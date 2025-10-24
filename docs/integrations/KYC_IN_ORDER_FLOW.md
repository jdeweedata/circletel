# KYC (Know Your Customer) in the CircleTel Order Flow

**Date:** 2025-10-22
**Purpose:** Document when and how KYC happens in the order lifecycle

---

## 📋 Quick Answer

**When does KYC happen?**
**AFTER payment is received** but BEFORE service activation.

```
Order Flow:
1. Select Package ✅
2. Fill Account Details ✅
3. Complete Payment ✅ ← Payment received
4. KYC Document Upload 📄 ← KYC happens here
5. KYC Verification (Admin) ✅
6. Credit Check (if applicable) 🔍
7. Schedule Installation 📅
8. Activate Service 🟢
```

---

## 🔄 Complete Order Status Lifecycle

Based on `lib/types/customer-journey.ts`, here's the complete order status flow:

### **Phase 1: Order Creation**
```
Status: pending → payment_pending
User Action: Fill out order form, select package
```

### **Phase 2: Payment** ⭐ **Netcash Integration Point**
```
Status: payment_pending → payment_received
User Action: Pay with credit card via Netcash
Webhook: Netcash → CircleTel → Update order status
```

### **Phase 3: KYC (Know Your Customer)** 📄 **KYC HAPPENS HERE**
```
Status: payment_received → kyc_pending
User Action: Upload KYC documents
          - ID Document (SA ID or Passport)
          - Proof of Address (Utility bill, bank statement)
          - Bank Statement (last 3 months)
          - Company Registration (for business accounts)

Admin Action: Review documents
Status Updates:
  → kyc_approved ✅ (Documents verified, proceed to next step)
  → kyc_rejected ❌ (Documents rejected, request re-upload)
```

### **Phase 4: Credit Check** (if applicable)
```
Status: kyc_approved → credit_check_pending
System Action: Run credit check (business accounts, high-value orders)
Status: credit_check_pending → credit_check_approved
```

### **Phase 5: Installation Scheduling**
```
Status: credit_check_approved → installation_scheduled
Admin Action: Schedule installation appointment
User Notification: Installation date confirmed
```

### **Phase 6: Installation**
```
Status: installation_scheduled → installation_in_progress
Technician Action: Install service at customer location
Status: installation_in_progress → installation_completed
```

### **Phase 7: Service Activation**
```
Status: installation_completed → active
Result: Service is live, billing starts
```

### **Phase 8: Operational Statuses**
```
active: Service running normally
suspended: Temporary suspension (e.g., non-payment)
on_hold: Admin hold (e.g., compliance issue)
cancelled: Order cancelled
completed: Service delivered and closed
```

---

## 📄 KYC Document Types

### **Required for All Personal Accounts:**
1. **ID Document** (`id_document`)
   - South African ID book/card
   - OR Valid passport

2. **Proof of Address** (`proof_of_address`)
   - Utility bill (electricity, water, rates)
   - Bank statement
   - Must be dated within last 3 months

### **Required for Business Accounts:**
3. **Company Registration** (`company_registration`)
   - CIPC registration certificate
   - Company letterhead

4. **Bank Statement** (`bank_statement`)
   - Business bank statement
   - Last 3 months

### **Optional Documents:**
5. **Tax Certificate** (`tax_certificate`)
6. **VAT Certificate** (`vat_certificate`)
7. **Director ID** (`director_id`) - For company directors
8. **Shareholder Agreement** (`shareholder_agreement`)
9. **Other** (`other`) - Additional supporting documents

---

## 🔧 KYC Technical Implementation

### **Component:**
`components/order/KycDocumentUpload.tsx`

**Features:**
- Drag-and-drop file upload
- File validation (PDF, JPG, PNG)
- Max file size: 5MB
- Image preview
- Multiple document upload
- Document type selection
- Upload progress indicator

**API Endpoint:**
```
POST /api/kyc/upload
```

**Request:**
```typescript
{
  file: File,              // Document file
  orderId: string,         // Order UUID
  documentType: KycDocumentType
}
```

**Response:**
```typescript
{
  documentId: string,
  url: string,             // Storage URL
  success: boolean
}
```

### **Storage:**
**Supabase Storage Bucket:** `kyc-documents`
- **Privacy:** Private (not publicly accessible)
- **Allowed Types:** PDF, JPG, JPEG, PNG
- **Max Size:** 5MB
- **Path Format:** `{orderId}/{documentType}_{timestamp}.{ext}`

