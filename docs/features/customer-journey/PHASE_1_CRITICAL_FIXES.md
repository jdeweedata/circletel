# Phase 1: Critical Fixes - Days 1-5
## Order Tracking, Notifications, KYC Upload, Payment Validation

> **Goal**: Make customer journey end-to-end functional for MVP deployment
> **Duration**: 5 working days
> **Priority**: P0 - Blocks MVP Launch
> **Dependencies**: Phase 1 foundation (database schema) already complete

---

## Overview

Phase 1 addresses the **P0 critical gaps** that block production deployment. These features are essential for a functional customer journey from coverage check through order activation.

### What Phase 1 Delivers

- ✅ Customer-facing order status tracking
- ✅ Automated service activation emails
- ✅ Real-time sales team alerts for new leads
- ✅ KYC document upload and verification workflow
- ✅ Payment validation and error recovery

### Success Criteria

- [ ] Customers can track order status in real-time
- [ ] 100% of activated orders send credentials email
- [ ] 100% of no-coverage leads trigger sales alerts within 30 seconds
- [ ] KYC documents upload successfully to Supabase Storage
- [ ] Payment errors handled gracefully with retry option
- [ ] All features mobile responsive

---

## Day 1-2: Order Tracking & Notifications

### Task 1.1: Build Order Status Page (8 hours)

**File**: `/app/orders/[orderId]/page.tsx` (new)

**Description**: Create customer-facing page to track order progress from payment through activation.

#### Implementation Details

**Component Structure**:
```tsx
// /app/orders/[orderId]/page.tsx
import { OrderStatusBadge } from '@/components/customer-journey/OrderStatusBadge';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { KycUploadButton } from '@/components/order/KycUploadButton'; // new

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  // Fetch order from consumer_orders table
  // Fetch status history from order_status_history table
  // Fetch KYC documents if applicable

  return (
    <div>
      <h1>Order Tracking</h1>
      <OrderStatusBadge status={order.status} />
      <OrderTimeline statusHistory={statusHistory} />
      {order.status === 'kyc_pending' && <KycUploadButton orderId={orderId} />}
      {order.status === 'installation_scheduled' && <InstallationDetails {...order} />}
      {order.status === 'active' && <ActivationDetails {...order} />}
    </div>
  );
}
```

**Features**:
1. **Real-Time Status Display**
   - Fetch current order status from `consumer_orders` table
   - Display status badge with color coding (green = active, yellow = pending, red = failed)
   - Show estimated time to next status change

2. **Timeline Component**
   - Show all status changes from `order_status_history` table
   - Display timestamps and change reasons
   - Highlight current status
   - Show who made the change (customer vs. automated vs. admin)

3. **Conditional Actions**
   - If `status = 'kyc_pending'`: Show "Upload Documents" button
   - If `status >= 'installation_scheduled'`: Show installation date/time
   - If `status = 'active'`: Show account details and credentials

4. **Mobile Responsive**
   - Stack timeline vertically on mobile
   - Large tap targets for buttons
   - Readable font sizes

**Database Queries**:
```sql
-- Fetch order
SELECT * FROM consumer_orders WHERE id = $1;

-- Fetch status history
SELECT * FROM order_status_history
WHERE entity_type = 'consumer_order' AND entity_id = $1
ORDER BY status_changed_at DESC;

-- Fetch KYC documents
SELECT * FROM kyc_documents
WHERE consumer_order_id = $1;
```

**API Route** (optional): `/app/api/orders/[orderId]/route.ts`
- `GET /api/orders/[orderId]` - Fetch order details
- `GET /api/orders/[orderId]/status-history` - Fetch timeline

**Acceptance Criteria**:
- [ ] Order status page loads in < 2 seconds
- [ ] Status updates appear in real-time (poll every 30 seconds or use WebSocket)
- [ ] Timeline shows all status changes with timestamps
- [ ] Conditional UI renders based on order status
- [ ] Mobile responsive (tested on 375px viewport)
- [ ] Handles invalid orderId gracefully (404 page)

