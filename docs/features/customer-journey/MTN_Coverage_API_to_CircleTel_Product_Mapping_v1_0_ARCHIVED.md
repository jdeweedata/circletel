# ⚠️ ARCHIVED DOCUMENT

> **Archive Date**: 2025-10-21
> **Archive Reason**: Superseded by MERGED_IMPLEMENTATION_PLAN.md
> **Status**: Reference Only - Do Not Implement
>
> **This document has been superseded by**:
> - `MERGED_IMPLEMENTATION_PLAN.md` - Complete implementation plan with multi-provider architecture
> - `TODO_BREAKDOWN.md` - Actionable checklist with Phase 1A tasks
> - `MULTI_PROVIDER_ARCHITECTURE.md` - Technical architecture documentation
> - `PROVIDER_INTEGRATION_TEMPLATE.md` - Provider integration guide
>
> **What Changed**:
> - Merged with Customer Journey Implementation Plan
> - Enhanced with multi-provider architecture (MTN, MetroFibre, Openserve, DFA, Vumatel)
> - Added provider registry pattern for scalability
> - Updated timeline: 18-19 days (was focused on MTN only)
>
> **Use This Document For**: Historical reference and understanding original MTN-only mapping requirements

---

# MTN Coverage API to Circle Tel Product Mapping (ARCHIVED)
## API Response to Product Portfolio Integration Guide
### Version 1.0 - 21 October 2025

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 21 October 2025 | Circle Tel Product Team | Initial mapping document |
| ARCHIVED | 21 October 2025 | Development Team | Superseded by merged implementation plan |

**Locale:** South African English (en-ZA)
**Status:** ARCHIVED - Reference Only
**Supersedes:** None (Initial Version)
**Superseded By:** MERGED_IMPLEMENTATION_PLAN.md

---

## Executive Summary

This document maps the MTN Coverage API endpoint `/api/coverage/mtn/check` response to Circle Tel's consumer and business product portfolios. The API returns coverage availability for multiple technologies (fibre, 5G, LTE, fixed wireless) which need to be intelligently matched to appropriate Circle Tel offerings based on technology type, customer segment, and service availability.

### Key Mapping Principles

1. **Technology Priority:** Fibre > Fixed Wireless > 5G > LTE
2. **Customer Segment:** Consumer vs Business offerings differ in pricing, SLAs, and features
3. **Coverage Confidence:** Use API confidence levels to recommend primary and backup solutions
4. **Speed Matching:** Map estimated speeds to appropriate product tiers

---

## API Response Structure Analysis

### Sample API Response Structure

```json
{
  "success": true,
  "data": {
    "available": true,
    "coordinates": {"lat": -26.2041, "lng": 28.0473},
    "confidence": "high",
    "services": [...],
    "businessCoverage": {...},
    "consumerCoverage": {...},
    "location": {...}
  }
}
```

### Service Object Schema

Each service in the `services` array contains:
- `type`: Technology type (fibre, 5g, fixed_lte, lte, uncapped_wireless)
- `available`: Boolean availability
- `signal`: Signal strength (excellent, good, fair, poor)
- `source`: Segment (consumer, business)
- `layer`: MTN network layer identifier
- `technology`: Specific technology (FTTH, 5G NR, LTE-A, Fixed LTE, Wireless)
- `estimatedSpeed`: Download/upload speeds with unit

---

## Product Mapping Framework

### 1. CONSUMER PRODUCTS MAPPING

#### 1.1 Fibre Services → HomeFibreConnect™

**API Indicators:**
```json
{
  "type": "fibre",
  "source": "consumer",
  "technology": "FTTH",
  "estimatedSpeed": {"download": 1, "upload": 1, "unit": "Gbps"}
}
```

**Product Mapping Logic:**

| API Speed Range | Circle Tel Product | Monthly Price | Wholesale Cost |
|-----------------|-------------------|---------------|----------------|
| Up to 25 Mbps | HomeFibreConnect Starter | R899 | R499 (MTN FTTH) |
| 26-50 Mbps | HomeFibreConnect Plus | R1,199 | R599 (MTN FTTH) |
| 51-100 Mbps | HomeFibreConnect Max | R1,599 | R699 (MTN FTTH) |
| 101-200 Mbps | HomeFibreConnect Ultra | R2,299 | R899 (MTN FTTH) |
| 201+ Mbps | HomeFibreConnect Ultra | R2,299 | R899 (MTN FTTH) |

