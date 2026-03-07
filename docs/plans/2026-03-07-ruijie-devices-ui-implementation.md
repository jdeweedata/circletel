# Ruijie Network Devices UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the Ruijie devices admin page with StatCards, collapsible filters, responsive table/card views, and dropdown actions menu.

**Architecture:** Extract the monolithic 546-line page into 5 focused components. Use existing `StatCard` for metrics, `DropdownMenu` for actions, `Sheet` for mobile filters. Main page becomes a thin orchestrator.

**Tech Stack:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui components, Phosphor Icons

---

## Task 1: Create DeviceActionsMenu Component

**Files:**
- Create: `components/admin/network/DeviceActionsMenu.tsx`

**Step 1: Create the component file**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import {
  PiCopyBold,
  PiDotsThreeVerticalBold,
  PiEyeBold,
  PiLinkBold,
  PiPowerBold,
} from 'react-icons/pi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DeviceActionsMenuProps {
  sn: string;
  deviceName: string;
  isOnline: boolean;
  tunnelLimitReached: boolean;
  onReboot: () => void;
}

export function DeviceActionsMenu({
  sn,
  deviceName,
  isOnline,
  tunnelLimitReached,
  onReboot,
}: DeviceActionsMenuProps) {
  const router = useRouter();

  const handleCopySN = () => {
    navigator.clipboard.writeText(sn);
    toast.success('SN copied to clipboard');
  };

  const handleViewDetails = () => {
    router.push(`/admin/network/devices/${sn}`);
  };

  const handleLaunchEweb = () => {
    router.push(`/admin/network/devices/${sn}?action=tunnel`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <PiDotsThreeVerticalBold className="h-4 w-4" />
          <span className="sr-only">Actions for {deviceName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleViewDetails}>
          <PiEyeBold className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLaunchEweb}
          disabled={tunnelLimitReached}
        >
          <PiLinkBold className="mr-2 h-4 w-4" />
          Launch eWeb
          {tunnelLimitReached && (
            <span className="ml-auto text-xs text-muted-foreground">Limit</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopySN}>
          <PiCopyBold className="mr-2 h-4 w-4" />
          Copy SN
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onReboot}
          disabled={!isOnline}
          className="text-red-600 focus:text-red-600"
        >
          <PiPowerBold className="mr-2 h-4 w-4" />
          Reboot
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Create index file for network components**

```tsx
// components/admin/network/index.ts
export { DeviceActionsMenu } from './DeviceActionsMenu';
```

**Step 3: Verify TypeScript compiles**

Run: `npm run type-check:memory 2>&1 | grep -E "error|DeviceActions" | head -10`
Expected: No errors related to DeviceActionsMenu

**Step 4: Commit**

```bash
git add components/admin/network/
git commit -m "feat(ruijie): add DeviceActionsMenu component"
```

---

## Task 2: Create DeviceStatCards Component

**Files:**
- Create: `components/admin/network/DeviceStatCards.tsx`
- Modify: `components/admin/network/index.ts`

**Step 1: Create the component**

```tsx
'use client';

import {
  PiCheckCircleBold,
  PiLinkBold,
  PiWifiHighBold,
  PiWifiSlashBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared';
import { cn } from '@/lib/utils';

interface DeviceStatCardsProps {
  total: number;
  online: number;
  offline: number;
  activeTunnels: number;
  tunnelLimit: number;
  activeFilter: string;
  onFilterChange: (status: string) => void;
}

export function DeviceStatCards({
  total,
  online,
  offline,
  activeTunnels,
  tunnelLimit,
  activeFilter,
  onFilterChange,
}: DeviceStatCardsProps) {
  const onlinePercent = total > 0 ? Math.round((online / total) * 100) : 0;
  const tunnelWarning = activeTunnels >= 8;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Total Devices"
        value={total}
        icon={<PiWifiHighBold className="h-5 w-5" />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
      />
      <StatCard
        label="Online"
        value={`${online} (${onlinePercent}%)`}
        icon={<PiCheckCircleBold className="h-5 w-5" />}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
        onClick={() => onFilterChange(activeFilter === 'online' ? '' : 'online')}
        isActive={activeFilter === 'online'}
      />
      <StatCard
        label="Offline"
        value={offline}
        icon={<PiWifiSlashBold className="h-5 w-5" />}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        onClick={() => onFilterChange(activeFilter === 'offline' ? '' : 'offline')}
        isActive={activeFilter === 'offline'}
        className={cn(offline > 0 && 'ring-1 ring-red-200')}
      />
      <div className="relative">
        <StatCard
          label="Active Tunnels"
          value={`${activeTunnels}/${tunnelLimit}`}
          icon={<PiLinkBold className="h-5 w-5" />}
          iconBgColor={tunnelWarning ? 'bg-orange-100' : 'bg-gray-100'}
          iconColor={tunnelWarning ? 'text-orange-600' : 'text-gray-600'}
        />
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-lg overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              tunnelWarning ? 'bg-orange-500' : 'bg-circleTel-orange'
            )}
            style={{ width: `${(activeTunnels / tunnelLimit) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Update index exports**

```tsx
// components/admin/network/index.ts
export { DeviceActionsMenu } from './DeviceActionsMenu';
export { DeviceStatCards } from './DeviceStatCards';
```

**Step 3: Verify TypeScript compiles**

Run: `npm run type-check:memory 2>&1 | grep -E "error|DeviceStat" | head -10`
Expected: No errors

**Step 4: Commit**

```bash
git add components/admin/network/
git commit -m "feat(ruijie): add DeviceStatCards component"
```

---

## Task 3: Create DeviceFilters Component

**Files:**
- Create: `components/admin/network/DeviceFilters.tsx`
- Modify: `components/admin/network/index.ts`

**Step 1: Create the component**

```tsx
'use client';

import { useState } from 'react';
import {
  PiArrowsClockwiseBold,
  PiDownloadBold,
  PiFunnelBold,
  PiMagnifyingGlassBold,
  PiXBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface DeviceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  groupFilter: string;
  onGroupChange: (value: string) => void;
  modelFilter: string;
  onModelChange: (value: string) => void;
  groups: string[];
  models: string[];
  onRefresh: () => void;
  onExport: () => void;
  refreshing: boolean;
}

export function DeviceFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  groupFilter,
  onGroupChange,
  modelFilter,
  onModelChange,
  groups,
  models,
  onRefresh,
  onExport,
  refreshing,
}: DeviceFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasFilters = statusFilter || groupFilter || modelFilter;
  const activeFilterCount = [statusFilter, groupFilter, modelFilter].filter(Boolean).length;

  const clearAllFilters = () => {
    onStatusChange('');
    onGroupChange('');
    onModelChange('');
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by SN, name, or IP..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters toggle */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <PiFunnelBold className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <PiArrowsClockwiseBold className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <PiDownloadBold className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {statusFilter && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusFilter}
                <button onClick={() => onStatusChange('')} className="ml-1 hover:text-red-500">
                  <PiXBold className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {groupFilter && (
              <Badge variant="secondary" className="gap-1">
                Group: {groupFilter}
                <button onClick={() => onGroupChange('')} className="ml-1 hover:text-red-500">
                  <PiXBold className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {modelFilter && (
              <Badge variant="secondary" className="gap-1">
                Model: {modelFilter}
                <button onClick={() => onModelChange('')} className="ml-1 hover:text-red-500">
                  <PiXBold className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Expanded filters */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent>
            <div className="flex flex-wrap items-end gap-4 mt-4 pt-4 border-t">
              <div className="w-40">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <Select value={statusFilter || 'all'} onValueChange={(v) => onStatusChange(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Group</label>
                <Select value={groupFilter || 'all'} onValueChange={(v) => onGroupChange(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Model</label>
                <Select value={modelFilter || 'all'} onValueChange={(v) => onModelChange(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {models.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <PiXBold className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Update index exports**

```tsx
// components/admin/network/index.ts
export { DeviceActionsMenu } from './DeviceActionsMenu';
export { DeviceStatCards } from './DeviceStatCards';
export { DeviceFilters } from './DeviceFilters';
```

**Step 3: Verify TypeScript compiles**

Run: `npm run type-check:memory 2>&1 | grep -E "error|DeviceFilter" | head -10`
Expected: No errors

**Step 4: Commit**

```bash
git add components/admin/network/
git commit -m "feat(ruijie): add DeviceFilters component with collapsible filters"
```

---

## Task 4: Create DeviceCard Component (Mobile)

**Files:**
- Create: `components/admin/network/DeviceCard.tsx`
- Modify: `components/admin/network/index.ts`

**Step 1: Create the component**

```tsx
'use client';

import { PiWifiHighBold, PiWifiSlashBold } from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DeviceActionsMenu } from './DeviceActionsMenu';

interface RuijieDevice {
  sn: string;
  device_name: string;
  model: string | null;
  group_name: string | null;
  online_clients: number;
  status: string;
  synced_at: string;
  mock_data: boolean;
}

interface DeviceCardProps {
  device: RuijieDevice;
  tunnelLimitReached: boolean;
  onReboot: (device: RuijieDevice) => void;
  formatRelativeTime: (date: string) => string;
}

export function DeviceCard({
  device,
  tunnelLimitReached,
  onReboot,
  formatRelativeTime,
}: DeviceCardProps) {
  const isOnline = device.status === 'online';
  const StatusIcon = isOnline ? PiWifiHighBold : PiWifiSlashBold;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border bg-white',
        !isOnline && 'bg-red-50/50 border-red-200'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon
            className={cn(
              'h-5 w-5 flex-shrink-0',
              isOnline ? 'text-green-600' : 'text-red-600'
            )}
          />
          <span className="font-medium truncate">{device.device_name}</span>
          {device.mock_data && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200 flex-shrink-0">
              MOCK
            </Badge>
          )}
        </div>
        <DeviceActionsMenu
          sn={device.sn}
          deviceName={device.device_name}
          isOnline={isOnline}
          tunnelLimitReached={tunnelLimitReached}
          onReboot={() => onReboot(device)}
        />
      </div>
      <div className="mt-2 text-sm text-gray-600">
        {device.model || 'Unknown'} • {device.group_name || 'No group'}
      </div>
      <div className="mt-1 text-sm text-gray-500">
        {device.online_clients} clients • Synced {formatRelativeTime(device.synced_at)}
      </div>
    </div>
  );
}
```

**Step 2: Update index exports**

```tsx
// components/admin/network/index.ts
export { DeviceActionsMenu } from './DeviceActionsMenu';
export { DeviceStatCards } from './DeviceStatCards';
export { DeviceFilters } from './DeviceFilters';
export { DeviceCard } from './DeviceCard';
```

**Step 3: Verify TypeScript compiles**

Run: `npm run type-check:memory 2>&1 | grep -E "error|DeviceCard" | head -10`
Expected: No errors

**Step 4: Commit**

```bash
git add components/admin/network/
git commit -m "feat(ruijie): add DeviceCard component for mobile view"
```

---

## Task 5: Create DeviceTable Component

**Files:**
- Create: `components/admin/network/DeviceTable.tsx`
- Modify: `components/admin/network/index.ts`

**Step 1: Create the component**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { PiWifiHighBold, PiWifiSlashBold } from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DeviceActionsMenu } from './DeviceActionsMenu';

interface RuijieDevice {
  sn: string;
  device_name: string;
  model: string | null;
  group_name: string | null;
  management_ip: string | null;
  online_clients: number;
  status: string;
  synced_at: string;
  mock_data: boolean;
}

interface DeviceTableProps {
  devices: RuijieDevice[];
  tunnelLimitReached: boolean;
  onReboot: (device: RuijieDevice) => void;
  formatRelativeTime: (date: string) => string;
}

export function DeviceTable({
  devices,
  tunnelLimitReached,
  onReboot,
  formatRelativeTime,
}: DeviceTableProps) {
  const router = useRouter();

  const handleRowClick = (sn: string) => {
    router.push(`/admin/network/devices/${sn}`);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Status</TableHead>
              <TableHead>Device</TableHead>
              <TableHead className="hidden md:table-cell">Model</TableHead>
              <TableHead className="hidden lg:table-cell">Group</TableHead>
              <TableHead className="hidden lg:table-cell">IP</TableHead>
              <TableHead className="text-center w-20">Clients</TableHead>
              <TableHead className="hidden sm:table-cell w-24">Synced</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => {
              const isOnline = device.status === 'online';
              const StatusIcon = isOnline ? PiWifiHighBold : PiWifiSlashBold;

              return (
                <TableRow
                  key={device.sn}
                  className={cn(
                    'cursor-pointer',
                    !isOnline && 'bg-red-50/50'
                  )}
                  onClick={() => handleRowClick(device.sn)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        isOnline ? 'bg-green-500' : 'bg-red-500'
                      )}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{device.device_name}</span>
                      {device.mock_data && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                          MOCK
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-600">
                    {device.model || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-gray-600">
                    {device.group_name || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <code className="text-xs text-gray-600">{device.management_ip || '-'}</code>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {device.online_clients}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-gray-500 text-sm">
                    {formatRelativeTime(device.synced_at)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DeviceActionsMenu
                      sn={device.sn}
                      deviceName={device.device_name}
                      isOnline={isOnline}
                      tunnelLimitReached={tunnelLimitReached}
                      onReboot={() => onReboot(device)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {devices.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No devices found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Update index exports**

```tsx
// components/admin/network/index.ts
export { DeviceActionsMenu } from './DeviceActionsMenu';
export { DeviceStatCards } from './DeviceStatCards';
export { DeviceFilters } from './DeviceFilters';
export { DeviceCard } from './DeviceCard';
export { DeviceTable } from './DeviceTable';
```

**Step 3: Verify TypeScript compiles**

Run: `npm run type-check:memory 2>&1 | grep -E "error|DeviceTable" | head -10`
Expected: No errors

**Step 4: Commit**

```bash
git add components/admin/network/
git commit -m "feat(ruijie): add DeviceTable component with row actions"
```

---

## Task 6: Refactor Main Page to Use New Components

**Files:**
- Modify: `app/admin/network/devices/page.tsx`

**Step 1: Replace imports and remove inline components**

Update the imports section at the top of the file:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PiArrowsClockwiseBold,
  PiWarningBold,
} from 'react-icons/pi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DeviceStatCards,
  DeviceFilters,
  DeviceTable,
  DeviceCard,
} from '@/components/admin/network';
```

