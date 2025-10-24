/**
 * CircleTel Multi-Agent Orchestration System - Auto Detector
 *
 * Purpose: Automatically detect when user requests require orchestration
 * Architecture: Pattern matching + keyword analysis
 *
 * Responsibilities:
 * - Analyze user prompts for complexity signals
 * - Detect multi-layer feature requests
 * - Score requests for orchestration likelihood
 * - Provide recommendation to invoke orchestrator
 */

import type { Complexity, Layer } from './types';

// ============================================================================
// Types
// ============================================================================

export interface DetectionResult {
  /** Should orchestrator be invoked? */
  shouldOrchestrate: boolean;

  /** Confidence score (0-1) */
  confidence: number;

  /** Detected complexity */
  complexity: Complexity;

  /** Detected layers */
  detectedLayers: Layer[];

  /** Matched keywords */
  matchedKeywords: string[];

  /** Reasoning for recommendation */
  reasoning: string;
}

// ============================================================================
// Keyword Patterns
// ============================================================================

const ORCHESTRATION_KEYWORDS = {
  /** Keywords indicating feature implementation */
  feature: [
    'implement',
    'create',
    'build',
    'develop',
    'add feature',
    'new feature',
    'feature request',
  ],

  /** Keywords indicating multiple layers */
  multiLayer: [
    'full stack',
    'end-to-end',
    'complete',
    'entire',
    'comprehensive',
    'with database',
    'with api',
    'with ui',
    'with tests',
  ],

  /** Keywords indicating complexity */
  complex: [
    'system',
    'platform',
    'architecture',
    'integration',
    'workflow',
    'dashboard',
    'management',
    'analytics',
    'reporting',
  ],

  /** Database-related keywords */
  database: [
    'database',
    'schema',
    'migration',
    'table',
    'model',
    'data model',
    'rls',
    'row level security',
  ],

  /** API-related keywords */
  api: [
    'api',
    'endpoint',
    'route',
    'backend',
    'server',
    'service',
    'webhook',
    'rest',
  ],

  /** UI-related keywords */
  ui: [
    'ui',
    'component',
    'page',
    'form',
    'modal',
    'dashboard',
    'interface',
    'frontend',
    'view',
  ],

  /** Testing-related keywords */
  testing: [
    'test',
    'testing',
    'e2e',
    'integration test',
    'unit test',
    'coverage',
  ],
};

const EXCLUSION_KEYWORDS = [
  // Simple modifications
  'fix',
  'bug',
  'typo',
  'update text',
  'change color',

  // Research/exploration
  'how',
  'what',
  'why',
  'explain',
  'show me',
  'find',

  // Documentation
  'document',
  'comment',
  'readme',

  // Single-file changes
  'one file',
  'quick change',
  'small fix',
];

// ============================================================================
// Auto Detector Class
// ============================================================================

