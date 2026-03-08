# Network Management & Customer Support Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build comprehensive network management and customer support features that link devices to customers, provide proactive monitoring, and enable efficient troubleshooting.

**Architecture:** Three-phase approach starting with database schema extensions, followed by API and UI layers, then advanced analytics. Each phase builds on the previous, with Phase 1 deliverables immediately usable by support staff.

**Tech Stack:** Next.js 15, TypeScript, Supabase (PostgreSQL), Inngest (background jobs), Ruijie Cloud API, Slack Webhooks

---

## Phase Overview

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| 1 | Quick Wins | 2-3 days | Device-customer linking, offline alerts, support notes |
| 2 | High Value | 3-5 days | Customer device lookup, connection quality dashboard, AP logs |
| 3 | Advanced | 5-7 days | Proactive monitoring, bandwidth analytics, network health map |

---

# Phase 1: Quick Wins (2-3 days)

## Task 1.1: Device-Customer Linking Schema

**Files:**
- Create: `supabase/migrations/YYYYMMDD_device_customer_linking.sql`
- Modify: `lib/ruijie/types.ts:86-114` (add customer_id to RuijieDeviceCacheRow)

**Step 1: Create migration file**

```sql
-- Device-Customer Linking Migration
-- Links Ruijie devices to consumer_orders or corporate_sites

-- Add customer linking columns to ruijie_device_cache
ALTER TABLE ruijie_device_cache
ADD COLUMN customer_order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,
ADD COLUMN corporate_site_id UUID REFERENCES corporate_sites(id) ON DELETE SET NULL,
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_email TEXT,
ADD COLUMN customer_phone TEXT,
ADD COLUMN support_notes TEXT,
ADD COLUMN support_notes_updated_at TIMESTAMPTZ,
ADD COLUMN support_notes_updated_by UUID REFERENCES admin_users(id);

-- Index for customer lookups
CREATE INDEX idx_ruijie_device_cache_customer_order ON ruijie_device_cache(customer_order_id) WHERE customer_order_id IS NOT NULL;
CREATE INDEX idx_ruijie_device_cache_corporate_site ON ruijie_device_cache(corporate_site_id) WHERE corporate_site_id IS NOT NULL;
CREATE INDEX idx_ruijie_device_cache_customer_email ON ruijie_device_cache(customer_email) WHERE customer_email IS NOT NULL;

-- Comments
COMMENT ON COLUMN ruijie_device_cache.customer_order_id IS 'Link to consumer_orders for residential customers';
COMMENT ON COLUMN ruijie_device_cache.corporate_site_id IS 'Link to corporate_sites for B2B (e.g., Unjani)';
COMMENT ON COLUMN ruijie_device_cache.support_notes IS 'Free-text notes from support staff about device issues';
```

**Step 2: Apply migration locally**

Run: `npx supabase migration new device_customer_linking`
Copy SQL content to the generated file, then:
Run: `npx supabase db push` (or apply via Supabase dashboard)

**Step 3: Update TypeScript types**

```typescript
// lib/ruijie/types.ts - Add to RuijieDeviceCacheRow interface
export interface RuijieDeviceCacheRow {
  // ... existing fields ...

  // Customer linking (Phase 1)
  customer_order_id: string | null;
  corporate_site_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  support_notes: string | null;
  support_notes_updated_at: string | null;
  support_notes_updated_by: string | null;
}
```

**Step 4: Commit**

```bash
git add supabase/migrations/ lib/ruijie/types.ts
git commit -m "feat(schema): add device-customer linking columns to ruijie_device_cache"
```

---

## Task 1.2: Device Linking API

**Files:**
- Create: `app/api/ruijie/devices/[sn]/link/route.ts`

**Step 1: Create link API endpoint**

