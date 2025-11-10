# CircleTel Quote API - Quick Reference

**Fast access to all admin quote API endpoints with curl examples**

---

## Setup Variables

```bash
export BASE_URL="http://localhost:3000"
export PACKAGE_ID="your-package-uuid-here"
export QUOTE_ID="your-quote-uuid-here"
```

---

## 1️⃣ List Quotes (Basic)

```bash
# List all quotes
curl "$BASE_URL/api/quotes"

# Filter by status
curl "$BASE_URL/api/quotes?status=draft"

# Search
curl "$BASE_URL/api/quotes?search=test"

# Filter by agent
curl "$BASE_URL/api/quotes?agent_id=AGENT_UUID"
```

**Response**: `{ success: true, quotes: [...] }`

---

## 2️⃣ List Quotes (Advanced)

```bash
# Paginated list
curl "$BASE_URL/api/quotes/business/list?limit=20&offset=0"

# Sort by price (descending)
curl "$BASE_URL/api/quotes/business/list?sort_by=total_monthly&sort_order=desc"

# Multiple filters
curl "$BASE_URL/api/quotes/business/list?status=approved&customer_type=smme&limit=10"

# Search with pagination
curl "$BASE_URL/api/quotes/business/list?search=company&limit=50"
```

**Response**:
```json
{
  "success": true,
  "quotes": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

## 3️⃣ Create Quote

### SMME Quote (24-month)
```bash
curl -X POST "$BASE_URL/api/quotes/business/create" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_type": "smme",
    "company_name": "Test Company Ltd",
    "registration_number": "2024/123456/07",
    "vat_number": "4123456789",
    "contact_name": "John Doe",
    "contact_email": "john@testcompany.co.za",
    "contact_phone": "+27821234567",
    "service_address": "123 Test Street, Cape Town, 8001",
    "contract_term": 24,
    "items": [
      {
        "package_id": "'$PACKAGE_ID'",
        "item_type": "primary",
        "quantity": 1
      }
    ]
  }'
```

### Enterprise Quote (36-month, multi-service)
```bash
curl -X POST "$BASE_URL/api/quotes/business/create" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_type": "enterprise",
    "company_name": "Big Corporation (Pty) Ltd",
    "registration_number": "2020/987654/07",
    "vat_number": "4987654321",
    "contact_name": "Jane Smith",
    "contact_email": "jane.smith@bigcorp.co.za",
    "contact_phone": "+27217654321",
    "service_address": "456 Corporate Drive, Johannesburg, 2000",
    "contract_term": 36,
    "items": [
      {
        "package_id": "'$PACKAGE_ID'",
        "item_type": "primary",
        "quantity": 1,
        "notes": "Primary connection"
      },
      {
        "package_id": "'$PACKAGE_ID'",
        "item_type": "secondary",
        "quantity": 1,
        "notes": "Backup connection"
      }
    ],
    "customer_notes": "Requires 99.9% SLA"
  }'
```

**Response**: `{ success: true, quote: {...}, message: "Quote created successfully" }`

---

## 4️⃣ Get Quote Details

```bash
# Get full quote with items
curl "$BASE_URL/api/quotes/business/$QUOTE_ID"

# Pretty print JSON
curl "$BASE_URL/api/quotes/business/$QUOTE_ID" | jq '.'

# Extract quote number only
curl -s "$BASE_URL/api/quotes/business/$QUOTE_ID" | jq -r '.quote.quote_number'
```

**Response**:
```json
{
  "success": true,
  "quote": {
    "id": "uuid",
    "quote_number": "BQ-2025-001",
    "status": "draft",
    "company_name": "Test Company Ltd",
    "total_monthly": 899.00,
    "items": [...]
  }
}
```

---

## 5️⃣ Update Quote

```bash
# Update company details
curl -X PUT "$BASE_URL/api/quotes/business/$QUOTE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Updated Company Name Ltd",
    "contact_phone": "+27821111111"
  }'

# Update with items
curl -X PUT "$BASE_URL/api/quotes/business/$QUOTE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Updated Name",
    "notes": "Updated via API",
    "items": [
      {
        "id": "item-uuid",
        "quantity": 2,
        "monthly_price": 1299.00
      }
    ]
  }'
```

**Response**: `{ success: true, message: "Quote updated successfully", quote: {...} }`

---

## 6️⃣ Approve Quote

```bash
# Approve quote (changes status to 'approved')
curl -X POST "$BASE_URL/api/quotes/business/$QUOTE_ID/approve"

# Approve and check new status
curl -X POST "$BASE_URL/api/quotes/business/$QUOTE_ID/approve" && \
  curl -s "$BASE_URL/api/quotes/business/$QUOTE_ID" | jq '.quote.status'
```

**Response**: `{ success: true, quote: {...}, message: "Quote approved successfully" }`

**Status Transition**: `draft` → `approved`

---

## 7️⃣ Reject Quote

```bash
# Reject with reason
curl -X POST "$BASE_URL/api/quotes/business/$QUOTE_ID/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "rejection_reason": "Pricing too high - customer requested 20% discount"
  }'

