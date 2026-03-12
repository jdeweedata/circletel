# Interstellio UI Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Interstellio RADIUS admin page to match the Orders detail page design system.

**Architecture:** Create `InterstellioHeader` component matching `OrderHeader` pattern. Replace custom stats with shared `StatCard` grid. Replace shadcn Tabs with `UnderlineTabs` + `TabPanel`. Wrap content in `SectionCard` components.

**Tech Stack:** Next.js 15, TypeScript, React, Tailwind CSS, shared admin components (`StatCard`, `SectionCard`, `UnderlineTabs`, `StatusBadge`)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `components/admin/interstellio/InterstellioHeader.tsx` | Create | Header with breadcrumbs, title, StatusBadge, actions |
| `components/admin/interstellio/InterstellioStatCards.tsx` | Modify | Refactor to use shared `StatCard` component |
| `components/admin/interstellio/index.ts` | Modify | Add `InterstellioHeader` export |
| `app/admin/integrations/interstellio/page.tsx` | Modify | Update layout, tabs, wrappers |

---

## Chunk 1: Create InterstellioHeader Component

### Task 1: Create InterstellioHeader Component

**Files:**
- Create: `components/admin/interstellio/InterstellioHeader.tsx`

- [ ] **Step 1: Create the InterstellioHeader component**

```tsx
'use client';

import {
  PiCaretRightBold,
  PiArrowsClockwiseBold,
  PiGearBold,
  PiArrowClockwiseBold,
} from 'react-icons/pi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/admin/shared';

interface InterstellioHeaderProps {
  healthStatus: 'healthy' | 'degraded' | 'error';
  lastRefresh: Date | null;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const HEALTH_STATUS_CONFIG: Record<string, { className: string; label: string }> = {
  healthy: { className: 'bg-emerald-50 text-emerald-700', label: 'Healthy' },
  degraded: { className: 'bg-amber-50 text-amber-700', label: 'Degraded' },
  error: { className: 'bg-red-50 text-red-700', label: 'Error' },
};

export function InterstellioHeader({
  healthStatus,
  lastRefresh,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  isLoading,
}: InterstellioHeaderProps) {
  const statusConfig = HEALTH_STATUS_CONFIG[healthStatus] || HEALTH_STATUS_CONFIG.healthy;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/admin/integrations" className="hover:text-primary">Integrations</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">Interstellio RADIUS</span>
        </div>

        {/* Title Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Interstellio RADIUS
            </h2>
            <StatusBadge status={statusConfig.label} className={statusConfig.className} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={onAutoRefreshChange}
              />
              <Label htmlFor="auto-refresh" className="text-sm text-slate-600">
                Auto-refresh
              </Label>
            </div>

            {/* Last refresh time */}
            {lastRefresh && (
              <span className="text-xs text-slate-500">
                Updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}

            {/* Action button group */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Settings"
                aria-label="Integration Settings"
                onClick={() => window.location.href = '/admin/integrations'}
              >
                <PiGearBold className="w-5 h-5" />
              </button>
            </div>

            {/* Sync button */}
            <Button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <PiArrowsClockwiseBold className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run type check to verify component**

Run: `npm run type-check:memory 2>&1 | grep -E "(error|InterstellioHeader)" | head -20`
Expected: No errors related to InterstellioHeader

- [ ] **Step 3: Update index.ts exports**

Modify `components/admin/interstellio/index.ts`:

```ts
export { SubscriberStatusBadge } from './SubscriberStatusBadge'
export { InterstellioStatsCards } from './InterstellioStatsCards'
export { InterstellioHeader } from './InterstellioHeader'
export { SubscriberTable } from './SubscriberTable'
export { ActiveSessionsTable } from './ActiveSessionsTable'
export { UsageChart } from './UsageChart'
export { CustomerRadiusSection } from './CustomerRadiusSection'
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/interstellio/InterstellioHeader.tsx components/admin/interstellio/index.ts
git commit -m "feat(admin): add InterstellioHeader component matching Orders pattern"
```

---

## Chunk 2: Refactor InterstellioStatCards

### Task 2: Refactor InterstellioStatCards to Use Shared StatCard

**Files:**
- Modify: `components/admin/interstellio/InterstellioStatsCards.tsx`

- [ ] **Step 1: Refactor InterstellioStatsCards to use shared StatCard**

Replace entire file content with:

```tsx
'use client';