```typescript
/**
 * Link/Unlink Device to Customer
 * POST /api/ruijie/devices/[sn]/link - Link device to customer
 * DELETE /api/ruijie/devices/[sn]/link - Unlink device
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

interface LinkRequest {
  type: 'consumer' | 'corporate';
  customer_order_id?: string;
  corporate_site_id?: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  const { sn } = await context.params;

  try {
    // Auth check
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = await createClient();
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body: LinkRequest = await request.json();

    // Fetch customer details based on type
    let customerName: string | null = null;
    let customerEmail: string | null = null;
    let customerPhone: string | null = null;

    if (body.type === 'consumer' && body.customer_order_id) {
      const { data: order } = await supabaseAdmin
        .from('consumer_orders')
        .select('first_name, last_name, email, phone')
        .eq('id', body.customer_order_id)
        .single();

      if (order) {
        customerName = `${order.first_name} ${order.last_name}`;
        customerEmail = order.email;
        customerPhone = order.phone;
      }
    } else if (body.type === 'corporate' && body.corporate_site_id) {
      const { data: site } = await supabaseAdmin
        .from('corporate_sites')
        .select('site_name, site_contact_email, site_contact_phone')
        .eq('id', body.corporate_site_id)
        .single();

      if (site) {
        customerName = site.site_name;
        customerEmail = site.site_contact_email;
        customerPhone = site.site_contact_phone;
      }
    }

    // Update device
    const { error: updateError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .update({
        customer_order_id: body.type === 'consumer' ? body.customer_order_id : null,
        corporate_site_id: body.type === 'corporate' ? body.corporate_site_id : null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      })
      .eq('sn', sn);

    if (updateError) {
      apiLogger.error('[Ruijie] Failed to link device', { error: updateError, sn });
      return NextResponse.json({ error: 'Failed to link device' }, { status: 500 });
    }

    return NextResponse.json({ success: true, customer_name: customerName });

  } catch (error) {
    apiLogger.error('[Ruijie] Device link API error', { error, sn });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  const { sn } = await context.params;

  try {
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = await createClient();

    const { error: updateError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .update({
        customer_order_id: null,
        corporate_site_id: null,
        customer_name: null,
        customer_email: null,
        customer_phone: null,
      })
      .eq('sn', sn);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to unlink device' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    apiLogger.error('[Ruijie] Device unlink API error', { error, sn });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/ruijie/devices/\[sn\]/link/route.ts
git commit -m "feat(api): add device-customer linking endpoints"
```

---

## Task 1.3: Support Notes API

**Files:**
- Create: `app/api/ruijie/devices/[sn]/notes/route.ts`

**Step 1: Create notes API endpoint**

```typescript
/**
 * Device Support Notes API
 * GET /api/ruijie/devices/[sn]/notes - Get notes
 * PUT /api/ruijie/devices/[sn]/notes - Update notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  const { sn } = await context.params;

  try {
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = await createClient();

    const { data: device, error } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select(`
        support_notes,
        support_notes_updated_at,
        support_notes_updated_by,
        admin_users!support_notes_updated_by(first_name, last_name)
      `)
      .eq('sn', sn)
      .single();

    if (error || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({
      notes: device.support_notes,
      updated_at: device.support_notes_updated_at,
      updated_by: device.admin_users
        ? `${device.admin_users.first_name} ${device.admin_users.last_name}`
        : null,
    });

  } catch (error) {
    apiLogger.error('[Ruijie] Get notes error', { error, sn });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  const { sn } = await context.params;

  try {
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = await createClient();

    // Verify admin
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { notes } = await request.json();

    const { error: updateError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .update({
        support_notes: notes,
        support_notes_updated_at: new Date().toISOString(),
        support_notes_updated_by: user.id,
      })
      .eq('sn', sn);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    apiLogger.error('[Ruijie] Update notes error', { error, sn });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/ruijie/devices/\[sn\]/notes/route.ts
git commit -m "feat(api): add device support notes endpoints"
```

---

## Task 1.4: Offline Device Alerts (Inngest)

**Files:**
- Create: `lib/inngest/functions/ruijie-offline-alerts.ts`
- Modify: `lib/inngest/index.ts` (export new function)

**Step 1: Create offline alerts function**

