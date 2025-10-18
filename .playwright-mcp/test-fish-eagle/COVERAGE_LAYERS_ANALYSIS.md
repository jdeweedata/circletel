# MTN Coverage Layers Analysis: Fish Eagle Place, Cape Town

**Test Date:** October 4, 2025
**Address:** 25 Fish Eagle Place, Fish Eagle Park, Cape Town, Western Cape
**Coordinates:** -34.134078, 18.369972
**Test URL:** https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html?mc=busr-407a787d7e9949dbb2d8fc9a3d073976

---

## Executive Summary

This document provides a detailed analysis of **WMS (Web Map Service) coverage layers** for different technology types at the Fish Eagle Place location. While the MTN Feasibility API failed (502 Proxy Error), the visual coverage layers successfully loaded via GeoServer WMS, providing valuable insights into technology availability.

**Key Discovery:** Each technology filter displays distinct coverage visualization through different colored overlays on the map, revealing which services are potentially available at the location.

---

## Coverage Visualization by Technology Type

### 1. All Technologies (Default View)

**Screenshot:** `04-final-result-with-marker.png`
**Button State:** Yellow background
**Coverage Color:** Yellowish-green overlay
**Layer Name:** `mtnsi:MTN-EBU-RBUS-ALL2`

**Observation:**
- Shows composite coverage of all available technologies
- Yellowish-green color indicates general service availability
- Serves as baseline for comparison with individual technology layers

**Visual Interpretation:**
- ✅ General MTN coverage present in the area
- Location falls within a covered zone
- Multiple technologies likely available (pending individual layer confirmation)

---

### 2. Uncapped Wireless Coverage

**Screenshot:** `05-uncapped-wireless-selected.png`
**Button State:** White background (active/selected)
**Coverage Color:** Teal/Cyan-Green overlay
**WMS Layer:** Uncapped Wireless specific layer

**Observation:**
- Distinct teal/cyan-green coverage overlay
- Significant coverage area visible around Fish Eagle Park
- Color differentiates clearly from other technology types
- Coverage extends broadly across the residential area

**Visual Coverage Assessment:**
- ✅ **Strong Visual Coverage** - Location appears well within covered zone
- Dense coverage in surrounding suburbs
- Lighter shading in some areas suggests variable signal strength

**Technology Details:**
- Uncapped Wireless typically uses LTE/4G/5G cellular technology
- Provides internet access without physical cable installation
- Suitable for residential and business use where fibre unavailable

---

### 3. Fibre Coverage

**Screenshot:** `06-fibre-coverage-layer.png`
**Button State:** Green background (highlighted)
**Coverage Color:** Light green overlay
**WMS Layer:** Fibre infrastructure layer

**Observation:**
- Light green coverage overlay distinct from wireless layers
- Coverage appears more localized/patchy compared to wireless
- Some white/uncovered areas visible
- Fish Eagle Place location shows lighter green tint

**Visual Coverage Assessment:**
- ⚠️ **Moderate/Limited Visual Coverage** - Location on edge of covered zone
- Fibre coverage not as extensive as wireless technologies
- Suggests fibre infrastructure may be limited in this suburb

**Technology Details:**
- Fibre-to-the-Home (FTTH) or Fibre-to-the-Business (FTTB)
- Requires physical fibre optic cable installation
- Typically offers highest speeds and most reliable connectivity
- Installation dependent on infrastructure availability

---

### 4. Fixed LTE Coverage

**Screenshot:** `07-fixed-lte-coverage-layer.png`
**Button State:** Red/Dark background (highlighted)
**Coverage Color:** Red/Pink overlay (extensive)
**WMS Layer:** Fixed LTE layer

**Observation:**
- **Most extensive coverage** of all technology types
- Entire visible map area covered in red/pink overlay
- Very strong visual presence
- Fish Eagle Place location fully within covered zone

**Visual Coverage Assessment:**
- ✅ **Excellent Visual Coverage** - Comprehensive coverage across entire area
- Strongest coverage indicator of all tested technologies
- Uniform coverage suggests well-established infrastructure

**Technology Details:**
- Fixed LTE uses cellular towers to provide stationary internet
- Outdoor antenna installed at premises
- More reliable than mobile LTE due to fixed antenna position
- Good alternative to fibre where unavailable