import { StatCard } from '@/components/admin/shared';

interface InterstellioStats {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
  activeSessions: number;
  totalUsage: {
    uploadGb: number;
    downloadGb: number;
  };
}

interface InterstellioStatsCardsProps {
  stats: InterstellioStats | null;
  linkedServices: number;
  isLoading?: boolean;
}

function formatUsage(uploadGb: number, downloadGb: number): string {
  const total = uploadGb + downloadGb;
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1)} TB`;
  }
  return `${total.toFixed(1)} GB`;
}

export function InterstellioStatCards({
  stats,
  linkedServices,
  isLoading = false,
}: InterstellioStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse">
            <div className="h-3 bg-slate-200 rounded w-24 mb-3" />
            <div className="h-5 bg-slate-200 rounded w-16 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  const totalSubscribers = stats?.totalSubscribers ?? 0;
  const activeSubscribers = stats?.activeSubscribers ?? 0;
  const activeSessions = stats?.activeSessions ?? 0;
  const uploadGb = stats?.totalUsage?.uploadGb ?? 0;
  const downloadGb = stats?.totalUsage?.downloadGb ?? 0;
  const unlinked = totalSubscribers - linkedServices;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Subscribers"
        value={totalSubscribers}
        subtitle={`${activeSubscribers} online`}
      />
      <StatCard
        label="Active Sessions"
        value={activeSessions}
        subtitle={`Across ${activeSubscribers} subscribers`}
      />
      <StatCard
        label="Linked Services"
        value={linkedServices}
        subtitle={unlinked > 0 ? `${unlinked} unlinked` : 'All linked'}
      />
      <StatCard
        label="Total Usage"
        value={formatUsage(uploadGb, downloadGb)}
        subtitle={`↑${uploadGb.toFixed(1)}GB ↓${downloadGb.toFixed(1)}GB`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run type check**

Run: `npm run type-check:memory 2>&1 | grep -E "error" | head -10`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/admin/interstellio/InterstellioStatsCards.tsx
git commit -m "refactor(admin): use shared StatCard in InterstellioStatCards"
```

---

## Chunk 3: Refactor Main Page

### Task 3: Refactor Interstellio Page Layout and Tabs

**Files:**
- Modify: `app/admin/integrations/interstellio/page.tsx`

- [ ] **Step 1: Update imports**

Replace import section at top of file:

```tsx
'use client';

import { PiUsersBold, PiWifiHighBold, PiChartLineBold } from 'react-icons/pi';
import { useState, useEffect, useCallback } from 'react';
import { UnderlineTabs, TabPanel, SectionCard } from '@/components/admin/shared';
import {
  InterstellioHeader,
  InterstellioStatCards,
  SubscriberTable,
  ActiveSessionsTable,
  UsageChart,
} from '@/components/admin/interstellio';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
```

- [ ] **Step 2: Add tab configuration after imports**

Add after the interfaces (around line 93):

```tsx
const TAB_CONFIG = [
  { id: 'subscribers', label: 'Subscribers' },
  { id: 'sessions', label: 'Active Sessions' },
  { id: 'usage', label: 'Usage Analytics' },
] as const;

type TabId = typeof TAB_CONFIG[number]['id'];
```

- [ ] **Step 3: Add activeTab state to component**

Add to the state declarations (around line 101):

```tsx
const [activeTab, setActiveTab] = useState<TabId>('subscribers');
```

- [ ] **Step 4: Replace the return statement with new layout**

Replace the entire return block (starting around line 285) with:

```tsx
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <InterstellioHeader
        healthStatus={stats?.health?.status ?? 'healthy'}
        lastRefresh={lastRefresh}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        onRefresh={fetchDashboardData}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stat Cards */}
        <InterstellioStatCards
          stats={stats}
          linkedServices={stats?.linkedServices ?? 0}
          isLoading={isLoading}
        />

        {/* Tabs */}
        <UnderlineTabs
          tabs={TAB_CONFIG.map(tab => ({
            ...tab,
            label: tab.id === 'subscribers'
              ? `Subscribers (${subscribers.length})`
              : tab.id === 'sessions'
                ? `Active Sessions (${sessions.length})`
                : tab.label
          }))}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        {/* SUBSCRIBERS TAB */}
        <TabPanel id="subscribers" activeTab={activeTab} className="mt-6">
          <SectionCard icon={PiUsersBold} title="All Subscribers">
            <SubscriberTable
              subscribers={subscribers}
              isLoading={isLoading}
              onRefresh={fetchDashboardData}
              onDisconnectAll={handleDisconnectAllSessions}
              onViewDetails={handleViewSubscriberDetails}
            />
          </SectionCard>
        </TabPanel>

        {/* SESSIONS TAB */}
        <TabPanel id="sessions" activeTab={activeTab} className="mt-6">
          <SectionCard icon={PiWifiHighBold} title="Active Sessions">
            <ActiveSessionsTable
              sessions={sessions}
              isLoading={isLoading}
              onRefresh={fetchDashboardData}
              onDisconnect={handleDisconnectSession}
            />
          </SectionCard>
        </TabPanel>

        {/* USAGE TAB */}
        <TabPanel id="usage" activeTab={activeTab} className="mt-6">
          <SectionCard icon={PiChartLineBold} title="Usage Analytics">
            <div className="space-y-4">
              {/* Subscriber selector */}
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium">View usage for:</Label>
                <select
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={selectedSubscriberId || 'all'}
                  onChange={(e) =>
                    setSelectedSubscriberId(e.target.value === 'all' ? null : e.target.value)
                  }
                >
                  <option value="all">All Subscribers (Top 5)</option>
                  {subscribers.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.username} {sub.linkedCustomerName ? `(${sub.linkedCustomerName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <UsageChart
                data={usageData}
                summary={usageSummary}
                aggregation={aggregation}
                onAggregationChange={setAggregation}
                onRefresh={fetchUsageData}
                title={
                  selectedSubscriberId
                    ? `Usage - ${subscribers.find((s) => s.id === selectedSubscriberId)?.username || 'Selected'}`
                    : 'Aggregate Usage (Top 5 Subscribers)'
                }
              />
            </div>
          </SectionCard>
        </TabPanel>
      </div>
    </div>
  );
```

- [ ] **Step 5: Run type check**

Run: `npm run type-check:memory 2>&1 | tail -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add app/admin/integrations/interstellio/page.tsx
git commit -m "refactor(admin): update Interstellio page to use shared design system

- Use InterstellioHeader with breadcrumbs and StatusBadge
- Replace shadcn Tabs with UnderlineTabs + TabPanel
- Wrap content in SectionCard components
- Consistent layout with Orders detail page"
```

---

## Chunk 4: Final Verification

### Task 4: Verify and Push

- [ ] **Step 1: Run full type check**

Run: `npm run type-check:memory`
Expected: Exit 0, no errors

- [ ] **Step 2: View git log to verify commits**

Run: `git log --oneline -5`
Expected: See 3 commits for header, stats, and page refactor

- [ ] **Step 3: Push to main**

```bash
git push origin main
```

---

## Success Criteria Checklist

- [ ] InterstellioHeader component created matching OrderHeader pattern
- [ ] InterstellioStatCards uses shared StatCard component
- [ ] Page uses UnderlineTabs + TabPanel instead of shadcn Tabs
- [ ] All content wrapped in SectionCard components
- [ ] Layout uses `min-h-screen bg-slate-50` pattern
- [ ] All existing functionality preserved (auto-refresh, disconnect, etc.)
- [ ] Type check passes
- [ ] All changes committed and pushed