**Mapping Code Example:**
```javascript
function mapConsumerFibre(service) {
  const downloadSpeed = service.estimatedSpeed.download;
  const unit = service.estimatedSpeed.unit;
  
  // Convert to Mbps
  const speedMbps = unit === "Gbps" ? downloadSpeed * 1000 : downloadSpeed;
  
  if (speedMbps <= 25) return {
    product: "HomeFibreConnect Starter",
    speed: "25/25 Mbps",
    price: "R899",
    features: ["Unlimited data", "Basic streaming", "Email & browsing"]
  };
  
  if (speedMbps <= 50) return {
    product: "HomeFibreConnect Plus",
    speed: "50/50 Mbps",
    price: "R1,199",
    features: ["Unlimited data", "HD streaming", "Work from home"]
  };
  
  if (speedMbps <= 100) return {
    product: "HomeFibreConnect Max",
    speed: "100/100 Mbps",
    price: "R1,599",
    features: ["Unlimited data", "4K streaming", "Gaming optimised"]
  };
  
  return {
    product: "HomeFibreConnect Ultra",
    speed: "200/200 Mbps",
    price: "R2,299",
    features: ["Unlimited data", "Multiple 4K streams", "Premium support"]
  };
}
```

#### 1.2 Fixed Wireless Services → SkyFibre Home

**API Indicators:**
```json
{
  "type": "fibre",
  "source": "consumer",
  "technology": "FTTH",
  "layer": "mtnsi:SUPERSONIC-CONSOLIDATED"
}
```

**Note:** MTN Supersonic uses Tarana G1 technology, same as Circle Tel's SkyFibre.

**Product Mapping Logic:**

| API Speed Range | Circle Tel Product | Monthly Price | Wholesale Cost |
|-----------------|-------------------|---------------|----------------|
| Up to 50 Mbps | SkyFibre Home Lite | R1,089 | R499 (MTN FWB) |
| 51-100 Mbps | SkyFibre Home Plus | R1,259 | R599 (MTN FWB) |
| 101-200 Mbps | SkyFibre Home Max | R1,449 | R699 (MTN FWB) |

**Mapping Code Example:**
```javascript
function mapConsumerFixedWireless(service) {
  const downloadSpeed = service.estimatedSpeed.download;
  const signal = service.signal;
  
  // Base product on speed
  let product = {};
  
  if (downloadSpeed <= 50) {
    product = {
      product: "SkyFibre Home Lite",
      speed: "50/50 Mbps",
      price: "R1,089",
      promo: "R899 (First 3 months)"
    };
  } else if (downloadSpeed <= 100) {
    product = {
      product: "SkyFibre Home Plus",
      speed: "100/100 Mbps",
      price: "R1,259",
      promo: "R999 (First 3 months)"
    };
  } else {
    product = {
      product: "SkyFibre Home Max",
      speed: "200/200 Mbps",
      price: "R1,449",
      promo: "R1,099 (First 3 months)"
    };
  }
  
  // Add signal quality note
  product.signalQuality = signal;
  product.installation = {
    standard: "R900 (self-install R875)",
    timeline: "3-5 business days"
  };
  
  return product;
}
```

#### 1.3 Mobile 5G Services → MTN Business Standard Uncapped 5G

**API Indicators:**
```json
{
  "type": "5g",
  "source": "consumer",
  "technology": "5G NR",
  "estimatedSpeed": {"download": 500, "upload": 100, "unit": "Mbps"}
}
```

**Product Mapping Logic:**

| API Speed Range | Circle Tel Product | Monthly Price | Data Allocation |
|-----------------|-------------------|---------------|-----------------|
| High speed (200+) | MTN 5G Standard | R795 | 250GB FUP |
| Standard (100-200) | MTN 5G Premium | R1,095 | 500GB FUP |

**Note:** These are MTN retail products that Circle Tel can resell or recommend.

#### 1.4 LTE Services → MTN Business Broadband LTE

