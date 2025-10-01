# Story: CRM Lead Notification UI Confirmation

**Story ID**: CFC-001-03
**Epic**: Coverage & Feasibility Check System (CFC-001)
**Created**: October 1, 2025
**Status**: Ready for Development
**Points**: 3 (0.5 days)
**Assignee**: Full-Stack Developer
**Priority**: 🟡 IMPORTANT (User Reassurance)

## Story Overview

As a **CircleTel potential customer in an uncovered area**, I want to **receive clear confirmation that my details have been registered and the sales team will contact me** so that **I feel reassured that I haven't been forgotten and know what to expect next**.

### Business Value
- Reduces customer uncertainty and anxiety
- Increases lead quality (customers expect follow-up)
- Provides clear expectations for sales team response time
- Completes BRS requirement 4.1 (Sales team notification visibility)
- Improves user experience for no-coverage scenario

## Context Engineering

### Current Architecture Context

#### Existing Lead Creation (Backend Works ✅)
```typescript
// app/api/coverage/leads/route.ts (Existing)
export async function POST(request: NextRequest) {
  try {
    const { address, latitude, longitude } = await request.json();

    // Create coverage lead ✅ Works correctly
    const { data: lead, error } = await supabase
      .from('coverage_leads')
      .insert({
        address: address.trim(),
        latitude: latitude || null,
        longitude: longitude || null,
        source: 'web_form'
      })
      .select()
      .single();

    if (error) throw error;

    // Lead created successfully, but user sees no confirmation
    return NextResponse.json({
      success: true,
      id: lead.id,
      address: lead.address
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

// Note: Supabase trigger automatically creates Zoho CRM lead ✅
// But this happens silently - no UI feedback to user
```

#### Existing Coverage Check UI (Silent Lead Creation 🟡)
```typescript
// app/coverage/page.tsx (Current - Line 82)
} else {
  // No coverage available
  alert('Sorry, no coverage available at this location yet.');
  setCurrentStep('input');
}

// Problem: User sees generic alert, no mention of:
// - Lead has been registered
// - Sales team will contact them
// - Expected timeline for contact
```

#### Existing Toast System (Available ✅)
```typescript
// Using sonner for toast notifications
import { toast } from 'sonner';

// Already installed and working
toast.success('Success message');
toast.error('Error message');
toast.info('Info message');
```

### Required Extensions

#### 1. No Coverage Modal Component (NEW)
```typescript
// components/coverage/NoCoverageModal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  TrendingUp
} from 'lucide-react';

interface NoCoverageModalProps {
  open: boolean;
  onClose: () => void;
  address: string;
  leadId: string;
  expectedContactDays?: number;
}

export function NoCoverageModal({
  open,
  onClose,
  address,
  leadId,
  expectedContactDays = 2
}: NoCoverageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-circleTel-orange/10 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-circleTel-orange" />
          </div>
          <DialogTitle className="text-center text-2xl">
            We're Expanding to Your Area!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            While we don't currently service <strong>{address}</strong>,
            we're rapidly expanding our network.
          </DialogDescription>
        </DialogHeader>

        {/* Success Alert */}
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 ml-2">
            Your details have been registered with our sales team
          </AlertDescription>
        </Alert>

        {/* What Happens Next */}
        <div className="space-y-4">
          <h4 className="font-semibold text-circleTel-darkNeutral">
            What happens next?
          </h4>

          <div className="space-y-3">
            {/* Step 1: Registration */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-circleTel-orange text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Registration Complete</p>
                <p className="text-xs text-circleTel-secondaryNeutral">
                  Your details are now in our system
                </p>
              </div>
            </div>

            {/* Step 2: Sales Contact */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-circleTel-orange text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Sales Team Contact</p>
                <p className="text-xs text-circleTel-secondaryNeutral">
                  Within {expectedContactDays} business days via phone or email
                </p>
              </div>
            </div>

            {/* Step 3: Coverage Update */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-circleTel-orange text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Coverage Options</p>
                <p className="text-xs text-circleTel-secondaryNeutral">
                  We'll discuss availability and alternative solutions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Solutions */}
        <div className="p-4 bg-blue-50 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">
              In the meantime...
            </p>
          </div>
          <p className="text-xs text-blue-800">
            Our team may have alternative solutions like nearby coverage areas
            or upcoming expansion plans for your region.
          </p>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-semibold text-circleTel-darkNeutral">
            Need immediate assistance?
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-circleTel-orange" />
              <a
                href="tel:0860123456"
                className="text-circleTel-orange hover:underline"
              >
                086 012 3456
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-circleTel-orange" />
              <a
                href="mailto:sales@circletel.co.za"
                className="text-circleTel-orange hover:underline"
              >
                sales@circletel.co.za
              </a>
            </div>
          </div>
        </div>

        {/* Reference Number */}
        <div className="text-center text-xs text-circleTel-secondaryNeutral pt-2">
          Reference: {leadId.substring(0, 8).toUpperCase()}
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
          size="lg"
        >
          Got it, thanks!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

#### 2. Enhanced Toast Notification (NEW)
```typescript
// lib/notifications/coverage-notifications.ts
import { toast } from 'sonner';
import { CheckCircle, X } from 'lucide-react';

