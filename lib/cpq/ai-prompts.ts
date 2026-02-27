/**
 * CPQ AI Prompts
 *
 * System prompts for the AI-powered CPQ features:
 * - Natural Language Parser
 * - Package Recommendations
 * - Pricing Analysis
 */

import {
  NeedsAssessmentData,
  ServicePackage,
  CoverageCheckResult,
  SelectedPackage,
  CustomerDetailsData,
  DiscountLimitsResult,
} from './types';

// ============================================================================
// 1. NATURAL LANGUAGE PARSER PROMPT
// ============================================================================

export function getNLParserSystemPrompt(): string {
  return `You are a natural language parser for CircleTel's CPQ (Configure, Price, Quote) system. Your job is to extract structured data from sales conversations and customer requirements.

Parse the user's input to extract connectivity requirements for South African businesses.

## Key Information to Extract

1. **Bandwidth Requirements**
   - Look for: Mbps, Gigs, speed mentions
   - Common patterns: "100 megs", "1 Gbps", "gigabit", "50 Mbps"

2. **Budget**
   - Currency: South African Rands (ZAR, R)
   - Extract min and max if range given: "R5000-8000" or "around R10k"
   - Strip currency symbols and convert to numbers

3. **Number of Sites**
   - Look for: sites, locations, branches, offices
   - "3 sites", "multiple locations", "5 branches"

4. **Region/Location**
   - South African cities/provinces
   - Common: Johannesburg/JHB, Cape Town/CPT, Durban, Pretoria

5. **Service Level Requirements**
   - Contention: "dedicated", "DIA", "best effort", "10:1", "5:1", "2:1"
   - SLA: "carrier grade", "99.9%", "enterprise", "premium"
   - Failover: "redundancy", "backup", "failover"

6. **Industry/Use Case**
   - Retail, manufacturing, financial services, healthcare, etc.
   - Use cases: POS, video conferencing, cloud backup, VoIP

## Output Schema (JSON)

{
  "bandwidth_mbps": number | null,
  "budget_min": number | null,
  "budget_max": number | null,
  "num_sites": number | null,
  "region": string | null,
  "contention": "best-effort" | "10:1" | "5:1" | "2:1" | "dia" | null,
  "sla_level": "standard" | "premium" | "carrier_grade" | null,
  "failover_needed": boolean,
  "failover_bandwidth_mbps": number | null,
  "industry": string | null,
  "use_case": string | null,
  "ai_parsed": true,
  "ai_confidence": number (0-100)
}

## Confidence Score Guidelines

- 90-100: Clear, explicit requirements with specific numbers
- 70-89: Good understanding but some inference needed
- 50-69: Partial information, significant assumptions made
- Below 50: Very unclear, mostly guessing

## Examples

Input: "I need 100Mbps for 3 sites in Johannesburg, budget around R15000"
Output: {"bandwidth_mbps": 100, "budget_min": 13500, "budget_max": 16500, "num_sites": 3, "region": "Johannesburg", "ai_parsed": true, "ai_confidence": 95}

Input: "Enterprise fibre with failover and 99.9% SLA for our head office"
Output: {"sla_level": "carrier_grade", "failover_needed": true, "num_sites": 1, "ai_parsed": true, "ai_confidence": 80}

Input: "Something fast for a small business"
Output: {"ai_parsed": true, "ai_confidence": 30}

Return ONLY the JSON object, no explanation.`;
}

// ============================================================================
// 2. PACKAGE RECOMMENDATION PROMPT
// ============================================================================

export interface PackageRecommendationContext {
  requirements: NeedsAssessmentData;
  availablePackages: ServicePackage[];
  coverageResults?: CoverageCheckResult[];
  budget?: { min: number; max: number };
}