**API Indicators:**
```json
{
  "type": "lte",
  "source": "consumer",
  "technology": "LTE-A",
  "estimatedSpeed": {"download": 40, "upload": 16, "unit": "Mbps"}
}
```

**Product Mapping Logic:**

| Data Requirement | Circle Tel Recommendation | Monthly Price | Data Bundle |
|------------------|--------------------------|---------------|-------------|
| Light usage | MTN Business LTE 50GB | R599 | 50GB anytime |
| Moderate usage | MTN Business LTE 100GB | R899 | 100GB anytime |
| Heavy usage | MTN Business LTE 200GB | R1,399 | 200GB anytime |

---

### 2. BUSINESS PRODUCTS MAPPING

#### 2.1 Business Fibre → BizFibreConnect™

**API Indicators:**
```json
{
  "type": "fibre",
  "source": "business",
  "technology": "Fibre",
  "layer": "FTTBCoverage",
  "estimatedSpeed": {"download": 1, "upload": 1, "unit": "Gbps"}
}
```

**Product Mapping Logic:**

| API Speed Range | Circle Tel Product | Monthly Price | SLA Uptime | Support |
|-----------------|-------------------|---------------|------------|---------|
| Up to 25 Mbps | BizFibreConnect Essential | R1,699 | 99.5% | Business hours |
| 26-50 Mbps | BizFibreConnect Professional | R2,899 | 99.7% | Extended hours |
| 51-100 Mbps | BizFibreConnect Premium | R3,499 | 99.8% | 8am-8pm, 6 days |
| 101-200 Mbps | BizFibreConnect Enterprise | R4,999 | 99.9% | 24/7 support |

**Mapping Code Example:**
```javascript
function mapBusinessFibre(service, requirementLevel = "standard") {
  const downloadSpeed = service.estimatedSpeed.download;
  const unit = service.estimatedSpeed.unit;
  
  const speedMbps = unit === "Gbps" ? downloadSpeed * 1000 : downloadSpeed;
  
  let product = {};
  
  if (speedMbps <= 50) {
    product = {
      product: "BizFibreConnect Essential",
      speed: "50/50 Mbps",
      price: "R1,899",
      sla: "99.5% uptime",
      features: [
        "1× Static IP included",
        "Business-grade router",
        "Email hosting (5 accounts)",
        "Cloud backup (50GB)",
        "Business hours support"
      ],
      installation: "R2,550 (incl. project management)"
    };
  } else if (speedMbps <= 100) {
    product = {
      product: "BizFibreConnect Professional",
      speed: "100/100 Mbps",
      price: "R2,899",
      sla: "99.7% uptime",
      features: [
        "1× Static IP included",
        "Premium business router",
        "Email hosting (10 accounts)",
        "Cloud backup (100GB)",
        "VPN service (5 users)",
        "Extended hours support (8am-8pm)"
      ],
      installation: "R2,550 (incl. project management)"
    };
  } else if (speedMbps <= 200) {
    product = {
      product: "BizFibreConnect Premium",
      speed: "200/200 Mbps",
      price: "R4,499",
      sla: "99.8% uptime",
      features: [
        "2× Static IPs included",
        "Enterprise-grade router",
        "Email hosting (20 accounts)",
        "Cloud backup (250GB)",
        "Advanced security suite",
        "VPN service (10 users)",
        "24/7 support"
      ],
      installation: "Free with 24-month contract"
    };
  } else {
    product = {
      product: "BizFibreConnect Enterprise",
      speed: "Custom (up to 1Gbps)",
      price: "From R4,999",
      sla: "99.9% uptime",
      features: [
        "Multiple Static IPs",
        "Redundant enterprise routers",
        "Dedicated account manager",
        "Custom email solution",
        "Enterprise backup",
        "Advanced security & VPN",
        "24/7 priority support"
      ],
      installation: "Customised deployment"
    };
  }
  
  return product;
}
```

#### 2.2 Business Fixed Wireless → SkyFibre Business

**API Indicators:**
```json
{
  "type": "uncapped_wireless",
  "source": "business",
  "technology": "Wireless",
  "estimatedSpeed": {"download": 40, "upload": 16, "unit": "Mbps"}
}
```

**OR**

```json
{
  "type": "fixed_lte",
  "source": "business",
  "technology": "Fixed LTE",
  "estimatedSpeed": {"download": 80, "upload": 40, "unit": "Mbps"}
}
```

