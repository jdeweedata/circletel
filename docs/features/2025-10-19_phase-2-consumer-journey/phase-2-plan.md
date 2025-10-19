# Phase 2: Consumer Journey (B2C) - Implementation Plan

> **Goal**: Build complete B2C checkout flow from coverage check to order tracking
> **Duration**: 2-3 days
> **Prerequisites**: ✅ Phase 1 Complete (Database foundation)

---

## 🎯 Overview

### Customer Flow:
```
User checks coverage
         ↓
[No Coverage] → Lead Captured → Follow-up scheduled
         ↓
[Coverage Available]
         ↓
Browse packages → Select package → Enter details → Confirm order
         ↓
Order created → Email sent → Payment → KYC upload
         ↓
Installation scheduled → Technician visit → Connection activated
```

---

## 📁 Pages to Build

### 1. **Enhanced Coverage Checker** (`/coverage`)
**Status**: Exists, needs enhancement

**Enhancements Needed**:
- [x] Existing: Address input with Google Maps autocomplete
- [ ] Add: "No Coverage" lead capture form
- [ ] Add: Zoho CRM sync on lead submission
- [ ] Add: Success message with follow-up timeline

**File**: `app/coverage/page.tsx`

**New Components**:
- `NoCoverageLeadForm.tsx` - Lead capture when no coverage
- Hook: `useLeadCapture.ts` - Handle lead creation + Zoho sync

---

### 2. **Coverage Results Page** (`/coverage/results`)
**Status**: New page

**Features**:
- Display available packages from coverage check
- Filter by speed/price
- Package comparison view
- "Select Package" CTA → Order form

**File**: `app/coverage/results/page.tsx`

**Components**:
- Reuse: `<ProductCard />` from `/components/products/ProductCard.tsx`
- New: `<PackageComparison />` - Side-by-side comparison
- New: `<CoverageResultsHero />` - Success message with address

**API Integration**:
- Fetch packages based on coverage check ID
- Filter by address/coordinates

---

### 3. **Consumer Order Form** (`/order/consumer`)
**Status**: New page

**Features**:
- 3-step checkout wizard
- Form validation with Zod
- Auto-save to localStorage
- Mobile responsive

**Steps**:
1. **Package Confirmation** - Review selected package
2. **Customer Details** - Personal info + address
3. **Order Confirmation** - Review and submit

**File**: `app/order/consumer/page.tsx`

**Components**:
- `<OrderWizard />` - Step navigation
- `<Step1PackageConfirmation />` - Package review
- `<Step2CustomerDetails />` - Form fields
- `<Step3OrderConfirmation />` - Final review
- Hook: `useOrderSubmission.ts` - Handle order creation

**API Integration**:
- `POST /api/orders/consumer` - Create order
- Generate order number
- Send confirmation email

---

### 4. **Order Status Tracking** (`/orders/[orderId]`)
**Status**: New page

**Features**:
- Real-time order status
- Progress indicator
- KYC document upload
- Installation scheduling
- Communication history

**File**: `app/orders/[orderId]/page.tsx`

**Components**:
- Reuse: `<OrderStatusProgress />` from Phase 1
- Reuse: `<ConsumerOrderStatusBadge />` from Phase 1
- New: `<KycUploadForm />` - Document upload
- New: `<OrderTimeline />` - Status history
- New: `<InstallationScheduler />` - Pick date/time

**API Integration**:
- `GET /api/orders/[orderId]` - Fetch order details
- `POST /api/orders/[orderId]/kyc` - Upload documents
- `GET /api/orders/[orderId]/history` - Status history

---

### 5. **Admin Order Management** (`/admin/orders/consumer`)
**Status**: New page

**Features**:
- Order list with filtering
- Status updates
- Customer communication
- KYC document review
- Installation scheduling

**File**: `app/admin/orders/consumer/page.tsx`

**Components**:
- `<OrdersDataTable />` - Sortable table with filters
- `<OrderDetailsDrawer />` - Quick view sidebar
- `<StatusUpdateDialog />` - Change order status
- `<CustomerCommunication />` - Email/SMS interface

**API Integration**:
- `GET /api/admin/orders/consumer` - List orders
- `PATCH /api/admin/orders/consumer/[id]` - Update order
- `POST /api/admin/orders/consumer/[id]/status` - Change status

---

## 🔌 API Routes to Create

### Consumer-Facing APIs

#### 1. Create Order
**Route**: `POST /api/orders/consumer`

