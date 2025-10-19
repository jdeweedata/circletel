# Product Approval Workflow - Complete Guide

## Overview

Complete end-to-end system for importing products from Excel files, reviewing them in an admin panel, and publishing them to your CircleTel platform with notifications and reminders.

## Features

- ✅ **Excel Import**: Parse product data from Excel workbooks
- ✅ **Approval Queue**: Review products before adding to catalog
- ✅ **Notifications**: Real-time in-app notifications for product managers
- ✅ **Reminders**: Deadline reminders for pending approvals
- ✅ **Activity Log**: Complete audit trail of all actions
- ✅ **RBAC Integration**: Permission-based access control

---

## System Architecture

### Database Tables

1. **product_imports** - Stores import batches
2. **product_approval_queue** - Products pending review
3. **notifications** - In-app notifications for users
4. **reminders** - Task reminders with deadlines
5. **product_approval_activity_log** - Audit trail

### Workflow Steps

```
1. Upload Excel → 2. Parse Products → 3. Create Import Record
                                              ↓
5. View on Frontend ← 4. Review & Approve ← Notification Sent
```

---

## Setup Instructions

### Step 1: Apply Database Migration

**Method 1: Supabase Dashboard (Recommended)**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of:
   ```
   supabase/migrations/20251019000002_create_product_approval_system.sql
   ```
5. Paste into SQL Editor and click **Run**
6. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN (
     'product_imports',
     'product_approval_queue',
     'notifications',
     'reminders',
     'product_approval_activity_log'
   );
   ```

### Step 2: Verify Installation

Run the test script:

```bash
node scripts/test-product-import-workflow.js
```

Expected output:
```
✅ Passed:   11
❌ Failed:   0
⚠️  Warnings: 1
```

### Step 3: Import Products

Import products from Excel:

```bash
node scripts/import-product-excel.js "docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/DFA Business Internet Access Service with ENNI-GNNI Infrastructure.xlsx"
```

This will:
- Parse all products from the Excel file
- Create an import record
- Add products to approval queue
- Send notifications to Product Managers

---

## Usage Guide

### For Product Managers

#### 1. View Pending Approvals

Navigate to: `/admin/products/approvals`

You'll see:
- **Pending tab**: Products waiting for review
- **Approved tab**: Products already approved
- **Rejected tab**: Products that were rejected

#### 2. Review Product Details

Each product card shows:
- Product name and speed
- Pricing (regular, promo, installation)
- Router information
- Cost breakdown (DFA wholesale, infrastructure, markup)
- First month total

#### 3. Approve a Product

1. Click the **Approve** button
2. Product is added to `service_packages` table
3. Notification sent to importer
4. Product becomes available on frontend

#### 4. Reject a Product

1. Click the **Reject** button
2. Enter rejection reason
3. Notification sent to importer with reason

### For Developers

#### Importing Products Programmatically

```javascript
const { importProductExcel } = require('./scripts/import-product-excel');

await importProductExcel(
  'path/to/excel-file.xlsx',
  userId // Optional: current user ID
);
```

#### Fetching Approvals via API

```bash
# Get pending approvals
GET /api/admin/product-approvals?status=pending

# Approve a product
POST /api/admin/product-approvals/{id}/approve
{
  "approval_notes": "Looks good!",
  "map_to_existing_package": "optional-package-id"
}

# Reject a product
POST /api/admin/product-approvals/{id}/reject
{
  "rejection_reason": "Pricing needs review"
}
```

#### Notifications API

```bash
# Get user notifications
GET /api/admin/notifications?unread_only=true

