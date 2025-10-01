# Story: Enhanced Order Summary Display

**Story ID**: CFC-001-02
**Epic**: Coverage & Feasibility Check System (CFC-001)
**Created**: October 1, 2025
**Status**: Ready for Development
**Points**: 5 (1 day)
**Assignee**: Full-Stack Developer
**Priority**: 🟡 IMPORTANT (UX Improvement)

## Story Overview

As a **CircleTel customer**, I want to **see a detailed order summary before completing payment** so that **I understand exactly what I'm purchasing, including pricing, features, installation timeline, and terms**.

### Business Value
- Reduces customer uncertainty and purchase anxiety
- Increases conversion rate by providing transparency
- Reduces support tickets about "what did I order?"
- Completes BRS requirement 4.3 (Order summary display)
- Builds trust through clear communication

## Context Engineering

### Current Architecture Context

#### Existing Order Context
```typescript
// components/order/context/OrderContext.tsx
interface OrderState {
  leadId: string;
  selectedPackageId: string;
  package: ServicePackage;
  coverage: CoverageResult;
  account: AccountDetails;
  contact: ContactDetails;
  installation: InstallationPreferences;
  currentStage: 'coverage' | 'account' | 'contact' | 'installation' | 'payment';
}

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OrderState>(initialState);
  // Context implementation exists ✅
}
```

#### Existing Package Display
```typescript
// components/packages/PackageCard.tsx (Existing)
export function PackageCard({
  id,
  name,
  service_type,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  description,
  features,
  isPopular,
  isSelected,
  onSelect
}: PackageCardProps) {
  // Card component exists with all package details ✅
}
```

#### Existing Order Wizard
```typescript
// components/order/wizard/OrderWizard.tsx (Existing)
export function OrderWizard({
  onStageComplete,
  onOrderComplete
}: OrderWizardProps) {
  // 4 stages: coverage, account, contact, installation
  // Need to add order review before payment stage
}
```

### Required Extensions

