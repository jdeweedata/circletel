/**
 * CPQ AI Service
 *
 * AI-powered features for the CPQ system using Gemini:
 * - Natural Language Parsing
 * - Package Recommendations
 * - Pricing Analysis
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  NeedsAssessmentData,
  ServicePackage,
  CoverageCheckResult,
  SelectedPackage,
  CustomerDetailsData,
  DiscountLimitsResult,
  ParseNaturalLanguageResult,
  GetRecommendationsResult,
  AnalyzePricingResult,
  AIRecommendation,
} from './types';
import {
  getNLParserSystemPrompt,
  getPackageRecommendationPrompt,
  getPricingAnalysisPrompt,
  CPQ_AI_ERROR_MESSAGES,
  PackageRecommendationContext,
  PricingAnalysisContext,
} from './ai-prompts';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODEL_NAME = 'gemini-2.5-flash';

interface AIServiceConfig {
  maxRetries: number;
  parserTemperature: number;
  recommendationTemperature: number;
  analysisTemperature: number;
  maxOutputTokens: number;
}

const DEFAULT_CONFIG: AIServiceConfig = {
  maxRetries: 2,
  parserTemperature: 0.1, // Low for consistent parsing
  recommendationTemperature: 0.3, // Slightly higher for creative recommendations
  analysisTemperature: 0.2, // Low for consistent analysis
  maxOutputTokens: 4096,
};

// ============================================================================
// LAZY-LOADED GEMINI CLIENT
// ============================================================================

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('AI API key not configured (GOOGLE_AI_API_KEY or GEMINI_API_KEY)');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// ============================================================================
// 1. NATURAL LANGUAGE PARSER
// ============================================================================

/**
 * Parse natural language input into structured needs assessment data
 */
export async function parseNaturalLanguage(
  text: string,
  context?: { customerType?: 'business' | 'residential' }
): Promise<ParseNaturalLanguageResult> {
  const startTime = Date.now();

  if (!text || text.trim().length < 5) {
    return {
      success: false,
      error: CPQ_AI_ERROR_MESSAGES.NO_REQUIREMENTS,
    };
  }

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const systemPrompt = getNLParserSystemPrompt();
    const userPrompt = context?.customerType
      ? `Customer type: ${context.customerType}\n\nInput: ${text}`
      : `Input: ${text}`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: userPrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: DEFAULT_CONFIG.parserTemperature,
        maxOutputTokens: DEFAULT_CONFIG.maxOutputTokens,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text().trim();
    const responseTime = Date.now() - startTime;

    // Parse JSON response
    let parsed: NeedsAssessmentData;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error('Invalid JSON response');
      }
    }

    // Store original input
    parsed.raw_input = text;
    parsed.ai_parsed = true;

    // Get token counts
    const usageMetadata = result.response.usageMetadata;
    const tokens = usageMetadata
      ? {
          input: usageMetadata.promptTokenCount || 0,
          output: usageMetadata.candidatesTokenCount || 0,
        }
      : undefined;

    return {
      success: true,
      data: parsed,
      confidence: parsed.ai_confidence,
      tokens,
      response_time_ms: responseTime,
    };
  } catch (error) {
    console.error('[cpq-ai] Parse error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      return { success: false, error: CPQ_AI_ERROR_MESSAGES.SERVICE_UNAVAILABLE };
    }
    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      return { success: false, error: CPQ_AI_ERROR_MESSAGES.RATE_LIMITED };
    }

    return { success: false, error: CPQ_AI_ERROR_MESSAGES.PARSE_FAILED };
  }
}

// ============================================================================
// 2. PACKAGE RECOMMENDATIONS
// ============================================================================

/**
 * Get AI-powered package recommendations based on requirements
 */
export async function getPackageRecommendations(
  requirements: NeedsAssessmentData,
  availablePackages: ServicePackage[],
  coverageResults?: CoverageCheckResult[],
  budget?: { min: number; max: number }
): Promise<GetRecommendationsResult> {
  const startTime = Date.now();

  if (!availablePackages || availablePackages.length === 0) {
    return {
      success: false,
      error: CPQ_AI_ERROR_MESSAGES.NO_PACKAGES,
    };
  }

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const context: PackageRecommendationContext = {
      requirements,
      availablePackages,
      coverageResults,
      budget,
    };

    const prompt = getPackageRecommendationPrompt(context);

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: DEFAULT_CONFIG.recommendationTemperature,
        maxOutputTokens: DEFAULT_CONFIG.maxOutputTokens,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text().trim();
    const responseTime = Date.now() - startTime;

    // Parse JSON response
    let parsed: AIRecommendation[];
    try {
      const rawParsed = JSON.parse(responseText);
      // Handle both array and object with recommendations field
      parsed = Array.isArray(rawParsed) ? rawParsed : rawParsed.recommendations || [];
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const rawParsed = JSON.parse(jsonMatch[1].trim());
        parsed = Array.isArray(rawParsed) ? rawParsed : rawParsed.recommendations || [];
      } else {
        throw new Error('Invalid JSON response');
      }
    }

    // Validate and normalize recommendations
    const recommendations: AIRecommendation[] = parsed.map((rec, index) => ({
      package_id: rec.package_id || '',
      product_name: rec.product_name || 'Unknown Package',
      confidence: Math.min(100, Math.max(0, rec.confidence || 0)),
      rank: rec.rank || index + 1,
      reasoning: rec.reasoning || '',
      monthly_price: rec.monthly_price || 0,
      features: Array.isArray(rec.features) ? rec.features : [],
      match_scores: {
        bandwidth: rec.match_scores?.bandwidth || 0,
        budget: rec.match_scores?.budget || 0,
        coverage: rec.match_scores?.coverage || 0,
        sla: rec.match_scores?.sla || 0,
      },
    }));

    // Get token counts
    const usageMetadata = result.response.usageMetadata;
    const tokens = usageMetadata
      ? {
          input: usageMetadata.promptTokenCount || 0,
          output: usageMetadata.candidatesTokenCount || 0,
        }
      : undefined;

    return {
      success: true,
      recommendations,
      tokens,
      response_time_ms: responseTime,
    };
  } catch (error) {
    console.error('[cpq-ai] Recommendation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      return { success: false, error: CPQ_AI_ERROR_MESSAGES.SERVICE_UNAVAILABLE };
    }
    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      return { success: false, error: CPQ_AI_ERROR_MESSAGES.RATE_LIMITED };
    }

    return { success: false, error: CPQ_AI_ERROR_MESSAGES.RECOMMENDATION_FAILED };
  }
}