---

### Task 1.2: Service Activation Email (4 hours)

**File**: `/lib/notifications/notification-service.ts` (update)

**Description**: Send automated email to customer when order status changes to `active`, providing account credentials and next steps.

#### Implementation Details

**Email Template**: `service_activated`

```typescript
// Add to /lib/notifications/notification-service.ts

interface ServiceActivationData {
  customerName: string;
  accountNumber: string;
  serviceAddress: string;
  packageName: string;
  speed: string;
  activationDate: string;
  // Optional login credentials (if applicable)
  loginUrl?: string;
  username?: string;
  tempPassword?: string;
  supportEmail: string;
  supportPhone: string;
}

async function sendServiceActivationEmail(order: ConsumerOrder): Promise<boolean> {
  const data: ServiceActivationData = {
    customerName: `${order.first_name} ${order.last_name}`,
    accountNumber: order.account_number!,
    serviceAddress: order.installation_address,
    packageName: order.package_name,
    speed: order.package_speed,
    activationDate: order.activation_date!.toISOString(),
    loginUrl: 'https://circletel.co.za/account/login',
    username: order.email,
    tempPassword: generateTempPassword(), // Store in order table
    supportEmail: 'support@circletel.co.za',
    supportPhone: '+27 11 123 4567',
  };

  return await EmailNotificationService.send({
    to: order.email,
    template: 'service_activated',
    subject: '🎉 Your CircleTel Service is Active!',
    data,
  });
}
```

**Email Content** (HTML template):
```html
<h1>Welcome to CircleTel! 🎉</h1>
<p>Hi {{customerName}},</p>
<p>Great news! Your internet service is now active and ready to use.</p>

<h2>Service Details</h2>
<ul>
  <li><strong>Account Number:</strong> {{accountNumber}}</li>
  <li><strong>Service Address:</strong> {{serviceAddress}}</li>
  <li><strong>Package:</strong> {{packageName}} ({{speed}})</li>
  <li><strong>Activation Date:</strong> {{activationDate}}</li>
</ul>

<h2>Next Steps</h2>
<ol>
  <li>Log in to your account: <a href="{{loginUrl}}">{{loginUrl}}</a></li>
  <li>Username: {{username}}</li>
  <li>Temporary Password: {{tempPassword}}</li>
  <li>Change your password on first login</li>
</ol>

<h2>Need Help?</h2>
<p>Email: {{supportEmail}}</p>
<p>Phone: {{supportPhone}}</p>

<p>Thank you for choosing CircleTel!</p>
```

**Trigger**: Database trigger on `consumer_orders` table

```sql
-- Add to migration or run in Supabase SQL Editor
CREATE OR REPLACE FUNCTION notify_service_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'active'
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    -- Call Edge Function or queue email
    PERFORM pg_notify('service_activated', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_activation_trigger
AFTER UPDATE ON consumer_orders
FOR EACH ROW
EXECUTE FUNCTION notify_service_activation();
```

**Alternative**: Use Supabase Edge Function
- Create `/supabase/functions/send-activation-email/index.ts`
- Listen for database changes via Supabase Realtime
- Send email via Resend API

**Acceptance Criteria**:
- [ ] Email sent within 1 minute of order status → `active`
- [ ] Email contains all required information (account number, credentials, support)
- [ ] Email renders correctly on desktop and mobile clients
- [ ] Temporary password is secure (generated via `crypto.randomBytes`)
- [ ] Email delivery logged in database (optional: `email_logs` table)
- [ ] Failed email sends retry up to 3 times

---

### Task 1.3: Sales Team Alerts (4 hours)

**File**: `/lib/notifications/sales-alerts.ts` (new)

**Description**: Send real-time email/SMS alerts to sales team when critical events occur (no-coverage lead, business quote request, high-value order).

#### Implementation Details

