# Story: Complete Netcash Payment Integration

**Story ID**: CFC-001-01
**Epic**: Coverage & Feasibility Check System (CFC-001)
**Created**: October 1, 2025
**Status**: Ready for Development
**Points**: 8 (2 days)
**Assignee**: Full-Stack Developer
**Priority**: 🔴 CRITICAL (Blocks Revenue)

## Story Overview

As a **CircleTel customer**, I need to **complete my order with secure payment processing** so that **I can purchase internet services and receive confirmation of my subscription**.

### Business Value
- Enables revenue generation (currently blocked)
- Completes BRS requirement 4.3 (Order and Subscription)
- Provides secure, PCI-compliant payment processing
- Sends automated confirmation emails to customers
- Integrates with Zoho Billing for invoicing

## Context Engineering

### Current Architecture Context

#### Existing Order Flow
```typescript
// Current implementation: app/order/page.tsx
export default function OrderPage() {
  const { state } = useOrderContext();

  // Redirects to coverage stage
  useEffect(() => {
    router.push('/order/coverage');
  }, [router]);

  return (
    <OrderWizard
      onStageComplete={(stage) => console.log(`Stage ${stage} completed`)}
      onOrderComplete={() => router.push('/order/confirmation')}
    >
      {/* 4 stages: coverage, account, contact, installation */}
    </OrderWizard>
  );
}
```

#### Environment Configuration (Exists)
```bash
# .env.netcash.example
NETCASH_MERCHANT_ID=your_merchant_id
NETCASH_SECRET_KEY=your_secret_key
NETCASH_PAYMENT_URL=https://paynow.netcash.co.za/site/paynow.aspx
NETCASH_WEBHOOK_SECRET=your_webhook_secret
```

#### Email Configuration (Exists)
```bash
# Already configured in .env
RESEND_API_KEY=re_xxxxx  # ✅ Ready to use
```

### Required Extensions

#### 1. Payment Form Component (NEW)
```typescript
// components/order/PaymentStage.tsx
import { useOrderContext } from '@/components/order/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface NetcashPaymentData {
  M1: string;       // Merchant ID
  M2: string;       // Merchant Key
  M3: string;       // Amount (in cents)
  M4: string;       // Reference (Order ID)
  M5: string;       // Return URL
  M6: string;       // Cancel URL
  M10: string;      // Extra 1 (Lead ID)
  M11: string;      // Extra 2 (Package ID)
}

export function PaymentStage() {
  const { state, updateState } = useOrderContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePayment = async () => {
    setIsSubmitting(true);

    try {
      // Create order in database first
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: state.leadId,
          package_id: state.selectedPackageId,
          customer_details: state.account,
          contact_details: state.contact,
          installation_preferences: state.installation,
        })
      });

      if (!orderResponse.ok) throw new Error('Failed to create order');

      const order = await orderResponse.json();

      // Redirect to Netcash payment page
      const paymentUrl = await fetch('/api/payment/netcash/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          amount: state.package.price,
          customer_email: state.contact.email,
        })
      }).then(res => res.json());

      // Redirect to Netcash
      window.location.href = paymentUrl.paymentUrl;
    } catch (error) {
      console.error('Payment initiation failed:', error);
      toast.error('Payment initiation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Complete Your Payment</h2>

      {/* Order Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between mb-2">
          <span>{state.package.name}</span>
          <span className="font-semibold">R{state.package.price}</span>
        </div>
        <div className="border-t pt-2 flex justify-between">
          <span className="font-bold">Total</span>
          <span className="font-bold text-circleTel-orange">
            R{state.package.price}
          </span>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Shield className="w-4 h-4" />
        <span>Secure payment powered by Netcash</span>
      </div>

      <Button
        onClick={handlePayment}
        disabled={isSubmitting}
        className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Pay R{state.package.price}
            <ArrowRight className="ml-2 h-4 h-4" />
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 mt-4 text-center">
        By proceeding, you agree to our Terms of Service and Privacy Policy
      </p>
    </Card>
  );
}
```

