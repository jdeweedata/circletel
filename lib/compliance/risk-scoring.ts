/**
 * KYC Risk Scoring System
 *
 * Calculates risk tier based on Didit-extracted KYC data
 * Uses 100-point scoring system with weighted factors
 */

import type { ExtractedKYCData, RiskTier, RiskScoreBreakdown } from '@/lib/integrations/didit/types';

/**
 * Risk Scoring Weights (Total: 100 points)
 *
 * - Liveness Score: 40 points (most important - proves real person)
 * - Document Validity: 30 points (authentic documents)
 * - AML Screening: 30 points (no money laundering flags)
 */
const WEIGHTS = {
  LIVENESS_MAX: 40,
  DOCUMENT_VALIDITY_MAX: 30,
  AML_SCREENING_MAX: 30,
};

/**
 * Risk Tier Thresholds
 *
 * - Low Risk (80-100): Auto-approve, generate contract immediately
 * - Medium Risk (50-79): Escalate to admin compliance queue
 * - High Risk (0-49): Auto-decline, notify customer
 */
const RISK_THRESHOLDS = {
  LOW_RISK_MIN: 80,
  MEDIUM_RISK_MIN: 50,
};

/**
 * Calculate Risk Tier from Extracted KYC Data
 *
 * Evaluates liveness detection, document authenticity, and AML flags
 * to produce a risk score and classification
 *
 * @param extractedData - KYC data from Didit verification
 * @returns Risk score breakdown with tier and auto-approval flag
 *
 * @example
 * const riskScore = calculateRiskTier(kycData);
 * if (riskScore.auto_approved) {
 *   // Generate contract automatically
 * } else if (riskScore.risk_tier === 'medium') {
 *   // Send to admin compliance queue
 * } else {
 *   // Decline and notify customer
 * }
 */
export function calculateRiskTier(extractedData: ExtractedKYCData): RiskScoreBreakdown {
  const livenessPoints = calculateLivenessPoints(extractedData.liveness_score);
  const documentPoints = calculateDocumentValidityPoints(extractedData);
  const amlPoints = calculateAMLPoints(extractedData);

  const totalScore = livenessPoints + documentPoints + amlPoints;
  const riskTier = determineRiskTier(totalScore);
  const autoApproved = riskTier === 'low';

  const reasoning: string[] = [];

  // Build reasoning explanation
  if (livenessPoints === WEIGHTS.LIVENESS_MAX) {
    reasoning.push(`Strong liveness detection (${extractedData.liveness_score.toFixed(2)} score)`);
  } else if (livenessPoints < WEIGHTS.LIVENESS_MAX / 2) {
    reasoning.push(`Weak liveness detection (${extractedData.liveness_score.toFixed(2)} score) - potential fraud risk`);
  }

  if (documentPoints === WEIGHTS.DOCUMENT_VALIDITY_MAX) {
    reasoning.push('All documents verified as authentic');
  } else if (extractedData.document_authenticity === 'suspicious') {
    reasoning.push('Document authenticity flagged as suspicious - requires manual review');
  } else if (extractedData.document_authenticity === 'invalid') {
    reasoning.push('Invalid documents detected - potential forgery');
  }

  if (amlPoints === WEIGHTS.AML_SCREENING_MAX) {
    reasoning.push('Clean AML screening - no red flags');
  } else {
    const flagCount = extractedData.aml_flags.length;
    reasoning.push(`AML screening flagged ${flagCount} issue${flagCount > 1 ? 's' : ''}`);
    if (extractedData.sanctions_match) {
      reasoning.push('⚠️ Sanctions list match detected');
    }
    if (extractedData.pep_match) {
      reasoning.push('⚠️ Politically Exposed Person (PEP) detected');
    }
  }

  console.log(`[Risk Scoring] Total: ${totalScore}/100 (${riskTier}) - Auto-approved: ${autoApproved}`);

  return {
    liveness_score_points: livenessPoints,
    document_validity_points: documentPoints,
    aml_screening_points: amlPoints,
    total_score: totalScore,
    risk_tier: riskTier,
    auto_approved: autoApproved,
    reasoning,
  };
}

