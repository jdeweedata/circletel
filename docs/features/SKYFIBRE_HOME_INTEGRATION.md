# SkyFibre Home Products Integration

**Date**: 2025-10-26
**Status**: ✅ Complete
**Products**: 3 Residential Wireless Packages

## Overview

Successfully integrated 3 SkyFibre Home residential products into the CircleTel platform with proper MTN FWA (Fixed Wireless Access) mapping and licensed wireless P2P microwave handling.

## Products Added

| Product | Speed | Price | Target Market |
|---------|-------|-------|---------------|
| **SkyFibre Home Plus** | 50 Mbps symmetrical | R999/month | Average families (2-4 people) |
| **SkyFibre Home Max** | 100 Mbps symmetrical | R1,499/month | Power users (4-6 people) |
| **SkyFibre Home Ultra** | 200 Mbps symmetrical | R1,999/month | Premium homes (6+ people) |

## Technical Configuration

### Database Schema

```sql
service_type: 'SkyFibre'
product_category: 'wireless'
customer_type: 'consumer'
active: true
```

### Key Metadata Stored

All products include comprehensive metadata in `provider_specific_config`:

- **Technology**: MTN Tarana G1
- **Frequency**: Licensed spectrum
- **Installation Options**:
  - Self-install: R875
  - Professional install: R2000 (included in Ultra)
- **SLA**: 99.5% - 99.9% uptime
- **Equipment**: Tarana G1 BN CPE + Reyee WiFi 5/6 router
- **Margins**: 37.9% - 58.9% gross margin
- **MSC Commitments**: Month-by-month revenue targets

## MTN Coverage Integration

### Service Type Mapping

| MTN API Response | Product Mapping | Frontend Display |
|------------------|-----------------|------------------|
| `uncapped_wireless` | → SkyFibre products | **WIRELESS Tab** |
| `licensed_wireless` | → Lead capture form | **Quote Request Form** |

### Coverage Flow

```
User enters address
    ↓
MTN Feasibility Engine checks coverage
    ↓
┌─────────────────────────────────────────┐
│ Returns: uncapped_wireless              │
│ → Show SkyFibre Home products           │
│ → Display in WIRELESS tab                │
│ → User can select and purchase           │
└─────────────────────────────────────────┘

OR

┌─────────────────────────────────────────┐
│ Returns: licensed_wireless (P2P)        │
│ → Show lead capture form                │
│ → Business customers only                │
│ → Requires site survey                   │
│ → Custom quote provided                  │
└─────────────────────────────────────────┘
```

## Licensed Wireless (P2P Microwave)

### Business Rules

- **Service Type**: Point-to-Point licensed microwave
- **Customer Type**: Business only (SMME/Enterprise)
- **Pricing**: Quote-based, not standardized
- **Requirements**:
  - Site survey mandatory
  - Feasibility assessment (3-5 days)
  - Custom installation plan
  - Variable pricing based on bandwidth/distance

### Lead Capture Flow

1. User checks address coverage
2. MTN API returns `licensed_wireless`
3. System shows `LicensedWirelessLeadCapture` component
4. Customer fills out business details:
   - Company name
   - Contact person
   - Email & phone
   - Business type (SMME/Enterprise)
   - Requirements
5. Lead saved with `coverage_status: 'licensed_wireless_quote_requested'`
6. Sales team contacted for site survey scheduling

### Key Features

- ✅ Enterprise-grade reliability (99.99% SLA)
- ✅ Dedicated bandwidth (up to 1 Gbps symmetrical)
- ✅ Licensed spectrum (interference-free)
- ✅ Business-only service
- ⚠️ Does NOT show product packages
- ⚠️ Requires manual quote process

## Frontend Display

### Package Tab Filtering

Packages appear in the **WIRELESS tab** on `/packages/[leadId]`:

```typescript
// Frontend filter logic (lines 238-243)
const wireless = packages.filter(p => {
  const st = (p.service_type || p.product_category || '').toLowerCase();
  return (st.includes('wireless') || st.includes('skyfibre')) &&
         !st.includes('lte') &&
         !st.includes('5g');
});
```

### Display Order (Sorted by Price)

1. Wireless Connect Basic 10Mbps - R299
2. Wireless Connect Standard 25Mbps - R449
3. Wireless Connect Premium 50Mbps - R699
4. SkyFibre Starter - 50Mbps - R799
5. SkyFibre Plus - 100Mbps - R899
6. **SkyFibre Home Plus** - 50Mbps - **R999** ⭐
7. SkyFibre Pro - 200Mbps - R1,099
8. **SkyFibre Home Max** - 100Mbps - **R1,499** ⭐
9. **SkyFibre Home Ultra** - 200Mbps - **R1,999** ⭐

## Files Created/Modified

### New Files

1. **`scripts/import-skyfibre-products.js`**
   - Product import script with schema mapping
   - Handles upsert logic for future updates

2. **`components/coverage/LicensedWirelessLeadCapture.tsx`**
   - Business lead capture form for P2P microwave
   - Includes form validation, business type selection
   - Professional UI with enterprise-grade messaging

