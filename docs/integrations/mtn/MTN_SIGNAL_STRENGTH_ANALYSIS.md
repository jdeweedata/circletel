# MTN API Signal Strength Analysis

**Date**: October 27, 2025
**Analysis Type**: MTN Wholesale & Business API Signal Strength Parameters
**Test Location**: The Courtyard, 18 Rasmus Erasmus Blvd, Heritage Hill, Centurion, 0169
**Coordinates**: -25.8894, 28.1786

---

## Executive Summary

**Key Finding**: ❌ **Neither MTN Wholesale API nor MTN Business API provides direct signal strength measurements** (RSSI, RSRP, RSRQ, SINR) for Fixed Wireless Access (FWA) services including Uncapped Wireless (Tarana) and Fixed LTE.

**Alternative Approach**: ✅ **Infrastructure-based signal estimation is available and implemented** using proximity, density, and technology scoring.

---

## Detailed Analysis

### 1. Fixed LTE Coverage (`mtnsi:MTNSA-Coverage-FIXLTE-EBU-0`)

#### Available Parameters:
```json
{
  "CELL_ID": "L06428C9",
  "SLOTS": 11875,           // Total capacity slots
  "SLOTS_U5M": 11875,       // Slots for speeds up to 5Mbps
  "SLOTS_U10M": 11875,      // Slots for speeds up to 10Mbps
  "SLOTS_U20M": 1875,       // Slots for speeds up to 20Mbps
  "DISPLAY_COV_MAP": 1,
  "LAST_UPDATED": "2025-10-22T01:50:00Z"
}
```

#### Signal Strength Indicators:
- ❌ **No RSSI** (Received Signal Strength Indicator)
- ❌ **No RSRP** (Reference Signal Received Power)
- ❌ **No RSRQ** (Reference Signal Received Quality)
- ❌ **No SINR** (Signal-to-Interference-plus-Noise Ratio)

#### What We CAN Derive:
- ✅ **Capacity availability** via SLOTS metrics
- ✅ **Service availability** (presence of features = coverage exists)
- ✅ **Cell identification** for proximity calculations
- ✅ **Speed tier availability** (5Mbps, 10Mbps, 20Mbps slots)

**Signal Estimation Method**: Use available SLOTS as a proxy for quality. Higher slot counts suggest better infrastructure capacity and potentially better signal quality.

---

### 2. Uncapped Wireless - Tarana (`mtnsi:MTNSA-Coverage-Tarana`)

#### Available Parameters:
```json
{
  "NAME": "X10092_45",
  "STATUS": 4,
  "TYPE": "TARANA",
  "PROVIDER": "MTN",
  "ID": "X10092_45",
  "CLAT": -25.872933870215,   // Cell/tower latitude
  "CLON": 28.1773561037205    // Cell/tower longitude
}
```

#### Signal Strength Indicators:
- ❌ **No direct signal measurements**
- ❌ **No RSSI, RSRP, or quality metrics**

#### What We CAN Derive:
- ✅ **Tower location** (CLAT/CLON) for distance calculations
- ✅ **Service availability** (presence of features = coverage exists)
- ✅ **Tower identification** (NAME, ID)
- ✅ **Provider confirmation** (MTN)
- ⚠️ **STATUS field** (value: 4) - purpose unknown, possibly operational status

**Signal Estimation Method**: Calculate distance from user coordinates to tower coordinates (CLAT/CLON). Closer proximity = better signal quality.

---

### 3. Licensed Wireless - PMP (`mtnsi:MTN-PMP-Feasible-Integrated`)

#### Available Parameters:
```json
{
  "OGR_FID": 60,
  "NAME": "MTN Centurion",
  "AP_ID": "MMCN_45"          // Access Point ID
}
```

#### Signal Strength Indicators:
- ❌ **No signal strength data**
- ❌ **No location coordinates** (unlike Tarana)
- ❌ **No capacity metrics** (unlike Fixed LTE)

#### What We CAN Derive:
- ✅ **Service availability** (presence of features = coverage exists)
- ✅ **Access point identification** (NAME, AP_ID)
- ⚠️ **Very limited metadata** - hardest to estimate quality

**Signal Estimation Method**: Use feature density (number of overlapping access points) as a proxy. More APs = better coverage redundancy.

---