**Sales Alert Triggers**:

1. **Coverage Lead Captured** (no coverage available)
   - Trigger: `coverage_leads` table insert with `coverage_check_id IS NULL`
   - Alert: Email + SMS to sales team

2. **Business Quote Requested**
   - Trigger: `business_quotes` table insert with `status = 'draft'`
   - Alert: Email to sales manager

3. **High-Value Order** (optional)
   - Trigger: `consumer_orders` table insert with `monthly_recurring > 2000`
   - Alert: Email to sales team for follow-up

**Implementation**:

```typescript
// /lib/notifications/sales-alerts.ts

interface SalesAlertData {
  alertType: 'coverage_lead' | 'business_quote' | 'high_value_order';
  leadId?: string;
  quoteId?: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  requestedService?: string;
  estimatedValue?: number;
  urgency: 'low' | 'medium' | 'high';
}

export class SalesAlertService {
  static async sendCoverageLeadAlert(lead: CoverageLead): Promise<boolean> {
    const alertData: SalesAlertData = {
      alertType: 'coverage_lead',
      leadId: lead.id,
      customerName: `${lead.first_name} ${lead.last_name}`,
      customerEmail: lead.email,
      customerPhone: lead.phone,
      address: lead.address,
      requestedService: lead.requested_service_type,
      urgency: 'high', // No coverage = hot lead
    };

    // Send email to sales team
    const emailSent = await this.sendSalesEmail(alertData);

    // Send SMS to on-call sales rep (optional)
    const smsSent = await this.sendSalesSMS(alertData);

    return emailSent && smsSent;
  }

  private static async sendSalesEmail(data: SalesAlertData): Promise<boolean> {
    return await EmailNotificationService.send({
      to: 'sales@circletel.co.za', // or fetch from env
      subject: `🚨 New ${data.alertType} - ${data.customerName}`,
      template: 'sales_alert',
      data,
    });
  }

  private static async sendSalesSMS(data: SalesAlertData): Promise<boolean> {
    const message = `New ${data.alertType}: ${data.customerName} at ${data.address}. Contact: ${data.customerPhone}`;
    return await SmsNotificationService.send(
      process.env.SALES_TEAM_PHONE!, // e.g., '+27821234567'
      message
    );
  }
}
```

**Database Trigger**:

```sql
-- Trigger on coverage_leads insert
CREATE OR REPLACE FUNCTION notify_sales_coverage_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if no coverage available
  IF NEW.status = 'new' THEN
    PERFORM pg_notify('sales_coverage_lead', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_coverage_lead_trigger
AFTER INSERT ON coverage_leads
FOR EACH ROW
EXECUTE FUNCTION notify_sales_coverage_lead();
```

**Integration Options**:

1. **Email**: Resend API (already configured)
   - Use existing `RESEND_API_KEY` environment variable
   - Template: Professional sales alert with lead details

2. **SMS**: ClickaTel API or Twilio
   - Add `CLICKATEL_API_KEY` environment variable
   - Send to sales team phone number

3. **Slack** (optional): Webhook notification
   - Add `SLACK_WEBHOOK_URL` environment variable
   - Post to #sales-leads channel

**Email Template**:

```html
<h1>🚨 New Coverage Lead Alert</h1>
<p><strong>Customer:</strong> {{customerName}}</p>
<p><strong>Email:</strong> {{customerEmail}}</p>
<p><strong>Phone:</strong> {{customerPhone}}</p>
<p><strong>Address:</strong> {{address}}</p>
<p><strong>Requested Service:</strong> {{requestedService}}</p>
<p><strong>Urgency:</strong> {{urgency}}</p>

<p><a href="https://circletel.co.za/admin/coverage-leads/{{leadId}}">View Lead in Admin Panel</a></p>

<p><strong>Action Required:</strong> Follow up within 24 hours to discuss coverage expansion or alternative solutions.</p>
```

