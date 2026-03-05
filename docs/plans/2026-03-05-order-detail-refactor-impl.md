# Order Detail Page Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the admin order detail page to match the new design with underline tabs, grouped action buttons, and clean 3-column layout.

**Architecture:** Component-by-component refactor of existing files. No new components needed - update styling and structure of OrderHeader, OrderStatCards, page.tsx tabs, OrderOverviewTab, and OrderProgressTimeline.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Phosphor Icons (react-icons/pi), shadcn/ui

---

## Task 1: Update OrderHeader Component

**Files:**
- Modify: `components/admin/orders/detail/OrderHeader.tsx`

**Step 1: Read current implementation**

Read the full file to understand current structure and imports.

**Step 2: Update imports**

Add icons for action buttons:
```typescript
import {
  PiArrowLeftBold,
  PiCaretRightBold,
  PiPauseBold,
  PiXCircleBold,
  PiEnvelopeBold,
  PiPrinterBold,
  PiDownloadSimpleBold,
} from 'react-icons/pi';
```

**Step 3: Update breadcrumb styling**

```tsx
<div className="flex items-center gap-2 text-xs font-medium text-slate-500">
  <Link href="/admin/orders" className="hover:text-primary">Orders</Link>
  <PiCaretRightBold className="w-3 h-3" />
  <Link href="/admin/orders" className="hover:text-primary">Active Orders</Link>
  <PiCaretRightBold className="w-3 h-3" />
  <span className="text-slate-900">{order.order_number}</span>
</div>
```

**Step 4: Update title row**

```tsx
<div className="flex flex-wrap items-center justify-between gap-6">
  <div className="flex items-center gap-4">
    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
      {order.order_number}
    </h2>
    <Badge className={cn(statusConfig.bg, statusConfig.text, 'border-0')}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {statusConfig.label}
    </Badge>
  </div>
  {/* Action buttons - Step 5 */}
</div>
```

**Step 5: Add grouped action buttons**

```tsx
<div className="flex flex-wrap items-center gap-2">
  {/* Grouped icon buttons */}
  <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
    <button
      className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors"
      title="Suspend Order"
    >
      <PiPauseBold className="w-5 h-5" />
    </button>
    <button
      className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200"
      title="Cancel Order"
    >
      <PiXCircleBold className="w-5 h-5" />
    </button>
    <SendEmailDialog
      customerEmail={order.email}
      customerName={`${order.first_name} ${order.last_name}`}
      trigger={
        <button
          className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200"
          title="Send Email"
        >
          <PiEnvelopeBold className="w-5 h-5" />
        </button>
      }
    />
    <button
      className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200"
      title="Print Details"
      onClick={() => window.print()}
    >
      <PiPrinterBold className="w-5 h-5" />
    </button>
  </div>

  {/* Export button */}
  <Button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
    <PiDownloadSimpleBold className="w-5 h-5" />
    Export Order
  </Button>
</div>
```

**Step 6: Verify visually**

Run dev server and check `/admin/orders/[any-order-id]`:
- Breadcrumbs show correctly
- Title is large and bold
- Status badge is inline
- Action buttons are grouped with borders
- Export button is orange

**Step 7: Commit**

```bash
git add components/admin/orders/detail/OrderHeader.tsx
git commit -m "refactor(admin): update OrderHeader with grouped action buttons"
```

---

## Task 2: Update OrderStatCards Component

**Files:**
- Modify: `components/admin/orders/detail/OrderStatCards.tsx`

**Step 1: Read current implementation**

Read the full file to understand current structure.

**Step 2: Simplify card structure**

Replace current card implementation with cleaner design:

```tsx
function StatCard({
  label,
  value,
  subtitle,
  subtitleIcon,
  indicator,
}: {
  label: string;
  value: string;
  subtitle: string;
  subtitleIcon?: React.ReactNode;
  indicator?: 'pulse' | 'none';
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p className="text-lg font-bold text-slate-900">{value}</p>
        {indicator === 'pulse' && (
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>
      <div className="mt-2 text-xs text-slate-500 font-medium flex items-center gap-1">
        {subtitleIcon}
        {subtitle}
      </div>
    </div>
  );
}
```

**Step 3: Update the main component**