**Step 2: Keep interface definitions and helper functions**

Keep `RuijieDevice`, `DevicesResponse`, `formatRelativeTime` as they are.

**Step 3: Update the JSX to use new components**

Replace the return statement JSX (starting from line ~267) with:

```tsx
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        {/* Skeleton filter bar */}
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        {/* Skeleton table */}
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const onlineCount = data?.devices.filter((d) => d.status === 'online').length || 0;
  const offlineCount = data?.devices.filter((d) => d.status === 'offline').length || 0;
  const isMockData = data?.devices.every((d) => d.mock_data) && (data?.devices.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Devices</h1>
          <p className="text-gray-500 mt-1">
            Ruijie Cloud managed devices
            {data?.lastSynced && (
              <span className="ml-2 text-sm">
                • Last synced {formatRelativeTime(data.lastSynced)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Mock Data Banner */}
      {isMockData && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-purple-800">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="font-medium">
                Displaying mock data — Connect Ruijie API for live data
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stale Warning */}
      {isStale && (
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiWarningBold className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">
                  Device data may be outdated — last synced {formatRelativeTime(data?.lastSynced || '')}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Refresh Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <DeviceStatCards
        total={data?.total || 0}
        online={onlineCount}
        offline={offlineCount}
        activeTunnels={tunnelCount}
        tunnelLimit={TUNNEL_LIMIT}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Filters */}
      <DeviceFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        groupFilter={groupFilter}
        onGroupChange={setGroupFilter}
        modelFilter={modelFilter}
        onModelChange={setModelFilter}
        groups={data?.filters.groups || []}
        models={data?.filters.models || []}
        onRefresh={handleRefresh}
        onExport={handleExportCSV}
        refreshing={refreshing}
      />

      {/* Device List - Table on desktop, Cards on mobile */}
      <div className="hidden md:block">
        <DeviceTable
          devices={data?.devices || []}
          tunnelLimitReached={tunnelCount >= TUNNEL_LIMIT}
          onReboot={setRebootDevice}
          formatRelativeTime={formatRelativeTime}
        />
      </div>
      <div className="md:hidden space-y-3">
        {data?.devices.map((device) => (
          <DeviceCard
            key={device.sn}
            device={device}
            tunnelLimitReached={tunnelCount >= TUNNEL_LIMIT}
            onReboot={setRebootDevice}
            formatRelativeTime={formatRelativeTime}
          />
        ))}
        {data?.devices.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No devices found
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Showing {data?.devices.length || 0} of {data?.total || 0} devices</span>
        <span>Active tunnels: {tunnelCount}/{TUNNEL_LIMIT}</span>
      </div>

      {/* Reboot Confirmation Dialog */}
      <AlertDialog open={!!rebootDevice} onOpenChange={() => setRebootDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reboot Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reboot <strong>{rebootDevice?.device_name}</strong> ({rebootDevice?.sn}).
              The device will be offline for approximately 2-3 minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReboot}
              disabled={rebooting}
              className="bg-red-600 hover:bg-red-700"
            >
              {rebooting ? 'Rebooting...' : 'Reboot'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
```