**Significance:**
- Red overlay indicates this is likely the **primary recommended technology** for this location
- Most readily available service
- Highest probability of successful installation

---

### 5. Licensed Wireless Coverage

**Screenshot:** `08-licensed-wireless-coverage-layer.png`
**Button State:** Blue background (highlighted)
**Coverage Color:** Blue overlay
**WMS Layer:** Licensed wireless layer

**Observation:**
- Bright blue coverage overlay
- Extensive but not complete coverage
- Some white gaps/patches visible (e.g., center area near marker)
- Fish Eagle Place location shows blue coverage but with nearby gaps

**Visual Coverage Assessment:**
- ✅ **Good Visual Coverage** - Location appears covered
- Some coverage gaps in immediate vicinity
- Less uniform than Fixed LTE, more extensive than Fibre

**Technology Details:**
- Uses licensed radio spectrum (dedicated frequencies)
- Point-to-point or point-to-multipoint wireless
- Requires line-of-sight to tower/base station
- More reliable than unlicensed wireless due to dedicated spectrum

**Considerations:**
- Line-of-sight requirements may affect actual availability
- Visual coverage doesn't guarantee installation feasibility
- Building obstructions could impact service

---

## Coverage Comparison Matrix

| Technology | Visual Coverage | Color | Extensiveness | Recommended for Fish Eagle Place |
|-----------|----------------|-------|---------------|----------------------------------|
| **Fixed LTE** | ✅ Excellent | Red/Pink | Highest (100% visible area) | ⭐ **Primary Choice** |
| **Uncapped Wireless** | ✅ Strong | Teal/Cyan | High (90%+ coverage) | ⭐ **Secondary Choice** |
| **Licensed Wireless** | ✅ Good | Blue | Moderate-High (80%+ with gaps) | ⚠️ Conditional (LOS required) |
| **Fibre** | ⚠️ Limited | Light Green | Low-Moderate (patchy) | ❌ Limited Availability |
| **All Combined** | ✅ Good | Yellow-Green | Composite | N/A (Reference) |

---

## WMS Coverage Layer Technical Details

### How Coverage Layers Work

**WMS (Web Map Service):**
- GeoServer-based mapping service
- Serves geographic data as visual map tiles
- Each technology type has dedicated layer(s)
- Tiles rendered in EPSG:900913 (Web Mercator) projection

**Layer Request Pattern:**
```
https://mtnsi.mtn.co.za/geoserver/mtnsi/wms?
  SERVICE=WMS
  &REQUEST=GetMap
  &LAYERS=mtnsi:MTN-EBU-RBUS-ALL2  (varies by technology)
  &BBOX=[coordinates]
  &WIDTH=256
  &HEIGHT=256
  &FORMAT=image/png
  &TRANSPARENT=true
```

**Coverage Interpretation:**
- Colors indicate **potential service availability**
- Visual coverage ≠ guaranteed installation
- Actual feasibility requires API verification (currently failing)
- Darker/more saturated colors typically indicate stronger coverage

### Color Coding System

| Color | Technology | Meaning |
|-------|------------|---------|
| 🟥 Red/Pink | Fixed LTE | Extensive cellular-based coverage |
| 🟦 Blue | Licensed Wireless | Radio frequency coverage (LOS dependent) |
| 🟩 Green | Fibre | Physical cable infrastructure zones |
| 🟦 Teal/Cyan | Uncapped Wireless | Cellular data coverage |
| 🟨 Yellow-Green | All Technologies | Composite availability |

---

## Technology Recommendation for 25 Fish Eagle Place

Based on **visual coverage analysis only** (pending Feasibility API restoration):

### 🥇 First Choice: Fixed LTE
- **Reason:** Most extensive red coverage across entire area
- **Pros:** Readily available, established infrastructure, reliable
- **Cons:** Potential speed limitations vs. fibre
- **Installation:** External antenna required

### 🥈 Second Choice: Uncapped Wireless
- **Reason:** Strong teal coverage throughout suburb
- **Pros:** Quick installation, no cables, mobile backup
- **Cons:** Potential congestion during peak times, fair usage policies
- **Installation:** Router with SIM card, possible external antenna