**Product Mapping Logic:**

| API Speed Range | Circle Tel Product | Monthly Price | SLA | Features |
|-----------------|-------------------|---------------|-----|----------|
| Up to 50 Mbps | SkyFibre Business Lite | R1,699 | 99.5% | Static IP, Business router |
| 51-100 Mbps | SkyFibre Business Plus | R2,199 | 99.7% | Static IP, Premium router, VPN |
| 101-200 Mbps | SkyFibre Business Pro | R2,899 | 99.8% | Multiple IPs, Enterprise router, 24/7 |

**Mapping Code Example:**
```javascript
function mapBusinessFixedWireless(service) {
  const downloadSpeed = service.estimatedSpeed.download;
  const technology = service.technology;
  
  let product = {};
  
  if (downloadSpeed <= 50) {
    product = {
      product: "SkyFibre Business Lite",
      speed: "50/50 Mbps",
      price: "R1,699",
      technology: technology,
      sla: "99.5% uptime",
      features: [
        "1× Static IP included",
        "Business-grade wireless router",
        "Low latency (<5ms)",
        "Business hours support",
        "Backup SIM included"
      ]
    };
  } else if (downloadSpeed <= 100) {
    product = {
      product: "SkyFibre Business Plus",
      speed: "100/100 Mbps",
      price: "R2,199",
      technology: technology,
      sla: "99.7% uptime",
      features: [
        "1× Static IP included",
        "Premium wireless router",
        "Low latency (<5ms)",
        "VPN service (5 users)",
        "Extended support (8am-8pm)",
        "Backup SIM included"
      ]
    };
  } else {
    product = {
      product: "SkyFibre Business Pro",
      speed: "200/200 Mbps",
      price: "R2,899",
      technology: technology,
      sla: "99.8% uptime",
      features: [
        "2× Static IPs included",
        "Enterprise wireless router",
        "Ultra-low latency (<3ms)",
        "Advanced security",
        "VPN service (10 users)",
        "24/7 priority support",
        "Backup SIM included"
      ]
    };
  }
  
  product.installation = {
    cost: "R2,550 (professional installation)",
    timeline: "3-5 business days",
    includes: "Site survey, optimal CPE placement, testing"
  };
  
  return product;
}
```

---

## Complete Mapping Decision Tree

### Decision Flow

```
API Response Received
    ↓
Check "available" = true
    ↓
Identify Customer Segment
    ├── Consumer Request
    │   ↓
    │   Check Available Technologies (Priority Order)
    │   ├── 1. Fibre (FTTH) Available?
    │   │   → Map to HomeFibreConnect (Based on speed)
    │   ├── 2. Fixed Wireless Available?
    │   │   → Map to SkyFibre Home (Based on speed)
    │   ├── 3. 5G Available?
    │   │   → Recommend MTN 5G Products
    │   └── 4. LTE Available?
    │       → Recommend MTN LTE Products
    │
    └── Business Request
        ↓
        Check Available Technologies (Priority Order)
        ├── 1. Business Fibre Available?
        │   → Map to BizFibreConnect (Based on speed + SLA requirements)
        ├── 2. Business Fixed Wireless / Fixed LTE?
        │   → Map to SkyFibre Business (Based on speed + SLA requirements)
        ├── 3. Uncapped Wireless?
        │   → Map to SkyFibre Business
        └── 4. Consumer technologies available?
            → Offer business packages of consumer products with enhanced SLAs
```

### Implementation Code Example

