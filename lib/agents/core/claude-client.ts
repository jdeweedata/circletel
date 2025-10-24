/**
 * CircleTel Multi-Agent Orchestration System - Prompt-Based Client
 *
 * Purpose: Prompt-based wrapper for Claude Code native execution
 * Architecture: Uses structured prompts instead of API calls (works with Claude Max)
 *
 * Note: This uses Claude Code's native capabilities - NO API key required!
 * Works seamlessly with Claude Max subscription.
 */

import type { ClaudeModel, AgentRole } from './types';

// ============================================================================
// Types
// ============================================================================

export interface PromptRequest {
  /** Model preference (informational only, Claude Code decides actual model) */
  modelPreference: ClaudeModel;

  /** The prompt to execute */
  prompt: string;

  /** System context to inject */
  systemContext?: string;

  /** Temperature preference (informational) */
  temperature?: number;
}

export interface PromptResponse {
  /** Generated content */
  content: string;

  /** Execution metadata */
  metadata: {
    executedAt: Date;
    modelUsed: 'sonnet' | 'haiku' | 'unknown';
  };
}

// ============================================================================
// Prompt-Based Client Class
// ============================================================================

/**
 * Client for executing structured prompts via Claude Code
 *
 * This class wraps Claude Code's native prompt execution without requiring
 * external API calls. Perfect for Claude Max users.
 */
export class ClaudeClient {
  private verbose: boolean;

  constructor(options: { verbose?: boolean } = {}) {
    this.verbose = options.verbose ?? false;
  }

  /**
   * Execute a prompt via Claude Code's native capabilities
   *
   * Note: This doesn't make API calls. Instead, it returns a structured
   * prompt that Claude Code will execute as part of the current session.
   */
  async executePrompt(request: PromptRequest): Promise<PromptResponse> {
    if (this.verbose) {
      console.log(`\n🤖 Executing Prompt (${request.modelPreference}):`);
      console.log(`   Prompt Length: ${request.prompt.length} chars`);
      console.log(`   Temperature: ${request.temperature ?? 0.7}\n`);
    }

    // Build the full prompt with system context
    const fullPrompt = this.buildFullPrompt(request);

    // In Claude Code, we return the prompt as content
    // The actual execution happens as part of Claude Code's response
    const content = fullPrompt;

    const response: PromptResponse = {
      content,
      metadata: {
        executedAt: new Date(),
        modelUsed: this.getModelType(request.modelPreference),
      },
    };

    if (this.verbose) {
      console.log(`\n✅ Prompt Prepared:`);
      console.log(`   Response Length: ${response.content.length} chars`);
      console.log(`   Model: ${response.metadata.modelUsed}\n`);
    }

    return response;
  }

  /**
   * Build the complete prompt with system context
   */
  private buildFullPrompt(request: PromptRequest): string {
    const parts: string[] = [];

    // Add system context if provided
    if (request.systemContext) {
      parts.push('# System Context');
      parts.push(request.systemContext);
      parts.push('');
    }

    // Add the main prompt
    parts.push('# Task');
    parts.push(request.prompt);

    return parts.join('\n');
  }

  /**
   * Get model type from preference
   */
  private getModelType(model: ClaudeModel): 'sonnet' | 'haiku' | 'unknown' {
    if (model.includes('sonnet')) return 'sonnet';
    if (model.includes('haiku')) return 'haiku';
    return 'unknown';
  }

  /**
   * Execute a simple prompt (convenience method)
   */
  async prompt(
    prompt: string,
    options: {
      modelPreference?: ClaudeModel;
      systemContext?: string;
      temperature?: number;
    } = {}
  ): Promise<string> {
    const response = await this.executePrompt({
      modelPreference: options.modelPreference ?? 'claude-sonnet-4-5-20250929',
      prompt,
      systemContext: options.systemContext,
      temperature: options.temperature,
    });

    return response.content;
  }