// ============================================================================
// 3. PRICING ANALYSIS
// ============================================================================

/**
 * Analyze pricing and provide optimization suggestions
 */
export async function analyzePricing(
  selectedPackages: SelectedPackage[],
  customerDetails: CustomerDetailsData,
  discountLimits: DiscountLimitsResult,
  currentDiscountPercent: number = 0,
  subtotal: number
): Promise<AnalyzePricingResult> {
  const startTime = Date.now();

  if (!selectedPackages || selectedPackages.length === 0) {
    return {
      success: false,
      error: CPQ_AI_ERROR_MESSAGES.NO_PACKAGES,
    };
  }

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const context: PricingAnalysisContext = {
      selectedPackages,
      customerDetails,
      discountLimits,
      currentDiscountPercent,
      subtotal,
    };

    const prompt = getPricingAnalysisPrompt(context);

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: DEFAULT_CONFIG.analysisTemperature,
        maxOutputTokens: DEFAULT_CONFIG.maxOutputTokens,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text().trim();
    const responseTime = Date.now() - startTime;

    // Parse JSON response
    let parsed: {
      optimal_discount?: number;
      upsell_opportunities?: Array<{
        product_id?: string;
        product_name: string;
        additional_monthly: number;
        value_proposition: string;
      }>;
      margin_analysis?: {
        current_margin: number;
        with_optimal_discount: number;
        industry_benchmark: number;
      };
      close_probability?: number;
      suggestions?: string[];
    };

    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error('Invalid JSON response');
      }
    }

    // Ensure optimal_discount doesn't exceed limits
    const optimalDiscount = Math.min(
      parsed.optimal_discount || 0,
      discountLimits.max_discount
    );

    // Get token counts
    const usageMetadata = result.response.usageMetadata;
    const tokens = usageMetadata
      ? {
          input: usageMetadata.promptTokenCount || 0,
          output: usageMetadata.candidatesTokenCount || 0,
        }
      : undefined;

    return {
      success: true,
      optimal_discount: optimalDiscount,
      upsell_opportunities: parsed.upsell_opportunities?.map((opp) => ({
        product_id: opp.product_id || '',
        product_name: opp.product_name,
        additional_monthly: opp.additional_monthly,
        value_proposition: opp.value_proposition,
      })),
      margin_analysis: parsed.margin_analysis,
      close_probability: Math.min(100, Math.max(0, parsed.close_probability || 50)),
      suggestions: parsed.suggestions || [],
      tokens,
      response_time_ms: responseTime,
    };
  } catch (error) {
    console.error('[cpq-ai] Analysis error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      return { success: false, error: CPQ_AI_ERROR_MESSAGES.SERVICE_UNAVAILABLE };
    }
    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      return { success: false, error: CPQ_AI_ERROR_MESSAGES.RATE_LIMITED };
    }

    return { success: false, error: CPQ_AI_ERROR_MESSAGES.ANALYSIS_FAILED };
  }
}

// ============================================================================
// AI USAGE TRACKING
// ============================================================================

export type CPQAIRequestType = 'cpq_parse' | 'cpq_recommend' | 'cpq_analyze';

export interface CPQAIUsageRecord {
  session_id?: string;
  partner_id?: string;
  admin_user_id?: string;
  request_type: CPQAIRequestType;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  response_time_ms?: number;
  success: boolean;
}

/**
 * Create a usage record for tracking AI costs
 */
export function createUsageRecord(
  requestType: CPQAIRequestType,
  result: ParseNaturalLanguageResult | GetRecommendationsResult | AnalyzePricingResult,
  context?: {
    session_id?: string;
    partner_id?: string;
    admin_user_id?: string;
  }
): CPQAIUsageRecord {
  return {
    session_id: context?.session_id,
    partner_id: context?.partner_id,
    admin_user_id: context?.admin_user_id,
    request_type: requestType,
    model_used: MODEL_NAME,
    input_tokens: result.tokens?.input || 0,
    output_tokens: result.tokens?.output || 0,
    response_time_ms: result.response_time_ms,
    success: result.success,
  };
}