#### 2. Payment Initiation API (NEW)
```typescript
// app/api/payment/netcash/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { order_id, amount, customer_email } = await request.json();

    // Validate inputs
    if (!order_id || !amount || !customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update order with payment pending status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'pending' })
      .eq('id', order_id);

    if (updateError) throw updateError;

    // Generate Netcash payment parameters
    const merchantId = process.env.NETCASH_MERCHANT_ID!;
    const merchantKey = process.env.NETCASH_SECRET_KEY!;
    const amountInCents = (parseFloat(amount) * 100).toString();

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order/payment/success`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order/payment/cancel`;

    // Build Netcash payment URL
    const paymentUrl = new URL(process.env.NETCASH_PAYMENT_URL!);
    paymentUrl.searchParams.append('M1', merchantId);
    paymentUrl.searchParams.append('M2', merchantKey);
    paymentUrl.searchParams.append('M3', amountInCents);
    paymentUrl.searchParams.append('M4', order_id);  // Reference
    paymentUrl.searchParams.append('M5', returnUrl);
    paymentUrl.searchParams.append('M6', cancelUrl);
    paymentUrl.searchParams.append('M14', customer_email);

    return NextResponse.json({
      success: true,
      paymentUrl: paymentUrl.toString(),
      order_id
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 3. Payment Webhook Handler (NEW)
```typescript
// app/api/payment/netcash/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook signature (Netcash security)
    const webhookSecret = process.env.NETCASH_WEBHOOK_SECRET!;
    // TODO: Implement signature verification

    const {
      M4: order_id,           // Reference (Order ID)
      TransactionAccepted,    // true/false
      Reason,                 // Status message
    } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 });
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, service_packages(*), coverage_leads(*)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order payment status
    const paymentStatus = TransactionAccepted ? 'completed' : 'failed';
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        payment_reason: Reason,
        payment_completed_at: TransactionAccepted ? new Date().toISOString() : null
      })
      .eq('id', order_id);

    if (updateError) throw updateError;

    // Send confirmation email if payment successful
    if (TransactionAccepted) {
      await resend.emails.send({
        from: 'CircleTel <orders@circletel.co.za>',
        to: order.coverage_leads.email || order.customer_email,
        subject: 'Order Confirmation - CircleTel',
        html: generateOrderConfirmationEmail(order)
      });

      // Create invoice in Zoho Billing (if integrated)
      // TODO: Call Zoho Billing API to create invoice
    }

    return NextResponse.json({
      success: true,
      payment_status: paymentStatus
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateOrderConfirmationEmail(order: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { background: #F5831F; color: white; padding: 20px; }
          .content { padding: 20px; }
          .package { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Thank you for choosing CircleTel!</h1>
        </div>
        <div class="content">
          <h2>Order Confirmation</h2>
          <p>Your order has been successfully placed and payment received.</p>

          <div class="package">
            <h3>${order.service_packages.name}</h3>
            <p><strong>Speed:</strong> ${order.service_packages.speed_down}Mbps down / ${order.service_packages.speed_up}Mbps up</p>
            <p><strong>Price:</strong> R${order.service_packages.price}/month</p>
          </div>

          <h3>What happens next?</h3>
          <ol>
            <li>Our team will contact you within 24 hours to schedule installation</li>
            <li>Installation typically takes 1-3 business days</li>
            <li>You'll receive your activation details via email</li>
          </ol>

          <p>If you have any questions, please contact us at <a href="mailto:support@circletel.co.za">support@circletel.co.za</a></p>
        </div>
      </body>
    </html>
  `;
}
```

#### 4. Database Schema Update
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_orders_table.sql
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.coverage_leads(id),
  package_id UUID REFERENCES public.service_packages(id),

  -- Customer details
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),

  -- Address details
  installation_address TEXT NOT NULL,
  installation_latitude DECIMAL(10, 8),
  installation_longitude DECIMAL(11, 8),

  -- Installation preferences
  installation_notes TEXT,
  preferred_installation_date DATE,

  -- Payment details
  payment_status VARCHAR(50) DEFAULT 'pending',  -- pending, completed, failed, refunded
  payment_amount DECIMAL(10, 2),
  payment_completed_at TIMESTAMPTZ,
  payment_reason TEXT,
  payment_transaction_id VARCHAR(255),

  -- Status tracking
  order_status VARCHAR(50) DEFAULT 'pending',  -- pending, confirmed, in_progress, completed, cancelled

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  USING (auth.email() = customer_email);

-- Service role can manage all orders
CREATE POLICY "Service role can manage orders"
  ON public.orders
  FOR ALL
  USING (auth.role() = 'service_role');
```

### Integration Pattern

#### Payment Flow Diagram
```
Customer (Browser)
  ↓ [1. Submit Order]
OrderWizard → PaymentStage
  ↓ [2. Create Order]
POST /api/orders/create
  ↓ [3. Initiate Payment]
POST /api/payment/netcash/initiate
  ↓ [4. Redirect to Netcash]
Netcash Payment Page
  ↓ [5a. Payment Success]      ↓ [5b. Payment Cancel]
/order/payment/success     /order/payment/cancel
  ↓ [6. Webhook Callback]
POST /api/payment/netcash/webhook
  ↓ [7. Update Order Status]
Supabase orders table
  ↓ [8. Send Confirmation]
Resend Email API
  ↓ [9. Create Invoice]
Zoho Billing (optional)
```

## Technical Implementation

### Step 1: Create Payment Stage Component
**File**: `components/order/PaymentStage.tsx` (NEW)
- Import existing CircleTel components (Button, Card)
- Use OrderContext for state access
- Display order summary with package details
- Handle payment initiation
- Show loading states during processing

### Step 2: Create Payment API Routes
**Files**:
- `app/api/payment/netcash/initiate/route.ts` (NEW)
- `app/api/payment/netcash/webhook/route.ts` (NEW)
- `app/api/orders/create/route.ts` (NEW)

**Implementation**:
- Validate environment variables on startup
- Generate Netcash payment URLs with proper parameters
- Handle webhook signature verification
- Update order status based on payment result
- Log all payment events for debugging

### Step 3: Create Orders Database Schema
**File**: `supabase/migrations/YYYYMMDDHHMMSS_add_orders_table.sql` (NEW)
- Create orders table with all required fields
- Add foreign keys to coverage_leads and service_packages
- Enable RLS for customer data protection
- Create policies for customer and admin access

### Step 4: Integrate Email Notifications
**File**: `lib/email/templates/order-confirmation.tsx` (NEW)
- Use React Email or plain HTML template
- Include order details, package info, next steps
- Add CircleTel branding (logo, colors)
- Test with Resend sandbox

### Step 5: Add Payment Success/Cancel Pages
**Files**:
- `app/order/payment/success/page.tsx` (NEW)
- `app/order/payment/cancel/page.tsx` (NEW)

**Success Page**:
- Show order confirmation message
- Display order ID and package details
- Provide timeline for installation
- Include support contact information

**Cancel Page**:
- Explain payment was cancelled
- Offer to retry payment
- Provide alternative contact methods

### Step 6: Update OrderWizard
**File**: `components/order/wizard/OrderWizard.tsx` (MODIFY)
- Add payment stage to wizard flow
- Update progress indicator (5 stages now)
- Handle payment stage navigation
- Persist order state to localStorage (for return from Netcash)

## Implementation Steps

1. **Set up environment variables** (Netcash merchant account required)
2. **Create database migration** for orders table
3. **Build Payment API routes** (initiate, webhook)
4. **Create PaymentStage component**
5. **Update OrderWizard** to include payment stage
6. **Create order confirmation pages** (success/cancel)
7. **Integrate Resend email notifications**
8. **Test payment flow in sandbox** (test cards)
9. **Configure webhook endpoint** in Netcash dashboard
10. **Test end-to-end order flow**

## Acceptance Criteria

### Functional Requirements
- [ ] User can view order summary before payment
- [ ] User can proceed to secure Netcash payment page
- [ ] Payment completes successfully with test cards
- [ ] Order status updates to 'completed' on success
- [ ] Order status updates to 'failed' on failure
- [ ] User redirected to success page after payment
- [ ] User redirected to cancel page if payment cancelled
- [ ] Confirmation email sent via Resend
- [ ] Email includes order details and next steps

### Technical Requirements
- [ ] Netcash payment URL generated correctly
- [ ] Webhook signature verification implemented
- [ ] Order records stored in database
- [ ] Payment status tracked accurately
- [ ] Environment variables validated on startup
- [ ] Error handling for failed payments
- [ ] Logging for payment events

### Security Requirements
- [ ] No payment card data stored locally
- [ ] Payment processing tokenized through Netcash
- [ ] Webhook signature verified before processing
- [ ] RLS policies protect customer orders
- [ ] HTTPS enforced for all payment pages
- [ ] PCI DSS compliance maintained

### Quality Requirements
- [ ] Payment page loads < 2s
- [ ] Webhook processes within 5s
- [ ] Email sent within 10s of payment
- [ ] TypeScript compilation passes
- [ ] ESLint rules followed

## Testing Strategy

### Unit Tests
```typescript
// Test payment URL generation
describe('Netcash Payment Initiation', () => {
  it('should generate valid payment URL', async () => {
    const result = await POST({
      order_id: 'test-order-123',
      amount: 1299,
      customer_email: 'test@example.com'
    });

    expect(result.paymentUrl).toContain('paynow.netcash.co.za');
    expect(result.paymentUrl).toContain('M3=129900'); // Amount in cents
  });
});
```

### Integration Tests
```typescript
// Test webhook processing
describe('Netcash Webhook', () => {
  it('should update order status on successful payment', async () => {
    const webhook = {
      M4: 'test-order-123',
      TransactionAccepted: true,
      Reason: 'Transaction Accepted'
    };

    await POST(webhook);

    const order = await supabase
      .from('orders')
      .select('payment_status')
      .eq('id', 'test-order-123')
      .single();

    expect(order.data.payment_status).toBe('completed');
  });
});
```

### Manual Tests
1. Complete order flow with Netcash test card
2. Verify email received with correct details
3. Test payment cancellation flow
4. Verify webhook updates order status
5. Test failed payment handling

## Dependencies

### External Dependencies
- **Netcash Merchant Account**: Production credentials required
- **Netcash Test Environment**: For sandbox testing
- **Resend API**: Email delivery (already configured ✅)
- **Supabase**: Database and RLS policies

### Internal Dependencies
- **OrderContext**: Order state management (exists ✅)
- **OrderWizard**: Multi-stage flow (exists ✅)
- **CircleTel Components**: Button, Card, etc. (exist ✅)

## Risk Mitigation

### Risk 1: Payment Gateway Downtime
**Probability**: Low
**Impact**: High (no orders processed)
**Mitigation**:
- Show clear error message to user
- Provide alternative contact methods (phone, email)
- Log all payment failures for follow-up

### Risk 2: Webhook Delivery Failure
**Probability**: Medium
**Impact**: Medium (order status not updated)
**Mitigation**:
- Implement retry logic in webhook handler
- Add manual order reconciliation tool in admin panel
- Monitor webhook success rate

### Risk 3: Email Delivery Failure
**Probability**: Low
**Impact**: Low (customer doesn't receive confirmation)
**Mitigation**:
- Resend provides delivery tracking
- Add email to admin notification system
- Display confirmation on success page

## Definition of Done

- [ ] Payment stage component created
- [ ] Payment API routes implemented
- [ ] Webhook handler functional
- [ ] Orders database table created
- [ ] Email notifications working
- [ ] Success/cancel pages created
- [ ] OrderWizard updated
- [ ] Environment variables configured
- [ ] Sandbox testing completed
- [ ] Production testing completed
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Deployed to production

## Notes

- **PCI DSS Compliance**: No card data is stored locally. All payment processing happens on Netcash's secure platform.
- **South African Regulation**: Netcash is POPIA compliant for SA customers.
- **Email Sending**: Use CircleTel brand colors and logo in email template.
- **Zoho Billing Integration**: Create invoice after successful payment (optional for MVP, required for full billing).
- **Testing**: Use Netcash test cards for sandbox testing before production deployment.

**Netcash Test Cards**:
- Success: 4111111111111111 (CVV: 123, Expiry: any future date)
- Decline: 4242424242424242
- Insufficient Funds: 5555555555554444

## References

- [Netcash Pay Now Documentation](https://merchant.netcash.co.za/SitePages/Pay-Now.aspx)
- [Resend Email API Docs](https://resend.com/docs/send-with-nextjs)
- [CircleTel BRS v2.0](../../business-requirements/Circle_Tel_Business_Requirements_Specification_v2.0_September_2025.md) - Section 4.3
