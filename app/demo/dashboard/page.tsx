'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { IconType } from 'react-icons';
import {
  PiBellBold,
  PiCalendarCheckBold,
  PiCaretDownBold,
  PiCaretRightBold,
  PiCheckCircleBold,
  PiClockBold,
  PiCurrencyDollarBold,
  PiGearBold,
  PiHeadsetBold,
  PiMagnifyingGlassBold,
  PiMapPinLineBold,
  PiPaperPlaneTiltBold,
  PiPlusBold,
  PiQuestionBold,
  PiShoppingCartSimpleBold,
  PiSignOutBold,
  PiSquaresFourBold,
  PiTicketBold,
  PiTrendUpBold,
  PiUserBold,
  PiUserPlusBold,
  PiUsersThreeBold,
  PiWarningBold,
  PiWifiHighBold,
} from 'react-icons/pi';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { hasChildren } from '@/lib/admin/feature-registry';
import { cn } from '@/lib/utils';
import { createPrototypeNavigationHandlers } from './interaction';
import { dashboardNavigation } from './navigation';

export type TrendRange = '30d' | '6m' | '12m';

type StatusTone = 'positive' | 'warning' | 'critical' | 'neutral';

interface DashboardKpi {
  label: string;
  value: string;
  change: string;
  detail: string;
  icon: IconType;
  tone: StatusTone;
}

export const dashboardKpis: DashboardKpi[] = [
  {
    label: 'Active customers',
    value: '1,246',
    change: '+3.8%',
    detail: '46 added this month',
    icon: PiUsersThreeBold,
    tone: 'positive',
  },
  {
    label: 'Monthly revenue',
    value: 'R1.84m',
    change: '+6.2%',
    detail: 'R107k above June',
    icon: PiCurrencyDollarBold,
    tone: 'positive',
  },
  {
    label: 'Open tickets',
    value: '18',
    change: '5 need attention',
    detail: '3 outside SLA',
    icon: PiHeadsetBold,
    tone: 'warning',
  },
  {
    label: 'Network incidents',
    value: '2',
    change: '1 service-impacting',
    detail: 'Last update 8 min ago',
    icon: PiWifiHighBold,
    tone: 'critical',
  },
];

const dashboardTrendData: Record<
  TrendRange,
  Array<{ label: string; customers: number; revenue: number }>
> = {
  '30d': [
    { label: 'Week 1', customers: 1178, revenue: 1.52 },
    { label: 'Week 2', customers: 1196, revenue: 1.61 },
    { label: 'Week 3', customers: 1222, revenue: 1.72 },
    { label: 'Week 4', customers: 1246, revenue: 1.84 },
  ],
  '6m': [
    { label: 'Feb', customers: 1034, revenue: 1.22 },
    { label: 'Mar', customers: 1082, revenue: 1.31 },
    { label: 'Apr', customers: 1126, revenue: 1.43 },
    { label: 'May', customers: 1174, revenue: 1.56 },
    { label: 'Jun', customers: 1211, revenue: 1.69 },
    { label: 'Jul', customers: 1246, revenue: 1.84 },
  ],
  '12m': Array.from({ length: 12 }, (_, index) => ({
    label: new Date(2025, 7 + index).toLocaleString('en-ZA', {
      month: 'short',
    }),
    customers: 842 + index * 36,
    revenue: Number((0.91 + index * 0.085).toFixed(2)),
  })),
};

export function getDashboardTrendData(range: TrendRange) {
  return dashboardTrendData[range];
}

const quickActions: Array<{
  label: string;
  description: string;
  icon: IconType;
}> = [
  {
    label: 'Add customer',
    description: 'Create a new account',
    icon: PiUserPlusBold,
  },
  {
    label: 'New order',
    description: 'Capture a service order',
    icon: PiShoppingCartSimpleBold,
  },
  {
    label: 'Log ticket',
    description: 'Open a support case',
    icon: PiTicketBold,
  },
  {
    label: 'Schedule install',
    description: 'Book a field visit',
    icon: PiCalendarCheckBold,
  },
  {
    label: 'Send message',
    description: 'Notify a customer',
    icon: PiPaperPlaneTiltBold,
  },
  {
    label: 'Run coverage',
    description: 'Check a new address',
    icon: PiMapPinLineBold,
  },
];