### **Database Table:**
`kyc_documents` (created by migration `20251022000003_create_kyc_documents_table.sql`)

```sql
CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES consumer_orders(id),
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  verification_status TEXT DEFAULT 'pending',
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Verification Statuses:**
- `pending` - Uploaded, awaiting review
- `under_review` - Admin is reviewing
- `approved` - ✅ Document verified
- `rejected` - ❌ Document rejected (reason provided)
- `expired` - Document has expired
- `requires_update` - Needs to be updated/replaced

---

## 🎯 When KYC is Triggered

### **Trigger Point:**
After successful Netcash webhook confirmation updates order status to `payment_received`.

### **User Journey:**
```
1. User completes payment
   └→ Netcash processes payment
       └→ Webhook sent to CircleTel
           └→ Order status: payment_pending → payment_received
               └→ Email sent to user with KYC upload link
                   └→ User navigates to KYC upload page
                       └→ User uploads documents
                           └→ Order status: payment_received → kyc_pending
                               └→ Admin receives notification
                                   └→ Admin reviews documents
                                       ├→ Approved: kyc_pending → kyc_approved
                                       └→ Rejected: kyc_pending → kyc_rejected
```

### **Email Notification:**
**Subject:** "CircleTel Order #{orderNumber} - Payment Received - Upload KYC Documents"

**Content:**
```
Hi {customerName},

Thank you for your payment! Your order #{orderNumber} has been confirmed.

Next Step: Upload KYC Documents

To proceed with your order, please upload the following documents:

For Personal Accounts:
✓ ID Document (SA ID or Passport)
✓ Proof of Address (Utility bill or bank statement, last 3 months)

For Business Accounts:
✓ Company Registration Certificate
✓ Bank Statement (last 3 months)

Upload your documents here:
{kycUploadLink}

Once we verify your documents, we'll schedule your installation.

Order Details:
Package: {packageName}
Amount Paid: R{amount}
Installation Address: {address}

Questions? Contact us at support@circletel.co.za

Best regards,
CircleTel Team
```

---

## 🔐 Security & Compliance

### **Data Protection:**
- All KYC documents stored in **private Supabase Storage bucket**
- Row Level Security (RLS) policies enforce access control
- Only admin users can view/verify documents
- Customer can only view their own uploaded documents

### **POPIA Compliance:**
- Documents stored securely in South African data center
- Access logs maintained for audit trail
- Document retention policy: 7 years (financial regulations)
- Customer has right to request document deletion after service termination

### **FICA Requirements:**
CircleTel KYC process complies with **FICA (Financial Intelligence Centre Act)** requirements for telecommunications services:

1. ✅ Identity verification (ID/Passport)
2. ✅ Residential address verification (Proof of address)
3. ✅ Business verification (Company registration)
4. ✅ Document retention (7 years minimum)

---

## 📱 User Experience Flow

### **Confirmation Page (After Payment):**
```
✅ Payment Successful!

Your order has been confirmed.

Order Number: #CT-2025-12345
Amount Paid: R379.00
Package: HomeFibre Basic (20/10 Mbps)

Next Steps:
1. 📄 Upload KYC Documents (Required)
2. 🔍 Document Verification (1-2 business days)
3. 📅 Schedule Installation
4. 🟢 Service Activation

[Upload Documents Now] ← Button to KYC page
```

### **KYC Upload Page:**
```
Upload Your Documents

To activate your service, we need to verify your identity.

Step 1: Select Document Type
[ ] ID Document
[ ] Proof of Address
[ ] Bank Statement
[ ] Company Registration

Step 2: Upload File
[Drag & drop your file here or click to browse]
Max size: 5MB | Formats: PDF, JPG, PNG

[Upload Document]

Already Uploaded:
✅ ID Document - id_scan.pdf (1.2 MB) - Pending Review
```

### **Admin KYC Verification Dashboard:**
```
/admin/kyc

KYC Documents Pending Review (23)

Order #CT-2025-12345 - John Doe
└─ ID Document: id_scan.pdf (1.2 MB) [View] [Approve] [Reject]
└─ Proof of Address: utility_bill.pdf (0.8 MB) [View] [Approve] [Reject]

Actions:
[✅ Approve All] [❌ Reject] [💬 Request More Info]