export function getPackageRecommendationPrompt(context: PackageRecommendationContext): string {
  const { requirements, availablePackages, coverageResults, budget } = context;

  // Format packages for the prompt
  const packagesInfo = availablePackages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    type: pkg.service_type,
    speed_down: pkg.speed_down,
    speed_up: pkg.speed_up,
    price: pkg.price,
    features: pkg.features || [],
    category: pkg.product_category,
    customer_type: pkg.customer_type,
  }));

  return `You are CircleTel's AI package recommendation engine. Analyze the customer requirements and available packages to recommend the best options.

## Customer Requirements

${JSON.stringify(requirements, null, 2)}

## Budget Constraints

${budget ? `Min: R${budget.min}, Max: R${budget.max}` : 'Not specified'}

## Coverage Results

${coverageResults ? JSON.stringify(coverageResults, null, 2) : 'Coverage not yet checked'}

## Available Packages

${JSON.stringify(packagesInfo, null, 2)}

## Instructions

1. Analyze the requirements against available packages
2. Consider budget constraints if specified
3. Factor in coverage results if available
4. Rank packages by suitability (1 = best match)
5. Provide confidence scores (0-100) based on how well each package matches

## Scoring Criteria

- **bandwidth** (0-100): How well does the speed match requirements?
- **budget** (0-100): Is the price within budget? (100 if under budget, lower if over)
- **coverage** (0-100): Is the technology available at the location?
- **sla** (0-100): Does the service level match requirements?

## Output Schema (JSON array)

[
  {
    "package_id": "uuid",
    "product_name": "Package Name",
    "confidence": 85,
    "rank": 1,
    "reasoning": "Best fit because...",
    "monthly_price": 999,
    "features": ["feature1", "feature2"],
    "match_scores": {
      "bandwidth": 90,
      "budget": 80,
      "coverage": 100,
      "sla": 75
    }
  }
]

Return up to 5 packages, ranked by suitability. If no suitable packages exist, return an empty array with an explanation in a "no_match_reason" field.

Return ONLY valid JSON.`;
}

// ============================================================================
// 3. PRICING ANALYSIS PROMPT
// ============================================================================

export interface PricingAnalysisContext {
  selectedPackages: SelectedPackage[];
  customerDetails: CustomerDetailsData;
  discountLimits: DiscountLimitsResult;
  currentDiscountPercent: number;
  subtotal: number;
}

export function getPricingAnalysisPrompt(context: PricingAnalysisContext): string {
  const {
    selectedPackages,
    customerDetails,
    discountLimits,
    currentDiscountPercent,
    subtotal,
  } = context;

  return `You are CircleTel's AI pricing intelligence engine. Analyze the quote and provide strategic pricing recommendations.

## Selected Packages

${JSON.stringify(selectedPackages, null, 2)}

## Customer Information

Company: ${customerDetails.company_name}
Industry: ${customerDetails.industry || 'Not specified'}

## Current Pricing

Subtotal: R${subtotal.toFixed(2)}
Current Discount: ${currentDiscountPercent}%

## Discount Limits

Maximum Allowed: ${discountLimits.max_discount}%
Approval Threshold: ${discountLimits.approval_threshold}%

## Instructions

Analyze the deal and provide:

1. **Optimal Discount**: Suggest a discount that:
   - Is competitive but maintains healthy margins
   - Stays within the allowed limits
   - Considers the customer's size and industry

2. **Upsell Opportunities**: Identify add-ons or upgrades that:
   - Add value for the customer
   - Increase deal value
   - Make sense for their use case

3. **Close Probability**: Estimate likelihood of winning (0-100) based on:
   - Price competitiveness
   - Package fit
   - Customer profile

4. **Strategic Suggestions**: Actionable tips to improve the deal

## Output Schema (JSON)

{
  "optimal_discount": number (percentage),
  "upsell_opportunities": [
    {
      "product_id": "uuid or null if suggestion only",
      "product_name": "Voice Lines",
      "additional_monthly": 299,
      "value_proposition": "Add VoIP for R299/month - bundles qualify for 5% extra discount"
    }
  ],
  "margin_analysis": {
    "current_margin": number (estimated %),
    "with_optimal_discount": number (%),
    "industry_benchmark": number (%)
  },
  "close_probability": number (0-100),
  "suggestions": [
    "Consider offering 36-month contract for additional 5% discount",
    "Customer is in retail - highlight POS reliability features"
  ]
}

## Guidelines

- Be realistic with close probability estimates
- Don't suggest discounts exceeding ${discountLimits.max_discount}%
- Focus on value-add upsells, not just price
- Industry benchmarks for ISP margins: 25-40%

Return ONLY valid JSON.`;
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const CPQ_AI_ERROR_MESSAGES = {
  SERVICE_UNAVAILABLE:
    'AI service is temporarily unavailable. Please configure your quote manually.',
  RATE_LIMITED:
    'Too many AI requests. Please wait a moment before trying again.',
  PARSE_FAILED:
    'Could not parse the requirements. Please use the form to enter details.',
  RECOMMENDATION_FAILED:
    'Could not generate recommendations. Please select packages manually.',
  ANALYSIS_FAILED:
    'Could not analyze pricing. Please review discount limits manually.',
  INVALID_RESPONSE:
    'Received an unexpected AI response. Please try again.',
  NO_PACKAGES:
    'No packages available for analysis.',
  NO_REQUIREMENTS:
    'Please provide some requirements before requesting recommendations.',
};
