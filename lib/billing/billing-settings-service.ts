/**
 * Billing Settings Service
 *
 * Provides access to configurable billing settings stored in the database.
 * Replaces hardcoded values with dynamic, admin-configurable settings.
 *
 * @module lib/billing/billing-settings-service
 */

import { createClient } from '@/lib/supabase/server';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// Types
// =============================================================================

export interface BillingSetting {
  id: string;
  setting_key: string;
  setting_value: string | number | boolean | number[];
  customer_type: 'global' | 'business' | 'consumer' | 'partner';
  description: string | null;
  category: 'billing_rules' | 'fees_charges' | 'payment_methods' | 'reminders' | 'general';
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface BillingSettingsMap {
  // Billing Rules
  vat_rate: number;
  invoice_due_days: number;
  b2b_due_days: number;
  grace_period_days: number;
  auto_suspend_days: number;
  billing_dates: number[];

  // Fees & Charges
  late_payment_fee: number;
  reconnection_fee: number;
  router_price: number;
  failed_debit_fee: number;

  // Reminders
  email_reminder_days: number;
  sms_reminder_max: number;
  sms_urgency_thresholds: number[];
  whatsapp_enabled: boolean;
}

export type BillingSettingKey = keyof BillingSettingsMap;

// Default values (fallbacks if DB is unavailable)
const DEFAULT_SETTINGS: BillingSettingsMap = {
  vat_rate: 15.0,
  invoice_due_days: 7,
  b2b_due_days: 30,
  grace_period_days: 3,
  auto_suspend_days: 14,
  billing_dates: [1, 5, 25, 30],
  late_payment_fee: 100.0,
  reconnection_fee: 250.0,
  router_price: 99.0,
  failed_debit_fee: 100.0,
  email_reminder_days: 5,
  sms_reminder_max: 3,
  sms_urgency_thresholds: [3, 7],
  whatsapp_enabled: false,
};

// =============================================================================
// In-Memory Cache
// =============================================================================

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(key: string, customerType: string): string {
  return `${key}:${customerType}`;
}

function getFromCache<T>(key: string, customerType: string): T | null {
  const cacheKey = getCacheKey(key, customerType);
  const entry = cache.get(cacheKey);

  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(cacheKey);
    return null;
  }

  return entry.value as T;
}