```tsx
export function OrderStatCards({ order }: OrderStatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Package"
        value={order.package_name}
        subtitle={order.package_speed}
        subtitleIcon={<PiLightningBold className="w-3 h-3 text-primary" />}
      />
      <StatCard
        label="Monthly Price"
        value={formatCurrency(order.package_price)}
        subtitle="VAT Inclusive"
      />
      <StatCard
        label="Payment Status"
        value={getPaymentStatusLabel(order.payment_status)}
        subtitle={getPaymentSubtitle(order.payment_status)}
        indicator={order.payment_status === 'pending' ? 'pulse' : 'none'}
      />
      <StatCard
        label="Lead Source"
        value={formatLeadSource(order.lead_source)}
        subtitle={order.source_campaign || 'Direct'}
      />
    </div>
  );
}
```

**Step 4: Add helper functions**

```tsx
function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    partial: 'Partial',
    failed: 'Failed',
  };
  return labels[status] || status;
}

function getPaymentSubtitle(status: string): string {
  const subtitles: Record<string, string> = {
    pending: 'Awaiting clearing',
    paid: 'Payment received',
    partial: 'Partial payment',
    failed: 'Payment failed',
  };
  return subtitles[status] || '';
}
```

**Step 5: Verify visually**

Check that 4 cards display correctly in a row on desktop, 2 on tablet, 1 on mobile.

**Step 6: Commit**

```bash
git add components/admin/orders/detail/OrderStatCards.tsx
git commit -m "refactor(admin): simplify OrderStatCards styling"
```

---

## Task 3: Update Tabs in Page Component

**Files:**
- Modify: `app/admin/orders/[id]/page.tsx`

**Step 1: Read current tabs implementation**

Focus on lines 238-272 where tabs are defined.

**Step 2: Remove tab icon imports**

Remove these imports (no longer needed):
```typescript
// Remove:
// PiEyeBold, PiGearBold, PiMoneyBold, PiClockCounterClockwiseBold
```

**Step 3: Replace TabsList with underline tabs**

