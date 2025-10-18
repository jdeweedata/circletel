# Coverage API Key Findings - Quick Reference

**Date:** October 16, 2025
**Status:** ✅ Complete

---

## 🎯 Key Discoveries

### Supersonic (supersonic.co.za)

**Authentication Method:**
```javascript
Authorization: Bearer 6ebb671412e42506d0b09bfd5881d9bb9891ba902c549d2cb31b3b86881a49ce...
```
- ✅ Uses Strapi CMS with Bearer token authentication
- ✅ Token is public (embedded in frontend JS)
- ✅ Read-only access to CMS content

**API Endpoints:**
```
https://supersonic.sudosky.com/api/home-page-header
https://supersonic.sudosky.com/api/home-page-body
https://supersonic.sudosky.com/api/partner-logo
```

**Google Maps API Key:**
```
AIzaSyDBs50OhIhu4ynXqSoz5XQQEkw19kpWFkw
```

**WMS/GIS:** Google Maps (no traditional WMS)

---

### CircleTel Customer Portal (circletel-customer.agilitygis.com)

**Authentication Method:**
- ❌ **NO AUTH HEADERS** - Appears to be public portal
- Site Instance ID: `85` (tenant identifier)

**API Platform:**
```
https://integration.agilitygis.com/api/publicsiteinstance/85/
```

**Architecture:**
- AgilityGIS white-label portal
- AngularJS frontend
- Configuration-driven UI
- Minimal cookies (3-4)

**WMS/GIS:** Google Maps with ng-map directive

---

## 📊 Comparison

| Feature | Supersonic | CircleTel Portal |
|---------|-----------|------------------|
| **Auth** | ✅ Bearer Token | ❌ None (Public) |
| **Platform** | Strapi CMS | AgilityGIS |
| **Cookies** | 32+ | 3-4 |
| **Tracking** | Heavy | Minimal |
| **Maps** | Google Maps | Google Maps |

---

## ⚠️ Important Note

**Coverage API endpoints NOT captured** because:
- Address typing alone doesn't trigger coverage checks
- Explicit button click or form submission required
- May need address selection from dropdown

**Recommendation:**
- Extend test to include button clicks
- Add explicit wait for API responses
- Monitor XHR/Fetch requests specifically

---

## 📁 Test Artifacts

**Location:** `test-results/`
- `coverage-api-recording-2025-10-16T08-14-00-150Z.json` (Full capture)
- `api-analysis-report.txt` (Detailed analysis)

**Screenshots:** `.playwright-mcp/` directory

**Scripts:**
- `scripts/test-coverage-api-recording.ts` (Test script)
- `scripts/analyze-api-recording.ts` (Analysis script)

---

## 🚀 Next Steps

1. **Manual Testing:** Use browser DevTools to capture actual coverage API calls
2. **Button Click Test:** Extend Playwright script to click "Check Coverage" buttons
3. **AgilityGIS Docs:** Request API documentation from AgilityGIS
4. **Backend Review:** Check CircleTel backend for AgilityGIS integration code

---

**Full Report:** `docs/integrations/COVERAGE_API_FEASIBILITY_ANALYSIS.md`