  /**
   * Create a specialized client for a specific role
   */
  static forRole(role: AgentRole, verbose = false): ClaudeClient {
    return new ClaudeClient({ verbose });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the appropriate Claude model preference for a given role
 *
 * Note: In prompt-based mode, this is just a preference/hint.
 * Claude Code will use whatever model is currently active.
 */
export function getModelForRole(role: AgentRole): ClaudeModel {
  switch (role) {
    case 'orchestrator':
      return 'claude-sonnet-4-5-20250929'; // Preference for strategic planning
    case 'worker':
      return 'claude-sonnet-4-5-20250929'; // All workers use current model
  }
}

/**
 * Format a system prompt for CircleTel agents
 */
export function formatCircleTelSystemPrompt(role: AgentRole, domain?: string): string {
  const basePrompt = `You are a specialized ${role} for the CircleTel ISP platform.

CircleTel is a B2B/B2C telecommunications platform built with:
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Supabase (PostgreSQL + Auth + RLS)
- Tailwind CSS + shadcn/ui
- React Query + Zustand

**Critical Standards:**

1. **TypeScript**: Strict mode, no \`any\`, all exports typed
2. **RBAC**: Admin features require permission gates (UI + API + database)
3. **Design System**:
   - Colors: circleTel-orange (#F5831F), circleTel-darkNeutral (#1F2937)
   - Components: Use shadcn/ui primitives
   - Spacing: Tailwind scale (4px increments)
4. **Database**:
   - Always create migrations for schema changes
   - Enable RLS on all tables
   - Use service role key for admin operations
5. **Testing**: Minimum 80% coverage for new features
6. **Error Handling**: Try-catch in API routes, error boundaries in React

**File Structure:**
- Pages: \`/app/[page]/page.tsx\`
- API Routes: \`/app/api/[endpoint]/route.ts\`
- Components: \`/components/[domain]/[Component].tsx\`
- Services: \`/lib/[service]/[name]-service.ts\`
- Migrations: \`/supabase/migrations/[timestamp]_*.sql\`

**Next.js 15 Patterns:**
\`\`\`typescript
// API route params (REQUIRED pattern)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
}
\`\`\`

**Import Conventions:**
- Use \`@/\` alias for all project imports
- Group: React → External → Internal → Types
`;

  if (domain) {
    return `${basePrompt}\n\n**Your Domain**: ${domain}\nFocus on ${domain}-specific best practices and patterns.`;
  }

  return basePrompt;
}

/**
 * Create a structured prompt for analysis tasks
 */
export function createAnalysisPrompt(
  task: string,
  context: string,
  outputFormat: string
): string {
  return `# Analysis Task

**Task**: ${task}

**Context**:
${context}

**Output Format**:
${outputFormat}

Analyze carefully and provide your response in the specified format.`;
}

/**
 * Create a structured prompt for code generation tasks
 */
export function createCodeGenerationPrompt(
  description: string,
  requirements: string[],
  standards: string[],
  outputFormat: string
): string {
  const reqList = requirements.map((r, i) => `${i + 1}. ${r}`).join('\n');
  const stdList = standards.map((s, i) => `${i + 1}. ${s}`).join('\n');

  return `# Code Generation Task

**Description**: ${description}

**Requirements**:
${reqList}

**Standards to Follow**:
${stdList}

**Output Format**:
${outputFormat}

Generate high-quality, production-ready code following all requirements and standards.`;
}

/**
 * Create a structured prompt for validation tasks
 */
export function createValidationPrompt(
  itemToValidate: string,
  validationRules: string[],
  outputFormat: string
): string {
  const rulesList = validationRules.map((r, i) => `${i + 1}. ${r}`).join('\n');

  return `# Validation Task

**Item to Validate**:
${itemToValidate}

**Validation Rules**:
${rulesList}

**Output Format**:
${outputFormat}

Validate thoroughly and report all issues found.`;
}

/**
 * Extract JSON from a response that may contain markdown code blocks
 */
export function extractJSON<T = unknown>(response: string): T {
  // Try to find JSON in markdown code blocks
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);

  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // Try to find raw JSON
  const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    return JSON.parse(jsonObjectMatch[0]);
  }

  throw new Error('No valid JSON found in response');
}

/**
 * Format a prompt with sections
 */
export function formatPromptWithSections(sections: {
  title: string;
  content: string;
}[]): string {
  return sections
    .map((section) => `# ${section.title}\n\n${section.content}`)
    .join('\n\n');
}