**Step 4: Remove unused imports and old inline code**

Remove these imports that are no longer needed:
- `Link`
- `PiCaretRightBold`, `PiCheckCircleBold`, `PiCopyBold`, `PiDownloadBold`, `PiEyeBold`, `PiFunnelBold`, `PiLinkBold`, `PiPowerBold`, `PiWifiHighBold`, `PiWifiSlashBold`, `PiXBold`
- `Input`, `Badge`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`
- `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`

Remove helper functions that are now in components:
- `getStatusConfig`
- `getConfigStatusBadge`

Remove the `TooltipProvider` wrapper.

**Step 5: Verify TypeScript compiles**

Run: `npm run type-check:memory 2>&1 | head -20`
Expected: No errors

**Step 6: Commit**

```bash
git add app/admin/network/devices/page.tsx
git commit -m "refactor(ruijie): use new components for devices page"
```

---

## Task 7: Final Type Check and Push

**Step 1: Full type check**

Run: `npm run type-check:memory`
Expected: Clean exit with no errors

**Step 2: Test build**

Run: `npm run build:memory 2>&1 | tail -30`
Expected: Build succeeds

**Step 3: Push all changes**

```bash
git push origin main
```

**Step 4: Verify deployment**

Wait for Vercel to deploy, then test at:
- Desktop: `https://www.circletel.co.za/admin/network/devices`
- Mobile: Use browser dev tools to test responsive views

---

## Summary

| Task | Component | Lines of Code |
|------|-----------|---------------|
| 1 | DeviceActionsMenu | ~70 |
| 2 | DeviceStatCards | ~70 |
| 3 | DeviceFilters | ~140 |
| 4 | DeviceCard | ~60 |
| 5 | DeviceTable | ~110 |
| 6 | Page refactor | -200 (removed), +100 (new) |
| 7 | Final verification | - |

**Total new code:** ~450 lines across 5 components
**Page reduction:** From ~546 lines to ~250 lines (54% smaller)
