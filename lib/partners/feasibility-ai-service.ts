/**
 * Partner Feasibility AI Service
 *
 * AI-powered assistant for partner feasibility requests using Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ChatMessage,
  ExtractedFeasibilityData,
  CoverageResult,
  ExtractedRequirements,
} from './feasibility-types';
import {
  getChatSystemPrompt,
  EXTRACTION_SYSTEM_PROMPT,
  getRecommendationPrompt,
  AI_ERROR_MESSAGES,
} from './feasibility-prompts';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODEL_NAME = 'gemini-2.0-flash';

interface AIServiceConfig {
  maxRetries: number;
  chatTemperature: number;
  extractionTemperature: number;
  maxOutputTokens: number;
}

const DEFAULT_CONFIG: AIServiceConfig = {
  maxRetries: 2,
  chatTemperature: 0.5,
  extractionTemperature: 0.2,
  maxOutputTokens: 2048,
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
// CHAT FUNCTION
// ============================================================================

export interface ChatResult {
  success: boolean;
  response?: string;
  extracted_data?: Partial<ExtractedFeasibilityData>;
  tokens?: { input: number; output: number };
  response_time_ms?: number;
  error?: string;
}

export async function chat(
  message: string,
  history: ChatMessage[],
  partnerContext: {
    partner_name: string;
    partner_tier?: string;
    commission_rate?: number;
  }
): Promise<ChatResult> {
  const startTime = Date.now();

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    // Build conversation history for context
    const conversationParts: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Add system prompt as first user message
    conversationParts.push({
      role: 'user',
      parts: [{ text: getChatSystemPrompt(partnerContext) }],
    });
    conversationParts.push({
      role: 'model',
      parts: [{ text: 'I understand. I\'m ready to help you with your feasibility request.' }],
    });

    // Add conversation history
    for (const msg of history) {
      conversationParts.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    // Add current message
    conversationParts.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const result = await model.generateContent({
      contents: conversationParts,
      generationConfig: {
        temperature: DEFAULT_CONFIG.chatTemperature,
        maxOutputTokens: DEFAULT_CONFIG.maxOutputTokens,
      },
    });

    const responseText = result.response.text().trim();
    const responseTime = Date.now() - startTime;

    // Get token counts if available
    const usageMetadata = result.response.usageMetadata;
    const tokens = usageMetadata
      ? {
          input: usageMetadata.promptTokenCount || 0,
          output: usageMetadata.candidatesTokenCount || 0,
        }
      : undefined;

    return {
      success: true,
      response: responseText,
      tokens,
      response_time_ms: responseTime,
    };
  } catch (error) {
    console.error('[feasibility-ai] Chat error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      return { success: false, error: AI_ERROR_MESSAGES.SERVICE_UNAVAILABLE };
    }
    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      return { success: false, error: AI_ERROR_MESSAGES.RATE_LIMITED };
    }

    return { success: false, error: AI_ERROR_MESSAGES.INVALID_RESPONSE };
  }
}

// ============================================================================
// DATA EXTRACTION FUNCTION
// ============================================================================

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedFeasibilityData;
  tokens?: { input: number; output: number };
  response_time_ms?: number;
  error?: string;
}

export async function extractData(
  conversationHistory: ChatMessage[]
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    // Build conversation text
    const conversationText = conversationHistory
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: EXTRACTION_SYSTEM_PROMPT },
            { text: `\n\nExtract data from this conversation:\n\n---\n${conversationText}\n---` },
          ],
        },
      ],
      generationConfig: {
        temperature: DEFAULT_CONFIG.extractionTemperature,
        maxOutputTokens: DEFAULT_CONFIG.maxOutputTokens,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text().trim();
    const responseTime = Date.now() - startTime;

    // Parse JSON response
    let parsed: ExtractedFeasibilityData;
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

    // Validate structure
    if (!parsed.sites || !Array.isArray(parsed.sites)) {
      parsed.sites = [];
    }
    if (!parsed.requirements) {
      parsed.requirements = {};
    }
    if (!parsed.client) {
      parsed.client = {};
    }

    // Normalize coordinates
    parsed.sites = parsed.sites.map((site) => ({
      ...site,
      latitude:
        typeof site.latitude === 'number' && isFinite(site.latitude)
          ? site.latitude
          : undefined,
      longitude:
        typeof site.longitude === 'number' && isFinite(site.longitude)
          ? site.longitude
          : undefined,
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
      data: parsed,
      tokens,
      response_time_ms: responseTime,
    };
  } catch (error) {
    console.error('[feasibility-ai] Extraction error:', error);
    return { success: false, error: AI_ERROR_MESSAGES.EXTRACTION_FAILED };
  }
}

// ============================================================================
// PACKAGE RECOMMENDATION FUNCTION
// ============================================================================

export interface RecommendationResult {
  success: boolean;
  recommendation?: string;
  tokens?: { input: number; output: number };
  response_time_ms?: number;
  error?: string;
}

export async function recommendPackages(
  requirements: ExtractedRequirements,
  coverageResults: CoverageResult[]
): Promise<RecommendationResult> {
  const startTime = Date.now();

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const prompt = getRecommendationPrompt({
      requirements,
      coverage_results: coverageResults,
    });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: DEFAULT_CONFIG.chatTemperature,
        maxOutputTokens: 512,
      },
    });

    const responseText = result.response.text().trim();
    const responseTime = Date.now() - startTime;

    const usageMetadata = result.response.usageMetadata;
    const tokens = usageMetadata
      ? {
          input: usageMetadata.promptTokenCount || 0,
          output: usageMetadata.candidatesTokenCount || 0,
        }
      : undefined;

    return {
      success: true,
      recommendation: responseText,
      tokens,
      response_time_ms: responseTime,
    };
  } catch (error) {
    console.error('[feasibility-ai] Recommendation error:', error);
    return { success: false, error: AI_ERROR_MESSAGES.INVALID_RESPONSE };
  }
}

// ============================================================================
// AI USAGE TRACKING
// ============================================================================

export interface AIUsageRecord {
  partner_id: string;
  request_type: 'chat' | 'extraction' | 'recommendation';
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  response_time_ms?: number;
  success: boolean;
  request_id?: string;
}

export function createUsageRecord(
  partnerId: string,
  requestType: 'chat' | 'extraction' | 'recommendation',
  result: ChatResult | ExtractionResult | RecommendationResult,
  requestId?: string
): AIUsageRecord {
  return {
    partner_id: partnerId,
    request_type: requestType,
    model_used: MODEL_NAME,
    input_tokens: result.tokens?.input || 0,
    output_tokens: result.tokens?.output || 0,
    response_time_ms: result.response_time_ms,
    success: result.success,
    request_id: requestId,
  };
}
