'use client';

/**
 * Splynx-style admin dashboard — CircleTel-branded demo.
 *
 * Recreates the Splynx ISP dashboard layout using shadcn/ui primitives
 * (Card, Badge, Tabs, Avatar, DropdownMenu, Separator, Button, Chart) and
 * Recharts, restyled to CircleTel brand tokens. Static mock data only.
 *
 * Route: /demo/splynx-dashboard (demo layout gates it out of production).
 */

import { useState } from 'react';
import {
  PiSquaresFour,
  PiUsersThree,
  PiHandshake,
  PiTicket,
  PiWallet,
  PiEnvelopeSimple,
  PiGlobe,
  PiCalendarBlank,
  PiStack,
  PiMicrophone,
  PiPercent,
  PiIdentificationCard,
  PiSlidersHorizontal,
  PiPlus,
  PiMagnifyingGlass,
  PiQuestion,
  PiInfo,
  PiBell,
  PiCaretDown,
  PiUserPlus,
  PiPaperPlaneTilt,
  PiWifiHigh,
  PiDesktopTower,
  PiBroadcast,
  PiGear,
  PiListChecks,
  PiPencilSimple,
  PiWarningCircle,
  PiChartLineUp,
} from 'react-icons/pi';
import type { IconType } from 'react-icons';
import Image from 'next/image';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const NAV_SECTIONS: { heading: string; items: { label: string; icon: IconType; active?: boolean }[] }[] = [
  {
    heading: 'CRM',
    items: [
      { label: 'Dashboard', icon: PiSquaresFour, active: true },
      { label: 'Customers', icon: PiUsersThree },
      { label: 'Leads', icon: PiHandshake },
      { label: 'Tickets', icon: PiTicket },
      { label: 'Finance', icon: PiWallet },
      { label: 'Messages', icon: PiEnvelopeSimple },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'Networking', icon: PiGlobe },
      { label: 'Scheduling', icon: PiCalendarBlank },
      { label: 'Inventory', icon: PiStack },
      { label: 'Voice', icon: PiMicrophone },
      { label: 'Tariff plans', icon: PiPercent },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'Administration', icon: PiIdentificationCard },
      { label: 'Config', icon: PiSlidersHorizontal },
    ],
  },
];

const STATS: {
  label: string;
  value: string;
  icon: IconType;
  accent: string;
  valueClass: string;
}[] = [
  { label: 'Online customers', value: '1246', icon: PiUsersThree, accent: 'text-emerald-500', valueClass: 'text-emerald-600' },
  { label: 'New customers', value: '15', icon: PiUserPlus, accent: 'text-sky-500', valueClass: 'text-sky-600' },
  { label: 'New & open tickets', value: '10', icon: PiTicket, accent: 'text-amber-500', valueClass: 'text-amber-600' },
  { label: 'Device down', value: '2', icon: PiWarningCircle, accent: 'text-red-500', valueClass: 'text-red-600' },
];

const SHORTCUTS: { label: string; icon: IconType }[] = [
  { label: 'Add customer', icon: PiUserPlus },
  { label: 'Add lead', icon: PiHandshake },
  { label: 'Add ticket', icon: PiTicket },
  { label: 'Add task', icon: PiListChecks },
  { label: 'Send message', icon: PiPaperPlaneTilt },
  { label: 'Add router', icon: PiWifiHigh },
  { label: 'Add hardware', icon: PiDesktopTower },
  { label: 'Add internet tariff plan', icon: PiPercent },
  { label: 'Add network site', icon: PiBroadcast },
  { label: 'Configure the system', icon: PiGear },
];

const CHART_DATA = [
  { month: 'Jan', newCust: 6, active: 4 },
  { month: 'Feb', newCust: 9, active: 8 },
  { month: 'Mar', newCust: 11, active: 12 },
  { month: 'Apr', newCust: 14, active: 15 },
  { month: 'May', newCust: 19, active: 21 },
  { month: 'Jun', newCust: 24, active: 27 },
];

const CHART_CONFIG = {
  newCust: { label: 'New', color: '#E87A1E' },
  active: { label: 'Active', color: '#1B2A4A' },
} satisfies ChartConfig;