# Reject without reason
curl -X POST "$BASE_URL/api/quotes/business/$QUOTE_ID/reject" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response**: `{ success: true, quote: {...}, message: "Quote rejected successfully" }`

**Status Transition**: Any → `rejected`

---

## 8️⃣ Get Pending Quotes

```bash
# Get all pending approval quotes
curl "$BASE_URL/api/quotes/business/admin/pending"

# Get first 5 pending
curl "$BASE_URL/api/quotes/business/admin/pending?limit=5&offset=0"

# Get specific status
curl "$BASE_URL/api/quotes/business/admin/pending?status=pending_approval&limit=20"
```

**Response**:
```json
{
  "success": true,
  "quotes": [
    {
      "id": "uuid",
      "quote_number": "BQ-2025-001",
      "status": "pending_approval",
      "item_count": 2,
      ...
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

---

## 9️⃣ Get Analytics

```bash
# All-time analytics
curl "$BASE_URL/api/quotes/business/admin/analytics"

# This year only
curl "$BASE_URL/api/quotes/business/admin/analytics?start_date=2025-01-01&end_date=2025-12-31"

# Current month
curl "$BASE_URL/api/quotes/business/admin/analytics?start_date=2025-11-01&end_date=2025-11-30"

# Pretty print analytics
curl -s "$BASE_URL/api/quotes/business/admin/analytics" | jq '{
  total: .analytics.total_quotes,
  accepted: .analytics.accepted_quotes,
  conversion_rate: .analytics.conversion_rate,
  avg_value: .analytics.average_quote_value
}'
```

**Response**:
```json
{
  "success": true,
  "analytics": {
    "total_quotes": 150,
    "quotes_by_status": {
      "draft": 20,
      "approved": 45,
      "sent": 30,
      "accepted": 40,
      "rejected": 10,
      "expired": 5
    },
    "accepted_quotes": 40,
    "total_accepted_value": 51999.60,
    "average_quote_value": 1299.99,
    "conversion_rate": 53.33,
    "average_time_to_sign_days": 7.5
  }
}
```

---

## 🔟 Delete Quote

```bash
# Delete draft quote
curl -X DELETE "$BASE_URL/api/quotes/business/$QUOTE_ID"

# Delete and verify
curl -X DELETE "$BASE_URL/api/quotes/business/$QUOTE_ID" && \
  curl "$BASE_URL/api/quotes/business/$QUOTE_ID"
# Should return 404
```

**Response**: `{ success: true, message: "Quote deleted successfully" }`

**Note**: Only `draft`, `rejected`, or `expired` quotes can be deleted.

---

## Workflow Examples

### Complete Quote Lifecycle

```bash
#!/bin/bash
BASE_URL="http://localhost:3000"
PACKAGE_ID="your-package-id"

# 1. Create quote
echo "Creating quote..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/quotes/business/create" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_type": "smme",
    "company_name": "Workflow Test Co",
    "contact_name": "Test User",
    "contact_email": "test@workflow.co.za",
    "contact_phone": "+27821234567",
    "service_address": "123 Workflow St",
    "contract_term": 24,
    "items": [{"package_id": "'$PACKAGE_ID'", "item_type": "primary", "quantity": 1}]
  }')

QUOTE_ID=$(echo $RESPONSE | jq -r '.quote.id')
QUOTE_NUMBER=$(echo $RESPONSE | jq -r '.quote.quote_number')
echo "✅ Created: $QUOTE_NUMBER ($QUOTE_ID)"

# 2. Update quote
echo "Updating quote..."
curl -s -X PUT "$BASE_URL/api/quotes/business/$QUOTE_ID" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Updated via workflow"}' > /dev/null
echo "✅ Updated"

# 3. Approve quote
echo "Approving quote..."
curl -s -X POST "$BASE_URL/api/quotes/business/$QUOTE_ID/approve" > /dev/null
echo "✅ Approved"

# 4. Get final status
echo "Final status:"
curl -s "$BASE_URL/api/quotes/business/$QUOTE_ID" | jq '{
  quote_number: .quote.quote_number,
  status: .quote.status,
  total_monthly: .quote.total_monthly,
  approved_at: .quote.approved_at
}'
```

### Batch Approve Pending Quotes

```bash
#!/bin/bash
BASE_URL="http://localhost:3000"

# Get all pending quotes
PENDING=$(curl -s "$BASE_URL/api/quotes/business/admin/pending?limit=100")

# Extract quote IDs
QUOTE_IDS=$(echo $PENDING | jq -r '.quotes[].id')

# Approve each
for ID in $QUOTE_IDS; do
  echo "Approving $ID..."
  curl -s -X POST "$BASE_URL/api/quotes/business/$ID/approve" > /dev/null
  echo "✅ Approved"
done

echo "✅ All pending quotes approved"
```

### Generate Weekly Report

```bash
#!/bin/bash
BASE_URL="http://localhost:3000"

# Get this week's analytics
START_DATE=$(date -d "monday" +%Y-%m-%d)
END_DATE=$(date -d "sunday" +%Y-%m-%d)