function setCache<T>(key: string, customerType: string, value: T): void {
  const cacheKey = getCacheKey(key, customerType);
  cache.set(cacheKey, {
    value,
    expiry: Date.now() + CACHE_TTL_MS,
  });
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Get a single billing setting value.
 *
 * @param key - The setting key (e.g., 'vat_rate', 'invoice_due_days')
 * @param customerType - Optional customer type for type-specific settings
 * @returns The setting value with proper type
 */
export async function getBillingSetting<K extends BillingSettingKey>(
  key: K,
  customerType: 'global' | 'business' | 'consumer' | 'partner' = 'global'
): Promise<BillingSettingsMap[K]> {
  // Check cache first
  const cached = getFromCache<BillingSettingsMap[K]>(key, customerType);
  if (cached !== null) {
    return cached;
  }

  try {
    const supabase = await createClient();

    // Try customer-specific setting first
    const { data, error } = await supabase
      .from('billing_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .eq('customer_type', customerType)
      .single();

    if (error && customerType !== 'global') {
      // Fall back to global setting
      const { data: globalData, error: globalError } = await supabase
        .from('billing_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .eq('customer_type', 'global')
        .single();

      if (globalError || !globalData) {
        billingLogger.warn(`[BillingSettings] Setting not found: ${key}, using default`);
        return DEFAULT_SETTINGS[key];
      }

      const value = parseSettingValue(key, globalData.setting_value);
      setCache(key, customerType, value);
      return value;
    }

    if (error || !data) {
      billingLogger.warn(`[BillingSettings] Setting not found: ${key}, using default`);
      return DEFAULT_SETTINGS[key];
    }

    const value = parseSettingValue(key, data.setting_value);
    setCache(key, customerType, value);
    return value;
  } catch (error) {
    billingLogger.error(`[BillingSettings] Error fetching setting: ${key}`, { error });
    return DEFAULT_SETTINGS[key];
  }
}

/**
 * Get all billing settings.
 *
 * @param customerType - Optional customer type filter
 * @returns All settings as a map
 */
export async function getAllBillingSettings(
  customerType: 'global' | 'business' | 'consumer' | 'partner' = 'global'
): Promise<BillingSettingsMap> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('billing_settings')
      .select('*')
      .in('customer_type', customerType === 'global' ? ['global'] : [customerType, 'global'])
      .order('customer_type', { ascending: false }); // Specific type first

    if (error || !data) {
      billingLogger.error('[BillingSettings] Error fetching all settings', { error });
      return { ...DEFAULT_SETTINGS };
    }

    // Build settings map, preferring type-specific over global
    const settings = { ...DEFAULT_SETTINGS };
    const seen = new Set<string>();

    for (const row of data) {
      if (seen.has(row.setting_key)) continue; // Skip if already set by specific type

      const key = row.setting_key as BillingSettingKey;
      if (key in DEFAULT_SETTINGS) {
        (settings as Record<string, unknown>)[key] = parseSettingValue(key, row.setting_value);
        seen.add(row.setting_key);
      }
    }

    return settings;
  } catch (error) {
    billingLogger.error('[BillingSettings] Error fetching all settings', { error });
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Get billing settings grouped by category.
 *
 * @returns Settings grouped by category
 */
export async function getBillingSettingsByCategory(): Promise<{
  billing_rules: BillingSetting[];
  fees_charges: BillingSetting[];
  payment_methods: BillingSetting[];
  reminders: BillingSetting[];
  general: BillingSetting[];
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('billing_settings')
      .select('*')
      .eq('customer_type', 'global')
      .order('category');

    if (error || !data) {
      throw new Error(`Failed to fetch settings: ${error?.message}`);
    }

    const result = {
      billing_rules: [] as BillingSetting[],
      fees_charges: [] as BillingSetting[],
      payment_methods: [] as BillingSetting[],
      reminders: [] as BillingSetting[],
      general: [] as BillingSetting[],
    };

    for (const row of data) {
      const setting: BillingSetting = {
        id: row.id,
        setting_key: row.setting_key,
        setting_value: parseSettingValue(row.setting_key as BillingSettingKey, row.setting_value),
        customer_type: row.customer_type,
        description: row.description,
        category: row.category,
        created_at: row.created_at,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
      };

      result[row.category as keyof typeof result]?.push(setting);
    }

    return result;
  } catch (error) {
    billingLogger.error('[BillingSettings] Error fetching settings by category', { error });
    throw error;
  }
}

/**
 * Update a billing setting.
 *
 * @param key - The setting key
 * @param value - The new value
 * @param updatedBy - UUID of the admin user making the change
 * @param customerType - Customer type (default: global)
 */
export async function updateBillingSetting<K extends BillingSettingKey>(
  key: K,
  value: BillingSettingsMap[K],
  updatedBy: string,
  customerType: 'global' | 'business' | 'consumer' | 'partner' = 'global'
): Promise<void> {
  try {
    const supabase = await createClient();

    // Serialize value for JSONB storage
    const serializedValue = JSON.stringify(value);

    const { error } = await supabase
      .from('billing_settings')
      .update({
        setting_value: serializedValue,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', key)
      .eq('customer_type', customerType);

    if (error) {
      throw new Error(`Failed to update setting: ${error.message}`);
    }

    // Invalidate cache
    cache.delete(getCacheKey(key, customerType));
    if (customerType === 'global') {
      // Also invalidate type-specific caches that might fall back to global
      cache.delete(getCacheKey(key, 'business'));
      cache.delete(getCacheKey(key, 'consumer'));
      cache.delete(getCacheKey(key, 'partner'));
    }

    billingLogger.info(`[BillingSettings] Updated setting: ${key}`, {
      value,
      customerType,
      updatedBy,
    });
  } catch (error) {
    billingLogger.error(`[BillingSettings] Error updating setting: ${key}`, { error });
    throw error;
  }
}

/**
 * Update multiple billing settings at once.
 *
 * @param settings - Array of settings to update
 * @param updatedBy - UUID of the admin user making the change
 */
export async function updateBillingSettings(
  settings: Array<{ key: BillingSettingKey; value: unknown }>,
  updatedBy: string,
  customerType: 'global' | 'business' | 'consumer' | 'partner' = 'global'
): Promise<void> {
  const supabase = await createClient();

  for (const { key, value } of settings) {
    const serializedValue = JSON.stringify(value);

    const { error } = await supabase
      .from('billing_settings')
      .update({
        setting_value: serializedValue,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', key)
      .eq('customer_type', customerType);

    if (error) {
      throw new Error(`Failed to update setting ${key}: ${error.message}`);
    }

    // Invalidate cache
    cache.delete(getCacheKey(key, customerType));
  }

  billingLogger.info(`[BillingSettings] Batch updated ${settings.length} settings`, {
    keys: settings.map((s) => s.key),
    updatedBy,
  });
}

/**
 * Clear the settings cache (useful after bulk updates).
 */
export function clearBillingSettingsCache(): void {
  cache.clear();
  billingLogger.info('[BillingSettings] Cache cleared');
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse a setting value from JSONB storage to the correct type.
 */
function parseSettingValue<K extends BillingSettingKey>(
  key: K,
  rawValue: unknown
): BillingSettingsMap[K] {
  // Handle string-wrapped values from JSONB
  let value = rawValue;
  if (typeof rawValue === 'string') {
    try {
      value = JSON.parse(rawValue);
    } catch {
      // Keep as string if not valid JSON
      value = rawValue;
    }
  }

  // Type-specific parsing based on key
  switch (key) {
    case 'billing_dates':
    case 'sms_urgency_thresholds':
      if (Array.isArray(value)) {
        return value.map(Number) as BillingSettingsMap[K];
      }
      return DEFAULT_SETTINGS[key] as BillingSettingsMap[K];

    case 'whatsapp_enabled':
      if (typeof value === 'boolean') return value as BillingSettingsMap[K];
      if (typeof value === 'string') {
        return (value === 'true' || value === '1') as BillingSettingsMap[K];
      }
      return false as BillingSettingsMap[K];

    case 'vat_rate':
    case 'late_payment_fee':
    case 'reconnection_fee':
    case 'router_price':
    case 'failed_debit_fee':
      return Number(value) as BillingSettingsMap[K];

    case 'invoice_due_days':
    case 'b2b_due_days':
    case 'grace_period_days':
    case 'auto_suspend_days':
    case 'email_reminder_days':
    case 'sms_reminder_max':
      return Math.round(Number(value)) as BillingSettingsMap[K];

    default:
      return value as BillingSettingsMap[K];
  }
}

// =============================================================================
// Convenience Getters
// =============================================================================

/**
 * Get the current VAT rate.
 */
export async function getVatRate(): Promise<number> {
  return getBillingSetting('vat_rate');
}

/**
 * Get invoice due days based on customer type.
 */
export async function getInvoiceDueDays(isB2B: boolean = false): Promise<number> {
  return getBillingSetting(isB2B ? 'b2b_due_days' : 'invoice_due_days');
}

/**
 * Get router price.
 */
export async function getRouterPrice(): Promise<number> {
  return getBillingSetting('router_price');
}

/**
 * Get SMS reminder max count.
 */
export async function getSmsReminderMax(): Promise<number> {
  return getBillingSetting('sms_reminder_max');
}

/**
 * Get email reminder days before due.
 */
export async function getEmailReminderDays(): Promise<number> {
  return getBillingSetting('email_reminder_days');
}

/**
 * Get available billing dates.
 */
export async function getBillingDates(): Promise<number[]> {
  return getBillingSetting('billing_dates');
}
