# MTN Business Deals Admin Guide

## Overview

The MTN Business Deals system provides a comprehensive platform for managing device + service bundle deals from MTN's Helios and iLula platforms. This guide covers all administrative features and workflows.

---

## Features

### 1. Browse & Search Deals (`/admin/products/mtn-deals`)

**URL**: https://www.circletel.co.za/admin/products/mtn-deals

**Capabilities**:
- View all 17,464+ MTN deals in grid layout
- Real-time search by device name, price plan, or deal ID
- Filter by contract term (12, 24, 36 months)
- Filter by platform (Helios, iLula, or both)
- View deal details: pricing, data bundles, contract terms
- Track promo expiry dates
- See availability status

**Dashboard Stats**:
- **Total Deals**: Count of all deals in database
- **Active Deals**: Currently available deals
- **Expiring Soon**: Deals expiring in next 30 days
- **Avg. Monthly Price**: Average monthly cost across all deals

---

### 2. Deal Recommendation Engine

**API Endpoint**: `POST /api/products/mtn-deals/recommend`

**Purpose**: Intelligently recommend deals based on customer profile

**Request Body**:
```json
{
  "budget": 1500,
  "preferredContractTerm": 24,
  "dataUsage": "high",
  "devicePreference": "Samsung",
  "limit": 5
}
```

**Response**:
```json
{
  "success": true,
  "recommendations": [
    {
      "deal": { /* full deal object */ },
      "score": 85,
      "reasons": [
        "Perfect budget match",
        "24-month contract as requested",
        "High data allocation for heavy users",
        "Matches your Samsung preference"
      ]
    }
  ]
}
```

**Scoring Algorithm**:
- **Budget Match** (0-25 points): How close to customer budget
- **Contract Term** (0-20 points): Matches preferred term
- **Data Usage** (0-20 points): Low/Medium/High data needs
- **Device Preference** (0-15 points): Brand preference match
- **Value for Money** (0-10 points): Cost per GB analysis
- **Urgency Bonus** (0-10 points): Promo ending soon

---

### 3. Automatic Expiry Handling

**Cron Job**: `/api/cron/expire-deals`

**Schedule**: Daily at 2:00 AM SAST

**Function**: Automatically sets `active = false` for deals past their `promo_end_date`