```javascript
/**
 * Main mapping function for MTN Coverage API to Circle Tel Products
 * @param {Object} apiResponse - The full API response from /api/coverage/mtn/check
 * @param {String} customerSegment - "consumer" or "business"
 * @param {Object} customerNeeds - Additional customer requirements
 * @returns {Object} Recommended products with pricing and features
 */
function mapCoverageToProducts(apiResponse, customerSegment = "consumer", customerNeeds = {}) {
  
  // Validation
  if (!apiResponse.success || !apiResponse.data.available) {
    return {
      available: false,
      message: "No Circle Tel services available at this location",
      recommendations: []
    };
  }
  
  const { services, confidence, location } = apiResponse.data;
  const targetServices = customerSegment === "consumer" 
    ? services.filter(s => s.source === "consumer")
    : services.filter(s => s.source === "business");
  
  // Technology priority mapping
  const technologyPriority = {
    fibre: 1,
    uncapped_wireless: 2,
    fixed_lte: 3,
    "5g": 4,
    lte: 5
  };
  
  // Sort services by priority
  const sortedServices = targetServices
    .filter(s => s.available)
    .sort((a, b) => technologyPriority[a.type] - technologyPriority[b.type]);
  
  if (sortedServices.length === 0) {
    return {
      available: false,
      message: `No ${customerSegment} services available at this location`,
      recommendations: []
    };
  }
  
  // Map each available service to products
  const recommendations = sortedServices.map((service, index) => {
    let productMapping = {};
    
    if (customerSegment === "consumer") {
      switch (service.type) {
        case "fibre":
          productMapping = mapConsumerFibre(service);
          productMapping.priority = 1;
          productMapping.recommendedUse = "Primary Connection";
          break;
        case "5g":
          productMapping = mapConsumer5G(service);
          productMapping.priority = 2;
          productMapping.recommendedUse = index === 0 ? "Primary Connection" : "Backup/Mobile";
          break;
        case "lte":
          productMapping = mapConsumerLTE(service);
          productMapping.priority = 3;
          productMapping.recommendedUse = "Backup/Mobile";
          break;
        default:
          productMapping = null;
      }
    } else {
      // Business segment
      switch (service.type) {
        case "fibre":
          productMapping = mapBusinessFibre(service, customerNeeds.slaRequirement);
          productMapping.priority = 1;
          productMapping.recommendedUse = "Primary Connection";
          break;
        case "uncapped_wireless":
        case "fixed_lte":
          productMapping = mapBusinessFixedWireless(service);
          productMapping.priority = 2;
          productMapping.recommendedUse = index === 0 ? "Primary Connection" : "Failover/Backup";
          break;
        default:
          productMapping = null;
      }
    }
    
    if (productMapping) {
      productMapping.technology = service.technology;
      productMapping.signalStrength = service.signal;
      productMapping.coverageConfidence = confidence;
      productMapping.locationInfo = {
        province: location.province,
        nearestCity: location.nearestCity,
        populationDensity: location.populationDensityArea
      };
    }
    
    return productMapping;
  }).filter(p => p !== null);
  
  return {
    available: true,
    confidence: confidence,
    location: location,
    recommendations: recommendations,
    hybridSolutions: generateHybridRecommendations(recommendations, customerSegment)
  };
}

/**
 * Generate hybrid/bundle recommendations
 */
function generateHybridRecommendations(recommendations, customerSegment) {
  const hybrids = [];
  
  // If both fibre and wireless available, suggest failover
  const hasFibre = recommendations.some(r => r.technology === "FTTH" || r.technology === "Fibre");
  const hasWireless = recommendations.some(r => r.technology.includes("Wireless") || r.technology.includes("LTE"));
  
  if (hasFibre && hasWireless && customerSegment === "business") {
    hybrids.push({
      bundle: "Circle Business Continuity Bundle",
      description: "Primary fibre connection with automatic wireless failover",
      components: [
        recommendations.find(r => r.technology === "FTTH" || r.technology === "Fibre"),
        recommendations.find(r => r.technology.includes("Wireless") || r.technology.includes("LTE"))
      ],
      pricing: "Combined discount: 15% off backup connection",
      uptime: "99.99% combined uptime guarantee"
    });
  }
  
  return hybrids;
}

// Helper function examples for specific technologies
function mapConsumer5G(service) {
  return {
    product: "MTN 5G Standard",
    speed: "Up to 500 Mbps",
    price: "R795",
    dataAllocation: "250GB FUP",
    features: [
      "Mobile 5G connectivity",
      "No fixed installation",
      "Portable router",
      "Month-to-month contract"
    ],
    limitations: "Fair usage policy applies, coverage dependent on location"
  };
}

function mapConsumerLTE(service) {
  const downloadSpeed = service.estimatedSpeed.download;
  
  if (downloadSpeed >= 40) {
    return {
      product: "MTN Business LTE 200GB",
      speed: "Up to 40 Mbps",
      price: "R1,399",
      dataAllocation: "200GB anytime",
      features: [
        "LTE-A connectivity",
        "No fixed installation",
        "Anytime data (no peak/off-peak)",
        "Month-to-month contract"
      ]
    };
  } else {
    return {
      product: "MTN Business LTE 100GB",
      speed: "Up to 40 Mbps",
      price: "R899",
      dataAllocation: "100GB anytime",
      features: [
        "LTE-A connectivity",
        "No fixed installation",
        "Anytime data",
        "Month-to-month contract"
      ]
    };
  }
}
```