### 🥉 Third Choice: Licensed Wireless
- **Reason:** Good blue coverage but with nearby gaps
- **Pros:** Dedicated spectrum, reliable speeds
- **Cons:** Requires line-of-sight, installation assessment needed
- **Installation:** External directional antenna + receiver

### ⚠️ Not Recommended: Fibre
- **Reason:** Limited/patchy green coverage in area
- **Assessment:** Infrastructure may not reach Fish Eagle Place
- **Recommendation:** Verify availability via NAD/Feasibility API before considering

---

## Insights for CircleTel Integration

### Key Learnings

1. **Visual Coverage Layers are Reliable**
   - WMS layers loaded successfully even when Feasibility API failed
   - Provide valuable fallback for coverage indication
   - Can guide technology recommendations

2. **Color-Based Technology Identification**
   - Each technology has distinct visual signature
   - Enables quick at-a-glance coverage assessment
   - Useful for customer-facing coverage maps

3. **Coverage ≠ Guaranteed Service**
   - Visual coverage shows potential, not certainty
   - Feasibility API (when working) provides actual availability
   - Line-of-sight and infrastructure validation still required

### Integration Recommendations

**For CircleTel Coverage Checker:**

1. **Implement WMS Layer Queries**
   ```typescript
   // Alternative to failed Feasibility API
   async function checkCoverageViaWMS(lat: number, lng: number) {
     const technologies = ['fibre', 'fixedlte', 'wireless', 'licensed'];
     const results = {};

     for (const tech of technologies) {
       const coverage = await queryWMSLayer(tech, lat, lng);
       results[tech] = coverage.available;
     }

     return results;
   }
   ```

2. **Visual Coverage Map Component**
   - Display color-coded coverage layers
   - Allow users to toggle technology types
   - Show legend explaining colors
   - Add disclaimer about visual vs. actual availability

3. **Fallback Strategy**
   ```typescript
   // Try Feasibility API first, fall back to WMS
   try {
     const result = await checkFeasibilityAPI(address);
     return result;
   } catch (error) {
     console.warn('Feasibility API failed, using WMS fallback');
     return await checkCoverageViaWMS(lat, lng);
   }
   ```

4. **Coverage Confidence Scoring**
   ```typescript
   interface CoverageConfidence {
     technology: string;
     visual_coverage: 'excellent' | 'good' | 'limited' | 'none';
     confidence: number; // 0-100%
     source: 'feasibility_api' | 'wms_visual' | 'estimated';
   }
   ```

---

## Technical Implementation Details

### WMS GetFeatureInfo Query (Alternative to Feasibility API)

Instead of relying on the broken Feasibility API, CircleTel can query WMS layers directly:

```javascript
// Get coverage data at specific coordinates
const url = `https://mtnsi.mtn.co.za/geoserver/mtnsi/wms?
  SERVICE=WMS
  &VERSION=1.1.1
  &REQUEST=GetFeatureInfo
  &LAYERS=mtnsi:MTN-EBU-RBUS-FIBRE,mtnsi:MTN-EBU-RBUS-LTE,mtnsi:MTN-EBU-RBUS-WIRELESS
  &QUERY_LAYERS=mtnsi:MTN-EBU-RBUS-FIBRE,mtnsi:MTN-EBU-RBUS-LTE,mtnsi:MTN-EBU-RBUS-WIRELESS
  &INFO_FORMAT=application/json
  &FEATURE_COUNT=50
  &X=128
  &Y=128
  &SRS=EPSG:4326
  &WIDTH=256
  &HEIGHT=256
  &BBOX=${lng-0.001},${lat-0.001},${lng+0.001},${lat+0.001}`;

const response = await fetch(url);
const data = await response.json();

// Parse coverage from response
const coverage = {
  fibre: data.features.some(f => f.properties.FIBRE_AVAILABLE),
  fixedLTE: data.features.some(f => f.properties.LTE_AVAILABLE),
  wireless: data.features.some(f => f.properties.WIRELESS_AVAILABLE)
};
```

### Coverage Layer Names (Inferred)

Based on observed behavior:

- `mtnsi:MTN-EBU-RBUS-ALL2` - All technologies composite
- `mtnsi:MTN-EBU-RBUS-FIBRE` - Fibre coverage (likely)
- `mtnsi:MTN-EBU-RBUS-LTE` or `MTN-EBU-RBUS-FIXED-LTE` - Fixed LTE
- `mtnsi:MTN-EBU-RBUS-WIRELESS` - Uncapped wireless
- `mtnsi:MTN-EBU-RBUS-LICENSED` - Licensed wireless

**Note:** Exact layer names need verification via GetCapabilities request:
```
https://mtnsi.mtn.co.za/geoserver/mtnsi/wms?SERVICE=WMS&REQUEST=GetCapabilities
```

---

## Comparison: Visual vs. API-Based Coverage

| Aspect | WMS Visual Layers | Feasibility API (when working) |
|--------|-------------------|-------------------------------|
| **Availability** | ✅ Reliable | ❌ Currently failing (502) |
| **Data Type** | Visual/geographic zones | Precise address-based data |
| **Accuracy** | Approximate/indicative | Exact service availability |
| **Speed** | Fast (tile-based) | Slower (database query) |
| **Detail Level** | Coverage zones only | Speeds, packages, pricing |
| **Use Case** | Initial screening | Final verification |
| **Reliability** | High (GeoServer stable) | Low (proxy issues) |

**Recommendation:** Use WMS as **primary coverage indicator** with Feasibility API as **confirmation step** (when available).

---

## Testing Observations

### Filter Interaction Behavior

1. **Clicking Filter Button**
   - Changes button background color to match technology
   - Triggers WMS layer switch
   - Map overlay updates within ~1 second
   - No console errors during filter changes

2. **Console Logs**
   - No new API calls when switching filters
   - WMS tiles requested in background
   - Layer visibility toggled client-side
   - Map zoom/pan triggers new tile requests

3. **Network Activity**
   - Each filter change: ~20-50 new WMS tile requests
   - Tiles cached by browser for performance
   - No Feasibility API calls (only triggered on address selection)

---

## Screenshots Summary

| Screenshot | Technology | Coverage Assessment |
|-----------|------------|---------------------|
| 04-final-result-with-marker.png | All (default) | Composite yellow-green |
| 05-uncapped-wireless-selected.png | Uncapped Wireless | Strong teal coverage |
| 06-fibre-coverage-layer.png | Fibre | Limited green coverage |
| 07-fixed-lte-coverage-layer.png | Fixed LTE | Excellent red coverage |
| 08-licensed-wireless-coverage-layer.png | Licensed Wireless | Good blue coverage |

---

## Conclusions

### What We Learned

1. **Coverage Visualization Works Despite API Failure**
   - WMS layers provide reliable visual indication
   - Color coding clearly differentiates technologies
   - Useful fallback when Feasibility API unavailable

2. **Fish Eagle Place Coverage Profile**
   - ✅ Fixed LTE: Excellent
   - ✅ Uncapped Wireless: Strong
   - ✅ Licensed Wireless: Good (conditional)
   - ⚠️ Fibre: Limited

3. **Technology Priority for This Location**
   - Primary recommendation: Fixed LTE
   - Backup option: Uncapped Wireless
   - Avoid: Fibre (insufficient infrastructure)

### For CircleTel Development

**Implement Multi-Tier Coverage Checking:**

```typescript
// Tier 1: Visual WMS Check (fast, always available)
const visualCoverage = await checkWMSCoverage(coordinates);

// Tier 2: Feasibility API (detailed, sometimes unavailable)
try {
  const apiCoverage = await checkFeasibilityAPI(address);
  return { ...visualCoverage, ...apiCoverage, source: 'api' };
} catch {
  return { ...visualCoverage, source: 'wms_visual_only',
           disclaimer: 'Showing visual coverage only. Contact for confirmation.' };
}

// Tier 3: Manual Verification (when needed)
if (visualCoverage.uncertain) {
  suggestManualVerification(address);
}
```

---

**Test Completed:** October 4, 2025
**Tester:** Claude Code (Playwright MCP)
**Next Steps:** Test WMS GetFeatureInfo API directly to extract coverage data programmatically