**Configuration** (in `vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/expire-deals",
    "schedule": "0 2 * * *"
  }]
}
```

**Manual Trigger** (for testing):
```bash
curl -X GET https://www.circletel.co.za/api/cron/expire-deals \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully expired 12 deals",
  "expired": 12,
  "deals": [
    {
      "deal_id": "H-SAMSUNG-A05-24M",
      "deal_name": "Samsung Galaxy A05 24-Month Deal",
      "promo_end_date": "2025-11-03"
    }
  ]
}
```

---

### 4. Integration with Quote Builder

**Coming Soon**: Ability to add MTN deals directly to business quotes

**Planned Workflow**:
1. Customer requests quote for device + connectivity
2. Agent opens quote builder
3. Agent clicks "Add MTN Deal"
4. System shows recommended deals based on customer profile
5. Agent selects deal
6. Quote automatically populated with:
   - Device details
   - Service package
   - Monthly pricing
   - Contract term
   - Data/minutes/SMS bundles

---

## API Reference

### Get All Deals

```
GET /api/products/mtn-deals
```

**Query Parameters**:
- `limit` (number): Results per page (default: 100)
- `offset` (number): Pagination offset (default: 0)
- `search` (string): Search query
- `contract_term` (number): Filter by contract term (12, 24, 36)
- `platform` (string): Filter by platform (helios, ilula)

**Response**:
```json
{
  "success": true,
  "deals": [ /* array of deals */ ],
  "total": 17464,
  "limit": 100,
  "offset": 0
}
```

---

### Get Stats

```
GET /api/products/mtn-deals/stats
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "total": 17464,
    "active": 15231,
    "expiringSoon": 342,
    "avgPrice": 899.50
  }
}
```

---

### Get Recommendations

```
POST /api/products/mtn-deals/recommend
```

**Request Body**:
```json
{
  "budget": 1500,
  "preferredContractTerm": 24,
  "dataUsage": "medium",
  "devicePreference": "iPhone",
  "limit": 5
}
```

**Data Usage Options**:
- `low`: Up to 10GB/month
- `medium`: 10-50GB/month
- `high`: 50GB+/month

---

## Database Schema

**Table**: `mtn_business_deals`

**Key Columns**:
- `deal_id`: Unique identifier (e.g., "H-SAMSUNG-A05-24M")
- `device_name`: Device model
- `price_plan`: Service package name
- `contract_term`: 1, 3, 6, 12, 18, 24, or 36 months
- `monthly_price_incl_vat`: Monthly subscription cost
- `device_payment_incl_vat`: Device installment cost
- `total_data`: Data allocation (e.g., "50GB")
- `available_helios`: Available on Helios platform
- `available_ilula`: Available on iLula platform
- `promo_end_date`: When deal expires
- `active`: Whether deal is currently active

**Indexes**:
- Primary: `deal_id`, `price_plan`, `device_name`, `contract_term`
- Full-text search on device name + price plan
- Composite: availability, promo dates, pricing

**RLS Policies**:
- Authenticated users: Read active deals
- Service role: Full access
- Admin users: Manage all deals

---

## Monthly Data Refresh

MTN updates deals monthly/quarterly. To refresh:

### 1. Get New Excel File
Request updated file from MTN (typically "Helios and iLula Business Promos - [Month] [Year] - Deals.xlsx")

### 2. Convert to JSON
```bash
python scripts/excel-to-json.py "path/to/new-file.xlsx"
```

### 3. Backup Current Deals (Optional)
```sql
CREATE TABLE mtn_business_deals_backup AS 
SELECT * FROM mtn_business_deals;
```

### 4. Clear Old Deals
```sql
TRUNCATE TABLE mtn_business_deals CASCADE;
```

### 5. Import New Deals
```bash
python scripts/import-mtn-deals.py
```

### 6. Verify Import
```bash
python scripts/import-mtn-deals.py --verify-only
```

### 7. Update Documentation
Update this guide with any new fields or changes

---

## Troubleshooting

### Deals Not Showing on Admin Page

**Check**:
1. Are deals imported? `SELECT COUNT(*) FROM mtn_business_deals;`
2. Are deals active? `SELECT COUNT(*) FROM mtn_business_deals WHERE active = true;`
3. Check browser console for API errors
4. Verify RLS policies allow current user to read

### Recommendations Not Working

**Check**:
1. Ensure customer profile is valid
2. Check that active deals exist matching criteria
3. Review console logs for scoring issues
4. Test with broader criteria

### Cron Job Not Running

**Check**:
1. Verify `vercel.json` has cron configuration
2. Check Vercel dashboard > Settings > Cron Jobs
3. Review Vercel logs for execution
4. Ensure `CRON_SECRET` environment variable is set

### Search Not Finding Deals

**Check**:
1. Full-text search index exists
2. Search terms match device/plan names
3. Try exact deal_id for precision

---

## Best Practices

### 1. Deal Selection
- Use recommendation engine for personalized suggestions
- Filter by contract term to match customer preference
- Check expiry dates before presenting to customer
- Verify platform availability (Helios vs iLula)

### 2. Pricing
- Always show total monthly cost (subscription + device payment)
- Calculate total contract value: `(monthly_price_incl_vat + device_payment_incl_vat) * contract_term`
- Highlight value-for-money deals (low cost per GB)

### 3. Data Management
- Run monthly refresh to keep deals current
- Archive expired deals instead of deleting
- Monitor "Expiring Soon" count weekly
- Set calendar reminder for MTN file updates

### 4. Customer Communication
- Explain contract terms clearly
- Show data allocation prominently
- Compare deals side-by-side
- Highlight promo urgency if expiring soon

---

## Future Enhancements

### Q1 2026
- [ ] Quote builder integration
- [ ] Deal comparison tool (side-by-side)
- [ ] Customer self-service deal browser
- [ ] Email alerts for new deals matching customer profiles

### Q2 2026
- [ ] Automated MTN API integration (if available)
- [ ] Price trend analysis
- [ ] Deal popularity tracking
- [ ] Commission calculator for partners

### Q3 2026
- [ ] AI-powered deal matching
- [ ] Customer preference learning
- [ ] Deal bundle builder (multiple services)
- [ ] Contract renewal suggestions

---

## Support

For questions or issues:
- **Technical**: Review docs or check Supabase logs
- **Data Issues**: Re-run import script
- **Feature Requests**: Create GitHub issue

---

**Last Updated**: 2025-11-04  
**Version**: 1.0  
**Author**: CircleTel Development Team