---

## API Response Handling Best Practices

### 1. Coverage Confidence Levels

**High Confidence:**
- Directly recommend products
- Provide pricing and installation timelines
- Enable immediate checkout

**Medium Confidence:**
- Recommend products with caveat
- Suggest site survey before commitment
- Provide provisional pricing

**Low Confidence:**
- Don't recommend specific products
- Suggest contacting sales for site assessment
- Provide general product information only

### 2. Signal Quality Handling

```javascript
function adjustRecommendationBySignal(product, signalStrength) {
  const signalImpact = {
    excellent: {
      confidence: "Recommended",
      note: "Excellent signal strength for optimal performance"
    },
    good: {
      confidence: "Recommended",
      note: "Good signal strength, reliable performance expected"
    },
    fair: {
      confidence: "Possible with assessment",
      note: "Fair signal strength. Site survey recommended before installation"
    },
    poor: {
      confidence: "Not recommended",
      note: "Poor signal strength. Alternative technologies recommended"
    }
  };
  
  return {
    ...product,
    signalAssessment: signalImpact[signalStrength],
    requiresSiteSurvey: ["fair", "poor"].includes(signalStrength)
  };
}
```

### 3. Location-Based Adjustments

```javascript
function applyLocationAdjustments(products, location) {
  const { populationDensityArea, distanceToMajorCity } = location;
  
  // Rural areas (>50km from city)
  if (populationDensityArea === "rural" || distanceToMajorCity > 50) {
    products.forEach(product => {
      if (product.technology.includes("Wireless") || product.technology.includes("FWA")) {
        product.note = "Wireless solutions ideal for rural areas without fibre infrastructure";
        product.priority = 1; // Boost wireless priority in rural areas
      }
      
      // Extend installation timelines for rural
      if (product.installation && product.installation.timeline) {
        product.installation.timeline = product.installation.timeline.replace("3-5", "5-10");
        product.installation.note = "Extended timeline due to location";
      }
    });
  }
  
  return products;
}
```

---

## Error Handling and Edge Cases

### 1. No Coverage Available

```javascript
function handleNoCoverage(apiResponse) {
  return {
    available: false,
    message: "Unfortunately, Circle Tel services are not yet available at your location.",
    alternatives: [
      {
        action: "Register Interest",
        description: "Register your interest and we'll notify you when services become available",
        url: "/register-interest"
      },
      {
        action: "Check Nearby Locations",
        description: "Coverage may be available at nearby addresses",
        url: "/coverage-map"
      },
      {
        action: "Mobile Solutions",
        description: "Explore our mobile data solutions available nationwide",
        products: ["MTN 5G", "MTN LTE", "CircleConnect IoT"]
      }
    ],
    futureAvailability: estimateFutureAvailability(apiResponse.data.location)
  };
}
```

### 2. Conflicting Technology Data

```javascript
function resolveConflicts(services) {
  // If both consumer and business fibre available, prefer business for B2B customers
  const consumerFibre = services.filter(s => s.type === "fibre" && s.source === "consumer");
  const businessFibre = services.filter(s => s.type === "fibre" && s.source === "business");
  
  if (consumerFibre.length > 0 && businessFibre.length > 0) {
    // Return both but mark appropriately
    return {
      consumerRecommendation: consumerFibre[0],
      businessRecommendation: businessFibre[0],
      note: "Different products available for consumer vs business segments"
    };
  }
  
  return services;
}
```

### 3. Speed Mismatches