```typescript
/**
 * Ruijie Offline Device Alerts
 *
 * Runs every 5 minutes after sync, checks for devices offline > 15 min
 * Sends Slack alert for newly offline devices
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';

const SLACK_WEBHOOK_URL = process.env.SLACK_NETWORK_ALERTS_WEBHOOK;
const OFFLINE_THRESHOLD_MINUTES = 15;

interface OfflineDevice {
  sn: string;
  device_name: string;
  group_name: string | null;
  customer_name: string | null;
  last_seen_at: string | null;
  offline_minutes: number;
}

export const ruijieOfflineAlertsFunction = inngest.createFunction(
  {
    id: 'ruijie-offline-alerts',
    name: 'Ruijie Offline Device Alerts',
    retries: 2,
  },
  { event: 'ruijie/sync.completed' },
  async ({ event, step }) => {
    // Step 1: Find devices offline > threshold
    const offlineDevices = await step.run('find-offline-devices', async () => {
      const supabase = await createClient();

      const thresholdTime = new Date(Date.now() - OFFLINE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

      const { data: devices, error } = await supabase
        .from('ruijie_device_cache')
        .select('sn, device_name, group_name, customer_name, last_seen_at')
        .eq('status', 'offline')
        .lt('last_seen_at', thresholdTime)
        .order('last_seen_at', { ascending: true });

      if (error) {
        console.error('[OfflineAlerts] Query error:', error);
        return [];
      }

      return (devices || []).map(d => ({
        ...d,
        offline_minutes: Math.floor((Date.now() - new Date(d.last_seen_at || 0).getTime()) / 60000),
      })) as OfflineDevice[];
    });

    if (offlineDevices.length === 0) {
      return { alertsSent: 0, message: 'No offline devices exceeding threshold' };
    }

    // Step 2: Check for already-alerted devices (prevent spam)
    const newOfflineDevices = await step.run('filter-new-alerts', async () => {
      const supabase = await createClient();

      // Get devices alerted in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data: recentAlerts } = await supabase
        .from('ruijie_audit_log')
        .select('device_sn')
        .eq('action', 'offline_alert')
        .gte('created_at', oneHourAgo);

      const alertedSns = new Set(recentAlerts?.map(a => a.device_sn) || []);

      return offlineDevices.filter(d => !alertedSns.has(d.sn));
    });

    if (newOfflineDevices.length === 0) {
      return { alertsSent: 0, message: 'All offline devices already alerted recently' };
    }

    // Step 3: Send Slack alert
    if (SLACK_WEBHOOK_URL) {
      await step.run('send-slack-alert', async () => {
        const blocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🔴 ${newOfflineDevices.length} Device(s) Offline`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: newOfflineDevices.slice(0, 10).map(d =>
                `• *${d.device_name}* (${d.group_name || 'Unknown'}) - ${d.offline_minutes}min${d.customer_name ? ` - ${d.customer_name}` : ''}`
              ).join('\n'),
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View Devices' },
                url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/network/devices?status=offline`,
              },
            ],
          },
        ];

        await fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks }),
        });
      });
    }

    // Step 4: Log alerts to audit table
    await step.run('log-alerts', async () => {
      const supabase = await createClient();

      const entries = newOfflineDevices.map(d => ({
        device_sn: d.sn,
        action: 'offline_alert',
        action_detail: {
          offline_minutes: d.offline_minutes,
          customer_name: d.customer_name,
        },
        status: 'success',
        admin_user_id: null, // System-generated
      }));

      await supabase.from('ruijie_audit_log').insert(entries);
    });

    return {
      alertsSent: newOfflineDevices.length,
      devices: newOfflineDevices.map(d => d.sn),
    };
  }
);
```

**Step 2: Update Inngest index exports**

```typescript
// lib/inngest/index.ts - Add export
export { ruijieOfflineAlertsFunction } from './functions/ruijie-offline-alerts';
```

**Step 3: Add to Inngest serve**

Update `app/api/inngest/route.ts` to include the new function.

**Step 4: Add environment variable**

```bash
# .env.local
SLACK_NETWORK_ALERTS_WEBHOOK=https://hooks.slack.com/services/xxx/yyy/zzz
```

**Step 5: Commit**