# Mark as read
POST /api/admin/notifications/{id}/read
```

---

## Excel File Format

### Required Sheet Structure

**Sheet Name**: Any (e.g., "BizFibre Connect")

**Required Columns** (Row 7):
- Package
- Speed
- Regular Price
- Promo Price
- Router
- Installation Fee
- Total First Month

### Example Excel Data

| Package | Speed | Regular Price | Promo Price | Router | Installation Fee | Total First Month |
|---------|-------|---------------|-------------|--------|------------------|-------------------|
| BizFibre Connect Lite | 10/10 Mbps | R 1,699.00 | R - | Reyee RG-EW1300G (included) | R 2,500.00 | R4,199.00 |
| BizFibre Connect Starter | 25/25 Mbps | R 1,899.00 | R - | Reyee RG-EG105G* | R 3,000.00 | R4,899.00 |

### Price Format

- Accepts: `R 1,699.00`, `R 1699`, `1699`, `R -`
- Parser removes: `R`, spaces, commas
- `R -` or `-` = 0 (no price)

---

## Notification Bell (Admin Header)

### Adding to Admin Layout

Edit `/app/admin/layout.tsx`:

```tsx
import { NotificationBell } from '@/components/admin/NotificationBell';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <header>
        {/* Other header items */}
        <NotificationBell />
      </header>
      {children}
    </div>
  );
}
```

### Features

- Real-time unread count badge
- Auto-refresh every 30 seconds
- Click notification to mark as read + navigate
- Dropdown shows latest 10 notifications

---

## Reminders System

### Creating Reminders

```bash
POST /api/admin/reminders
{
  "title": "Review product approvals",
  "description": "5 products pending approval",
  "due_date": "2025-10-26T10:00:00Z",
  "reminder_type": "one_time",
  "related_entity_type": "product_approval",
  "related_entity_id": "approval-id"
}
```

### Automatic Reminders

The system automatically creates reminders:
- 1 day before approval deadline
- For assigned product approvals
- Sends in-app notification when due

---

## Frontend Display (Approved Products)

### Option 1: Fetch from service_packages

```tsx
// app/products/page.tsx
const { data: products } = await supabase
  .from('service_packages')
  .select('*')
  .eq('category', 'BizFibre Connect')
  .eq('is_active', true)
  .order('price', { ascending: true });
```

### Option 2: Use Existing Coverage System

Approved products automatically integrate with the coverage checker:
- Products added to `service_packages` table
- Coverage system filters by category
- Package recommendations include new products

---

## Troubleshooting

### Tables Not Found

**Error**: `Could not find the table 'public.product_imports'`

**Fix**: Apply the migration SQL via Supabase Dashboard

### Notifications Not Created

**Error**: No notifications after import

**Cause**: No users with Product Manager role exist

**Fix**: Create admin users with appropriate roles:
```sql
INSERT INTO admin_users (email, role_template_id)
VALUES (
  'manager@circletel.co.za',
  (SELECT id FROM role_templates WHERE name = 'Product Manager')
);
```

### Excel Parsing Errors

**Error**: `Could not find product pricing header`

**Cause**: Excel file structure doesn't match expected format

**Fix**: Ensure row 7 has columns: Package, Speed, Regular Price, etc.

---

## File Locations

| Component | Path |
|-----------|------|
| Migration SQL | `supabase/migrations/20251019000002_create_product_approval_system.sql` |
| Import Script | `scripts/import-product-excel.js` |
| Test Script | `scripts/test-product-import-workflow.js` |
| Parser | `lib/product-import/excel-parser.ts` |
| Types | `lib/types/product-approval.ts` |
| Approvals API | `app/api/admin/product-approvals/` |
| Notifications API | `app/api/admin/notifications/` |
| Admin UI | `app/admin/products/approvals/page.tsx` |
| Notification Bell | `components/admin/NotificationBell.tsx` |

---

## Next Steps

1. **Apply Migration**: Run SQL in Supabase Dashboard
2. **Test Import**: Import BizFibre Connect products
3. **Add Notification Bell**: Update admin header
4. **Review Products**: Navigate to `/admin/products/approvals`
5. **Approve Products**: Test approval workflow
6. **Check Frontend**: Verify products appear on website

---

## Support

For issues or questions:
- Check test results: `node scripts/test-product-import-workflow.js`
- Review logs: Supabase Dashboard → Logs
- Verify permissions: Check user's role_template_id

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**Status**: ✅ Ready for Production