const FINANCE = {
  current: [
    { label: 'Payments', value: '1081 ($124 212.79)' },
    { label: 'Paid invoices', value: '18 ($846.34)' },
    { label: 'Unpaid invoices', value: '7 ($1060.31)' },
    { label: 'Credit notes', value: '0 ($00.00)' },
  ],
  last: [
    { label: 'Payments', value: '1222 ($178 234.78)' },
    { label: 'Paid invoices', value: '1161 ($124 762.48)' },
    { label: 'Unpaid invoices', value: '135 ($53 739.54)' },
    { label: 'Credit notes', value: '3 ($343.73)' },
  ],
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SplynxDashboardPage() {
  const [series, setSeries] = useState<{ newCust: boolean; active: boolean }>({
    newCust: true,
    active: true,
  });

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] bg-slate-50 text-slate-900">
      {/* ---------------------------------------------------------------- */}
      {/* Sidebar (CircleTel navy authority rail)                          */}
      {/* ---------------------------------------------------------------- */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center px-5">
          <Image
            src="/images/circletel-logo-2026.png"
            alt="CircleTel"
            width={120}
            height={120}
            priority
            className="h-11 w-auto"
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <NavItem icon={PiSquaresFour} label="Dashboard" active className="mb-4" />
          {NAV_SECTIONS.map((section) => (
            <div key={section.heading} className="mb-4">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.heading}
              </p>
              {section.items
                .filter((i) => i.label !== 'Dashboard')
                .map((item) => (
                  <NavItem key={item.label} icon={item.icon} label={item.label} active={item.active} />
                ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Main column                                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="lg:hidden">
            <Image
              src="/images/circletel-logo-2026.png"
              alt="CircleTel"
              width={80}
              height={80}
              className="h-9 w-auto"
            />
          </div>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <TopIcon icon={PiPlus} />
            <TopIcon icon={PiMagnifyingGlass} />
            <TopIcon icon={PiQuestion} />
            <TopIcon icon={PiInfo} />
            <TopIcon icon={PiBell} badge />
            <Separator orientation="vertical" className="mx-1 hidden h-8 md:block" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://i.pravatar.cc/64?img=13" alt="John Appleseed" />
                    <AvatarFallback className="bg-[#1B2A4A] text-xs text-white">JA</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline">John Appleseed</span>
                  <PiCaretDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>John Appleseed</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
          {/* Page title */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FDF2E9] text-[#AE5B16]">
              <PiSquaresFour className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-semibold text-[#1B2A4A]">Dashboard</h1>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STATS.map((stat) => (
              <Card key={stat.label} className="border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2.5">
                    <stat.icon className={cn('h-5 w-5', stat.accent)} />
                    <span className="font-medium text-slate-700">{stat.label}</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <button className="text-sm font-medium text-[#AE5B16] hover:underline">
                      View
                    </button>
                    <span className={cn('text-3xl font-bold tabular-nums', stat.valueClass)}>
                      {stat.value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Shortcuts */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#1B2A4A]">Shortcuts</h2>
                <button className="text-slate-400 transition-colors hover:text-[#E87A1E]">
                  <PiPencilSimple className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {SHORTCUTS.map((s) => (
                  <button
                    key={s.label}
                    className="group flex items-center gap-2.5 text-left text-sm text-slate-700"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FDF2E9] text-[#E87A1E] transition-colors group-hover:bg-[#E87A1E] group-hover:text-white">
                      <s.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="font-medium group-hover:text-[#AE5B16]">{s.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chart + Finance */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Customers chart */}
            <Card className="border-slate-200 shadow-sm lg:col-span-3">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-[#1B2A4A]">
                    <PiChartLineUp className="h-5 w-5 text-[#E87A1E]" />
                    Customers chart
                  </h2>
                  <div className="flex items-center gap-2">
                    <SeriesPill
                      label="New"
                      color="#E87A1E"
                      active={series.newCust}
                      onClick={() => setSeries((s) => ({ ...s, newCust: !s.newCust }))}
                    />
                    <SeriesPill
                      label="Active"
                      color="#1B2A4A"
                      active={series.active}
                      onClick={() => setSeries((s) => ({ ...s, active: !s.active }))}
                    />
                  </div>
                </div>

                <ChartContainer config={CHART_CONFIG} className="aspect-[16/9] w-full">
                  <AreaChart data={CHART_DATA} margin={{ left: 4, right: 12, top: 10, bottom: 4 }}>
                    <defs>
                      <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-newCust)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-newCust)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-active)" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="var(--color-active)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#eef2f6" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={28}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <ChartTooltip
                      cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                      content={<ChartTooltipContent />}
                    />
                    {series.active && (
                      <Area
                        dataKey="active"
                        type="natural"
                        stroke="var(--color-active)"
                        strokeWidth={2.5}
                        fill="url(#fillActive)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    )}
                    {series.newCust && (
                      <Area
                        dataKey="newCust"
                        type="natural"
                        stroke="var(--color-newCust)"
                        strokeWidth={2.5}
                        fill="url(#fillNew)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    )}
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Finance */}
            <Card className="border-slate-200 shadow-sm lg:col-span-2">
              <CardContent className="p-5">
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#1B2A4A]">
                  <PiWallet className="h-5 w-5 text-[#E87A1E]" />
                  Finance
                </h2>

                <p className="mb-1.5 text-sm font-semibold text-emerald-600">Current month</p>
                <FinanceRows rows={FINANCE.current} />

                <Separator className="my-4" />

                <p className="mb-1.5 text-sm font-semibold text-amber-600">Last month</p>
                <FinanceRows rows={FINANCE.last} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Local presentational components
// ---------------------------------------------------------------------------

function NavItem({
  icon: Icon,
  label,
  active,
  className,
}: {
  icon: IconType;
  label: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      className={cn(
        'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-[#FDF2E9] font-semibold text-[#AE5B16]'
          : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        className
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#E87A1E]" />
      )}
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function TopIcon({ icon: Icon, badge }: { icon: IconType; badge?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-full text-slate-500 hover:text-[#1B2A4A]"
    >
      <Icon className="h-5 w-5" />
      {badge && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#E87A1E] ring-2 ring-white" />
      )}
    </Button>
  );
}

function SeriesPill({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
        active ? 'text-white' : 'bg-slate-100 text-slate-500'
      )}
      style={active ? { backgroundColor: color } : undefined}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: active ? '#ffffff' : color }}
      />
      {label}
    </button>
  );
}

function FinanceRows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between py-2 text-sm">
          <span className="text-slate-600">{row.label}</span>
          <span className="font-medium tabular-nums text-slate-900">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