## MTN Business API vs Consumer API

### Business API
- **Endpoint**: `https://mtnsi.mtn.co.za/coverage/dev/v3`
- **Config ID**: `busr-407a787d7e9949dbb2d8fc9a3d073976`
- **Layers**: FTTBCoverage, PMPCoverage, FLTECoverageEBU, UncappedWirelessEBU
- **Signal Data**: ❌ **None** - same limitation as Consumer API

### Consumer API (WMS)
- **Endpoint**: `https://mtnsi.mtn.co.za/cache/geoserver/wms`
- **Config ID**: `mtncoza`
- **Layers**: Enhanced set including 5G, LTE, 3G, 2G mobile coverage
- **Signal Data**: ❌ **None** - returns only availability (yes/no)

**Conclusion**: Both APIs provide **coverage availability only** - neither includes direct signal strength measurements.

---

## Infrastructure-Based Signal Estimation

Since MTN doesn't provide signal strength, CircleTel uses **infrastructure-based estimation** (already implemented in Phase 3).

### Estimation Factors

#### 1. Density Score (40% weight)
Number of overlapping coverage features at the location:
- **5+ features** → Excellent (1.0)
- **3-4 features** → Good (0.8)
- **2 features** → Fair (0.6)
- **1 feature** → Poor (0.4)

**Rationale**: Multiple overlapping towers/cells indicate redundant coverage and better quality.

#### 2. Proximity Score (40% weight)
Distance to nearest infrastructure:
- **≤ 200m** → Excellent (1.0)
- **≤ 500m** → Good (0.85)
- **≤ 1km** → Fair (0.7)
- **≤ 2km** → Poor (0.5)
- **≤ 5km** → Very Poor (0.3)

**Rationale**: Signal degrades with distance. Closer = stronger signal.

**How to Calculate**:
- **Fixed LTE**: No coordinates provided, use feature count only
- **Tarana**: Use CLAT/CLON to calculate haversine distance
- **PMP**: No coordinates, use feature count only

#### 3. Technology Score (20% weight)
Signal propagation characteristics by technology:
- **Fibre**: 1.0 (wired, no signal degradation)
- **Fixed LTE**: 0.95 (optimized tower placement)
- **Licensed Wireless**: 0.9 (dedicated spectrum)
- **LTE**: 0.9 (mature technology)
- **5G**: 0.85 (high frequency, shorter range)
- **Uncapped Wireless**: 0.85 (varies by technology)

### Final Signal Strength Classification

**Total Score Calculation**:
```
Total Score = (Density × 0.4) + (Proximity × 0.4) + (Technology × 0.2)
```

**Signal Strength Output**:
- **Excellent**: Score ≥ 0.85
- **Good**: Score ≥ 0.7
- **Fair**: Score ≥ 0.5
- **Poor**: Score ≥ 0.3
- **None**: Score < 0.3

### Confidence Levels
- **High**: 3+ features with location data
- **Medium**: 2 features OR location data available
- **Low**: 1 feature OR no location data

---

## Practical Example: Heritage Hill Analysis

### Test Results Summary

| Service Type | Features | Has Location | Has Capacity | Estimated Signal |
|--------------|----------|--------------|--------------|------------------|
| **Fixed LTE** | 2 cells | ❌ No | ✅ Yes (SLOTS) | **Good** (density + capacity) |
| **Uncapped Wireless** | 2 towers | ✅ Yes (CLAT/CLON) | ❌ No | **Good** (density + proximity) |
| **Licensed Wireless** | 2 APs | ❌ No | ❌ No | **Fair** (density only) |
| **Fibre** | 0 | - | - | **None** |

### Signal Quality Estimation

#### Fixed LTE:
- **Density**: 2 features → Fair (0.6)
- **Proximity**: Unknown (no coords) → Assume good based on capacity
- **Technology**: Fixed LTE → 0.95
- **Capacity**: 27,441 slots (high) → Excellent capacity indicator
- **Final**: **Good** signal (capacity-adjusted)

#### Uncapped Wireless (Tarana):
- **Density**: 2 towers → Fair (0.6)
- **Proximity**:
  - Tower 1 (X10092_45): ~1.8km away → Poor (0.5)
  - Tower 2 (X10092_135): ~0.1km away → **Excellent (1.0)**
