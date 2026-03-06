# Admin Shared Components

Reusable UI components for admin detail pages. Import from `@/components/admin/shared`.

```tsx
import {
  SectionCard,
  StatCard,
  InfoRow,
  StatusBadge,
  UnderlineTabs,
  TabPanel,
  DetailPageHeader,
  ProgressTimeline,
} from '@/components/admin/shared';
```

---

## SectionCard

Card container with header (title + optional action) and content area.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Section title displayed in header |
| `icon` | `ElementType` | No | Icon to display before title |
| `action` | `ReactNode` | No | Action element (button/badge) in header |
| `compact` | `boolean` | No | Use compact padding (p-4 vs p-6) |
| `children` | `ReactNode` | Yes | Card content |
| `className` | `string` | No | Additional CSS classes |

### Usage

```tsx
// Standard card
<SectionCard
  title="Customer Information"
  action={<Button variant="ghost" size="sm">Edit</Button>}
>
  <p>Customer details here...</p>
</SectionCard>

// With icon and compact mode
<SectionCard
  icon={PiMapPinBold}
  title="Installation Address"
  compact
>
  <p>Address details...</p>
</SectionCard>

// With badge action
<SectionCard
  icon={PiCreditCardBold}
  title="Payment Information"
  action={<StatusBadge status="Paid" variant="success" />}
  compact
>
  <p>Payment details...</p>
</SectionCard>
```

### Styling

- Container: `bg-white rounded-xl border border-slate-200 shadow-sm`
- Header (default): `px-6 py-4 border-b border-slate-100`
- Header (compact): `p-4 border-b border-slate-100`
- Title: `font-bold text-slate-900` (compact: `text-sm`)
- Content (default): `p-6`
- Content (compact): `p-4`

---

## StatCard

Metric card displaying a label, value, subtitle, and optional indicator.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Metric label (uppercase) |
| `value` | `string` | Yes | Primary metric value |
| `subtitle` | `string` | No | Secondary text below value |
| `subtitleIcon` | `ReactNode` | No | Icon before subtitle |
| `indicator` | `'pulse' \| 'none'` | No | Animated pulse indicator |

### Usage

```tsx
<StatCard
  label="Monthly Price"
  value="R899.00"
  subtitle="VAT Inclusive"
/>

<StatCard
  label="Payment Status"
  value="Pending"
  subtitle="Awaiting clearing"
  indicator="pulse"
/>
```

### Styling

- Container: `bg-white p-5 rounded-xl border border-slate-200 shadow-sm`
- Label: `text-xs font-semibold text-slate-500 uppercase tracking-wider`
- Value: `text-lg font-bold text-slate-900`
- Pulse: `w-2 h-2 rounded-full bg-amber-500 animate-pulse`

---

## InfoRow

Label + value row for displaying detail information.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Row label |
| `value` | `ReactNode` | Yes | Row value (can include badges, icons) |
| `icon` | `ElementType` | No | Optional icon before label |
| `className` | `string` | No | Additional CSS classes |

### Usage

```tsx
<InfoRow label="Contract Term" value="24 months" />

<InfoRow
  label="Router Status"
  value={
    <span className="flex items-center gap-1.5 text-emerald-600">
      <PiCheckCircleBold className="h-4 w-4" />
      Included
    </span>
  }
/>
```

### Styling

- Row: `flex justify-between items-center py-3 border-b border-slate-50 last:border-0`
- Label: `text-sm text-slate-500`
- Value: `text-sm font-medium text-slate-900`

---

## StatusBadge

Configurable status badge with color variants.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `string` | Yes | Status text to display |
| `variant` | `StatusVariant` | No | Color variant (default: 'neutral') |
| `showDot` | `boolean` | No | Show status dot (default: true) |
| `className` | `string` | No | Additional CSS classes |

### Variants