/**
 * Calculate Liveness Detection Points (Max 40)
 *
 * Liveness score from Didit (0.0 to 1.0) indicates confidence
 * that the person is real (not a photo, video, or deepfake)
 *
 * Scoring:
 * - >=0.9: 40 points (very high confidence)
 * - >=0.8: 35 points (high confidence)
 * - >=0.7: 25 points (medium confidence)
 * - >=0.6: 15 points (low confidence)
 * - <0.6: 0 points (failed liveness check)
 *
 * @param livenessScore - Didit liveness score (0.0 to 1.0)
 * @returns Points awarded (0-40)
 */
function calculateLivenessPoints(livenessScore: number): number {
  if (livenessScore >= 0.9) return 40;
  if (livenessScore >= 0.8) return 35;
  if (livenessScore >= 0.7) return 25;
  if (livenessScore >= 0.6) return 15;
  return 0;
}

/**
 * Calculate Document Validity Points (Max 30)
 *
 * Checks authenticity of ID document, company registration (if business),
 * and proof of address
 *
 * Scoring:
 * - All documents valid: 30 points
 * - Suspicious documents: 15 points (manual review needed)
 * - Invalid documents: 0 points (forgery detected)
 *
 * @param extractedData - KYC data including document authenticity
 * @returns Points awarded (0-30)
 */
function calculateDocumentValidityPoints(extractedData: ExtractedKYCData): number {
  const { document_authenticity, document_validation_details } = extractedData;

  // Check overall authenticity verdict
  if (document_authenticity === 'valid') {
    // Additional check: ensure all individual documents passed
    if (document_validation_details) {
      const allValid =
        document_validation_details.id_document_valid &&
        document_validation_details.proof_of_address_valid &&
        (document_validation_details.company_reg_valid !== false); // undefined or true

      if (allValid) {
        return 30; // All documents validated
      } else {
        return 20; // Overall valid but some warnings
      }
    }
    return 30; // No detailed validation, trust overall verdict
  }

  if (document_authenticity === 'suspicious') {
    return 15; // Needs manual review
  }

  // Invalid documents
  return 0;
}

/**
 * Calculate AML Screening Points (Max 30)
 *
 * Evaluates Anti-Money Laundering flags, sanctions matches,
 * and Politically Exposed Person (PEP) status
 *
 * Scoring:
 * - No flags: 30 points (clean)
 * - 1-2 flags: 15 points (low risk)
 * - 3+ flags or sanctions/PEP match: 0 points (high risk)
 *
 * @param extractedData - KYC data including AML flags
 * @returns Points awarded (0-30)
 */
function calculateAMLPoints(extractedData: ExtractedKYCData): number {
  const { aml_flags, sanctions_match, pep_match } = extractedData;

  // Critical matches = instant 0 points
  if (sanctions_match || pep_match) {
    return 0;
  }

  // Check flag count
  const flagCount = aml_flags.length;

  if (flagCount === 0) {
    return 30; // Clean screening
  }

  if (flagCount <= 2) {
    return 15; // Minor flags, low concern
  }

  // 3+ flags = high risk
  return 0;
}

/**
 * Determine Risk Tier from Total Score
 *
 * @param totalScore - Sum of all scoring factors (0-100)
 * @returns Risk tier classification
 */
function determineRiskTier(totalScore: number): RiskTier {
  if (totalScore >= RISK_THRESHOLDS.LOW_RISK_MIN) {
    return 'low';
  }

  if (totalScore >= RISK_THRESHOLDS.MEDIUM_RISK_MIN) {
    return 'medium';
  }

  return 'high';
}

/**
 * Get Risk Tier Color (for UI rendering)
 *
 * @param riskTier - Risk tier classification
 * @returns Tailwind color class
 */
export function getRiskTierColor(riskTier: RiskTier): string {
  switch (riskTier) {
    case 'low':
      return 'text-green-600 bg-green-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'high':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Get Risk Tier Label (for UI rendering)
 *
 * @param riskTier - Risk tier classification
 * @returns Human-readable label
 */
export function getRiskTierLabel(riskTier: RiskTier): string {
  switch (riskTier) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    default:
      return 'Unknown';
  }
}