const operationsRows = [
  {
    workstream: 'Installations scheduled',
    value: '12',
    note: '8 confirmed',
    tone: 'positive' as const,
  },
  {
    workstream: 'Awaiting provisioning',
    value: '7',
    note: 'Oldest: 19h',
    tone: 'warning' as const,
  },
  {
    workstream: 'Tickets outside SLA',
    value: '3',
    note: 'Escalation required',
    tone: 'critical' as const,
  },
  {
    workstream: 'Field teams active',
    value: '6',
    note: 'Across Gauteng',
    tone: 'neutral' as const,
  },
];

const collectionsRows = [
  { metric: 'Collected this month', value: 'R1.62m', status: 'On target' },
  { metric: 'Overdue invoices', value: 'R146k', status: '9 accounts' },
  { metric: 'Collection rate', value: '92.4%', status: '+1.8%' },
  { metric: 'Failed debit orders', value: '14', status: 'Review' },
];

const chartConfig = {
  customers: {
    label: 'Active customers',
    color: '#1B2A4A',
  },
  revenue: {
    label: 'Revenue (R millions)',
    color: '#E87A1E',
  },
} satisfies ChartConfig;

const toneStyles: Record<StatusTone, string> = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  critical: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
};

const toneIconStyles: Record<StatusTone, string> = {
  positive: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-700',
};

function OperationsSidebar({
  onNavigate,
}: {
  onNavigate: (label: string) => void;
}) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { isMobile, setOpen, setOpenMobile, state } = useSidebar();

  const setItemExpanded = (name: string, expanded: boolean) => {
    setExpandedItems((current) =>
      expanded
        ? [...new Set([...current, name])]
        : current.filter((itemName) => itemName !== name)
    );
  };

  const getNavigationHandlers = (label: string) =>
    createPrototypeNavigationHandlers({
      label,
      onNavigate,
      onMobileClose: isMobile ? () => setOpenMobile(false) : undefined,
    });

  return (
    <Sidebar
      collapsible="icon"
      className="border-ui-border bg-white md:!bottom-auto md:!top-[37px] md:!h-[calc(100svh-37px)]"
    >
      <SidebarHeader className="h-16 justify-center border-b border-ui-border px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <Image
            src="/images/circletel-logo.png"
            alt="CircleTel"
            width={190}
            height={64}
            priority
            className="h-14 w-auto object-contain group-data-[collapsible=icon]:hidden"
          />
          <Image
            src="/images/circletel-enclosed-logo.png"
            alt="CircleTel"
            width={32}
            height={32}
            className="hidden object-contain group-data-[collapsible=icon]:block"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white py-3">
        <nav aria-label="Operations navigation" className="flex flex-col gap-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive
                    tooltip="Dashboard"
                    onClick={() => {
                      onNavigate('Dashboard');
                      if (isMobile) setOpenMobile(false);
                    }}
                    className="h-10 data-[active=true]:bg-circleTel-orange-light data-[active=true]:text-circleTel-orange-accessible"
                  >
                    <PiSquaresFourBold />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {dashboardNavigation.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel className="uppercase tracking-[0.12em]">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    if (hasChildren(item)) {
                      return (
                        <Collapsible
                          key={item.name}
                          asChild
                          open={expandedItems.includes(item.name)}
                          onOpenChange={(expanded) => {
                            if (expanded && !isMobile && state === 'collapsed') {
                              setOpen(true);
                            }
                            setItemExpanded(item.name, expanded);
                          }}
                        >
                          <SidebarMenuItem className="group/collapsible">
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                tooltip={item.name}
                                className="h-9 text-ui-text-secondary hover:text-circleTel-navy"
                              >
                                <item.icon />
                                <span className="truncate">{item.name}</span>
                                <PiCaretRightBold className="ml-auto motion-safe:transition-transform motion-reduce:transition-none group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.children.map((child) => (
                                  <SidebarMenuSubItem key={child.href}>
                                    <SidebarMenuSubButton
                                      href={child.href}
                                      {...getNavigationHandlers(child.name)}
                                      className="text-ui-text-secondary hover:text-circleTel-navy"
                                    >
                                      <child.icon />
                                      <span className="truncate">
                                        {child.name}
                                      </span>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.name}
                          className="h-9 text-ui-text-secondary hover:text-circleTel-navy"
                        >
                          <a
                            href={item.href}
                            {...getNavigationHandlers(item.name)}
                          >
                            <item.icon />
                            <span className="truncate">{item.name}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-ui-border bg-white p-3">
        <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Operations Console · Prototype
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function IconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function OperationsHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ui-border bg-white px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-circleTel-navy">
            Operations overview
          </p>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            Live staff command center
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <IconButton label="Search">
          <PiMagnifyingGlassBold />
        </IconButton>
        <IconButton label="Help">
          <PiQuestionBold />
        </IconButton>
        <div className="relative">
          <IconButton label="Notifications">
            <PiBellBold />
          </IconButton>
          <span className="absolute right-1 top-1 size-2 rounded-full bg-circleTel-orange ring-2 ring-white" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-1 gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-circleTel-orange-light text-xs font-semibold text-circleTel-orange-accessible">
                  TM
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold">Thabo Mokoena</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Operations manager
                </span>
              </span>
              <PiCaretDownBold data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <PiUserBold className="mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <PiGearBold className="mr-2" />
                Preferences
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-red-600">
                <PiSignOutBold className="mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function KpiGrid() {
  return (
    <section aria-label="Key performance indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {dashboardKpis.map((item) => (
        <Card key={item.label} className="border-ui-border shadow-sm">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl text-circleTel-navy">
                {item.value}
              </CardTitle>
            </div>
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full',
                toneIconStyles[item.tone]
              )}
            >
              <item.icon className="size-5" />
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={toneStyles[item.tone]}>
              {item.change}
            </Badge>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">{item.detail}</p>
          </CardFooter>
        </Card>
      ))}
    </section>
  );
}