```javascript
function validateSpeedClaims(estimatedSpeed, technology) {
  const technologyLimits = {
    "FTTH": { max: 1000, typical: 200 },
    "FWA": { max: 200, typical: 100 },
    "5G NR": { max: 500, typical: 200 },
    "LTE-A": { max: 100, typical: 40 }
  };
  
  const limit = technologyLimits[technology];
  if (!limit) return estimatedSpeed;
  
  // Convert to Mbps if needed
  let speedMbps = estimatedSpeed.download;
  if (estimatedSpeed.unit === "Gbps") speedMbps *= 1000;
  
  // Cap at realistic maximum
  if (speedMbps > limit.max) {
    return {
      ...estimatedSpeed,
      download: limit.typical,
      note: `Speed capped at typical ${technology} performance`
    };
  }
  
  return estimatedSpeed;
}
```

---

## Integration with Circle Tel Systems

### 1. CRM Integration

```javascript
async function saveCustomerCoverageCheck(customerData, apiResponse, recommendations) {
  const coverageRecord = {
    customerId: customerData.id,
    checkDate: new Date().toISOString(),
    location: {
      coordinates: apiResponse.data.coordinates,
      address: customerData.address,
      province: apiResponse.data.location.province
    },
    coverageStatus: apiResponse.data.available,
    confidence: apiResponse.data.confidence,
    availableTechnologies: apiResponse.data.services.map(s => s.type),
    recommendedProducts: recommendations.map(r => ({
      product: r.product,
      price: r.price,
      priority: r.priority
    })),
    customerSegment: customerData.segment || "consumer"
  };
  
  // Save to CRM
  await crm.saveCoverageCheck(coverageRecord);
  
  // Trigger follow-up workflows
  if (apiResponse.data.available) {
    await crm.triggerWorkflow("coverage-available", customerData.id);
  } else {
    await crm.triggerWorkflow("coverage-unavailable", customerData.id);
  }
}
```

### 2. Quote Generation

```javascript
async function generateQuote(customerData, selectedProduct, recommendations) {
  const quote = {
    quoteNumber: generateQuoteNumber(),
    customerName: customerData.name,
    customerEmail: customerData.email,
    serviceAddress: customerData.address,
    product: selectedProduct,
    monthlyRecurring: selectedProduct.price,
    installationCost: selectedProduct.installation?.cost || "R0",
    equipmentCost: selectedProduct.equipment?.cost || "Included",
    validUntil: addDays(new Date(), 30),
    terms: {
      contractLength: "24 months",
      earlyTerminationFee: "50% of remaining contract value",
      sla: selectedProduct.sla || "Best effort"
    },
    alternativeProducts: recommendations.filter(r => r.product !== selectedProduct.product)
  };
  
  return quote;
}
```

### 3. Order Processing

```javascript
async function processOrder(quoteData, customerConfirmation) {
  // Validate coverage still available
  const currentCoverage = await checkMTNCoverage(customerConfirmation.address);
  
  if (!currentCoverage.data.available) {
    throw new Error("Coverage no longer available at this location");
  }
  
  // Create order in system
  const order = {
    orderNumber: generateOrderNumber(),
    customerId: customerConfirmation.customerId,
    product: quoteData.product,
    serviceAddress: customerConfirmation.address,
    status: "pending_installation",
    coverageDetails: {
      technology: quoteData.product.technology,
      signalStrength: currentCoverage.signalStrength,
      confidence: currentCoverage.confidence
    },
    installation: {
      scheduledDate: customerConfirmation.preferredDate,
      type: customerConfirmation.installationType || "professional",
      notes: generateInstallationNotes(currentCoverage, quoteData.product)
    }
  };
  
  // Submit to installation queue
  await installationQueue.add(order);
  
  // Provision wholesale service
  await mtnWholesale.provisionService({
    serviceType: mapProductToWholesaleService(quoteData.product),
    address: customerConfirmation.address,
    orderReference: order.orderNumber
  });
  
  return order;
}
```

---

## Reporting and Analytics

### 1. Coverage Analytics Dashboard