#### 1. Order Summary Component (NEW)
```typescript
// components/order/OrderSummary.tsx
import { useOrderContext } from '@/components/order/context/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, MapPin, Calendar, User, Mail, Phone } from 'lucide-react';

export function OrderSummary({ editable = false }: { editable?: boolean }) {
  const { state } = useOrderContext();
  const pkg = state.package;

  // Calculate pricing
  const hasPromotion = pkg.promotion_price && pkg.promotion_months;
  const monthlyPrice = hasPromotion ? pkg.promotion_price : pkg.price;
  const regularPrice = pkg.price;
  const savingsPerMonth = hasPromotion ? regularPrice - pkg.promotion_price! : 0;
  const totalSavings = savingsPerMonth * (pkg.promotion_months || 0);

  return (
    <div className="space-y-6">
      {/* Package Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-circleTel-orange" />
            Your Selected Package
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Package Name */}
          <div>
            <h3 className="text-2xl font-bold text-circleTel-darkNeutral">
              {pkg.name}
            </h3>
            <p className="text-sm text-circleTel-secondaryNeutral mt-1">
              {pkg.service_type}
            </p>
          </div>

          {/* Speed Display */}
          <div className="flex items-center gap-6 p-4 bg-circleTel-lightNeutral/30 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-circleTel-orange">
                {pkg.speed_down}
              </div>
              <div className="text-xs text-circleTel-secondaryNeutral">
                Mbps Download
              </div>
            </div>
            <div className="text-2xl text-circleTel-secondaryNeutral">↕</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-circleTel-orange">
                {pkg.speed_up}
              </div>
              <div className="text-xs text-circleTel-secondaryNeutral">
                Mbps Upload
              </div>
            </div>
          </div>

          {/* Features List */}
          <div>
            <h4 className="font-semibold text-sm text-circleTel-secondaryNeutral mb-2">
              What's Included:
            </h4>
            <ul className="space-y-2">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Pricing Breakdown */}
          <div className="space-y-2">
            {hasPromotion ? (
              <>
                {/* Promotional Pricing */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    Promotional Rate ({pkg.promotion_months} months)
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    R{pkg.promotion_price}/mo
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-circleTel-secondaryNeutral">
                  <span>Regular Rate (after {pkg.promotion_months} months)</span>
                  <span className="line-through">R{regularPrice}/mo</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-semibold text-green-700">
                    You Save
                  </span>
                  <span className="text-lg font-bold text-green-700">
                    R{totalSavings} total
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Regular Pricing */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">Monthly Rate</span>
                  <span className="text-2xl font-bold text-circleTel-orange">
                    R{regularPrice}/mo
                  </span>
                </div>
              </>
            )}

            {/* Installation */}
            <div className="flex justify-between items-center text-sm">
              <span>Installation Fee</span>
              <span className="font-semibold text-green-600">FREE</span>
            </div>

            {/* First Payment */}
            <Separator />
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-circleTel-darkNeutral">
                Due Today
              </span>
              <span className="text-3xl font-bold text-circleTel-orange">
                R{monthlyPrice}
              </span>
            </div>
            <p className="text-xs text-circleTel-secondaryNeutral">
              First month payment • No setup fees • Cancel anytime
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Installation Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-circleTel-orange" />
            Installation Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium text-circleTel-darkNeutral">
              {state.coverage.address}
            </p>
          </div>

          {state.installation.preferred_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-circleTel-secondaryNeutral" />
              <span>Preferred Installation Date: {state.installation.preferred_date}</span>
            </div>
          )}

          {state.installation.notes && (
            <div className="p-3 bg-circleTel-lightNeutral/30 rounded-lg">
              <p className="text-sm text-circleTel-secondaryNeutral">
                <strong>Notes:</strong> {state.installation.notes}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h5 className="font-semibold text-blue-900 mb-2">Installation Timeline</h5>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Payment confirmation within 5 minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Technical team contact within 24 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Installation scheduled (typically 1-3 business days)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>Service activated and ready to use</span>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-circleTel-orange" />
            Your Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-circleTel-secondaryNeutral" />
            <span className="text-sm">
              {state.account.first_name} {state.account.last_name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-circleTel-secondaryNeutral" />
            <span className="text-sm">{state.contact.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-circleTel-secondaryNeutral" />
            <span className="text-sm">{state.contact.phone}</span>
          </div>

          {editable && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => {/* Navigate back to edit */}}
            >
              Edit Details
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-3 text-xs text-gray-600">
            <h5 className="font-semibold text-gray-900">Terms & Conditions</h5>
            <ul className="space-y-2 list-disc list-inside">
              <li>Month-to-month subscription with no fixed contract period</li>
              <li>30-day money-back guarantee if not satisfied</li>
              <li>Fair usage policy applies (unlimited does not mean abuse)</li>
              <li>Installation subject to site survey and technical feasibility</li>
              <li>Prices exclude VAT where applicable</li>
            </ul>
            <p className="mt-4">
              By proceeding with payment, you agree to CircleTel's{' '}
              <a href="/terms" className="text-circleTel-orange underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-circleTel-orange underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 2. Review Stage Component (NEW)
```typescript
// components/order/ReviewStage.tsx
import { useOrderContext } from '@/components/order/context/OrderContext';
import { Button } from '@/components/ui/button';
import { OrderSummary } from '@/components/order/OrderSummary';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function ReviewStage({
  onNext,
  onBack
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { state } = useOrderContext();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">
          Review Your Order
        </h2>
        <p className="text-circleTel-secondaryNeutral">
          Please review your order details before proceeding to payment
        </p>
      </div>

      <OrderSummary editable={true} />

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          size="lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Installation
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-circleTel-orange hover:bg-circleTel-orange/90"
          size="lg"
        >
          Proceed to Payment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Security Badge */}
      <div className="text-center text-sm text-circleTel-secondaryNeutral">
        <p>🔒 Your payment information is secure and encrypted</p>
      </div>
    </div>
  );
}
```

#### 3. Compact Order Summary for Payment Page (NEW)
```typescript
// components/order/CompactOrderSummary.tsx
// Smaller version for payment confirmation page
import { useOrderContext } from '@/components/order/context/OrderContext';
import { Card, CardContent } from '@/components/ui/card';