export function showLeadRegisteredToast(address: string) {
  toast.success(
    <div className="flex items-start gap-3">
      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold">Details Registered</p>
        <p className="text-sm text-gray-600">
          Sales team will contact you about {address}
        </p>
      </div>
    </div>,
    {
      duration: 6000,
      position: 'top-center',
    }
  );
}

export function showCoverageCheckSuccess(packageCount: number) {
  toast.success(
    <div className="flex items-start gap-3">
      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold">Coverage Available!</p>
        <p className="text-sm text-gray-600">
          {packageCount} packages found for your location
        </p>
      </div>
    </div>,
    {
      duration: 4000,
      position: 'top-center',
    }
  );
}
```

#### 3. Updated Coverage Page Logic (MODIFY)
```typescript
// app/coverage/page.tsx (Modify existing no-coverage handling)
import { NoCoverageModal } from '@/components/coverage/NoCoverageModal';
import { showLeadRegisteredToast } from '@/lib/notifications/coverage-notifications';

export default function CoveragePage() {
  const [showNoCoverageModal, setShowNoCoverageModal] = useState(false);
  const [noCoverageData, setNoCoverageData] = useState<{
    address: string;
    leadId: string;
  } | null>(null);

  // Existing coverage check logic...
  const handleCoverageCheck = async () => {
    // ... existing code ...

    if (packagesData.available) {
      // Coverage available - existing success handling
      setResults({...});
      setCurrentStep('results');
    } else {
      // No coverage - NEW enhanced handling
      setNoCoverageData({
        address: address,
        leadId: leadId
      });
      setShowNoCoverageModal(true);

      // Also show toast for immediate feedback
      showLeadRegisteredToast(address);

      // Don't reset to input immediately - let user close modal
      // setCurrentStep('input');  // Remove this
    }
  };

  return (
    <div>
      {/* Existing coverage UI */}
      {/* ... */}

      {/* Add modal at end */}
      {noCoverageData && (
        <NoCoverageModal
          open={showNoCoverageModal}
          onClose={() => {
            setShowNoCoverageModal(false);
            setCurrentStep('input'); // Reset after modal closed
            setAddress(''); // Clear form
          }}
          address={noCoverageData.address}
          leadId={noCoverageData.leadId}
          expectedContactDays={2}
        />
      )}
    </div>
  );
}
```

#### 4. Updated CoverageChecker Component (MODIFY)
```typescript
// components/coverage/CoverageChecker.tsx (Modify no-coverage handling)
import { NoCoverageModal } from './NoCoverageModal';
import { showLeadRegisteredToast } from '@/lib/notifications/coverage-notifications';

export function CoverageChecker({...props}) {
  const [showNoCoverageModal, setShowNoCoverageModal] = useState(false);
  const [leadData, setLeadData] = useState<{address: string; leadId: string} | null>(null);

  const handleCheckCoverage = async () => {
    // ... existing coverage check logic ...

    if (result.available) {
      toast.success('Great news! Service is available in your area');
      if (onCoverageFound) onCoverageFound(result);
    } else {
      // NEW: Show modal instead of generic toast
      setLeadData({
        address: address,
        leadId: result.leadId || 'unknown'
      });
      setShowNoCoverageModal(true);
      showLeadRegisteredToast(address);

      if (onNoCoverage) onNoCoverage();
    }
  };

  return (
    <>
      <Card className={className}>
        {/* Existing coverage checker UI */}
      </Card>

      {/* Add modal */}
      {leadData && (
        <NoCoverageModal
          open={showNoCoverageModal}
          onClose={() => {
            setShowNoCoverageModal(false);
            setResults(null);
            setAddress('');
          }}
          address={leadData.address}
          leadId={leadData.leadId}
        />
      )}
    </>
  );
}
```

### Integration Pattern

#### User Experience Flow
```
User enters address
  ↓