**Acceptance Criteria**:
- [ ] Email sent to `sales@circletel.co.za` within 30 seconds of lead creation
- [ ] SMS sent to sales team phone (if configured)
- [ ] Alert contains all customer contact info and address
- [ ] Link to admin panel lead view included
- [ ] Alert delivery logged (optional: `alert_logs` table)
- [ ] Failed alerts retry up to 3 times
- [ ] No alerts sent in development environment

---

## Day 3-4: KYC Document Upload

### Task 2.1: KYC Upload Component (6 hours)

**File**: `/components/order/KycDocumentUpload.tsx` (new)

**Description**: Drag-and-drop file upload component for KYC documents with document type selection and preview.

#### Implementation Details

**Component Structure**:

```tsx
// /components/order/KycDocumentUpload.tsx
'use client';

import { useState } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { uploadToSupabase } from '@/lib/storage/supabase-upload';

interface KycUploadProps {
  orderId: string;
  onUploadComplete?: () => void;
}

export function KycDocumentUpload({ orderId, onUploadComplete }: KycUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<KycDocumentType>('id_document');
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<KycDocument[]>([]);

  const handleFileSelect = (file: File) => {
    // Validate file type (PDF, JPG, PNG)
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      alert('Please upload PDF, JPG, or PNG files only');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // 1. Upload file to Supabase Storage
      const filePath = await uploadToSupabase(selectedFile, `kyc/${orderId}`);

      // 2. Create KYC document record in database
      const response = await fetch('/api/kyc/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer_order_id: orderId,
          document_type: documentType,
          file_path: filePath,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          title: selectedFile.name,
        }),
      });

      if (!response.ok) throw new Error('Upload failed');

      const { document } = await response.json();
      setUploadedDocs([...uploadedDocs, document]);
      setSelectedFile(null);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3>Upload KYC Documents</h3>

      {/* Document Type Selector */}
      <Select value={documentType} onValueChange={(v) => setDocumentType(v as KycDocumentType)}>
        <SelectTrigger>
          <SelectValue placeholder="Select document type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="id_document">ID Document</SelectItem>
          <SelectItem value="proof_of_address">Proof of Address</SelectItem>
          <SelectItem value="bank_statement">Bank Statement</SelectItem>
        </SelectContent>
      </Select>

      {/* Drag & Drop Area */}
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-circleTel-orange"
        onClick={() => document.getElementById('file-input')?.click()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFileSelect(file);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-6 h-6" />
            <span>{selectedFile.name}</span>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Drag & drop or click to upload</p>
            <p className="text-sm text-gray-500">PDF, JPG, PNG (max 5MB)</p>
          </>
        )}
      </div>

      <input
        id="file-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {/* Upload Button */}
      <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full">
        {uploading ? 'Uploading...' : 'Upload Document'}
      </Button>

      {/* Uploaded Documents List */}
      {uploadedDocs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">Uploaded Documents</h4>
          {uploadedDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{doc.title}</span>
              </div>
              <span className="text-sm text-gray-500">{doc.verification_status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Supabase Storage Setup**:

```typescript
// /lib/storage/supabase-upload.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function uploadToSupabase(file: File, path: string): Promise<string> {
  const supabase = createClientComponentClient();

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  // Upload to Supabase Storage bucket 'kyc-documents'
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  return data.path;
}
```

**API Route**: `/app/api/kyc/upload/route.ts` (new)

```typescript
// /app/api/kyc/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  // Insert KYC document record
  const { data, error } = await supabase
    .from('kyc_documents')
    .insert({
      consumer_order_id: body.consumer_order_id,
      document_type: body.document_type,
      title: body.title,
      file_path: body.file_path,
      file_size: body.file_size,
      mime_type: body.mime_type,
      verification_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update order status to 'kyc_pending' if not already
  await supabase
    .from('consumer_orders')
    .update({ status: 'kyc_pending' })
    .eq('id', body.consumer_order_id)
    .eq('status', 'payment_received'); // Only update if still at payment_received

  return NextResponse.json({ document: data });
}
```

**Supabase Storage Bucket** (create via Dashboard):
- Bucket name: `kyc-documents`
- Public: `false` (private)
- RLS policies: Only allow authenticated users to access their own documents

**Acceptance Criteria**:
- [ ] Drag-and-drop file upload works
- [ ] File type validation (PDF, JPG, PNG only)
- [ ] File size validation (max 5MB)
- [ ] Document type selection (ID, proof of address, bank statement)
- [ ] Upload progress indicator
- [ ] File preview before upload
- [ ] Uploaded documents list displays
- [ ] Mobile responsive
- [ ] Error handling for failed uploads

---

### Task 2.2: Admin KYC Review Page (6 hours)

**File**: `/app/admin/orders/kyc-review/page.tsx` (new)

**Description**: Admin interface to view, approve, or reject uploaded KYC documents.

#### Implementation Details

**Page Structure**:

```tsx
// /app/admin/orders/kyc-review/page.tsx
import { KycReviewList } from '@/components/admin/kyc/KycReviewList';
import { KycDocumentViewer } from '@/components/admin/kyc/KycDocumentViewer';

export default async function KycReviewPage() {
  // Fetch all orders with kyc_pending status
  // Fetch KYC documents for each order

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h1>KYC Document Review</h1>
        <KycReviewList orders={ordersWithKyc} />
      </div>
      <div>
        <KycDocumentViewer />
      </div>
    </div>
  );
}
```

**Components**:

1. **KycReviewList**: List of orders requiring KYC review
   - Filter by status (pending, under_review, approved, rejected)
   - Sort by upload date
   - Click to view documents

2. **KycDocumentViewer**: View and approve/reject documents
   - Display document preview (PDF viewer or image)
   - Approve/reject buttons
   - Rejection reason textarea
   - Send notification to customer

**API Routes**:

```typescript
// /app/api/admin/kyc/[documentId]/approve/route.ts
export async function POST(request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const supabase = await createClient();

  // Update document status to 'approved'
  await supabase
    .from('kyc_documents')
    .update({ verification_status: 'approved', verified_at: new Date().toISOString() })
    .eq('id', documentId);

  // Check if all documents for order are approved
  // If yes, update order status to 'kyc_approved'

  return NextResponse.json({ success: true });
}