**Body**:
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  installationAddress: string;
  // ... other fields
  servicePackageId: string;
  coverageCheckId?: string;
}
```

**Response**:
```typescript
{
  success: true;
  order: ConsumerOrder;
  orderNumber: string;
}
```

**Actions**:
- Create order in `consumer_orders` table
- Auto-generate order number
- Send confirmation email
- Create initial status history record

---

#### 2. Get Order Details
**Route**: `GET /api/orders/[orderId]`

**Response**:
```typescript
{
  success: true;
  order: ConsumerOrder;
  statusHistory: OrderStatusHistory[];
  kycDocuments: KycDocument[];
}
```

---

#### 3. Upload KYC Documents
**Route**: `POST /api/orders/[orderId]/kyc`

**Body**: `FormData` with files

**Actions**:
- Save files to `/uploads/kyc/[orderId]/`
- Create records in `kyc_documents` table
- Update order status to `kyc_pending`
- Notify admin

---

### Admin APIs

#### 4. List Consumer Orders
**Route**: `GET /api/admin/orders/consumer`

**Query Params**:
- `status` - Filter by order status
- `search` - Search by name/email/order number
- `dateFrom`, `dateTo` - Date range
- `limit`, `offset` - Pagination

**Response**:
```typescript
{
  success: true;
  orders: ConsumerOrder[];
  totalCount: number;
}
```

---

#### 5. Update Order Status
**Route**: `PATCH /api/admin/orders/consumer/[id]/status`

**Body**:
```typescript
{
  status: OrderStatus;
  notes?: string;
  notifyCustomer?: boolean;
}
```

**Actions**:
- Update order status
- Create history record
- Send notification if requested
- Trigger automated workflows

---

## 🎨 UI Components to Create

### Shared Components

1. **`<OrderWizard />`** - Multi-step form wrapper
2. **`<KycUploadForm />`** - File upload with preview
3. **`<OrderTimeline />`** - Visual status history
4. **`<InstallationScheduler />`** - Date/time picker
5. **`<PackageComparison />`** - Side-by-side package view

### Form Components

6. **`<AddressForm />`** - Address input with validation
7. **`<ContactDetailsForm />`** - Phone/email with validation
8. **`<PaymentMethodSelector />`** - Payment option picker

### Display Components

9. **`<OrderSummaryCard />`** - Order details summary
10. **`<PricingBreakdown />`** - Package pricing display
11. **`<InstallationInfo />`** - Installation details card

---

## 🔗 React Hooks to Create

### 1. `useOrderSubmission.ts`
```typescript
export function useOrderSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitOrder = async (data: CreateConsumerOrderInput) => {
    // Validate data
    // Call API
    // Handle response
    // Show toast
  };

  return { submitOrder, isSubmitting };
}
```

### 2. `useLeadCapture.ts`
```typescript
export function useLeadCapture() {
  const captureLead = async (data: CreateCoverageLeadInput) => {
    // Create lead in database
    // Sync to Zoho CRM
    // Send confirmation email
  };

  return { captureLead };
}
```

### 3. `useOrderTracking.ts`
```typescript
export function useOrderTracking(orderId: string) {
  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
  });

  return { order, refetch };
}
```

---

## 📧 Email Templates Needed

1. **Order Confirmation** - `lib/notifications/templates/order-confirmation.tsx`
2. **Payment Received** - `lib/notifications/templates/payment-received.tsx`
3. **KYC Upload Request** - `lib/notifications/templates/kyc-upload-request.tsx`
4. **Installation Scheduled** - `lib/notifications/templates/installation-scheduled.tsx`
5. **Order Activated** - `lib/notifications/templates/order-activated.tsx`

All templates already created in Phase 1: `lib/notifications/notification-service.ts`

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Form validation (Zod schemas)
- [ ] Order submission hook
- [ ] Lead capture hook

### Integration Tests
- [ ] API routes respond correctly
- [ ] Database triggers fire
- [ ] Email notifications sent

### E2E Tests (Playwright)
- [ ] Complete order flow (coverage → package → order → tracking)
- [ ] Lead capture flow (no coverage)
- [ ] KYC upload
- [ ] Admin order management

---

## 📊 Implementation Order

### **Day 1: Coverage & Results**
1. ✅ Morning: Enhance coverage checker with lead capture
2. ✅ Afternoon: Create coverage results page

### **Day 2: Order Form**
3. ✅ Morning: Build order form (Steps 1-3)
4. ✅ Afternoon: Create order submission API + email notifications

### **Day 3: Tracking & Admin**
5. ✅ Morning: Build order status tracking page
6. ✅ Afternoon: Create admin order management dashboard

---

## 🎯 Success Criteria

### User Can:
- ✅ Check coverage at their address
- ✅ See available packages if coverage exists
- ✅ Submit lead form if no coverage
- ✅ Complete order in 3 simple steps
- ✅ Track order status in real-time
- ✅ Upload KYC documents
- ✅ Receive email notifications at each step

### Admin Can:
- ✅ View all consumer orders in one dashboard
- ✅ Filter/search orders
- ✅ Update order status
- ✅ Review KYC documents
- ✅ Schedule installations
- ✅ Communicate with customers

---

## 📝 Next Steps After Phase 2

1. **Phase 3**: B2B SMME Journey (business quotes, credit checks)
2. **Phase 4**: Admin Analytics Dashboard
3. **Phase 5**: Payment Gateway Integration
4. **Phase 6**: SMS/WhatsApp Notifications

---

**Ready to Start**: Phase 2 implementation begins with enhancing the coverage checker!
