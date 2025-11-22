# Splynx Dashboard - Ready-to-Use Code Snippets

**Document Version**: 1.0.0
**Created**: 2025-01-22
**Purpose**: Copy-paste code for quick implementation

---

## 🎯 How to Use

Each snippet below is **ready to copy-paste** into your CircleTel components. Follow the file paths and replacement instructions carefully.

---

## 1️⃣ Enhanced WorkflowStepper Component

**File**: `components/admin/orders/WorkflowStepper.tsx`

### **Complete Enhanced Version**

```tsx
'use client';

import { Check, Circle, LucideIcon } from 'lucide-react';

export interface WorkflowStep {
  id: number;
  label: string;
  subLabel?: string;
  status: 'completed' | 'active' | 'pending';
  icon?: LucideIcon;
  date?: string;
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  currentStatus: string;
  onStepClick?: (stepId: number) => void;
}

export function WorkflowStepper({ steps, currentStatus, onStepClick }: WorkflowStepperProps) {
  return (
    <div className="w-full py-6 overflow-x-auto bg-white">
      <div className="flex items-start justify-between min-w-[700px] px-4 md:px-6">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isPending = step.status === 'pending';

          const Icon = step.icon || Circle;

          return (
            <div
              key={step.id}
              className={`relative flex flex-col items-center flex-1 group ${
                onStepClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onStepClick && onStepClick(step.id)}
            >
              {/* Animated Connector Line */}
              {!isLast && (
                <div className="absolute top-6 left-[50%] right-[-50%] h-[3px] -z-0">
                  <div className={`h-full w-full transition-all duration-500 ease-in-out ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                </div>
              )}

              {/* Icon Circle with Scale Effect */}
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2
                transition-all duration-300 shadow-sm
                ${isCompleted ? 'bg-white border-green-500 text-green-500' : ''}
                ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-110' : ''}
                ${isPending ? 'bg-gray-50 border-gray-200 text-gray-300' : ''}
                group-hover:shadow-md
              `}>
                <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />

                {/* Completion Badge */}
                {isCompleted && (
                  <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Labels */}
              <div className="mt-4 text-center px-1">
                <p className={`text-xs font-bold uppercase tracking-wide mb-1 transition-colors duration-300
                  ${isActive ? 'text-indigo-600' : (isCompleted ? 'text-gray-700' : 'text-gray-500')}
                `}>
                  {step.label}
                </p>
                {step.subLabel && (
                  <p className="text-[11px] text-gray-500 font-medium leading-tight max-w-[110px] mx-auto">
                    {step.subLabel}
                  </p>
                )}
                {step.date && (
                  <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">
                    {step.date}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 2️⃣ Enhanced Status Badge

**File**: `app/admin/orders/[id]/page.tsx`

### **Replace Your Status Badge With**

```tsx
<Badge className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
  order.status === 'Active' || order.status === 'Service Active'
    ? 'bg-green-100 text-green-700 border-green-200'
    : order.status.includes('Progress') || order.status.includes('Installation')
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : order.status === 'Completed' || order.status === 'Installation Complete'
    ? 'bg-green-100 text-green-700 border-green-200'
    : order.status === 'Pending' || order.status === 'Payment Pending'
    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
    : order.status === 'Cancelled' || order.status === 'Failed'
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-gray-100 text-gray-700 border-gray-200'
}`}>
  {order.status}
</Badge>
```

---

## 3️⃣ Enhanced Card Headers (with Icons)

**File**: `app/admin/orders/[id]/page.tsx`

### **Customer Information Card**

```tsx
import { User, Package, MapPin, CreditCard, Calendar, FileText } from 'lucide-react';

<Card className="shadow-sm">
  <CardHeader className="px-6 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <User size={20} className="text-gray-700" />
      <CardTitle className="text-lg font-semibold text-gray-800">
        Customer Information
      </CardTitle>
    </div>
  </CardHeader>
  <CardContent className="p-6">
    {/* Existing customer info content */}
  </CardContent>
</Card>
```

### **Package Information Card**

```tsx
<Card className="shadow-sm">
  <CardHeader className="px-6 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <Package size={20} className="text-gray-700" />
      <CardTitle className="text-lg font-semibold text-gray-800">
        Package Information
      </CardTitle>
    </div>
  </CardHeader>
  <CardContent className="p-6">
    {/* Existing package info content */}
  </CardContent>
</Card>
```

### **Installation Address Card**

```tsx
<Card className="shadow-sm">
  <CardHeader className="px-6 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <MapPin size={20} className="text-gray-700" />
      <CardTitle className="text-lg font-semibold text-gray-800">
        Installation Address
      </CardTitle>
    </div>
  </CardHeader>
  <CardContent className="p-6">
    {/* Existing address content */}
  </CardContent>
</Card>
```

### **Payment Information Card**

```tsx
<Card className="shadow-sm">
  <CardHeader className="px-6 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <CreditCard size={20} className="text-gray-700" />
      <CardTitle className="text-lg font-semibold text-gray-800">
        Payment Information
      </CardTitle>
    </div>
  </CardHeader>
  <CardContent className="p-6">
    {/* Existing payment info content */}
  </CardContent>
</Card>
```

### **Installation Details Card**

```tsx
<Card className="shadow-sm">
  <CardHeader className="px-6 py-4 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <Calendar size={20} className="text-gray-700" />
      <CardTitle className="text-lg font-semibold text-gray-800">
        Installation Details
      </CardTitle>
    </div>
  </CardHeader>
  <CardContent className="p-6">
    {/* Existing installation details content */}
  </CardContent>
</Card>
```

---

## 4️⃣ Enhanced Page Header

**File**: `app/admin/orders/[id]/page.tsx`

### **Replace Your Header Section With**

```tsx
<div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">

  {/* Order Header Controls */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

    {/* Back Button */}
    <Link
      href="/admin/orders"
      className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 cursor-pointer transition-colors group"
    >
      <div className="p-1 rounded-full group-hover:bg-indigo-50 transition-colors">
        <ArrowLeft size={20} />
      </div>
      <span className="font-medium">Back to Orders</span>
    </Link>

    {/* Order ID and Status */}
    <div className="flex flex-col items-center md:items-start">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">
          Order #{order.order_number}
        </h2>
        {/* Status badge here (use snippet #2) */}
      </div>
      <span className="text-sm text-gray-500 mt-1">
        Created {new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </span>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center gap-2">
      {/* Your existing StatusActionButtons component */}
      <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2">
        <Printer size={16} />
        <span className="hidden md:inline">Print</span>
      </button>
      <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2">
        <Download size={16} />
        <span className="hidden md:inline">Export</span>
      </button>
    </div>
  </div>

  {/* Rest of your content */}
</div>
```

---

## 5️⃣ Enhanced Main Layout

**File**: `app/admin/orders/[id]/page.tsx`

### **Wrap Your Content With**

```tsx
<main className="flex-1 overflow-x-hidden overflow-y-auto pb-10 bg-gray-50">

  {/* Your existing header here */}

  <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">

    {/* Order Header (snippet #4) */}

    {/* Workflow Stepper */}
    <Card className="shadow-sm overflow-hidden">
      <WorkflowStepper
        steps={workflowSteps}
        currentStatus={order.status}
      />
    </Card>

    {/* Payment Method Status (if you have it) */}
    {order.payment_method_active && (
      <PaymentMethodStatus order={order} />
    )}

    {/* Two Column Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Left Column */}
      <div className="space-y-6">
        {/* Customer Information (snippet #3) */}
        {/* Package Information (snippet #3) */}
        {/* Installation Address (snippet #3) */}
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Payment Information (snippet #3) */}
        {/* Installation Details (snippet #3) */}
      </div>
    </div>

    {/* Full Width Sections */}
    <div className="space-y-6">
      {/* Installation Section (your existing component) */}
      {/* Communication Timeline (your existing component) */}
    </div>
  </div>
</main>
```

---

## 6️⃣ Workflow Steps Configuration

**File**: `app/admin/orders/[id]/page.tsx`

### **Create Workflow Steps Array**

```tsx
import {
  Inbox,
  CreditCard,
  Banknote,
  Calendar,
  Wrench,
  CheckSquare,
  Wifi
} from 'lucide-react';

// Inside your component
const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    label: "Order Received",
    subLabel: "Order created",
    status: order.status === 'Order Received' ? 'active' : 'completed',
    icon: Inbox,
    date: order.created_at ? formatShortDate(order.created_at) : undefined
  },
  {
    id: 2,
    label: "Payment Method",
    subLabel: "Method registered",
    status: getStepStatus(order.status, 'Payment Method'),
    icon: CreditCard,
    date: order.payment_date ? formatShortDate(order.payment_date) : undefined
  },
  {
    id: 3,
    label: "Payment Confirmed",
    subLabel: "Deposit received",
    status: getStepStatus(order.status, 'Payment Confirmed'),
    icon: Banknote,
    date: order.payment_date ? formatShortDate(order.payment_date) : undefined
  },
  {
    id: 4,
    label: "Scheduled",
    subLabel: "Install booked",
    status: getStepStatus(order.status, 'Scheduled'),
    icon: Calendar,
    date: order.installation_scheduled_date ? formatShortDate(order.installation_scheduled_date) : undefined
  },
  {
    id: 5,
    label: "Installation",
    subLabel: "Tech on-site",
    status: getStepStatus(order.status, 'Installation'),
    icon: Wrench,
    date: order.installation_scheduled_date ? formatShortDate(order.installation_scheduled_date) : undefined
  },
  {
    id: 6,
    label: "Completion",
    subLabel: "Work finished",
    status: getStepStatus(order.status, 'Completion'),
    icon: CheckSquare,
    date: order.installation_completed_date ? formatShortDate(order.installation_completed_date) : undefined
  },
  {
    id: 7,
    label: "Active",
    subLabel: "Service live",
    status: getStepStatus(order.status, 'Active'),
    icon: Wifi,
    date: order.activation_date ? formatShortDate(order.activation_date) : undefined
  },
];

// Helper function to determine step status
function getStepStatus(orderStatus: string, stepName: string): 'completed' | 'active' | 'pending' {
  const statusMap: Record<string, number> = {
    'Order Received': 1,
    'Payment Method': 2,
    'Payment Confirmed': 3,
    'Scheduled': 4,
    'Installation In Progress': 5,
    'Installation Complete': 6,
    'Service Active': 7,
  };

  const stepIds: Record<string, number> = {
    'Order Received': 1,
    'Payment Method': 2,
    'Payment Confirmed': 3,
    'Scheduled': 4,
    'Installation': 5,
    'Completion': 6,
    'Active': 7,
  };

  const currentStepId = statusMap[orderStatus] || 1;
  const thisStepId = stepIds[stepName] || 1;

  if (thisStepId < currentStepId) return 'completed';
  if (thisStepId === currentStepId) return 'active';
  return 'pending';
}

// Helper function to format date
function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
```

---

## 7️⃣ Hover Effects for Buttons

**File**: Any component with buttons

### **Enhanced Button Styles**

```tsx
// Primary Button
<button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2">
  <Icon size={16} />
  <span>Button Text</span>
</button>

// Secondary Button
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2">
  <Icon size={16} />
  <span>Button Text</span>
</button>

// Danger Button
<button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center gap-2">
  <Icon size={16} />
  <span>Button Text</span>
</button>

// Icon-only Button
<button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200">
  <Icon size={16} className="text-gray-700" />
</button>
```

---

## 8️⃣ Responsive Grid Layout

**File**: `app/admin/orders/[id]/page.tsx`

### **Two-Column Responsive Grid**

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Left Column */}
  <div className="space-y-6">
    {/* Cards here */}
  </div>

  {/* Right Column */}
  <div className="space-y-6">
    {/* Cards here */}
  </div>
</div>
```

### **Three-Column Responsive Grid**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards here */}
</div>
```

---

## 9️⃣ Info Row Component

**File**: Any card content

### **Consistent Info Row Style**

```tsx
<div className="space-y-3">
  <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-600 font-medium">Label:</span>
    <span className="text-sm text-gray-900 font-semibold text-right">Value</span>
  </div>
  <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-600 font-medium">Label:</span>
    <span className="text-sm text-gray-900 font-semibold text-right">Value</span>
  </div>
</div>
```

---

## 🔟 Loading State

**File**: `app/admin/orders/[id]/page.tsx`

### **Enhanced Loading Skeleton**

```tsx
{loading && (
  <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 animate-pulse">

    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <div className="h-8 w-48 bg-gray-200 rounded"></div>
      <div className="h-8 w-32 bg-gray-200 rounded"></div>
    </div>

    {/* Workflow Skeleton */}
    <Card className="shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="mt-2 h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </Card>

    {/* Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card className="shadow-sm">
          <div className="p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="shadow-sm">
          <div className="p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </Card>
      </div>
    </div>
  </div>
)}
```

---

## 1️⃣1️⃣ Error State

**File**: `app/admin/orders/[id]/page.tsx`

### **Enhanced Error Display**

```tsx
{error && (
  <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
    <Card className="shadow-sm border-red-200 bg-red-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <XCircle size={24} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Failed to Load Order
            </h3>
            <p className="text-sm text-red-700 mb-4">
              {error}
            </p>
            <div className="flex gap-2">
              <button
                onClick={fetchOrder}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/admin/orders"
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-100 transition-colors"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

---

## 1️⃣2️⃣ Tailwind Classes Cheat Sheet

### **Spacing**
```css
p-6          /* Padding: 1.5rem (24px) */
px-6 py-4    /* Horizontal: 1.5rem, Vertical: 1rem */
gap-6        /* Gap: 1.5rem */
space-y-6    /* Vertical spacing between children */
```

### **Shadows**
```css
shadow-sm    /* Subtle shadow (Splynx style) */
shadow       /* Default shadow */
shadow-lg    /* Larger shadow */
```

### **Borders**
```css
border                  /* 1px border */
border-gray-100        /* Light gray border */
border-gray-200        /* Default gray border */
rounded-lg             /* Large border radius */
rounded-full           /* Fully rounded */
```

### **Transitions**
```css
transition-all duration-300 ease-in-out    /* Smooth transition */
transition-colors duration-200             /* Color transition only */
hover:shadow-md                            /* Shadow on hover */
hover:scale-105                            /* Scale on hover */
```

### **Colors (Status)**
```css
/* Active/Success */
bg-green-100 text-green-700 border-green-200

/* Progress/Info */
bg-blue-50 text-blue-700 border-blue-200

/* Pending/Warning */
bg-yellow-50 text-yellow-700 border-yellow-200

/* Error/Danger */
bg-red-50 text-red-700 border-red-200

/* Neutral */
bg-gray-100 text-gray-700 border-gray-200
```

---

## 🎯 Quick Implementation Checklist

```bash
# 1. Backup current files
cp app/admin/orders/[id]/page.tsx app/admin/orders/[id]/page.backup.tsx
cp components/admin/orders/WorkflowStepper.tsx components/admin/orders/WorkflowStepper.backup.tsx

# 2. Apply snippets in order:
# ✅ Snippet #1: Enhanced WorkflowStepper (complete file replacement)
# ✅ Snippet #2: Enhanced Status Badge
# ✅ Snippet #3: Card headers with icons (apply to each card)
# ✅ Snippet #4: Enhanced page header
# ✅ Snippet #5: Enhanced main layout
# ✅ Snippet #6: Workflow steps configuration

# 3. Test locally
npm run dev:memory

# 4. Open browser
# http://localhost:3000/admin/orders/[order-id]

# 5. Verify:
# - Workflow stepper animations work
# - Status badges look correct
# - Card icons appear
# - Layout is responsive
# - All functionality still works
```

---

**End of Code Snippets**

---

*Copy these snippets directly into your components for instant visual improvements.*

*All snippets preserve existing functionality - they only enhance the visual design.*