```javascript
const coverageAnalytics = {
  
  // Track coverage requests by location
  async trackCoverageByLocation() {
    return await db.query(`
      SELECT 
        province,
        COUNT(*) as checks,
        SUM(CASE WHEN available = true THEN 1 ELSE 0 END) as available_count,
        AVG(CASE WHEN available = true THEN 1 ELSE 0 END) * 100 as availability_rate
      FROM coverage_checks
      WHERE check_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY province
    `);
  },
  
  // Track popular products by technology
  async trackProductRecommendations() {
    return await db.query(`
      SELECT 
        technology,
        product_name,
        COUNT(*) as recommendation_count,
        SUM(CASE WHEN order_placed = true THEN 1 ELSE 0 END) as conversion_count,
        AVG(CASE WHEN order_placed = true THEN 1 ELSE 0 END) * 100 as conversion_rate
      FROM coverage_recommendations
      WHERE recommendation_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY technology, product_name
      ORDER BY recommendation_count DESC
    `);
  },
  
  // Identify coverage gaps
  async identifyCoverageGaps() {
    return await db.query(`
      SELECT 
        province,
        nearest_city,
        COUNT(*) as no_coverage_checks,
        GROUP_CONCAT(DISTINCT customer_segment) as affected_segments
      FROM coverage_checks
      WHERE available = false
        AND check_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY province, nearest_city
      HAVING no_coverage_checks >= 10
      ORDER BY no_coverage_checks DESC
    `);
  }
};
```

---

## Version Control and Updates

### Update Procedure

1. **API Changes:** When MTN updates their API, update mapping logic in this document
2. **Product Changes:** When Circle Tel launches new products, add to mapping tables
3. **Pricing Changes:** Update pricing tables monthly or as changes occur
4. **Testing:** Validate mappings against API responses before deployment

### Change Log

| Version | Date | Description | Author |
|---------|------|-------------|--------|
| 1.0 | 21 October 2025 | Initial document creation | Circle Tel Product Team |

---

## Appendix A: Complete Product Reference

### Consumer Products

| Product Line | Products | Speed Range | Price Range |
|--------------|----------|-------------|-------------|
| HomeFibreConnect | Starter, Plus, Max, Ultra | 25-200 Mbps | R899-R2,299 |
| SkyFibre Home | Lite, Plus, Max | 50-200 Mbps | R1,089-R1,449 |
| MTN 5G (Resale) | Standard, Premium | Up to 500 Mbps | R795-R1,095 |
| MTN LTE (Resale) | 50GB, 100GB, 200GB | Up to 40 Mbps | R599-R1,399 |

### Business Products

| Product Line | Products | Speed Range | Price Range | SLA |
|--------------|----------|-------------|-------------|-----|
| BizFibreConnect | Essential, Professional, Premium, Enterprise | 50-1000 Mbps | R1,899-R4,999+ | 99.5-99.9% |
| SkyFibre Business | Lite, Plus, Pro | 50-200 Mbps | R1,699-R2,899 | 99.5-99.8% |
| CircleConnect IoT | Various verticals | Varies | Custom | 99.5%+ |

---

## Appendix B: MTN Wholesale Costs Reference

### Fixed Wireless Broadband (July 2025 Pricing)

| Speed Package | Wholesale Cost | Retail Price (Consumer) | Retail Price (Business) |
|--------------|----------------|------------------------|------------------------|
| 50 Mbps | R499 | R1,089 (SkyFibre Home Lite) | R1,699 (SkyFibre Business Lite) |
| 100 Mbps | R599 | R1,259 (SkyFibre Home Plus) | R2,199 (SkyFibre Business Plus) |
| 200 Mbps | R699 | R1,449 (SkyFibre Home Max) | R2,899 (SkyFibre Business Pro) |

### FTTH (Estimated Wholesale Costs)

| Speed Package | Wholesale Cost | Retail Price (Consumer) | Retail Price (Business) |
|--------------|----------------|------------------------|------------------------|
| 25 Mbps | R499 | R899 (HomeFibreConnect Starter) | R1,699 (BizFibreConnect Essential) |
| 50 Mbps | R599 | R1,199 (HomeFibreConnect Plus) | R2,899 (BizFibreConnect Professional) |
| 100 Mbps | R699 | R1,599 (HomeFibreConnect Max) | R3,499 (BizFibreConnect Premium) |
| 200 Mbps | R899 | R2,299 (HomeFibreConnect Ultra) | R4,999 (BizFibreConnect Enterprise) |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | | | |
| Technical Lead | | | |
| Sales Director | | | |
| Operations Manager | | | |

---

**End of Document**