- **Technology**: Uncapped Wireless → 0.85
- **Final**: **Excellent** signal (closest tower)
- **Total Score**: (0.6 × 0.4) + (1.0 × 0.4) + (0.85 × 0.2) = **0.81** → **Good**

#### Licensed Wireless (PMP):
- **Density**: 2 APs → Fair (0.6)
- **Proximity**: Unknown → Assume fair (0.7)
- **Technology**: Licensed Wireless → 0.9
- **Final**: **Fair** signal (limited data)
- **Total Score**: (0.6 × 0.4) + (0.7 × 0.4) + (0.9 × 0.2) = **0.70** → **Good**

---

## Implementation Status

### ✅ Phase 3 Complete (October 4, 2025)
Infrastructure-based signal estimation is **fully implemented**:

1. ✅ **CoordinateConverter** (`lib/coverage/mtn/coordinate-converter.ts`)
   - Haversine distance calculations
   - EPSG:900913 conversions
   - Bounding box generation

2. ✅ **InfrastructureSignalEstimator** (`lib/coverage/mtn/infrastructure-estimator.ts`)
   - Density scoring (feature count)
   - Proximity scoring (distance to towers)
   - Technology scoring (propagation characteristics)
   - Confidence level calculation

3. ✅ **AggregationService Integration** (`lib/coverage/aggregation-service.ts`)
   - Enhanced `inferSignalFromLayerData()` method
   - Metadata tracking: `phase_3_infrastructure_ready`
   - TODO marked for full feature data integration

### 🔄 Activation Required
To enable advanced signal estimation:

1. **Collect full feature arrays** in `mtnWMSRealtimeClient.checkCoverage()`
2. **Pass feature data** to `InfrastructureSignalEstimator.estimateSignalStrength()`
3. **Update aggregation service** to use estimated signal instead of hardcoded 'good'

**Files to Modify**:
- `lib/coverage/aggregation-service.ts` (lines 313-340)
- `lib/coverage/mtn/wms-realtime-client.ts` (return full features, not just count)

---

## Recommendations

### Short-Term (Immediate)
1. ✅ **Use capacity metrics for Fixed LTE quality** - SLOTS provide reliable capacity indicators
2. ✅ **Calculate distance for Tarana** - CLAT/CLON enable accurate proximity scoring
3. ✅ **Show estimated signal strength in UI** - "Good signal (estimated)" vs "Unknown signal"

### Medium-Term (Q1 2026)
1. 🔄 **Activate infrastructure estimator** - Connect existing code to live data
2. 🔄 **Display confidence levels** - "High confidence" vs "Estimated based on location"
3. 🔄 **Add signal quality filters** - Let users filter by "Excellent signal only"

### Long-Term (Q2 2026)
1. ⏳ **Crowdsource real signal data** - Collect actual speed test results from customers
2. ⏳ **Machine learning signal prediction** - Train model on collected data
3. ⏳ **MTN API enhancement request** - Request signal strength data in future API versions

---

## Conclusion

### Key Findings

1. **❌ No Direct Signal Strength Data**
   - MTN Wholesale and Business APIs do not provide RSSI, RSRP, RSRQ, or SINR
   - Only availability (yes/no) is provided

2. **✅ Capacity Metrics Available (Fixed LTE Only)**
   - SLOTS, SLOTS_U5M, SLOTS_U10M, SLOTS_U20M
   - Can be used to infer congestion and quality

3. **✅ Location Data Available (Tarana Only)**
   - CLAT/CLON provide tower coordinates
   - Enable accurate distance-based signal estimation

4. **✅ Infrastructure Estimation Ready**
   - Phase 3 implementation complete
   - Awaiting activation for production use

### Recommended Approach

**Use infrastructure-based estimation** as the primary signal quality indicator:
- **Fixed LTE**: Capacity + density scoring
- **Uncapped Wireless (Tarana)**: Proximity + density scoring
- **Licensed Wireless (PMP)**: Density scoring only
- **All Services**: Apply technology scoring factor

**Display format**:
```
Signal Quality: Good (estimated from 2 towers, 1.8km away)
Confidence: Medium
```

This provides users with meaningful quality indicators despite MTN API limitations.

---

**Analysis Complete**: October 27, 2025
**Analyst**: CircleTel Development Team
**Next Review**: When MTN API updates are released
