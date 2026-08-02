'use client';

/**
 * Hardware → Location → Active Customer inventory
 * shadcn/ui composition: Card, Chart, Tabs, ToggleGroup, Table, DropdownMenu
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Label, Pie, PieChart, Cell } from 'recharts';
import {
  PiArrowsClockwiseBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiDotsThreeBold,
  PiHardDrivesBold,
  PiLinkBold,
  PiLinkBreakBold,
  PiMagnifyingGlassBold,
  PiMapPinBold,
  PiWifiHighBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AdminPage,
  PageHeader,
  ErrorState,
  EmptyState,
} from '@/components/backend';

type HardwareSource = 'ruijie' | 'interstellio' | 'tarana';

interface HardwareRow {
  hardware_source: HardwareSource;
  hardware_id: string;
  hardware_label: string | null;
  hardware_model: string | null;
  hardware_status: string | null;
  last_seen_at: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  service_id: string | null;
  service_status: string | null;
  service_active: boolean | null;
  package_name: string | null;
  location_type: string | null;
  location_id: string | null;
  location_name: string | null;
  location_address: string | null;
  province: string | null;
  link_method: string | null;
}

interface ApiResponse {
  rows: HardwareRow[];
  totals: {
    total: number;
    linked: number;
    unlinked: number;
    by_source: Record<HardwareSource, number>;
  };
}

const SOURCE_LABEL: Record<HardwareSource, string> = {
  ruijie: 'Ruijie',
  interstellio: 'Interstellio',
  tarana: 'Tarana RN',
};

const PAGE_SIZE = 25;
type StatusFilter = 'all' | 'online' | 'offline';
type CardFilter = 'total' | 'linked' | 'unlinked' | 'online';

const sourceChartConfig = {
  ruijie: { label: 'Ruijie', color: 'hsl(24 95% 53%)' },
  interstellio: { label: 'Interstellio', color: 'hsl(217 91% 60%)' },
  tarana: { label: 'Tarana RN', color: 'hsl(142 71% 45%)' },
} satisfies ChartConfig;

const linkChartConfig = {
  linked: { label: 'Linked', color: 'hsl(142 71% 45%)' },
  unlinked: { label: 'Unlinked', color: 'hsl(215 16% 70%)' },
} satisfies ChartConfig;

function isOnlineStatus(status: string | null): boolean {
  const s = (status || '').toLowerCase();
  return ['online', 'enabled', 'active'].includes(s);
}

function isOfflineStatus(status: string | null): boolean {
  const s = (status || '').toLowerCase();
  return ['offline', 'disabled', 'down'].includes(s);
}

function statusBadgeClass(status: string | null): string {
  if (isOnlineStatus(status)) return 'bg-green-50 text-green-700 border-green-200';
  if (isOfflineStatus(status)) return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-muted text-muted-foreground border-border';
}

function detailHref(row: HardwareRow): string | null {
  if (row.hardware_source === 'ruijie') {
    return `/admin/network/devices/${encodeURIComponent(row.hardware_id)}`;
  }
  if (row.customer_id) {
    return `/admin/customers/${row.customer_id}`;
  }
  return null;
}

function HardwarePageSkeleton() {
  return (
    <AdminPage>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </AdminPage>
  );
}

export default function HardwareInstallationsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState<string>('all');
  const [linked, setLinked] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [serviceStatus, setServiceStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams();
        if (source !== 'all') params.set('source', source);
        if (linked !== 'all') params.set('linked', linked);
        if (serviceStatus !== 'all') params.set('service_status', serviceStatus);
        if (q) params.set('q', q);

        const res = await fetch(
          `/api/admin/network/hardware-installations?${params.toString()}`,
          { credentials: 'include' }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load');
        }
        const json = (await res.json()) as ApiResponse;
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [source, linked, serviceStatus, q]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [source, linked, statusFilter, serviceStatus, q]);

  const rows = data?.rows || [];
  const totals = data?.totals;

  const onlineCount = useMemo(
    () => rows.filter((r) => isOnlineStatus(r.hardware_status)).length,
    [rows]
  );
  const offlineCount = useMemo(
    () => rows.filter((r) => isOfflineStatus(r.hardware_status)).length,
    [rows]
  );
  const unknownCount = useMemo(
    () => rows.length - onlineCount - offlineCount,
    [rows.length, onlineCount, offlineCount]
  );

  const filteredRows = useMemo(() => {
    if (statusFilter === 'online') {
      return rows.filter((r) => isOnlineStatus(r.hardware_status));
    }
    if (statusFilter === 'offline') {
      return rows.filter((r) => isOfflineStatus(r.hardware_status));
    }
    return rows;
  }, [rows, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE);

  const activeCard: CardFilter | null = useMemo(() => {
    if (statusFilter === 'online') return 'online';
    if (linked === 'linked') return 'linked';
    if (linked === 'unlinked') return 'unlinked';
    if (linked === 'all' && statusFilter === 'all') return 'total';
    return null;
  }, [linked, statusFilter]);

  const applyCardFilter = (card: CardFilter) => {
    setPage(1);
    if (card === 'total') {
      setLinked('all');
      setStatusFilter('all');
      return;
    }
    if (card === 'linked') {
      setStatusFilter('all');
      setLinked((prev) => (prev === 'linked' ? 'all' : 'linked'));
      return;
    }
    if (card === 'unlinked') {
      setStatusFilter('all');
      setLinked((prev) => (prev === 'unlinked' ? 'all' : 'unlinked'));
      return;
    }
    setLinked('all');
    setStatusFilter((prev) => (prev === 'online' ? 'all' : 'online'));
  };

  const sourcePieData = useMemo(
    () =>
      (
        [
          { key: 'ruijie', value: totals?.by_source.ruijie ?? 0 },
          { key: 'interstellio', value: totals?.by_source.interstellio ?? 0 },
          { key: 'tarana', value: totals?.by_source.tarana ?? 0 },
        ] as const
      )
        .filter((d) => d.value > 0)
        .map((d) => ({
          name: d.key,
          value: d.value,
          fill: `var(--color-${d.key})`,
        })),
    [totals]
  );

  const linkPieData = useMemo(
    () =>
      [
        {
          name: 'linked',
          value: totals?.linked ?? 0,
          fill: 'var(--color-linked)',
        },
        {
          name: 'unlinked',
          value: totals?.unlinked ?? 0,
          fill: 'var(--color-unlinked)',
        },
      ].filter((d) => d.value > 0),
    [totals]
  );

  if (loading && !data) {
    return <HardwarePageSkeleton />;
  }

  if (error && !data) {
    return (
      <AdminPage>
        <ErrorState
          title="Unable to load inventory"
          message={error}
          onRetry={() => fetchData()}
        />
      </AdminPage>
    );
  }

  const total = totals?.total ?? 0;
  const linkedPct =
    total > 0 ? Math.round(((totals?.linked ?? 0) / total) * 100) : 0;

  return (
    <TooltipProvider>
      <AdminPage>
        <div className="flex flex-col gap-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/network">Network</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Hardware Installations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <PageHeader
            title="Hardware Installations"
            subtitle="Hardware-first inventory with location and active customer service links"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(true)}
                disabled={refreshing}
              >
                <PiArrowsClockwiseBold
                  className={`mr-2 size-4 ${refreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            }
          />

          {/* KPI cards — clickable filters */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                {
                  id: 'total' as const,
                  label: 'Total hardware',
                  value: total,
                  hint: 'Across Ruijie, Interstellio & Tarana',
                  icon: PiHardDrivesBold,
                  valueClass: '',
                },
                {
                  id: 'linked' as const,
                  label: 'Linked to service',
                  value: totals?.linked ?? 0,
                  hint: `${linkedPct}% of inventory mapped`,
                  icon: PiLinkBold,
                  valueClass: 'text-green-700',
                },
                {
                  id: 'unlinked' as const,
                  label: 'Unlinked',
                  value: totals?.unlinked ?? 0,
                  hint: 'Needs install-register mapping',
                  icon: PiLinkBreakBold,
                  valueClass: '',
                },
                {
                  id: 'online' as const,
                  label: 'Online signal',
                  value: onlineCount,
                  hint: `${offlineCount} offline · ${unknownCount} unknown`,
                  icon: PiWifiHighBold,
                  valueClass: 'text-green-700',
                },
              ] as const
            ).map((card) => {
              const Icon = card.icon;
              const isActive = activeCard === card.id;
              return (
                <Card
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  aria-label={`Filter by ${card.label}`}
                  onClick={() => applyCardFilter(card.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      applyCardFilter(card.id);
                    }
                  }}
                  className={cn(
                    'cursor-pointer transition-all hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange',
                    isActive &&
                      'border-circleTel-orange bg-orange-50/60 ring-2 ring-circleTel-orange'
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription
                      className={cn(isActive && 'text-circleTel-orange font-medium')}
                    >
                      {card.label}
                    </CardDescription>
                    <Icon
                      className={cn(
                        'size-4 text-muted-foreground',
                        isActive && 'text-circleTel-orange'
                      )}
                    />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={cn(
                        'text-3xl font-bold tracking-tight',
                        card.valueClass
                      )}
                    >
                      {card.value}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {card.hint}
                      <span className="ml-1 text-muted-foreground/80">
                        · click to filter
                      </span>
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By source</CardTitle>
                <CardDescription>
                  Hardware rows in the current filter set
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sourcePieData.length === 0 ? (
                  <EmptyState
                    icon={<PiHardDrivesBold />}
                    title="No hardware"
                    description="Adjust filters to see source mix."
                  />
                ) : (
                  <ChartContainer
                    config={sourceChartConfig}
                    className="mx-auto aspect-square max-h-[260px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={sourcePieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={90}
                        strokeWidth={2}
                      >
                        {sourcePieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            if (!viewBox || !('cx' in viewBox)) return null;
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) - 6}
                                  className="fill-foreground text-2xl font-bold"
                                >
                                  {total}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 16}
                                  className="fill-muted-foreground text-xs"
                                >
                                  devices
                                </tspan>
                              </text>
                            );
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                  {(
                    Object.keys(sourceChartConfig) as Array<
                      keyof typeof sourceChartConfig
                    >
                  ).map((key) => (
                    <span key={key} className="inline-flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: sourceChartConfig[key].color }}
                      />
                      {sourceChartConfig[key].label}:{' '}
                      {totals?.by_source[key as HardwareSource] ?? 0}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer link coverage</CardTitle>
                <CardDescription>
                  Mapped to an active customer service vs still unlinked
                </CardDescription>
              </CardHeader>
              <CardContent>
                {linkPieData.length === 0 ? (
                  <EmptyState
                    icon={<PiLinkBold />}
                    title="No rows"
                    description="Link coverage appears when inventory loads."
                  />
                ) : (
                  <ChartContainer
                    config={linkChartConfig}
                    className="mx-auto aspect-square max-h-[260px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={linkPieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={90}
                        strokeWidth={2}
                      >
                        {linkPieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            if (!viewBox || !('cx' in viewBox)) return null;
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) - 6}
                                  className="fill-foreground text-2xl font-bold"
                                >
                                  {linkedPct}%
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 16}
                                  className="fill-muted-foreground text-xs"
                                >
                                  linked
                                </tspan>
                              </text>
                            );
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: linkChartConfig.linked.color }}
                    />
                    Linked: {totals?.linked ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: linkChartConfig.unlinked.color }}
                    />
                    Unlinked: {totals?.unlinked ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters + table */}
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">Inventory</CardTitle>
                <CardDescription>
                  One row per device — customer and location when mapped
                </CardDescription>
              </div>

              <Tabs
                value={source}
                onValueChange={setSource}
                className="w-full"
              >
                <TabsList className="inline-flex h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-muted p-1">
                  {(
                    [
                      { value: 'all', label: 'All' },
                      { value: 'ruijie', label: 'Ruijie' },
                      { value: 'interstellio', label: 'Interstellio' },
                      { value: 'tarana', label: 'Tarana RN' },
                    ] as const
                  ).map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium',
                        'data-[state=inactive]:text-muted-foreground',
                        'data-[state=active]:bg-circleTel-orange data-[state=active]:text-white data-[state=active]:shadow-sm',
                        'data-[state=active]:hover:bg-circleTel-orange'
                      )}
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setQ(searchInput.trim());
                  }}
                >
                  <div className="relative flex-1">
                    <PiMagnifyingGlassBold className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search serial, customer, location…"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="sm">
                    Search
                  </Button>
                </form>

                <ToggleGroup
                  type="single"
                  value={linked}
                  onValueChange={(v) => {
                    if (!v) return;
                    setLinked(v);
                    if (v !== 'all') setStatusFilter('all');
                  }}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="all" aria-label="All links">
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="linked" aria-label="Linked only">
                    Linked
                  </ToggleGroupItem>
                  <ToggleGroupItem value="unlinked" aria-label="Unlinked only">
                    Unlinked
                  </ToggleGroupItem>
                </ToggleGroup>

                <Select value={serviceStatus} onValueChange={setServiceStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Service status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any service</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[110px]">Source</TableHead>
                      <TableHead>Hardware</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead className="w-[56px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-40">
                          <EmptyState
                            icon={<PiMapPinBold />}
                            title="No matching hardware"
                            description="Try clearing filters or widening the search."
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRows.map((row) => {
                        const href = detailHref(row);
                        return (
                          <TableRow
                            key={`${row.hardware_source}:${row.hardware_id}`}
                          >
                            <TableCell>
                              <Badge variant="outline">
                                {SOURCE_LABEL[row.hardware_source]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {row.hardware_label || row.hardware_id}
                              </div>
                              <div className="font-mono text-xs text-muted-foreground">
                                {row.hardware_id}
                              </div>
                              {row.hardware_model && (
                                <div className="text-xs text-muted-foreground">
                                  {row.hardware_model}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`size-2 shrink-0 rounded-full ${
                                    isOnlineStatus(row.hardware_status)
                                      ? 'bg-green-500'
                                      : isOfflineStatus(row.hardware_status)
                                        ? 'bg-red-500'
                                        : 'bg-muted-foreground/40'
                                  }`}
                                />
                                <Badge
                                  variant="outline"
                                  className={statusBadgeClass(row.hardware_status)}
                                >
                                  {row.hardware_status || '—'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {row.customer_name || row.customer_id ? (
                                <div>
                                  {row.customer_id ? (
                                    <Link
                                      href={`/admin/customers/${row.customer_id}`}
                                      className="font-medium text-circleTel-orange hover:underline"
                                    >
                                      {row.customer_name || 'Customer'}
                                    </Link>
                                  ) : (
                                    <span className="font-medium">
                                      {row.customer_name}
                                    </span>
                                  )}
                                  {row.customer_email && (
                                    <div className="text-xs text-muted-foreground">
                                      {row.customer_email}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Unlinked
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.service_id ? (
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant="outline"
                                    className={statusBadgeClass(row.service_status)}
                                  >
                                    {row.service_status || '—'}
                                  </Badge>
                                  {row.package_name && (
                                    <span className="text-xs text-muted-foreground">
                                      {row.package_name}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  No service
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.location_name || row.location_address ? (
                                <div>
                                  <div className="text-sm font-medium">
                                    {row.location_name || 'Location'}
                                  </div>
                                  {row.location_address && (
                                    <div className="line-clamp-2 text-xs text-muted-foreground">
                                      {row.location_address}
                                    </div>
                                  )}
                                  {row.province && (
                                    <div className="text-xs text-muted-foreground">
                                      {row.province}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  No location
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.link_method ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="font-mono text-[10px]">
                                      {row.link_method}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    How this row was joined to a customer service
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Map via install register
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label="Row actions"
                                  >
                                    <PiDotsThreeBold className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {href ? (
                                    <DropdownMenuItem asChild>
                                      <Link href={href}>Open details</Link>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled>
                                      No detail page
                                    </DropdownMenuItem>
                                  )}
                                  {row.customer_id && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/admin/customers/${row.customer_id}`}>
                                        View customer
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  {row.hardware_source === 'ruijie' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={`/admin/network/devices/${encodeURIComponent(row.hardware_id)}`}
                                        >
                                          Ruijie device
                                        </Link>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {filteredRows.length > 0 && (
                <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing{' '}
                    <span className="font-medium text-foreground">
                      {pageStart + 1}
                    </span>
                    –
                    <span className="font-medium text-foreground">
                      {Math.min(pageStart + PAGE_SIZE, filteredRows.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-foreground">
                      {filteredRows.length}
                    </span>
                    {statusFilter !== 'all' ? ' (status filter)' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <PiCaretLeftBold className="mr-1 size-4" />
                      Previous
                    </Button>
                    <span className="min-w-[5.5rem] text-center text-sm text-muted-foreground">
                      Page {safePage} of {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                      <PiCaretRightBold className="ml-1 size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminPage>
    </TooltipProvider>
  );
}
