# Address Testing Results: 18 Rasmus Erasmus
**Date:** October 4, 2025
**Address Tested:** 18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion, South Africa
**Coordinates:** -25.908507, 28.17801

## Test Summary

Three platforms were tested with the address "18 Rasmus Erasmus":

1. MTN Business Map (busr)
2. MTN Consumer Site
3. CircleTel Local App

---

## 1. MTN Business Map (busr)
**URL:** https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html?mc=busr-407a787d7e9949dbb2d8fc9a3d073976

### Results:
✅ **Address Found:** Yes
❌ **Coverage Check:** Failed with **502 Proxy Error**

### Details:
- **Address Autocomplete:** Successfully suggested "18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion, South Africa"
- **Geocoding:** Successfully resolved to coordinates: `-25.908507, 28.17801`
- **Address Display:**
  - 18 Rasmus Erasmus Blvd
  - Heritage Hill
  - Centurion
  - Gauteng
- **API Call:** Failed when calling Feasibility API
- **Error Message:**
  ```
  Error calling Feasibility API:Proxy Error:
  <!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
  ```
- **Console Logs:**
  - `Address Verification: No NAD result found for '18 Rasmus Erasmus Blvd Heritage Hill Centurion'`
  - `Failed to load resource: the server responded with a status of 502 (Proxy Error)`
  - `TypeError: Cannot read properties of undefined (reading 'fsId')`

### Screenshot:
![MTN Business Map Result](.playwright-mcp/test-rasmus-erasmus/mtn-business-map-result.png)

---

## 2. MTN Consumer Site
**URL:** https://www.mtn.co.za/home/coverage/

### Results:
⚠️ **Address Input:** Attempted
❌ **Coverage Check:** Not completed

### Details:
- **Search Field:** Address field available
- **Input:** "18 Rasmus Erasmus" was typed
- **Autocomplete:** Warning message indicating Google Maps Autocomplete API is deprecated/unavailable:
  ```
  As of March 1st, 2025, google.maps.places.Autocomplete is not available to new customers
  ```
- **Status:** Unable to proceed with search due to autocomplete API limitations
- **Note:** The MTN consumer site relies on Google Maps autocomplete which is deprecated for new customers as of March 2025

### Screenshot:
![MTN Consumer Site](.playwright-mcp/test-rasmus-erasmus/mtn-consumer-autocomplete-not-working.png)

---

## 3. CircleTel Local App
**URL:** http://localhost:3000

### Results:
✅ **Address Input:** Successful
⏳ **Coverage Check:** In Progress (Geolocation Loading)

### Details:
- **Address Field:** Full address entered: "18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion"
- **UI State:**
  - Address field populated correctly
  - "Use my current location" button clicked (active/loading state)
  - "Show me my deals" button remains disabled (waiting for location/geocoding)
- **Status:** Geolocation request in progress at time of screenshot
- **Note:** The app requires either Google Maps geocoding or browser geolocation to enable the search button

### Screenshot:
![Local App - Address Filled](.playwright-mcp/test-rasmus-erasmus/local-app-address-filled-location-loading.png)

---

## Key Findings

### Address Recognition
- ✅ **MTN Business API:** Recognizes the address with Google Maps autocomplete
- ❌ **MTN Consumer Site:** Google Autocomplete deprecated/unavailable
- ✅ **CircleTel App:** Address input works, requires geocoding to proceed

### API Issues
1. **MTN Business Feasibility API:**
   - Returns 502 Proxy Error for this address
   - Possible causes:
     - Address not in NAD (National Address Database)
     - API gateway/proxy issues
     - Address format not matching expected pattern

2. **MTN Consumer Site:**
   - Google Maps Autocomplete API deprecated for new customers (March 2025)
   - This may affect any new integrations or API keys

### Recommendations

1. **For CircleTel App:**
   - Implement fallback geocoding without requiring autocomplete
   - Consider using coordinate-based search as primary method
   - Add manual coordinate entry option

2. **For MTN Integration:**
   - Test with different address formats
   - Implement retry logic for 502 errors
   - Consider using coordinate-based queries instead of address strings
   - Monitor MTN API status/health endpoints

3. **Address Format Testing:**
   - Test variations:
     - "18 Rasmus Erasmus, Centurion"
     - "18 Rasmus Erasmus Blvd, Heritage Hill, Centurion, 0157"
     - Direct coordinates: `-25.908507, 28.17801`

---

## Screenshots Location
All screenshots saved in: `.playwright-mcp/test-rasmus-erasmus/`

- `mtn-business-map-initial.png` - Initial load of MTN business map
- `mtn-business-map-result.png` - Address found with 502 error
- `mtn-consumer-initial.png` - MTN consumer site initial state
- `mtn-consumer-autocomplete-not-working.png` - Autocomplete API deprecated warning
- `local-app-homepage.png` - CircleTel homepage (not captured due to timeout)
- `local-app-address-filled-location-loading.png` - Address filled, geolocation loading

---

## Technical Details

### Test Environment
- **Date:** October 4, 2025
- **Browser:** Chromium (via Playwright)
- **Dev Server:** Running on localhost:3000
- **Network:** Standard home/office connection

### Coordinates Verified
- **Latitude:** -25.908507
- **Longitude:** 28.17801
- **Location:** Heritage Hill, Centurion, Gauteng, South Africa

### Next Steps
1. Test with direct coordinate-based API calls
2. Investigate MTN API 502 errors
3. Complete CircleTel app coverage check flow
4. Test alternative address formats
5. Implement coordinate-based search as primary method
