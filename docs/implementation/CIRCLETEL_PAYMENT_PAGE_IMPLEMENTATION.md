# CircleTel Payment Page Implementation Guide

**Date:** October 24, 2025  
**Based On:** WebAfrica Payment Page Analysis  
**Status:** ✅ Ready for Integration

---

## 📋 Overview

This document provides a complete implementation guide for the CircleTel payment page, cloned from WebAfrica's design but adapted with CircleTel branding and colors.

---

## 🎨 Design Adaptations

### Color Scheme

| Element | WebAfrica | CircleTel | Usage |
|---------|-----------|-----------|-------|
| Primary Brand | `#FD1786` (Pink) | `#F5831F` (Orange) | Headers, section titles, accents |
| Text/Buttons | `#1E4B85` (Navy) | `#1E293B` (Dark Neutral) | Body text, form labels |
| Backgrounds | `#FFFFFF` (White) | `#FFFFFF` (White) | Cards, sections |
| Borders | `#CDDEE4` (Light Blue) | `#E5E7EB` (Gray) | Input borders, dividers |
| Success | `#10B981` (Green) | `#10B981` (Green) | Free items, checkmarks |
| Error | `#EF4444` (Red) | `#EF4444` (Red) | Validation errors |

### Typography

**Font Family:** Arial, Helvetica, sans-serif (CircleTel standard)

**Font Sizes:**
- Page Heading: `text-3xl` (30px)
- Section Headings: `text-xl` (20px)
- Body Text: `text-base` (16px)
- Labels: `text-sm` (14px)
- Small Text: `text-xs` (12px)

**Font Weights:**
- Headings: `font-semibold` (600)
- Body: `font-normal` (400)
- Emphasis: `font-bold` (700)

---

## 🏗️ Component Structure

### File Organization

```
components/
└── checkout/
    └── CircleTelPaymentPage.tsx    # Main payment page component

app/
└── checkout/
    └── payment/
        └── page.tsx                 # Next.js page wrapper

docs/
├── analysis/
│   └── WEBAFRICA_PAYMENT_PAGE_ANALYSIS.md
└── implementation/
    └── CIRCLETEL_PAYMENT_PAGE_IMPLEMENTATION.md
```

---

## 🧩 Component Features

### 1. Progress Header
- **Background:** CircleTel orange (`bg-circleTel-orange`)
- **Logo:** CircleTel branding
- **Progress Steps:** 3-step indicator
  - ✅ Create Account (completed)
  - 🔵 Payment (active)
  - ⚪ Order Confirmation (pending)
- **Security Badge:** "Secure Checkout" with shield icon

### 2. Collapsible Sections (Accordion)
All major sections use shadcn/ui `Accordion` component:

1. **Your Details**
   - ID Type dropdown
   - ID/Passport Number
   - Alternate Contact Number

2. **Service Address**
   - Address Type dropdown
   - Street Number & Name
   - Suburb, City, Province (pre-filled from coverage check)
   - Postal Code

3. **Delivery Address**
   - Radio buttons: "Same as above" or "New address"
   - Conditional fields for new address

4. **Payment Details**
   - Bank Name dropdown
   - Account Holder Name
   - Account Number
   - Account Type dropdown
   - Debit Order Mandate (with acceptance checkbox)

5. **Order Summary**
   - Package details with price
   - Router (FREE)
   - Installation fee (if applicable)
   - Total amount

### 3. Form Validation
- **Required Fields:** Marked with red asterisk (*)
- **Inline Errors:** Show below invalid fields
- **Submit Validation:** Prevents submission until all required fields valid
- **SA ID Validation:** 13-digit format check

### 4. Payment Flow
```typescript
Submit Form
    ↓
Validate All Fields
    ↓
Create Order (POST /api/orders/create)
    ↓
Initiate Payment (POST /api/payment/netcash/initiate)
    ↓
Redirect to Netcash Gateway
    ↓
Process Payment
    ↓
Webhook Callback
    ↓
Order Confirmation Page
```

---

## 🔧 Technical Implementation

### Dependencies