function QuickActions({
  onAction,
}: {
  onAction: (label: string) => void;
}) {
  return (
    <Card className="min-w-0 border-ui-border shadow-sm">
      <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg text-circleTel-navy">Quick actions</CardTitle>
          <CardDescription>Start the most common staff workflows.</CardDescription>
        </div>
        <Badge variant="secondary">Role-aware</Badge>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto justify-start px-4 py-3"
            onClick={() => onAction(action.label)}
          >
            <action.icon data-icon="inline-start" />
            <span className="flex min-w-0 flex-col items-start">
              <span className="truncate font-semibold">{action.label}</span>
              <span className="hidden text-xs font-normal text-muted-foreground 2xl:block">
                {action.description}
              </span>
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function GrowthChart({
  range,
  onRangeChange,
}: {
  range: TrendRange;
  onRangeChange: (range: TrendRange) => void;
}) {
  return (
    <Card className="min-w-0 border-ui-border shadow-sm">
      <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg text-circleTel-navy">Growth & revenue</CardTitle>
          <CardDescription>Active customers and billed revenue trend.</CardDescription>
        </div>
        <ToggleGroup
          type="single"
          value={range}
          onValueChange={(value) => {
            if (value) onRangeChange(value as TrendRange);
          }}
          variant="outline"
          size="sm"
          aria-label="Reporting period"
        >
          <ToggleGroupItem value="30d" aria-label="30 days">
            30d
          </ToggleGroupItem>
          <ToggleGroupItem value="6m" aria-label="6 months">
            6m
          </ToggleGroupItem>
          <ToggleGroupItem value="12m" aria-label="12 months">
            12m
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <LineChart
            accessibilityLayer
            data={getDashboardTrendData(range)}
            margin={{ left: 4, right: 4, top: 8 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              yAxisId="customers"
              tickLine={false}
              axisLine={false}
              width={42}
              domain={['dataMin - 40', 'dataMax + 40']}
            />
            <YAxis
              yAxisId="revenue"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(value) => `R${value}m`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              yAxisId="customers"
              dataKey="customers"
              type="monotone"
              stroke="#1B2A4A"
              strokeWidth={3}
              isAnimationActive={false}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="revenue"
              dataKey="revenue"
              type="monotone"
              stroke="#E87A1E"
              strokeWidth={3}
              isAnimationActive={false}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-circleTel-navy" />
          Active customers
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-circleTel-orange" />
          Revenue (R millions)
        </span>
      </CardFooter>
    </Card>
  );
}

function OperationsAndFinancePanel() {
  return (
    <Tabs defaultValue="operations" className="min-w-0">
      <Card className="min-w-0 border-ui-border shadow-sm">
        <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg text-circleTel-navy">Command center</CardTitle>
            <CardDescription>Operational work and collection health.</CardDescription>
          </div>
          <TabsList className="grid w-full grid-cols-2 bg-circleTel-orange-light sm:w-auto">
            <TabsTrigger
              value="operations"
              className="data-[state=active]:bg-white data-[state=active]:text-circleTel-orange-accessible"
            >
              Operations
            </TabsTrigger>
            <TabsTrigger
              value="finance"
              className="data-[state=active]:bg-white data-[state=active]:text-circleTel-orange-accessible"
            >
              Finance
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="px-0">
          <TabsContent value="operations" className="mt-0">
            <div className="flex items-center justify-between px-6 pb-3">
              <div className="flex items-center gap-2">
                <PiClockBold className="size-5 text-circleTel-orange-accessible" />
                <span className="text-sm font-semibold text-circleTel-navy">
                  Today’s operations
                </span>
              </div>
              <Badge variant="secondary">Live queue</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-10">Workstream</TableHead>
                  <TableHead className="h-10 text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operationsRows.map((row) => (
                  <TableRow key={row.workstream}>
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-circleTel-navy">
                          {row.workstream}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('w-fit', toneStyles[row.tone])}
                        >
                          {row.note}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right text-lg font-semibold">
                      {row.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="finance" className="mt-0">
            <div className="flex items-center justify-between px-6 pb-3">
              <span className="text-sm font-semibold text-circleTel-navy">
                Collections health
              </span>
              <Badge variant="outline" className={toneStyles.positive}>
                92.4%
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-10">Metric</TableHead>
                  <TableHead className="h-10 text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionsRows.map((row) => (
                  <TableRow key={row.metric}>
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-circleTel-navy">{row.metric}</span>
                        <span className="text-xs text-muted-foreground">{row.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right font-semibold">
                      {row.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}

export default function CircleTelOperationsDashboard() {
  const [range, setRange] = useState<TrendRange>('6m');
  const [activityMessage, setActivityMessage] = useState<string | null>(null);

  const showPrototypeFeedback = (label: string) => {
    setActivityMessage(`${label} is ready for the next prototype step.`);
  };

  return (
    <SidebarProvider
      defaultOpen
      className="min-h-[calc(100svh-37px)] bg-ui-bg"
      style={
        {
          '--sidebar-background': '0 0% 100%',
          '--sidebar-foreground': '220 46% 20%',
          '--sidebar-primary': '28 81% 51%',
          '--sidebar-primary-foreground': '0 0% 100%',
          '--sidebar-accent': '28 78% 95%',
          '--sidebar-accent-foreground': '28 78% 38%',
          '--sidebar-border': '220 13% 91%',
          '--sidebar-ring': '28 81% 51%',
        } as React.CSSProperties
      }
    >
      <OperationsSidebar onNavigate={showPrototypeFeedback} />
      <SidebarInset className="min-w-0 bg-ui-bg">
        <OperationsHeader />

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 xl:p-8">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Monday · 13 July 2026</Badge>
                <Badge variant="outline" className={toneStyles.positive}>
                  All systems monitored
                </Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-circleTel-navy md:text-3xl">
                Good morning, Thabo
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Here is the operational and commercial picture for CircleTel today.
              </p>
            </div>
            <Button variant="cta" onClick={() => showPrototypeFeedback('Create work item')}>
              <PiPlusBold data-icon="inline-start" />
              Create work item
            </Button>
          </section>

          {activityMessage ? (
            <Alert className="border-circleTel-orange/30 bg-circleTel-orange-light">
              <PiCheckCircleBold className="text-circleTel-orange-accessible" />
              <AlertTitle>Prototype interaction</AlertTitle>
              <AlertDescription>{activityMessage}</AlertDescription>
            </Alert>
          ) : null}

          <KpiGrid />
          <QuickActions onAction={showPrototypeFeedback} />

          <section aria-label="Business and operational analytics" className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
            <GrowthChart range={range} onRangeChange={setRange} />
            <OperationsAndFinancePanel />
          </section>

          <footer className="flex flex-col gap-2 border-t border-ui-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>CircleTel Operations Console · Standalone prototype</span>
            <span className="flex items-center gap-1">
              <PiTrendUpBold /> Data refreshed 2 minutes ago
            </span>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
