/**
 * Payment Provider Settings Loader
 *
 * Loads payment provider configurations from Supabase database.
 * Bridges the gap between PaymentProviderFactory and payment_provider_settings table.
 *
 * @module lib/payments/payment-provider-settings-loader
 */

import { createClient } from '@/lib/supabase/server';
import type { PaymentProviderType } from '@/lib/types/payment.types';

// ============================================================================
// Types
// ============================================================================

/**
 * Database provider settings from payment_provider_settings table
 */
export interface DatabaseProviderSettings {
  id: string;
  provider: PaymentProviderType;
  enabled: boolean;
  priority: number;
  test_mode: boolean;
  credentials?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  min_amount?: number;
  max_amount?: number;
  daily_limit?: number;
  webhook_url?: string;
  webhook_secret?: string;
  webhook_events?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Provider health status from database view
 */
export interface ProviderHealthStatus {
  provider: PaymentProviderType;
  enabled: boolean;
  priority: number;
  test_mode: boolean;
  total_transactions: number;
  completed_transactions: number;
  failed_transactions: number;
  total_amount: number;
  avg_completion_time_seconds: number;
}

// ============================================================================
// Settings Loader
// ============================================================================

/**
 * Payment Provider Settings Loader
 *
 * Loads provider configurations from the database.
 * Uses server-side Supabase client with service role permissions.
 */
export class PaymentProviderSettingsLoader {
  /**
   * Load all provider settings from database
   *
   * @returns Array of provider settings
   */
  static async loadAllProviders(): Promise<DatabaseProviderSettings[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('payment_provider_settings')
        .select('*')
        .order('priority', { ascending: false });

      if (error) {
        console.error('Failed to load provider settings:', error);
        return [];
      }

      return data as DatabaseProviderSettings[];
    } catch (error) {
      console.error('Error loading provider settings:', error);
      return [];
    }
  }

  /**
   * Load specific provider settings from database
   *
   * @param provider - Provider type to load
   * @returns Provider settings or null if not found
   */
  static async loadProvider(
    provider: PaymentProviderType
  ): Promise<DatabaseProviderSettings | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('payment_provider_settings')
        .select('*')
        .eq('provider', provider)
        .single();

      if (error) {
        console.error(`Failed to load ${provider} settings:`, error);
        return null;
      }

      return data as DatabaseProviderSettings;
    } catch (error) {
      console.error(`Error loading ${provider} settings:`, error);
      return null;
    }
  }

  /**
   * Load provider health status from database view
   *
   * @returns Array of provider health statuses
   */
  static async loadProviderHealth(): Promise<ProviderHealthStatus[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('v_payment_provider_health')
        .select('*')
        .order('priority', { ascending: false });

      if (error) {
        console.error('Failed to load provider health:', error);
        return [];
      }

      return data as ProviderHealthStatus[];
    } catch (error) {
      console.error('Error loading provider health:', error);
      return [];
    }
  }

  /**
   * Get enabled providers only
   *
   * @returns Array of enabled provider settings
   */
  static async getEnabledProviders(): Promise<DatabaseProviderSettings[]> {
    const allProviders = await this.loadAllProviders();
    return allProviders.filter(p => p.enabled);
  }

  /**
   * Get providers by priority
   *
   * Returns providers sorted by priority (highest first).
   * Only returns enabled providers.
   *
   * @returns Array of provider settings sorted by priority
   */
  static async getProvidersByPriority(): Promise<DatabaseProviderSettings[]> {
    const enabledProviders = await this.getEnabledProviders();
    return enabledProviders.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if provider is enabled
   *
   * @param provider - Provider type to check
   * @returns True if provider is enabled, false otherwise
   */
  static async isProviderEnabled(provider: PaymentProviderType): Promise<boolean> {
    const settings = await this.loadProvider(provider);
    return settings?.enabled ?? false;
  }

  /**
   * Update provider settings in database
   *
   * @param provider - Provider type to update
   * @param updates - Settings to update
   * @returns Updated provider settings or null if failed
   */
  static async updateProvider(
    provider: PaymentProviderType,
    updates: Partial<Omit<DatabaseProviderSettings, 'id' | 'provider' | 'created_at'>>
  ): Promise<DatabaseProviderSettings | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('payment_provider_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('provider', provider)
        .select()
        .single();

      if (error) {
        console.error(`Failed to update ${provider} settings:`, error);
        return null;
      }

      return data as DatabaseProviderSettings;
    } catch (error) {
      console.error(`Error updating ${provider} settings:`, error);
      return null;
    }
  }

  /**
   * Get provider credentials (for internal use only)
   *
   * WARNING: This returns sensitive credentials. Use only server-side.
   *
   * @param provider - Provider type
   * @returns Provider credentials or null
   */
  static async getProviderCredentials(
    provider: PaymentProviderType
  ): Promise<Record<string, unknown> | null> {
    const settings = await this.loadProvider(provider);
    if (!settings) return null;

    // Return test credentials if in test mode, otherwise production credentials
    return settings.test_mode
      ? (settings.settings?.test_credentials as Record<string, unknown> ?? null)
      : (settings.credentials ?? null);
  }
}