All required dependencies are already in the project:
- ✅ `@radix-ui/react-accordion` - Collapsible sections
- ✅ `@radix-ui/react-select` - Dropdowns
- ✅ `@radix-ui/react-radio-group` - Radio buttons
- ✅ `@radix-ui/react-checkbox` - Checkboxes
- ✅ `lucide-react` - Icons
- ✅ `next` - Framework
- ✅ `react` - UI library

### State Management

**OrderContext Integration:**
```typescript
const { state } = useOrderContext()
const selectedPackage = state.orderData.coverage?.selectedPackage
const pricing = state.orderData.coverage?.pricing
```

**Local Form State:**
```typescript
const [formData, setFormData] = useState({
  idType: "sa-id",
  idNumber: "",
  alternateContact: "",
  // ... all form fields
})
```

### Form Validation

**Validation Rules:**
```typescript
const validateForm = () => {
  const newErrors: Record<string, string> = {}
  
  // ID Number
  if (!formData.idNumber) {
    newErrors.idNumber = "ID/Passport number is required"
  } else if (formData.idType === "sa-id" && formData.idNumber.length !== 13) {
    newErrors.idNumber = "SA ID must be 13 digits"
  }
  
  // Address
  if (!formData.streetNumber) newErrors.streetNumber = "Street number is required"
  if (!formData.streetName) newErrors.streetName = "Street name is required"
  if (!formData.postalCode) newErrors.postalCode = "Postal code is required"
  
  // Payment
  if (!formData.bankName) newErrors.bankName = "Bank name is required"
  if (!formData.accountHolderName) newErrors.accountHolderName = "Account holder name is required"
  if (!formData.accountNumber) newErrors.accountNumber = "Account number is required"
  if (!formData.accountType) newErrors.accountType = "Account type is required"
  
  // Checkboxes
  if (!formData.acceptMandate) newErrors.acceptMandate = "You must accept the debit order mandate"
  if (!formData.acceptTerms) newErrors.acceptTerms = "You must accept the terms and conditions"
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

---

## 🚀 Usage

### Basic Usage

```tsx
import { CircleTelPaymentPage } from "@/components/checkout/CircleTelPaymentPage"

export default function PaymentPage() {
  return <CircleTelPaymentPage variant="home-internet" />
}
```

### With Variant Support

```tsx
// Wireless
<CircleTelPaymentPage variant="wireless" />

// Home Internet
<CircleTelPaymentPage variant="home-internet" />

// Business
<CircleTelPaymentPage variant="business" />
```

### With OrderContext

```tsx
import { OrderContextProvider } from "@/components/order/context/OrderContext"
import { CircleTelPaymentPage } from "@/components/checkout/CircleTelPaymentPage"