If rejecting, provide reason:
[ ] Document unclear/blurry
[ ] Document expired
[ ] Name mismatch
[ ] Address mismatch
[ ] Other: ___________________
```

---

## 🚀 Integration with Order Flow

### **Current Order Flow (Pre-KYC):**
```
1. Homepage → Coverage Check
2. Package Selection → Sidebar Confirmation
3. Account Form → Installation Details
4. Payment Page → Netcash Payment
5. Confirmation Page ← WE ARE HERE AFTER NETCASH WEBHOOK
```

### **Complete Order Flow (With KYC):**
```
1. Homepage → Coverage Check
2. Package Selection → Sidebar Confirmation
3. Account Form → Installation Details
4. Payment Page → Netcash Payment
5. ⭐ Confirmation Page (with KYC upload link)
6. 📄 KYC Upload Page ← NEW
7. ⏳ Admin KYC Verification ← NEW
8. ✅ KYC Approved → Schedule Installation
9. 📅 Installation Scheduled
10. 🔧 Installation In Progress
11. 🟢 Service Activated
```

---

## 🧪 Testing KYC Flow

### **Test Scenario:**

```
Prerequisites:
✅ Completed package selection
✅ Filled account details
✅ Netcash payment successful
✅ Webhook received (order status: payment_received)

Step 1: User receives email with KYC upload link
Step 2: User navigates to /kyc/upload/{orderId}
Step 3: User selects document type: "ID Document"
Step 4: User uploads test_id.pdf
Step 5: Verify file uploaded to Supabase Storage
Step 6: Verify kyc_documents table has record
Step 7: Admin navigates to /admin/kyc
Step 8: Admin sees pending document
Step 9: Admin clicks "View" → Document opens
Step 10: Admin clicks "Approve"
Step 11: Verify order status updates: kyc_pending → kyc_approved
Step 12: User receives email: "KYC Approved - Installation Scheduling"
```

### **Test Documents:**
Use these test files in staging:
- `test_id_document.pdf` - Valid SA ID card scan
- `test_proof_of_address.pdf` - Utility bill dated within 3 months
- `test_bank_statement.pdf` - Bank statement with visible name/address

---

## 📊 KYC Metrics & Monitoring

### **Key Metrics:**
- **KYC Approval Rate:** % of documents approved on first submission
- **Average Review Time:** Time from upload to admin decision
- **Rejection Reasons:** Most common reasons for rejection
- **Upload Completion Rate:** % of users who upload after payment

### **Admin Dashboard:**
```
/admin/kyc

KYC Overview:
Pending Review: 23
Under Review: 5
Approved Today: 47
Rejected Today: 3

Average Review Time: 1.2 hours
Approval Rate: 94%

Top Rejection Reasons:
1. Document unclear (45%)
2. Document expired (28%)
3. Address mismatch (18%)
4. Name mismatch (9%)
```

---

## ❓ FAQ: KYC in Order Flow

### **Q: Why does KYC happen after payment?**
**A:** We need payment confirmation before requesting sensitive identity documents. This ensures the customer is committed to the purchase and reduces fraud.

### **Q: What if user doesn't upload documents?**
**A:** Order remains in `payment_received` status. Automated reminders sent after 24 hours, 48 hours, and 7 days. After 30 days, order may be cancelled with refund.

### **Q: Can user activate service without KYC?**
**A:** No. FICA regulations require identity verification before service activation. Order cannot progress past `kyc_pending` without approved documents.

### **Q: What happens if KYC is rejected?**
**A:** User receives email with rejection reason and can re-upload corrected documents. Order status remains `kyc_rejected` until valid documents are provided.

### **Q: How long does KYC verification take?**
**A:** Target: 1-2 business days. Most documents reviewed within 24 hours during business hours.

### **Q: Is KYC required for all customers?**
**A:** Yes, both personal and business customers. Document requirements differ (see "KYC Document Types" section).

---

## 🔗 Related Documentation

- **Complete Order Flow:** `docs/integrations/COMPLETE_ORDER_FLOW_ANALYSIS.md`
- **Payment Integration:** `docs/integrations/NETCASH_MIGRATION_CHECKLIST.md`
- **Database Schema:** `supabase/migrations/20251022000003_create_kyc_documents_table.sql`
- **Component Docs:** `components/order/KycDocumentUpload.tsx`
- **Admin Guide:** `docs/admin/KYC_VERIFICATION_GUIDE.md` (TODO)

---

**Document Created:** 2025-10-22
**Purpose:** Complete KYC documentation for order flow
**Status:** ✅ Comprehensive KYC analysis complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)
