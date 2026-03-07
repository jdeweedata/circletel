# Admin Settings Service Pattern

**Date**: 2026-03-07
**Feature**: Finance Settings Configuration Page
**Time Saved**: ~2 hours for future admin settings pages

## Overview

Pattern for creating admin-configurable settings that replace hardcoded values, with database storage, caching, and a tabbed UI.

## Components

### 1. Database Table

```sql
CREATE TABLE IF NOT EXISTS [settings_table] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,  -- Supports strings, numbers, arrays, booleans
  customer_type TEXT DEFAULT 'global',  -- For per-type overrides
  description TEXT,
  category TEXT,  -- Group settings in UI tabs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id),
  UNIQUE(setting_key, customer_type)
);
```

**Key decisions:**
- JSONB for `setting_value` allows arrays (`[1, 5, 25, 30]`) and future schema changes
- `customer_type` enables per-segment overrides (business vs consumer)
- `category` maps to UI tabs

### 2. RLS Policy (Super Admin Only)

```sql
CREATE POLICY "Super Admins can view [settings]" ON [table]
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role_template_id = (
        SELECT id FROM role_templates WHERE name = 'Super Admin'
      )
    )
  );

-- Service role for background jobs
CREATE POLICY "Service role can read [settings]" ON [table]
  FOR SELECT TO service_role
  USING (true);
```

### 3. Service Layer with Caching

```typescript
// In-memory cache with TTL
const cache = new Map<string, { value: unknown; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getSetting<K extends SettingKey>(
  key: K,
  customerType = 'global'
): Promise<SettingsMap[K]> {
  // Check cache first
  const cached = getFromCache(key, customerType);
  if (cached !== null) return cached;

  // Fetch from DB
  const value = await fetchFromDB(key, customerType);

  // Cache and return
  setCache(key, customerType, value);
  return value;
}

// Convenience getters
export async function getVatRate(): Promise<number> {
  return getSetting('vat_rate');
}
```

**Key decisions:**
- 5-minute cache TTL balances freshness vs DB load
- Typed convenience getters for clean integration
- Default fallbacks when DB unavailable

### 4. API Routes

```
GET  /api/admin/settings/[domain]          - List all settings
PUT  /api/admin/settings/[domain]          - Update multiple settings
GET  /api/admin/settings/[domain]/[key]    - Get single setting
PUT  /api/admin/settings/[domain]/[key]    - Update single setting
```

### 5. Tabbed UI Component

```tsx
export function SettingsPage() {
  const [formValues, setFormValues] = useState<FormValues>(defaults);
  const [hasChanges, setHasChanges] = useState(false);

  // React Query for fetch/mutate
  const { data } = useQuery(['settings'], fetchSettings);
  const mutation = useMutation(saveSettings, {
    onSuccess: () => setHasChanges(false),
  });

  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <Tab1 values={formValues} onChange={updateValue} />
      </TabsContent>
      {/* Centralized save button */}
      <Button onClick={() => mutation.mutate()} disabled={!hasChanges}>
        Save Changes
      </Button>
    </Tabs>
  );
}
```

## Integration Pattern

When replacing hardcoded values:

```typescript
// BEFORE
const vatRate = 15.00;
const dueDays = 7;

// AFTER - fetch at function start
const [vatRate, dueDays] = await Promise.all([
  getVatRate(),
  getInvoiceDueDays(),
]);
```

## Migration Strategy

1. **Seed with current values**: Ensure zero-change deployment
2. **Keep defaults in code**: Fallback when DB unavailable
3. **Cache invalidation**: Clear cache on settings update

```sql
INSERT INTO settings (key, value) VALUES
  ('vat_rate', '15.00'),  -- Current hardcoded value
  ('due_days', '7')       -- Current hardcoded value
ON CONFLICT DO NOTHING;
```

## Files Reference

| File | Purpose |
|------|---------|
| `lib/billing/billing-settings-service.ts` | Service with caching |
| `app/api/admin/settings/billing/route.ts` | API routes |
| `components/admin/settings/finance/FinanceSettingsPage.tsx` | Tabbed UI |
| `supabase/migrations/20260307000001_create_billing_settings.sql` | Schema + seed |

## Gotchas

1. **Async in sync contexts**: Plan for async when replacing hardcoded values
2. **TypeScript const arrays**: Only check values that exist in const arrays
3. **Cache coherence**: Clear all related cache keys on global setting updates

## Time Savings

| Task | Without Pattern | With Pattern |
|------|-----------------|--------------|
| New settings table | 45 min | 15 min (copy schema) |
| Service layer | 60 min | 20 min (copy pattern) |
| UI components | 90 min | 30 min (copy structure) |
| **Total** | **~3 hours** | **~1 hour** |