// /app/api/admin/kyc/[documentId]/reject/route.ts
export async function POST(request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const { reason } = await request.json();
  const supabase = await createClient();

  // Update document status to 'rejected'
  await supabase
    .from('kyc_documents')
    .update({
      verification_status: 'rejected',
      verification_notes: reason,
      verified_at: new Date().toISOString()
    })
    .eq('id', documentId);

  // Update order status to 'kyc_rejected'
  // Send email to customer with rejection reason

  return NextResponse.json({ success: true });
}
```

**Acceptance Criteria**:
- [ ] List of orders with pending KYC documents displays
- [ ] Click order to view uploaded documents
- [ ] PDF/image viewer displays documents clearly
- [ ] Approve button updates status to `approved`
- [ ] Reject button shows reason textarea
- [ ] Rejection reason saved to database
- [ ] Customer receives email on approval/rejection
- [ ] Order status updates automatically when all docs approved

---

## Day 5: Payment Validation & Error Handling

### Task 3.1: Payment Error Recovery (4 hours)

**File**: `/app/order/payment/page.tsx` (update)

**Description**: Improve payment error handling with clear messages and retry option.

#### Implementation Details

**Payment Error Scenarios**:

1. **Declined Card**
   - Error: Insufficient funds, card blocked, expired card
   - Message: "Your payment was declined. Please check your card details or try a different card."
   - Action: "Try Again" button (re-show payment form)

2. **Network Timeout**
   - Error: Netcash API timeout or network error
   - Message: "We couldn't complete your payment due to a connection issue. Please try again."
   - Action: "Retry Payment" button

3. **Invalid Payment Details**
   - Error: Invalid card number, CVV, expiry date
   - Message: "Please check your payment details and try again."
   - Action: Pre-fill form, highlight error fields

4. **Abandoned Payment**
   - User closes Netcash payment window without completing
   - Message: "Payment cancelled. Your order is saved. You can resume payment anytime."
   - Action: "Resume Payment" button

**Implementation**:

```tsx
// /app/order/payment/page.tsx (update)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { processPayment } from '@/lib/payments/netcash';