```bash
git add lib/inngest/functions/ruijie-offline-alerts.ts lib/inngest/index.ts
git commit -m "feat(alerts): add offline device Slack alerts via Inngest"
```

---

## Task 1.5: Support Notes UI Component

**Files:**
- Create: `components/admin/network/detail/DeviceSupportNotes.tsx`
- Modify: `app/admin/network/devices/[sn]/page.tsx` (add notes to Overview tab)

**Step 1: Create SupportNotes component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { PiNotePencilBold, PiCheckBold, PiXBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SectionCard } from '@/components/admin/shared';

interface DeviceSupportNotesProps {
  sn: string;
}

export function DeviceSupportNotes({ sn }: DeviceSupportNotesProps) {
  const [notes, setNotes] = useState('');
  const [originalNotes, setOriginalNotes] = useState('');
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [sn]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/ruijie/devices/${sn}/notes`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      setNotes(data.notes || '');
      setOriginalNotes(data.notes || '');
      setUpdatedBy(data.updated_by);
      setUpdatedAt(data.updated_at);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/ruijie/devices/${sn}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
        credentials: 'include',
      });
      if (response.ok) {
        setOriginalNotes(notes);
        setEditing(false);
        fetchNotes(); // Refresh to get updated_by
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(originalNotes);
    setEditing(false);
  };

  if (loading) {
    return (
      <SectionCard icon={PiNotePencilBold} title="Support Notes" compact>
        <div className="h-24 bg-slate-100 animate-pulse rounded" />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={PiNotePencilBold}
      title="Support Notes"
      action={
        !editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : null
      }
      compact
    >
      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this device (issues, customer complaints, troubleshooting history)..."
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <PiXBold className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <PiCheckBold className="w-4 h-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {notes ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{notes}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No notes yet. Click Edit to add.</p>
          )}
          {updatedBy && updatedAt && (
            <p className="text-xs text-slate-400 mt-3">
              Last updated by {updatedBy} on {new Date(updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
```

**Step 2: Export from detail index**

```typescript
// components/admin/network/detail/index.ts
export { DeviceSupportNotes } from './DeviceSupportNotes';
```

**Step 3: Add to device detail page**

Add `<DeviceSupportNotes sn={device.sn} />` to the Overview tab grid.

**Step 4: Commit**

```bash
git add components/admin/network/detail/DeviceSupportNotes.tsx components/admin/network/detail/index.ts app/admin/network/devices/\[sn\]/page.tsx
git commit -m "feat(ui): add device support notes component"
```

---

## Task 1.6: Customer Link UI Component

**Files:**
- Create: `components/admin/network/detail/DeviceCustomerLink.tsx`

**Step 1: Create CustomerLink component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { PiUserBold, PiLinkBold, PiLinkBreakBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/admin/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Device {
  sn: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_order_id: string | null;
  corporate_site_id: string | null;
}

interface DeviceCustomerLinkProps {
  device: Device;
  onUpdate: () => void;
}

export function DeviceCustomerLink({ device, onUpdate }: DeviceCustomerLinkProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);

  const isLinked = device.customer_name !== null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // Search both consumer_orders and corporate_sites
      const response = await fetch(
        `/api/admin/search/customers?q=${encodeURIComponent(searchQuery)}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async (result: any) => {
    setLinking(true);
    try {
      const response = await fetch(`/api/ruijie/devices/${device.sn}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: result.type,
          customer_order_id: result.type === 'consumer' ? result.id : undefined,
          corporate_site_id: result.type === 'corporate' ? result.id : undefined,
        }),
        credentials: 'include',
      });
      if (response.ok) {
        setDialogOpen(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Link failed:', error);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setLinking(true);
    try {
      const response = await fetch(`/api/ruijie/devices/${device.sn}/link`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Unlink failed:', error);
    } finally {
      setLinking(false);
    }
  };

  return (
    <SectionCard
      icon={PiUserBold}
      title="Linked Customer"
      action={
        isLinked ? (
          <Button variant="ghost" size="sm" onClick={handleUnlink} disabled={linking}>
            <PiLinkBreakBold className="w-4 h-4 mr-1" />
            Unlink
          </Button>
        ) : null
      }
      compact
    >
      {isLinked ? (
        <div className="space-y-2">
          <p className="font-medium text-slate-900">{device.customer_name}</p>
          {device.customer_email && (
            <p className="text-sm text-slate-500">{device.customer_email}</p>
          )}
          {device.customer_phone && (
            <p className="text-sm text-slate-500">{device.customer_phone}</p>
          )}
        </div>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <PiLinkBold className="w-4 h-4 mr-2" />
              Link to Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Device to Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleLink(result)}
                    disabled={linking}
                    className="w-full text-left p-3 rounded-lg border hover:bg-slate-50 transition"
                  >
                    <p className="font-medium">{result.name}</p>
                    <p className="text-sm text-slate-500">{result.email}</p>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {result.type === 'consumer' ? 'Consumer' : 'Corporate'}
                    </span>
                  </button>
                ))}
                {searchResults.length === 0 && searchQuery && !searching && (
                  <p className="text-center text-slate-400 py-4">No customers found</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </SectionCard>
  );
}
```

**Step 2: Commit**

```bash
git add components/admin/network/detail/DeviceCustomerLink.tsx
git commit -m "feat(ui): add device-customer linking component"
```

---

# Phase 2: High Value Features (3-5 days)

## Task 2.1: Customer Device Lookup Page

**Files:**
- Create: `app/admin/support/devices/page.tsx`
- Create: `app/api/admin/search/customers/route.ts`
- Create: `app/api/admin/customers/[id]/devices/route.ts`

**Goal:** Support staff can search for a customer and see all their linked devices at a glance.

**Step 1: Create customer search API**

```typescript
// app/api/admin/search/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClientWithSession();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = await createClient();

  // Search consumer_orders
  const { data: consumers } = await supabaseAdmin
    .from('consumer_orders')
    .select('id, first_name, last_name, email, phone')
    .or(`email.ilike.%${query}%,phone.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(10);

  // Search corporate_sites
  const { data: sites } = await supabaseAdmin
    .from('corporate_sites')
    .select('id, site_name, site_contact_email, site_contact_phone')
    .or(`site_name.ilike.%${query}%,site_contact_email.ilike.%${query}%`)
    .limit(10);

  const results = [
    ...(consumers || []).map(c => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      phone: c.phone,
      type: 'consumer' as const,
    })),
    ...(sites || []).map(s => ({
      id: s.id,
      name: s.site_name,
      email: s.site_contact_email,
      phone: s.site_contact_phone,
      type: 'corporate' as const,
    })),
  ];

  return NextResponse.json({ results });
}
```

**Step 2: Create customer devices API**

```typescript
// app/api/admin/customers/[id]/devices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'consumer';

  const supabase = await createClientWithSession();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = await createClient();

  const column = type === 'consumer' ? 'customer_order_id' : 'corporate_site_id';

  const { data: devices, error } = await supabaseAdmin
    .from('ruijie_device_cache')
    .select('sn, device_name, model, status, group_name, online_clients, synced_at')
    .eq(column, id)
    .order('status')
    .order('device_name');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
  }

  return NextResponse.json({ devices: devices || [] });
}
```

**Step 3: Create Support Devices page** (Large component - abbreviated)

```typescript
// app/admin/support/devices/page.tsx
'use client';

import { useState } from 'react';
import { PiMagnifyingGlassBold, PiUserBold, PiWifiHighBold } from 'react-icons/pi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function SupportDevicesPage() {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/search/customers?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setCustomers(data.results || []);
      setSelectedCustomer(null);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/customers/${customer.id}/devices?type=${customer.type}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setDevices(data.devices || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Device Lookup</h1>
        <p className="text-slate-500">Search for a customer to view their linked devices</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by name, email, or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-md"
        />
        <Button onClick={handleSearch} disabled={loading}>
          <PiMagnifyingGlassBold className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PiUserBold className="w-5 h-5" />
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <p className="text-slate-400 text-sm">Search for a customer above</p>
            ) : (
              <div className="space-y-2">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedCustomer?.id === c.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.email}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PiWifiHighBold className="w-5 h-5" />
              Linked Devices
              {selectedCustomer && (
                <span className="text-sm font-normal text-slate-500">
                  ({devices.length} devices)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCustomer ? (
              <p className="text-slate-400 text-sm">Select a customer to view devices</p>
            ) : devices.length === 0 ? (
              <p className="text-slate-400 text-sm">No devices linked to this customer</p>
            ) : (
              <div className="space-y-3">
                {devices.map((d) => (
                  <Link
                    key={d.sn}
                    href={`/admin/network/devices/${d.sn}`}
                    className="block p-4 rounded-lg border hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{d.device_name}</p>
                        <p className="text-sm text-slate-500">{d.model} - {d.sn}</p>
                      </div>
                      <Badge className={d.status === 'online' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}>
                        {d.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add app/admin/support/devices/page.tsx app/api/admin/search/customers/route.ts app/api/admin/customers/\[id\]/devices/route.ts
git commit -m "feat(support): add customer device lookup page"
```

---

## Task 2.2: Connection Quality Dashboard (STA API)

**Files:**
- Create: `app/api/ruijie/sta/route.ts`
- Create: `components/admin/network/ClientQualityTable.tsx`
- Modify: `app/admin/network/devices/[sn]/page.tsx` (add to new "Clients" tab)

**Goal:** Show connected clients with RSSI, channel, connection quality scores.

(Implementation follows same pattern as above - API route wrapping Ruijie STA API, UI component to display data)

---

## Task 2.3: AP Logs Viewer

**Files:**
- Create: `app/api/ruijie/devices/[sn]/logs/route.ts`
- Create: `components/admin/network/detail/DeviceActivityLog.tsx`

**Goal:** Show device management logs (reboots, online/offline events) from Ruijie API 2.6.4.

---

# Phase 3: Advanced Features (5-7 days)

## Task 3.1: Proactive Monitoring System

**Files:**
- Create: `lib/inngest/functions/ruijie-health-monitor.ts`
- Create: `supabase/migrations/YYYYMMDD_device_health_tracking.sql`
- Create: `app/admin/network/health/page.tsx`

**Goal:** Track device health metrics over time, alert on anomalies.

---

## Task 3.2: Bandwidth Analytics

**Files:**
- Create: `app/api/ruijie/traffic/route.ts`
- Create: `components/admin/network/TrafficChart.tsx`
- Create: `app/admin/network/analytics/page.tsx`

**Goal:** Use Ruijie Traffic API (2.5.2) and App Flow API (2.5.3) for bandwidth insights.

---

## Task 3.3: Network Health Map

**Files:**
- Create: `app/admin/network/map/page.tsx`
- Create: `components/admin/network/NetworkMap.tsx`
- Modify: `ruijie_device_cache` (add lat/lng from corporate_sites)

**Goal:** Visual map showing all device locations with status indicators.

---

# Appendix

## Environment Variables Required

```bash
# Phase 1
SLACK_NETWORK_ALERTS_WEBHOOK=https://hooks.slack.com/services/xxx/yyy/zzz

# Phase 2-3 (already configured)
RUIJIE_BASE_URL=https://cloud.ruijienetworks.com/service/api
RUIJIE_APPID=xxx
RUIJIE_SECRET=xxx
```

## Database Schema Summary

```sql
-- Phase 1 additions to ruijie_device_cache
customer_order_id UUID
corporate_site_id UUID
customer_name TEXT
customer_email TEXT
customer_phone TEXT
support_notes TEXT
support_notes_updated_at TIMESTAMPTZ
support_notes_updated_by UUID

-- Phase 3 additions
device_health_scores TABLE
network_alerts TABLE
```

## Testing Checklist

- [ ] Device-customer linking works for both consumer and corporate
- [ ] Support notes persist and show update history
- [ ] Offline alerts fire to Slack after 15min
- [ ] Customer lookup finds both order and corporate site records
- [ ] STA client list shows RSSI and quality scores
- [ ] AP logs load from Ruijie API

---

**Plan complete and saved to `docs/plans/2026-03-08-network-support-features.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