export class AutoDetector {
  /**
   * Detect if user request should trigger orchestration
   */
  detect(userPrompt: string): DetectionResult {
    const prompt = userPrompt.toLowerCase();

    // Step 1: Check for exclusion keywords (quick exit)
    const hasExclusionKeyword = EXCLUSION_KEYWORDS.some((keyword) =>
      prompt.includes(keyword)
    );

    if (hasExclusionKeyword) {
      return {
        shouldOrchestrate: false,
        confidence: 0.9,
        complexity: 'simple',
        detectedLayers: [],
        matchedKeywords: [],
        reasoning: 'Request appears to be a simple change, bug fix, or research question',
      };
    }

    // Step 2: Count keyword matches
    const matchedKeywords: string[] = [];
    const layerCounts: Record<Layer, number> = {
      product: 0,
      database: 0,
      backend: 0,
      frontend: 0,
      testing: 0,
      integration: 0,
    };

    // Check feature keywords
    const featureMatches = ORCHESTRATION_KEYWORDS.feature.filter((kw) =>
      prompt.includes(kw)
    );
    matchedKeywords.push(...featureMatches);

    // Check multi-layer keywords
    const multiLayerMatches = ORCHESTRATION_KEYWORDS.multiLayer.filter((kw) =>
      prompt.includes(kw)
    );
    matchedKeywords.push(...multiLayerMatches);

    // Check complex keywords
    const complexMatches = ORCHESTRATION_KEYWORDS.complex.filter((kw) =>
      prompt.includes(kw)
    );
    matchedKeywords.push(...complexMatches);

    // Check database keywords
    const databaseMatches = ORCHESTRATION_KEYWORDS.database.filter((kw) =>
      prompt.includes(kw)
    );
    if (databaseMatches.length > 0) {
      layerCounts.database += databaseMatches.length;
      matchedKeywords.push(...databaseMatches);
    }

    // Check API keywords
    const apiMatches = ORCHESTRATION_KEYWORDS.api.filter((kw) =>
      prompt.includes(kw)
    );
    if (apiMatches.length > 0) {
      layerCounts.backend += apiMatches.length;
      matchedKeywords.push(...apiMatches);
    }

    // Check UI keywords
    const uiMatches = ORCHESTRATION_KEYWORDS.ui.filter((kw) =>
      prompt.includes(kw)
    );
    if (uiMatches.length > 0) {
      layerCounts.frontend += uiMatches.length;
      matchedKeywords.push(...uiMatches);
    }

    // Check testing keywords
    const testingMatches = ORCHESTRATION_KEYWORDS.testing.filter((kw) =>
      prompt.includes(kw)
    );
    if (testingMatches.length > 0) {
      layerCounts.testing += testingMatches.length;
      matchedKeywords.push(...testingMatches);
    }

    // Step 3: Determine detected layers
    const detectedLayers: Layer[] = (
      Object.entries(layerCounts) as [Layer, number][]
    )
      .filter(([, count]) => count > 0)
      .map(([layer]) => layer);

    // Step 4: Calculate complexity score
    const complexityScore =
      featureMatches.length * 2 +
      multiLayerMatches.length * 3 +
      complexMatches.length * 2 +
      detectedLayers.length * 3;

    // Step 5: Determine complexity level
    let complexity: Complexity;
    if (complexityScore >= 10) {
      complexity = 'complex';
    } else if (complexityScore >= 5) {
      complexity = 'moderate';
    } else {
      complexity = 'simple';
    }

    // Step 6: Calculate confidence
    const layerCount = detectedLayers.length;
    let confidence = 0;

    if (layerCount >= 3) {
      confidence = 0.95; // Very confident - multiple layers
    } else if (layerCount === 2) {
      confidence = 0.75; // Confident - two layers
    } else if (layerCount === 1 && complexityScore >= 5) {
      confidence = 0.5; // Moderate - one layer but complex
    } else {
      confidence = 0.2; // Low confidence
    }

    // Boost confidence if multi-layer keywords present
    if (multiLayerMatches.length > 0) {
      confidence = Math.min(confidence + 0.2, 1);
    }

    // Step 7: Make recommendation
    const shouldOrchestrate =
      confidence >= 0.6 || (layerCount >= 2 && complexity !== 'simple');

    // Step 8: Generate reasoning
    let reasoning = '';

    if (shouldOrchestrate) {
      reasoning = `Request appears to be a ${complexity} task spanning ${layerCount} layers `;
      reasoning += `(${detectedLayers.join(', ')}). `;
      reasoning += `Orchestration recommended for coordinated implementation.`;
    } else {
      if (layerCount === 0) {
        reasoning = 'No specific layers detected. May be a simple change or research question.';
      } else if (layerCount === 1) {
        reasoning = `Single layer detected (${detectedLayers[0]}). May not require orchestration.`;
      } else {
        reasoning = `Complexity score (${complexityScore}) is below threshold. Consider direct implementation.`;
      }
    }

    return {
      shouldOrchestrate,
      confidence,
      complexity,
      detectedLayers,
      matchedKeywords,
      reasoning,
    };
  }

  /**
   * Format detection result as user-friendly message
   */
  formatRecommendation(result: DetectionResult): string {
    const lines: string[] = [];

    lines.push('🤖 **Orchestration Auto-Detection**\n');
    lines.push(`**Recommendation**: ${result.shouldOrchestrate ? '✅ Use Orchestrator' : '❌ Direct Implementation'}`);
    lines.push(`**Confidence**: ${(result.confidence * 100).toFixed(0)}%`);
    lines.push(`**Complexity**: ${result.complexity}`);
    lines.push(`**Detected Layers**: ${result.detectedLayers.length > 0 ? result.detectedLayers.join(', ') : 'None'}`);
    lines.push(`\n**Reasoning**: ${result.reasoning}`);

    if (result.shouldOrchestrate) {
      lines.push('\n💡 **How to invoke**:');
      lines.push('```');
      lines.push('/orchestrate [your request]');
      lines.push('```');
      lines.push('or');
      lines.push('```');
      lines.push('npm run orchestrate -- "[your request]"');
      lines.push('```');
    } else {
      lines.push('\n💡 **Suggestion**: Implement directly without orchestration.');
    }

    return lines.join('\n');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalAutoDetector: AutoDetector | null = null;

/**
 * Get the global auto detector instance
 */
export function getAutoDetector(): AutoDetector {
  if (!globalAutoDetector) {
    globalAutoDetector = new AutoDetector();
  }
  return globalAutoDetector;
}

/**
 * Reset the global auto detector (useful for testing)
 */
export function resetAutoDetector(): void {
  globalAutoDetector = null;
}

// ============================================================================
// Convenience Function
// ============================================================================

/**
 * Quick check if prompt should trigger orchestration
 */
export function shouldOrchestrate(userPrompt: string): boolean {
  const detector = getAutoDetector();
  const result = detector.detect(userPrompt);
  return result.shouldOrchestrate;
}