| Variant | Colors | Use For |
|---------|--------|---------|
| `success` | `bg-emerald-50 text-emerald-700` | Active, Completed, Paid |
| `warning` | `bg-amber-50 text-amber-700` | Pending, Processing |
| `error` | `bg-red-50 text-red-700` | Failed, Cancelled |
| `info` | `bg-blue-50 text-blue-700` | Scheduled, New |
| `neutral` | `bg-slate-100 text-slate-700` | Default, Suspended |

### Usage

```tsx
import { StatusBadge, getStatusVariant } from '@/components/admin/shared';

<StatusBadge status="Active" variant="success" />

// Auto-detect variant from status string
<StatusBadge status={order.status} variant={getStatusVariant(order.status)} />
```

---

## UnderlineTabs

ARIA-accessible underline tab navigation.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tabs` | `readonly TabConfig[]` | Yes | Array of tab configurations |
| `activeTab` | `string` | Yes | Currently active tab ID |
| `onTabChange` | `(tabId: string) => void` | Yes | Tab change handler |
| `className` | `string` | No | Additional CSS classes |

### TabConfig

```ts
interface TabConfig {
  id: string;
  label: string;
}
```

### Usage

```tsx
const TAB_CONFIG = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details' },
  { id: 'history', label: 'History' },
] as const;

const [activeTab, setActiveTab] = useState('overview');

<UnderlineTabs
  tabs={TAB_CONFIG}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>

<TabPanel id="overview" activeTab={activeTab} className="mt-6">
  <p>Overview content...</p>
</TabPanel>
```

### Accessibility

- `role="tablist"` on container
- `role="tab"` on each button
- `aria-selected` reflects active state
- `aria-controls` links to panel ID
- Panels use `role="tabpanel"` and `aria-labelledby`

---

## DetailPageHeader

Page header with breadcrumbs, title, status badge, and actions.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `breadcrumbs` | `BreadcrumbItem[]` | Yes | Navigation breadcrumbs |
| `title` | `string` | Yes | Page title |
| `status` | `{ label: string; variant: StatusVariant }` | No | Status badge config |
| `actions` | `ReactNode` | No | Action buttons |
| `className` | `string` | No | Additional CSS classes |

### BreadcrumbItem

```ts
interface BreadcrumbItem {
  label: string;
  href?: string; // If omitted, renders as plain text
}
```

### Usage

```tsx
<DetailPageHeader
  breadcrumbs={[
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Active Orders', href: '/admin/orders' },
    { label: 'ORD-2024-0001' },
  ]}
  title="ORD-2024-0001"
  status={{ label: 'Active', variant: 'success' }}
  actions={
    <>
      <Button variant="outline">Edit</Button>
      <Button>Export</Button>
    </>
  }
/>
```

---

## ProgressTimeline

Vertical timeline showing step progress.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | No | Timeline header (default: 'Progress') |
| `steps` | `TimelineStep[]` | Yes | Array of timeline steps |
| `onViewHistory` | `() => void` | No | Handler for "View Full History" button |
| `className` | `string` | No | Additional CSS classes |

### TimelineStep

```ts
interface TimelineStep {
  id: string | number;
  label: string;
  subLabel?: string;
  status: 'completed' | 'active' | 'pending';
  icon: React.ElementType;
  date?: string;
}
```

### Usage

```tsx
import { PiPackageBold, PiCreditCardBold, PiRocketLaunchBold } from 'react-icons/pi';

const steps: TimelineStep[] = [
  { id: 1, label: 'Order Received', subLabel: 'Order created', status: 'completed', icon: PiPackageBold, date: 'Jan 15, 10:30' },
  { id: 2, label: 'Payment', subLabel: 'Awaiting payment', status: 'active', icon: PiCreditCardBold },
  { id: 3, label: 'Service Active', subLabel: 'Pending', status: 'pending', icon: PiRocketLaunchBold },
];

<ProgressTimeline
  title="Order Progress"
  steps={steps}
  onViewHistory={() => setActiveTab('history')}
/>
```

### Step Status Styling

| Status | Circle | Text |
|--------|--------|------|
| `completed` | Green with checkmark | Bold dark text |
| `active` | Primary color, pulsing icon | Bold primary text |
| `pending` | Gray | Muted text |