Coverage check (2-3s)
  ↓
No coverage found
  ↓
[IMMEDIATE] Toast notification appears (top-center)
  ↓
[SIMULTANEOUS] Modal opens with detailed information
  ↓
User reads timeline and contact info
  ↓
User clicks "Got it, thanks!"
  ↓
Modal closes, form resets
  ↓
User can check another address or contact sales
```

## Technical Implementation

### Step 1: Create NoCoverageModal Component
**File**: `components/coverage/NoCoverageModal.tsx` (NEW)
- Use shadcn/ui Dialog component
- Display CircleTel branding (orange, logo)
- Show 3-step timeline
- Include contact information
- Display lead reference number
- Add close button

### Step 2: Create Notification Utilities
**File**: `lib/notifications/coverage-notifications.ts` (NEW)
- Create reusable toast notification functions
- Use sonner library (already installed)
- Add custom styling for CircleTel brand
- Include appropriate icons

### Step 3: Update Coverage Page
**File**: `app/coverage/page.tsx` (MODIFY)
- Import NoCoverageModal component
- Add modal state management
- Replace generic alert with modal + toast
- Handle modal close event

### Step 4: Update CoverageChecker Component
**File**: `components/coverage/CoverageChecker.tsx` (MODIFY)
- Import NoCoverageModal component
- Add modal state management
- Replace toast.info with modal + custom toast
- Ensure modal props passed correctly

### Step 5: Update Toaster Configuration (if needed)
**File**: `app/layout.tsx` (VERIFY/MODIFY)
```typescript
// Ensure Toaster is configured at root level
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
```

## Implementation Steps

1. **Create NoCoverageModal component** with all sections
2. **Create notification utility functions**
3. **Update app/coverage/page.tsx** to use modal
4. **Update components/coverage/CoverageChecker.tsx** to use modal
5. **Verify Toaster configuration** in layout
6. **Test no-coverage flow** with various addresses
7. **Test on mobile devices** (modal responsiveness)
8. **Verify lead reference number** displays correctly

## Acceptance Criteria

### Functional Requirements
- [ ] Toast notification appears immediately on no-coverage
- [ ] Modal opens with detailed information
- [ ] Lead reference number displayed
- [ ] Contact information (phone, email) provided
- [ ] Expected timeline communicated (2 business days)
- [ ] 3-step process explained clearly
- [ ] Alternative solutions mentioned
- [ ] User can close modal
- [ ] Form resets after modal closed

### Visual Requirements
- [ ] CircleTel branding applied (orange accent)
- [ ] Toast notification styled consistently
- [ ] Modal matches design system
- [ ] Icons used appropriately
- [ ] Mobile-responsive modal
- [ ] Readable text sizes
- [ ] Clear visual hierarchy

### UX Requirements
- [ ] Immediate feedback (toast + modal)
- [ ] Reassuring tone in messaging
- [ ] Clear next steps
- [ ] Contact options easily accessible
- [ ] Reference number for tracking
- [ ] No jargon or technical terms
- [ ] Positive framing ("expanding", not "unavailable")

## Testing Strategy

### Manual Tests

**Test 1: Standard No-Coverage Flow**
```
1. Enter address with no coverage
2. Verify toast appears at top-center
3. Verify modal opens simultaneously
4. Check all sections display correctly
5. Verify contact info clickable
6. Click "Got it, thanks!"
7. Verify modal closes and form resets
```

**Test 2: Mobile Responsiveness**
```
1. Test on mobile device (or DevTools)
2. Verify modal fits screen
3. Check text remains readable
4. Ensure buttons are tappable
5. Test phone number click-to-call
6. Test email click-to-email
```

**Test 3: Multiple Addresses**
```
1. Check first no-coverage address
2. Close modal
3. Check second no-coverage address
4. Verify new leadId displayed
5. Verify address updated in modal
```

### Accessibility Tests
```
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader compatibility (semantic HTML)
- Color contrast ratios (WCAG 2.1 AA)
- Focus management (modal traps focus)
```

### Integration Tests
```typescript
// Test lead registration + modal display
describe('No Coverage Flow', () => {
  it('should show modal when no coverage available', async () => {
    const { getByText, getByRole } = render(<CoveragePage />);

    // Enter address
    const input = getByPlaceholderText('Enter your business address');
    fireEvent.change(input, { target: { value: 'Test Address' } });

    // Click check coverage
    const button = getByText('Show me my options');
    fireEvent.click(button);

    // Wait for API call
    await waitFor(() => {
      expect(getByText(/We're Expanding/i)).toBeInTheDocument();
    });

    // Verify modal content
    expect(getByText('Your details have been registered')).toBeInTheDocument();
    expect(getByText(/Within 2 business days/i)).toBeInTheDocument();
  });
});
```

## Dependencies

### External Dependencies
- **sonner**: Toast notification library (already installed ✅)
- **shadcn/ui**: Dialog component (already installed ✅)
- **Lucide Icons**: CheckCircle, MapPin, Phone, Mail (already installed ✅)

### Internal Dependencies
- **Lead Creation API**: `/api/coverage/leads` (working ✅)
- **CoverageChecker Component**: Existing component to modify
- **Coverage Page**: Existing page to modify
- **CircleTel UI Components**: Button, Alert, Dialog (exist ✅)

## Risk Mitigation

### Risk 1: User Ignores Modal
**Probability**: Medium
**Impact**: Low (toast still provides feedback)
**Mitigation**:
- Toast appears first for immediate feedback
- Modal provides additional details
- Both methods reinforce same message

### Risk 2: Contact Info Outdated
**Probability**: Low
**Impact**: High (customer can't reach sales)
**Mitigation**:
- Use environment variables for contact info
- Add contact details to component props
- Document contact info update process

### Risk 3: Lead Reference Not Helpful
**Probability**: Low
**Impact**: Low (nice-to-have feature)
**Mitigation**:
- Display shortened version (first 8 chars)
- Make it copyable
- Include in email to sales team

## Definition of Done

- [ ] NoCoverageModal component created
- [ ] Notification utilities created
- [ ] Coverage page updated
- [ ] CoverageChecker component updated
- [ ] Toaster configuration verified
- [ ] Mobile responsiveness tested
- [ ] Accessibility verified
- [ ] Contact info clickable (phone, email)
- [ ] Lead reference displays correctly
- [ ] Toast + modal timing works
- [ ] TypeScript compilation passes
- [ ] Code review approved
- [ ] Deployed to staging

## Notes

- **Tone**: Use positive, reassuring language ("expanding", "in the meantime") rather than negative ("not available", "can't service")
- **Timeline**: 2 business days is standard for sales follow-up. Adjust via prop if needed.
- **Contact Info**: Use actual CircleTel phone and email. Update via environment variables for flexibility.
- **Lead Reference**: Useful for customer service tracking. First 8 characters of UUID is sufficient.
- **Alternative Solutions**: Sales team may have nearby coverage or alternative wireless solutions.

## Design Reference

**Similar Patterns**:
- Afrihost "No coverage" modal (good inspiration)
- Supersonic "Coming soon" notification
- Verizon "Not in your area yet" modal

**CircleTel Brand Guidelines**:
- Primary: #F5831F (circleTel-orange)
- Success: Green-600 for confirmation
- Neutral: Gray-600 for secondary text
- Use CheckCircle icon for success states
- Maintain friendly, professional tone

## Success Metrics

**Target Improvements**:
- User satisfaction with no-coverage experience: +40%
- Sales team follow-up clarity: +50%
- Repeat address checks (confusion): -30%
- Customer support tickets "did you receive my details?": -60%

**User Experience Metrics**:
- Modal view rate: > 95% (almost all users read it)
- Phone/email click rate: > 20% (immediate contact interest)
- Time to close modal: 10-20 seconds (enough to read)
- Repeat coverage checks: < 15% (most users understand process)

## Future Enhancements

**Phase 2** (Future Sprints):
- Email confirmation to customer (via Resend)
- SMS notification option (via Twilio)
- "Notify me when available" button
- Coverage expansion map visualization
- Estimated expansion timeline by area