Replace the current TabsList/TabsTrigger implementation:

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <div className="border-b border-slate-200">
    <nav className="flex gap-8">
      <button
        onClick={() => setActiveTab('overview')}
        className={cn(
          'pb-4 border-b-2 text-sm font-medium transition-colors',
          activeTab === 'overview'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        )}
      >
        Overview
      </button>
      <button
        onClick={() => setActiveTab('installation')}
        className={cn(
          'pb-4 border-b-2 text-sm font-medium transition-colors',
          activeTab === 'installation'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        )}
      >
        Installation
      </button>
      <button
        onClick={() => setActiveTab('financials')}
        className={cn(
          'pb-4 border-b-2 text-sm font-medium transition-colors',
          activeTab === 'financials'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        )}
      >
        Financials
      </button>
      <button
        onClick={() => setActiveTab('history')}
        className={cn(
          'pb-4 border-b-2 text-sm font-medium transition-colors',
          activeTab === 'history'
            ? 'border-primary text-primary font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        )}
      >
        History
      </button>
    </nav>
  </div>

  {/* Keep TabsContent components as-is */}
  {activeTab === 'overview' && (
    <OrderOverviewTab order={order} onViewHistory={() => setActiveTab('history')} />
  )}
  {/* ... other tab contents */}
</Tabs>
```

**Step 4: Verify visually**

- Tabs show as text-only with underline
- Active tab has orange text and border
- Inactive tabs are gray with hover state
- Tab switching still works

**Step 5: Commit**

```bash
git add app/admin/orders/[id]/page.tsx
git commit -m "refactor(admin): replace pill tabs with underline tabs"
```

---

## Task 4: Update OrderOverviewTab Component

**Files:**
- Modify: `components/admin/orders/detail/OrderOverviewTab.tsx`

**Step 1: Read current implementation**

Full read to understand current card structure.

**Step 2: Update SectionCard component**

```tsx
function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm', className)}>
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
```

**Step 3: Update Customer Information card**

```tsx
<SectionCard
  title="Customer Information"
  action={<button className="text-primary text-xs font-bold hover:underline">Edit</button>}
>
  <div className="space-y-4">
    {/* Avatar and name */}
    <div className="flex items-center gap-4 mb-2">
      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
        {order.first_name[0]}{order.last_name[0]}
      </div>
      <div>
        <p className="text-base font-bold text-slate-900">
          {order.first_name} {order.last_name}
        </p>
        {order.account_number && (
          <p className="text-xs text-slate-500">Account: #{order.account_number}</p>
        )}
      </div>
    </div>

    {/* Contact info */}
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <PiEnvelopeBold className="w-5 h-5 text-slate-400" />
        <div className="text-sm">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tight">Email</p>
          <a href={`mailto:${order.email}`} className="text-slate-900 font-medium hover:text-primary">
            {order.email}
          </a>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <PiPhoneBold className="w-5 h-5 text-slate-400" />
        <div className="text-sm">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tight">Phone</p>
          <p className="text-slate-900 font-medium">{order.phone}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <PiBellBold className="w-5 h-5 text-slate-400" />
        <div className="text-sm">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tight">Preferences</p>
          <div className="flex gap-2 mt-1">
            {order.contact_preference && (
              <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase">
                {order.contact_preference}
              </span>
            )}
            {order.whatsapp_opt_in && (
              <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase">
                WhatsApp
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
</SectionCard>
```

**Step 4: Update Installation Address card**

```tsx
<SectionCard
  title="Installation Address"
  action={<button className="text-primary text-xs font-bold hover:underline">View Map</button>}
>
  <div className="flex gap-4">
    <div className="bg-slate-100 rounded-lg size-16 flex items-center justify-center flex-shrink-0">
      <PiMapPinBold className="w-8 h-8 text-slate-400" />
    </div>
    <div className="text-sm leading-relaxed">
      <p className="font-bold text-slate-900">{order.installation_address}</p>
      {order.suburb && <p className="text-slate-600">{order.suburb}</p>}
      {order.city && order.province && (
        <p className="text-slate-600">{order.city}, {order.province}</p>
      )}
      {order.postal_code && <p className="text-slate-600">{order.postal_code}</p>}
    </div>
  </div>
</SectionCard>
```

**Step 5: Update Package Details card**

```tsx
<SectionCard title="Package Details">
  <div className="space-y-6">
    {/* Highlighted package box */}
    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
      <div className="flex justify-between items-start mb-2">
        <p className="text-primary font-bold text-lg">{order.package_name}</p>
        <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded">
          HOT
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Speed</p>
          <p className="text-sm font-bold text-slate-900">{order.package_speed}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Price</p>
          <p className="text-sm font-bold text-slate-900">{formatCurrency(order.package_price)} /pm</p>
        </div>
      </div>
    </div>

    {/* Info rows */}
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Router Status</span>
        <span className="font-bold text-slate-900 flex items-center gap-1">
          {order.router_included ? (
            <>
              <PiCheckCircleBold className="w-4 h-4 text-emerald-500" />
              Included
            </>
          ) : (
            'Not included'
          )}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Contract Term</span>
        <span className="font-bold text-slate-900">Month-to-Month</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Installation Fee</span>
        <span className="font-bold text-slate-900">
          {order.installation_fee > 0
            ? formatCurrency(order.installation_fee)
            : `Waived (${formatCurrency(1500)})`
          }
        </span>
      </div>
    </div>
  </div>
</SectionCard>
```

**Step 6: Add Marketing & Attribution card**

```tsx
<SectionCard title="Marketing & Attribution">
  <div className="flex items-center gap-4">
    <div className="size-12 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-full">
      <PiTargetBold className="w-6 h-6" />
    </div>
    <div className="text-sm">
      <p className="font-bold text-slate-900">{formatLeadSource(order.lead_source)}</p>
      <p className="text-slate-500">
        {order.source_campaign
          ? `Converted from "${order.source_campaign}" campaign`
          : 'Direct lead'
        }
      </p>
    </div>
  </div>
</SectionCard>
```

**Step 7: Update grid layout**

```tsx
export function OrderOverviewTab({ order, onViewHistory }: OrderOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-6">
      {/* Left Column */}
      <div className="space-y-8">
        {/* Customer Information */}
        {/* Installation Address */}
      </div>

      {/* Middle Column */}
      <div className="space-y-8">
        {/* Package Details */}
        {/* Marketing & Attribution */}
      </div>

      {/* Right Column */}
      <div className="h-full">
        <OrderProgressTimeline order={order} onViewHistory={onViewHistory} />
      </div>
    </div>
  );
}
```

**Step 8: Verify visually**

- 3-column layout on desktop
- Cards have correct styling
- Avatar shows initials
- Package box is highlighted

**Step 9: Commit**

```bash
git add components/admin/orders/detail/OrderOverviewTab.tsx
git commit -m "refactor(admin): update OrderOverviewTab with new card designs"
```

---

## Task 5: Update OrderProgressTimeline Component

**Files:**
- Modify: `components/admin/orders/detail/OrderProgressTimeline.tsx`

**Step 1: Read current implementation**

Full read to understand timeline structure.

**Step 2: Update timeline wrapper**

```tsx
export function OrderProgressTimeline({ order, onViewHistory }: OrderProgressTimelineProps) {
  const steps = getTimelineSteps(order);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">Order Progress</h3>
      </div>
      <div className="p-6 relative">
        {/* Vertical connector line */}
        <div className="absolute left-[35px] top-10 bottom-10 w-0.5 bg-slate-200" />

        {/* Timeline items */}
        <div className="space-y-8 relative">
          {steps.map((step) => (
            <TimelineStep key={step.id} step={step} />
          ))}
        </div>

        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="w-full mt-10 py-3 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            View Full History
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Create TimelineStep component**

```tsx
function TimelineStep({ step }: { step: TimelineStep }) {
  const isCompleted = step.status === 'completed';
  const isActive = step.status === 'active';
  const Icon = step.icon;

  return (
    <div className="flex gap-4">
      {/* Circle */}
      <div
        className={cn(
          'z-10 size-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm',
          isCompleted && 'bg-emerald-500 text-white',
          isActive && 'bg-primary text-white shadow-primary/40',
          !isCompleted && !isActive && 'bg-slate-200 text-slate-400'
        )}
      >
        {isCompleted ? (
          <PiCheckBold className="w-5 h-5" />
        ) : isActive ? (
          <Icon className="w-5 h-5 animate-pulse" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>

      {/* Content */}
      <div>
        <p
          className={cn(
            'text-sm font-bold',
            isCompleted && 'text-slate-900',
            isActive && 'text-primary',
            !isCompleted && !isActive && 'text-slate-400 font-medium'
          )}
        >
          {step.label}
        </p>
        <p
          className={cn(
            'text-xs',
            isActive ? 'text-primary/70' : 'text-slate-500'
          )}
        >
          {step.date || step.subLabel}
        </p>
      </div>
    </div>
  );
}
```

**Step 4: Update step icons**

```tsx
import {
  PiCheckBold,
  PiPackageBold,
  PiCreditCardBold,
  PiCurrencyCircleDollarBold,
  PiCalendarBold,
  PiWrenchBold,
  PiRocketLaunchBold,
} from 'react-icons/pi';

// In getTimelineSteps, update icons:
// Step 1: PiPackageBold (Order Received)
// Step 2: PiCreditCardBold (Payment Method)
// Step 3: PiCurrencyCircleDollarBold (Payment Confirmation)
// Step 4: PiCalendarBold (Installation Scheduled)
// Step 5: PiWrenchBold (Installation Complete)
// Step 6: PiRocketLaunchBold (Service Active)
```

**Step 5: Verify visually**

- Vertical line connects steps
- Completed steps show green with checkmark
- Active step shows orange with pulse
- Pending steps show gray

**Step 6: Commit**

```bash
git add components/admin/orders/detail/OrderProgressTimeline.tsx
git commit -m "refactor(admin): update OrderProgressTimeline styling"
```

---

## Task 6: Final Verification & Type Check

**Step 1: Run type check**

```bash
npm run type-check:memory
```

Expected: No TypeScript errors

**Step 2: Visual verification**

Open `/admin/orders/[any-order-id]` and verify:
- [ ] Header has breadcrumbs, large title, grouped action buttons
- [ ] 4 stat cards in a row
- [ ] Underline tabs (text only)
- [ ] 3-column Overview layout
- [ ] Timeline has correct step states
- [ ] Responsive on mobile/tablet

**Step 3: Test functionality**

- [ ] Tab switching works
- [ ] Email dialog opens
- [ ] Print button works
- [ ] View History button switches to History tab

**Step 4: Final commit**

```bash
git add -A
git commit -m "refactor(admin): complete order detail page redesign

- Updated header with grouped action buttons
- Simplified stat cards styling
- Replaced pill tabs with underline tabs
- Redesigned Overview tab with 3-column layout
- Updated timeline step styling"
```

---

## Success Criteria

- [ ] Header matches new design with grouped action buttons
- [ ] Stat cards are clean with consistent styling
- [ ] Tabs use underline style without icons
- [ ] Overview tab has proper 3-column layout
- [ ] Timeline has correct visual states
- [ ] Page remains fully functional
- [ ] Responsive on mobile/tablet/desktop
- [ ] Type check passes