export default function PaymentPage() {
  return (
    <OrderContextProvider>
      <CircleTelPaymentPage variant="home-internet" />
    </OrderContextProvider>
  )
}
```

---

## 🎯 Integration Points

### 1. Coverage Check Integration
**Pre-fill from OrderContext:**
- Suburb (from address)
- City (from address)
- Province (from coordinates)

### 2. Package Selection Integration
**Display in Order Summary:**
- Package name
- Package speed
- Monthly price
- Installation fee
- Total amount

### 3. Payment Gateway Integration
**Netcash API Endpoints:**
- `POST /api/orders/create` - Create order record
- `POST /api/payment/netcash/initiate` - Start payment
- `POST /api/payment/netcash/webhook` - Payment callback

### 4. Order Confirmation
**Redirect After Payment:**
- Success: `/order/confirmation?orderId={id}`
- Failure: `/checkout/payment?error=payment_failed`

---

## 📱 Responsive Design

### Mobile (< 768px)
- Single column layout
- Full-width inputs
- Stacked form fields
- Collapsible sections more compact
- Fixed header with progress

### Tablet (768px - 1024px)
- Two-column grid for some fields
- More spacing
- Larger touch targets

### Desktop (> 1024px)
- Max width container (1024px)
- Two-column grid for most fields
- Optimal spacing
- Sidebar for order summary (optional)

---

## ✅ Testing Checklist

### Visual Testing
- [ ] Header displays correctly with CircleTel orange
- [ ] Progress indicator shows correct step
- [ ] All sections are collapsible
- [ ] Form fields have floating labels
- [ ] Required field asterisks are visible
- [ ] Order summary displays package details
- [ ] Submit button has lock icon
- [ ] Security badge shows in header

### Functional Testing
- [ ] Form validation works for all fields
- [ ] SA ID validation (13 digits)
- [ ] Postal code validation (4 digits)
- [ ] Dropdown selections work
- [ ] Radio button groups work
- [ ] Checkboxes toggle correctly
- [ ] Delivery address toggle works
- [ ] Pre-filled fields are disabled
- [ ] Submit button disabled until terms accepted

### Integration Testing
- [ ] OrderContext data loads correctly
- [ ] Package details display in summary
- [ ] Pricing calculations are correct
- [ ] Order creation API works
- [ ] Payment initiation API works
- [ ] Netcash redirect works
- [ ] Webhook processing works
- [ ] Order confirmation redirect works

### Responsive Testing
- [ ] Mobile layout (< 768px)
- [ ] Tablet layout (768px - 1024px)
- [ ] Desktop layout (> 1024px)
- [ ] Touch targets adequate (min 44px)
- [ ] Text readable on all devices
- [ ] Scrolling works smoothly

---

## 🐛 Known Issues & Solutions

### Issue 1: Accordion Not Expanding
**Solution:** Ensure `defaultValue` prop is set on Accordion items that should be open by default.

```tsx
<Accordion type="single" collapsible defaultValue="details">
  <AccordionItem value="details">
    {/* Content */}
  </AccordionItem>
</Accordion>
```

### Issue 2: Form Validation Not Showing
**Solution:** Ensure error state is passed to Input components.

```tsx
<Input
  className={errors.fieldName ? "border-red-500" : ""}
/>
{errors.fieldName && <p className="text-sm text-red-500">{errors.fieldName}</p>}
```

### Issue 3: OrderContext Data Not Loading
**Solution:** Wrap page in OrderContextProvider.

```tsx
<OrderContextProvider>
  <CircleTelPaymentPage />
</OrderContextProvider>
```

---

## 🔄 Future Enhancements

### Phase 1 (Immediate)
- [ ] Add loading states for API calls
- [ ] Implement error handling for failed submissions
- [ ] Add toast notifications for success/error
- [ ] Implement form auto-save (localStorage)

### Phase 2 (Short Term)
- [ ] Add address autocomplete (Google Maps)
- [ ] Implement bank account verification
- [ ] Add payment method selection (debit order vs credit card)
- [ ] Implement promo code functionality

### Phase 3 (Long Term)
- [ ] Add saved payment methods
- [ ] Implement one-click checkout
- [ ] Add order modification capability
- [ ] Implement multi-currency support

---

## 📚 Related Documentation

- **Analysis:** `docs/analysis/WEBAFRICA_PAYMENT_PAGE_ANALYSIS.md`
- **Component:** `components/checkout/CircleTelPaymentPage.tsx`
- **Page:** `app/checkout/payment/page.tsx`
- **Order Flow:** `docs/integrations/COMPLETE_ORDER_FLOW_ANALYSIS.md`
- **Design System:** `docs/architecture/DESIGN_SYSTEM.md`

---

## 🎉 Summary

The CircleTel payment page is a complete clone of WebAfrica's design with the following adaptations:

✅ **CircleTel Branding:** Orange (#F5831F) replaces pink  
✅ **Modern Components:** shadcn/ui components throughout  
✅ **Full Validation:** Comprehensive form validation  
✅ **OrderContext Integration:** Seamless data flow  
✅ **Responsive Design:** Mobile-first approach  
✅ **Security Features:** Lock icons, secure badges  
✅ **Payment Gateway:** Netcash integration ready  

**Ready for:** Staging deployment and user testing

---

**Implementation Complete:** October 24, 2025  
**Status:** ✅ Ready for Integration  
**Next Step:** Deploy to staging environment