export default function PaymentPage() {
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  const handlePayment = async () => {
    try {
      setPaymentError(null);
      const result = await processPayment(orderData);

      if (result.success) {
        router.push('/order/confirmation');
      } else {
        // Handle payment errors
        handlePaymentError(result.error);
      }
    } catch (error) {
      handlePaymentError(error);
    }
  };

  const handlePaymentError = (error: any) => {
    setRetryCount(retryCount + 1);

    // Map error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'DECLINED': 'Your payment was declined. Please check your card details or try a different card.',
      'TIMEOUT': 'We couldn\'t complete your payment due to a connection issue. Please try again.',
      'INVALID_CARD': 'Please check your payment details and try again.',
      'CANCELLED': 'Payment cancelled. Your order is saved. You can resume payment anytime.',
    };

    const errorCode = error.code || 'UNKNOWN';
    setPaymentError(errorMessages[errorCode] || 'An error occurred. Please try again.');

    // Log error for debugging
    console.error('Payment error:', error);
  };

  const handleRetry = () => {
    setPaymentError(null);
    handlePayment();
  };

  return (
    <div>
      {paymentError && (
        <Alert variant="destructive">
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      {!paymentError ? (
        <Button onClick={handlePayment}>Complete Payment</Button>
      ) : (
        <div className="space-y-4">
          <Button onClick={handleRetry}>
            {retryCount > 2 ? 'Try Different Payment Method' : 'Retry Payment'}
          </Button>
          <Button variant="outline" onClick={() => router.push('/order/summary')}>
            Back to Order Summary
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Payment errors display user-friendly messages (not technical error codes)
- [ ] Retry button allows user to re-attempt payment without restarting flow
- [ ] Retry count tracked (suggest alternative payment method after 3 failures)
- [ ] Order data persists across retries (localStorage or database)
- [ ] Error logging for debugging (console.error or Sentry)
- [ ] Abandoned payment saves order with status `payment_pending`

---

### Task 3.2: Payment Testing Suite (4 hours)

**File**: `/docs/testing/payment-flow-tests.md` (new)

**Description**: Comprehensive test suite for Netcash payment integration.

#### Test Cases

**1. Successful Payment**
- Test card: Netcash test card number
- Expected: Order status → `payment_received`
- Expected: Redirect to `/order/confirmation`
- Expected: Payment record created in `payment_transactions` table

**2. Declined Payment**
- Test card: Netcash declined test card
- Expected: Error message displayed
- Expected: "Retry Payment" button visible
- Expected: Order status remains `payment_pending`

**3. Network Timeout**
- Simulate: Disconnect network during payment
- Expected: Timeout error message displayed
- Expected: Order saved with status `payment_pending`
- Expected: Retry button functional

**4. Invalid Payment Details**
- Test: Invalid CVV, expired card, invalid card number
- Expected: Form validation errors highlighted
- Expected: User can correct details and retry

**5. Abandoned Payment**
- Test: Close Netcash payment window before completing
- Expected: Redirect to order summary
- Expected: Message: "Payment cancelled. Resume anytime."
- Expected: Order saved with status `payment_pending`

**6. Webhook Processing**
- Test: Netcash webhook POST to `/api/webhooks/netcash`
- Expected: Webhook verifies signature
- Expected: Order status updated based on webhook data
- Expected: Duplicate webhook handled (idempotency)

**Testing Script**:

```typescript
// /scripts/test-payment-flow.ts
import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test('successful payment', async ({ page }) => {
    await page.goto('http://localhost:3000/order/payment');
    await page.fill('input[name="cardNumber"]', '4111111111111111');
    await page.fill('input[name="cvv"]', '123');
    await page.fill('input[name="expiry"]', '12/25');
    await page.click('button:has-text("Complete Payment")');
    await expect(page).toHaveURL(/\/order\/confirmation/);
  });

  test('declined payment shows retry', async ({ page }) => {
    await page.goto('http://localhost:3000/order/payment');
    await page.fill('input[name="cardNumber"]', '4000000000000002'); // Declined test card
    await page.click('button:has-text("Complete Payment")');
    await expect(page.locator('text=declined')).toBeVisible();
    await expect(page.locator('button:has-text("Retry Payment")')).toBeVisible();
  });

  // Add more test cases...
});
```

**Acceptance Criteria**:
- [ ] All 6 test cases documented
- [ ] Test script runs successfully with Playwright
- [ ] All test cases pass in Netcash test mode
- [ ] Payment webhook tested with sample payloads
- [ ] Error scenarios handled gracefully

---

## Phase 1 Completion Checklist

### Order Tracking (Task 1.1)
- [ ] `/app/orders/[orderId]/page.tsx` created
- [ ] Order status displays with color-coded badge
- [ ] Timeline component shows status history
- [ ] Conditional UI renders based on order status
- [ ] Mobile responsive (tested on 375px viewport)
- [ ] Handles invalid orderId (404 page)

### Service Activation Email (Task 1.2)
- [ ] Email template `service_activated` created
- [ ] Email sent within 1 minute of activation
- [ ] Email contains account number, credentials, support info
- [ ] Database trigger on `consumer_orders` created
- [ ] Email delivery logged
- [ ] Failed sends retry up to 3 times

### Sales Team Alerts (Task 1.3)
- [ ] `/lib/notifications/sales-alerts.ts` created
- [ ] Email sent to `sales@circletel.co.za` on lead capture
- [ ] SMS sent to sales team phone (if configured)
- [ ] Alert contains customer contact info and address
- [ ] Alert delivery within 30 seconds
- [ ] No alerts in development environment

### KYC Upload (Task 2.1)
- [ ] `/components/order/KycDocumentUpload.tsx` created
- [ ] Drag-and-drop upload works
- [ ] File type/size validation functional
- [ ] Files upload to Supabase Storage
- [ ] KYC record created in `kyc_documents` table
- [ ] Uploaded documents list displays

### KYC Review (Task 2.2)
- [ ] `/app/admin/orders/kyc-review/page.tsx` created
- [ ] Orders with pending KYC display
- [ ] Document viewer shows PDF/images
- [ ] Approve/reject buttons update status
- [ ] Rejection reason saved
- [ ] Customer receives email on approval/rejection

### Payment Validation (Task 3.1)
- [ ] Payment error messages user-friendly
- [ ] Retry button functional
- [ ] Order persists across retries
- [ ] Abandoned payment saves order
- [ ] Error logging implemented

### Payment Testing (Task 3.2)
- [ ] Test suite documented in `/docs/testing/payment-flow-tests.md`
- [ ] All 6 test cases pass
- [ ] Playwright test script runs successfully
- [ ] Webhook tested with sample payloads

---

## Next Steps

After completing Phase 1:

1. **Deploy to staging** - Test all features in staging environment
2. **Run E2E tests** - Full customer journey from coverage check to activation
3. **Fix any bugs** - Address issues found in testing
4. **Deploy to production** - Release Phase 1 features
5. **Begin Phase 2** - Start B2B journey implementation

See `PHASE_2_B2B_JOURNEY.md` for next steps.

---

**Last Updated**: 2025-10-21
**Duration**: 5 days
**Dependencies**: Database schema (complete)
**Blocks**: Production MVP deployment