3. **`app/api/leads/licensed-wireless/route.ts`**
   - API endpoint for licensed wireless quote requests
   - Saves to coverage_leads with metadata
   - Ready for CRM integration (Zoho)

4. **`scripts/test-skyfibre-frontend.js`**
   - Test script for frontend filtering logic
   - Validates MTN coverage mapping

5. **`docs/features/SKYFIBRE_HOME_INTEGRATION.md`**
   - This documentation file

### Modified Files

1. **`app/api/coverage/packages/route.ts`**
   - Added `hasLicensedWireless` detection
   - Filters out licensed_wireless from package display
   - Returns `requiresQuote` flag for frontend

2. **`app/packages/[leadId]/page.tsx`**
   - Conditionally shows LicensedWirelessLeadCapture
   - Imports and handles quote-based flow

3. **Service Type Mappings (Database)**
   - Deactivated `licensed_wireless → SkyFibre` mapping
   - Deactivated `licensed_wireless → wireless` mapping

## API Response Schema

### Standard Package Response

```json
{
  "available": true,
  "services": ["uncapped_wireless"],
  "packages": [...],
  "leadId": "uuid",
  "address": "123 Main St",
  "coordinates": { "lat": -26.123, "lng": 28.456 },
  "hasLicensedWireless": false,
  "requiresQuote": false
}
```

### Licensed Wireless Response

```json
{
  "available": true,
  "services": ["licensed_wireless"],
  "packages": [],
  "leadId": "uuid",
  "address": "123 Business Park",
  "coordinates": { "lat": -26.123, "lng": 28.456 },
  "hasLicensedWireless": true,
  "requiresQuote": true  // Triggers lead form
}
```

## Customer Journey

### Residential Customer (uncapped_wireless)

1. ✅ Enters home address
2. ✅ MTN API returns `uncapped_wireless`
3. ✅ System shows 9 wireless packages
4. ✅ Customer selects SkyFibre Home Plus (R999)
5. ✅ Proceeds to account creation
6. ✅ Completes order and payment

### Business Customer (licensed_wireless)

1. ✅ Enters business address
2. ✅ MTN API returns `licensed_wireless`
3. ✅ System shows lead capture form (no packages)
4. ✅ Customer fills business details
5. ✅ Lead saved with site survey requirement
6. ⏳ Sales team contacts customer (24 hours)
7. ⏳ Site survey scheduled
8. ⏳ Custom quote provided
9. ⏳ Manual order processing

## Data Persistence

### Coverage Lead (licensed_wireless)

```json
{
  "id": "uuid",
  "address": "123 Business Park",
  "coordinates": { "lat": -26.123, "lng": 28.456 },
  "customer_type": "enterprise",
  "coverage_status": "licensed_wireless_quote_requested",
  "metadata": {
    "serviceType": "licensed_wireless",
    "quoteRequested": true,
    "requiresSiteSurvey": true,
    "businessDetails": {
      "companyName": "ABC Corporation",
      "contactPerson": "John Smith",
      "email": "john@abc.co.za",
      "phone": "0821234567",
      "businessType": "enterprise",
      "requirements": "Need 1 Gbps symmetrical",
      "requestedAt": "2025-10-26T12:00:00Z"
    }
  }
}
```

## Testing

### Test Script

```bash
node scripts/test-skyfibre-frontend.js
```

**Expected Output**:
- 9 wireless packages (including 3 SkyFibre Home)
- Correct tab filtering
- MTN mapping confirmation

### Manual Testing

1. **Residential Flow**: Use coverage checker with residential address
2. **Business Flow**: Use coverage checker with business park address
3. **Verify**: Check network tab for `hasLicensedWireless` and `requiresQuote` flags

## Future Enhancements

### Phase 1: Immediate
- ✅ Product import
- ✅ MTN coverage mapping
- ✅ Licensed wireless lead form
- ✅ Frontend integration

### Phase 2: CRM Integration
- ⏳ Zoho CRM task creation for site surveys
- ⏳ Email notifications to sales team
- ⏳ Customer confirmation emails
- ⏳ Quote workflow automation

### Phase 3: Analytics
- ⏳ Track quote request conversion rates
- ⏳ Site survey success metrics
- ⏳ P2P microwave revenue tracking

## Support & Maintenance

### Key Contacts
- **Sales**: For licensed wireless quote requests
- **Product Team**: For SkyFibre Home pricing updates
- **Tech Support**: For MTN coverage mapping issues

### Known Limitations
1. Licensed wireless quotes are manual (not automated)
2. Site survey scheduling requires sales intervention
3. P2P microwave pricing varies by location

## Success Metrics

- ✅ 3 products successfully imported
- ✅ All products active and visible
- ✅ Correct customer type (consumer)
- ✅ Proper service type mapping (uncapped_wireless → SkyFibre)
- ✅ Licensed wireless isolated to quote flow
- ✅ No product packages shown for P2P microwave
- ✅ Lead capture form functional

---

**Document Version**: 1.0
**Last Updated**: 2025-10-26
**Maintained By**: Development Team