echo "Weekly Quote Report ($START_DATE to $END_DATE)"
echo "================================================"

curl -s "$BASE_URL/api/quotes/business/admin/analytics?start_date=$START_DATE&end_date=$END_DATE" | jq -r '
  .analytics |
  "Total Quotes: \(.total_quotes)\n" +
  "Accepted: \(.accepted_quotes)\n" +
  "Conversion Rate: \(.conversion_rate)%\n" +
  "Total Value: R\(.total_accepted_value)\n" +
  "Average Value: R\(.average_quote_value)"
'
```

---

## Common Error Codes

| Status | Error | Meaning | Solution |
|--------|-------|---------|----------|
| 400 | Bad Request | Invalid input data | Check request body schema |
| 401 | Unauthorized | No/invalid auth token | Login and get valid token |
| 403 | Forbidden | Insufficient permissions | Check RBAC permissions |
| 404 | Not Found | Quote doesn't exist | Verify quote ID is correct |
| 500 | Internal Server Error | Server/database error | Check logs, contact support |

---

## Query Filters Reference

### Status Values
- `draft` - Initial creation
- `pending_approval` - Submitted for review
- `approved` - Admin approved
- `sent` - Sent to customer
- `viewed` - Customer viewed
- `accepted` - Customer accepted & signed
- `rejected` - Rejected
- `expired` - Past validity date

### Customer Types
- `smme` - Small/Medium Enterprise
- `enterprise` - Large Enterprise

### Contract Terms
- `12` - 12 months
- `24` - 24 months
- `36` - 36 months

### Item Types
- `primary` - Main service line
- `secondary` - Backup/redundancy
- `additional` - Additional services

---

## Performance Tips

### Pagination
```bash
# Good: Request small pages
curl "$BASE_URL/api/quotes/business/list?limit=20&offset=0"

# Bad: Request too many at once
curl "$BASE_URL/api/quotes/business/list?limit=1000"  # Slow!
```

### Filtering
```bash
# Good: Filter at database level
curl "$BASE_URL/api/quotes/business/list?status=approved&customer_type=smme"

# Bad: Filter client-side after fetching all
curl "$BASE_URL/api/quotes/business/list?limit=1000" | jq '.quotes[] | select(.status=="approved")'
```

### Sorting
```bash
# Good: Sort on server
curl "$BASE_URL/api/quotes/business/list?sort_by=total_monthly&sort_order=desc"

# Bad: Sort client-side
curl "$BASE_URL/api/quotes/business/list" | jq '.quotes | sort_by(.total_monthly) | reverse'
```

---

## Useful One-Liners

```bash
# Count quotes by status
curl -s "$BASE_URL/api/quotes/business/admin/analytics" | \
  jq '.analytics.quotes_by_status'

# Get highest value quote
curl -s "$BASE_URL/api/quotes/business/list?sort_by=total_monthly&sort_order=desc&limit=1" | \
  jq '.quotes[0] | {number: .quote_number, value: .total_monthly}'

# List companies with pending quotes
curl -s "$BASE_URL/api/quotes/business/admin/pending?limit=100" | \
  jq -r '.quotes[].company_name' | sort | uniq

# Calculate total pipeline value
curl -s "$BASE_URL/api/quotes/business/list?status=sent&limit=1000" | \
  jq '[.quotes[].total_monthly] | add'

# Find quotes expiring soon (next 7 days)
END_DATE=$(date -d "+7 days" +%Y-%m-%d)
curl -s "$BASE_URL/api/quotes/business/list?limit=100" | \
  jq --arg end "$END_DATE" '.quotes[] | select(.valid_until <= $end)'
```

---

## Testing Checklist

- [ ] Server running: `curl $BASE_URL/api/health`
- [ ] List quotes: `curl $BASE_URL/api/quotes`
- [ ] Create quote: See "Create Quote" examples above
- [ ] Get quote: `curl $BASE_URL/api/quotes/business/$QUOTE_ID`
- [ ] Update quote: See "Update Quote" examples above
- [ ] Approve quote: `curl -X POST $BASE_URL/api/quotes/business/$QUOTE_ID/approve`
- [ ] Reject quote: `curl -X POST $BASE_URL/api/quotes/business/$QUOTE_ID/reject`
- [ ] Get analytics: `curl $BASE_URL/api/quotes/business/admin/analytics`
- [ ] Delete quote: `curl -X DELETE $BASE_URL/api/quotes/business/$QUOTE_ID`

---

## Help & Support

**Need help?**
- Full documentation: `docs/testing/ADMIN_QUOTE_API_TEST_REPORT.md`
- Test script: `scripts/test-admin-quote-apis.js`
- HTTP tests: `test-admin-quote-apis.http`
- Database schema: `supabase/migrations/20251028000001_create_business_quotes_schema.sql`

**Found a bug?**
1. Check error response: `curl ... | jq '.'`
2. Check server logs: `npm run dev:memory`
3. Verify data: Query Supabase directly
4. Create issue with curl command that reproduces bug

---

**Last Updated**: 2025-11-10
**Version**: 1.0