export function CompactOrderSummary() {
  const { state } = useOrderContext();
  const pkg = state.package;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h4 className="font-semibold">{pkg.name}</h4>
            <p className="text-sm text-gray-600">
              {pkg.speed_down}Mbps ↓ / {pkg.speed_up}Mbps ↑
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-circleTel-orange">
              R{pkg.promotion_price || pkg.price}
            </div>
            <div className="text-xs text-gray-600">per month</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Installation: {state.coverage.address}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Integration Pattern

#### Updated Order Wizard Flow
```
Before:
Coverage → Account → Contact → Installation → Payment

After:
Coverage → Account → Contact → Installation → Review → Payment
                                                  ↑
                                           (NEW STAGE)
```

## Technical Implementation

### Step 1: Create OrderSummary Component
**File**: `components/order/OrderSummary.tsx` (NEW)
- Import OrderContext to access order state
- Use existing CircleTel UI components (Card, Badge, Separator)
- Calculate pricing with promotional logic
- Display package details, features, installation info
- Show customer details with edit option
- Include terms & conditions

### Step 2: Create ReviewStage Component
**File**: `components/order/ReviewStage.tsx` (NEW)
- Wrapper for OrderSummary in wizard flow
- Add navigation buttons (Back, Proceed to Payment)
- Include security messaging
- Handle stage transitions

### Step 3: Create CompactOrderSummary
**File**: `components/order/CompactOrderSummary.tsx` (NEW)
- Smaller version for payment page
- Show key details only (package, price, address)
- Use in PaymentStage component

### Step 4: Update OrderWizard
**File**: `components/order/wizard/OrderWizard.tsx` (MODIFY)
```typescript
// Add review stage to wizard
const stages = [
  'coverage',
  'account',
  'contact',
  'installation',
  'review',    // 🆕 NEW STAGE
  'payment'
];

// Update progress indicator
<ProgressIndicator
  stages={[
    { name: 'Coverage', icon: MapPin },
    { name: 'Account', icon: User },
    { name: 'Contact', icon: Mail },
    { name: 'Installation', icon: Calendar },
    { name: 'Review', icon: ClipboardCheck },  // 🆕 NEW
    { name: 'Payment', icon: CreditCard }
  ]}
  currentStage={currentStageIndex}
/>
```

### Step 5: Add Review Route
**File**: `app/order/review/page.tsx` (NEW)
```typescript
'use client';

import { ReviewStage } from '@/components/order/ReviewStage';
import { useRouter } from 'next/navigation';
import { useOrderContext } from '@/components/order/context/OrderContext';

export default function ReviewPage() {
  const router = useRouter();
  const { validateStage } = useOrderContext();

  // Ensure previous stages are complete
  useEffect(() => {
    if (!validateStage('installation')) {
      router.push('/order/installation');
    }
  }, []);

  return (
    <ReviewStage
      onNext={() => router.push('/order/payment')}
      onBack={() => router.push('/order/installation')}
    />
  );
}
```

### Step 6: Update PaymentStage
**File**: `components/order/PaymentStage.tsx` (MODIFY)
```typescript
// Add compact summary at top
import { CompactOrderSummary } from '@/components/order/CompactOrderSummary';

export function PaymentStage() {
  return (
    <div className="max-w-2xl mx-auto">
      <CompactOrderSummary />  {/* 🆕 NEW */}

      {/* Existing payment form */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
        </CardHeader>
        {/* ... existing payment logic ... */}
      </Card>
    </div>
  );
}
```

## Implementation Steps

1. **Create OrderSummary component** with all sections
2. **Create ReviewStage wrapper** with navigation
3. **Create CompactOrderSummary** for payment page
4. **Update OrderWizard** to include review stage
5. **Add review route** (`app/order/review/page.tsx`)
6. **Update ProgressIndicator** with 6 stages instead of 5
7. **Update PaymentStage** to show compact summary
8. **Test order flow** end-to-end

## Acceptance Criteria

### Functional Requirements
- [ ] User can view complete order summary before payment
- [ ] Package details displayed (name, speeds, features)
- [ ] Pricing breakdown shown (promotional vs. regular)
- [ ] Installation address and preferences visible
- [ ] Customer contact details displayed
- [ ] Installation timeline explained
- [ ] Terms & conditions included
- [ ] User can navigate back to edit details
- [ ] User can proceed to payment
- [ ] Compact summary shown on payment page

### Visual Requirements
- [ ] CircleTel branding applied (colors, typography)
- [ ] Mobile-responsive layout
- [ ] Clear visual hierarchy
- [ ] Pricing prominently displayed
- [ ] Features list with checkmarks
- [ ] Timeline presented clearly
- [ ] Professional, trustworthy design

### UX Requirements
- [ ] Summary is comprehensive but not overwhelming
- [ ] Important information stands out
- [ ] Edit option easily accessible
- [ ] Navigation buttons clear
- [ ] Loading states handled
- [ ] Error states handled

## Testing Strategy

### Visual Testing
```
Manual checks:
- Desktop (1920x1080): All content visible without scrolling per section
- Tablet (768px): Responsive layout maintains readability
- Mobile (375px): Cards stack properly, text remains legible
```

### Functional Testing
```typescript
// Test promotional pricing calculation
describe('OrderSummary Pricing', () => {
  it('should calculate promotional savings correctly', () => {
    const pkg = {
      price: 1299,
      promotion_price: 999,
      promotion_months: 3
    };

    const savingsPerMonth = pkg.price - pkg.promotion_price; // 300
    const totalSavings = savingsPerMonth * pkg.promotion_months; // 900

    expect(totalSavings).toBe(900);
  });
});
```

### User Journey Testing
```
Test Scenario: Complete order review
1. Select package from coverage check
2. Complete account details
3. Complete contact details
4. Complete installation preferences
5. Arrive at review stage
6. Verify all details displayed correctly
7. Click "Proceed to Payment"
8. Verify compact summary shown on payment page
```

## Dependencies

### External Dependencies
- None (uses existing CircleTel components)

### Internal Dependencies
- **OrderContext**: Order state management (exists ✅)
- **CircleTel UI Components**: Card, Badge, Button, Separator (exist ✅)
- **Lucide Icons**: CheckCircle, MapPin, Calendar, etc. (exist ✅)

## Risk Mitigation

### Risk 1: Information Overload
**Probability**: Medium
**Impact**: Medium (user abandons order)
**Mitigation**:
- Use collapsible sections for less critical info
- Prioritize most important details at top
- Use visual hierarchy (bold, color) to guide attention

### Risk 2: Mobile Usability
**Probability**: Low
**Impact**: Medium (mobile users have poor experience)
**Mitigation**:
- Test on real devices (iPhone, Android)
- Ensure touch targets are 44px minimum
- Stack cards vertically on mobile

### Risk 3: Terms Not Read
**Probability**: High
**Impact**: Low (expected behavior)
**Mitigation**:
- Highlight key terms (cancellation, refund)
- Use plain language
- Provide links to full terms

## Definition of Done

- [ ] OrderSummary component created
- [ ] ReviewStage component created
- [ ] CompactOrderSummary component created
- [ ] OrderWizard updated with review stage
- [ ] Review route added
- [ ] PaymentStage updated with compact summary
- [ ] ProgressIndicator updated
- [ ] Mobile responsiveness verified
- [ ] Visual design matches CircleTel brand
- [ ] Navigation flow tested
- [ ] TypeScript compilation passes
- [ ] Code review approved
- [ ] Deployed to staging

## Notes

- **Reuse PackageCard Logic**: The existing PackageCard component already has good feature display. Reuse its patterns.
- **Promotional Pricing**: Ensure promotional pricing logic matches what's shown on package selection page.
- **Edit Functionality**: "Edit Details" button should navigate back to appropriate stage (account, contact, installation).
- **Terms & Conditions**: Link to actual terms page (need to create if doesn't exist).
- **Accessibility**: Use semantic HTML (headings, lists, links) for screen readers.

## Design Reference

**Similar Patterns**:
- Supersonic order summary page (good inspiration)
- Afrihost checkout review (clean pricing breakdown)
- Verizon cart summary (clear timeline display)

**CircleTel Brand Guidelines**:
- Primary color: #F5831F (circleTel-orange)
- Dark neutral: #1F2937 (circleTel-darkNeutral)
- Light neutral: #E6E9EF (circleTel-lightNeutral)
- Use Inter font family
- 8px spacing grid (space-2, space-4, space-6)

## Success Metrics

**Target Conversion Improvements**:
- Review stage completion rate: > 95%
- Payment stage entry rate: > 90% (from review)
- Customer support tickets about "what did I order?": -50%
- Order abandonment rate: -20%

**User Experience Metrics**:
- Time on review stage: 30-60 seconds (enough to read)
- Back navigation rate: < 10% (details are correct first time)
- Mobile completion rate: Match desktop (currently lower)
