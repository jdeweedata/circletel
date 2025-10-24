/**
 * CircleTel Multi-Agent Orchestration System - Base Worker
 *
 * Purpose: Abstract base class for all Haiku 4.5 workers
 * Architecture: Common functionality for specialized workers
 *
 * All workers extend this class and implement the `execute()` method
 */

import { ClaudeClient, formatCircleTelSystemPrompt } from '../core/claude-client';
import type {
  WorkerType,
  WorkerInput,
  WorkerResult,
  Layer,
  WorkerConfig,
} from '../core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Base Worker Class
// ============================================================================

export abstract class BaseWorker {
  protected client: ClaudeClient;
  protected workerType: WorkerType;
  protected domain: Layer;
  protected config: WorkerConfig;
  protected verbose: boolean;

  constructor(
    workerType: WorkerType,
    domain: Layer,
    config?: Partial<WorkerConfig>
  ) {
    this.workerType = workerType;
    this.domain = domain;
    this.verbose = config?.verbose ?? true;

    // Default worker configuration
    this.config = {
      model: 'claude-haiku-4-5-20250929',
      maxExecutionTokens: config?.maxExecutionTokens ?? 4096,
      temperature: config?.temperature ?? 0.7,
      maxRetries: config?.maxRetries ?? 2,
      retryDelayMs: config?.retryDelayMs ?? 1000,
      timeoutMs: config?.timeoutMs ?? 300000, // 5 minutes
    };

    this.client = ClaudeClient.forRole('worker', this.verbose);
  }

  /**
   * Execute the worker's task
   * Must be implemented by each specialized worker
   */
  abstract execute(input: WorkerInput): Promise<WorkerResult>;

  /**
   * Load domain-specific context from .claude/memory/
   */
  protected async loadDomainContext(): Promise<string> {
    try {
      const memoryPath = path.join(
        process.cwd(),
        '.claude',
        'memory',
        this.domain,
        'CLAUDE.md'
      );

      const content = await fs.readFile(memoryPath, 'utf-8');

      if (this.verbose) {
        console.log(`📚 Loaded ${this.domain} context (${content.length} chars)`);
      }

      return content;
    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️  Could not load ${this.domain} context:`, error);
      }
      return '';
    }
  }

  /**
   * Get CircleTel-specific system prompt for this worker
   */
  protected getSystemPrompt(): string {
    const basePrompt = formatCircleTelSystemPrompt('worker', this.domain);

    const workerSpecificPrompt = this.getWorkerSpecificPrompt();

    return `${basePrompt}\n\n${workerSpecificPrompt}`;
  }

  /**
   * Get worker-specific instructions
   * Override in subclasses for specialized behavior
   */
  protected abstract getWorkerSpecificPrompt(): string;

  /**
   * Build the execution prompt for Claude
   */
  protected buildExecutionPrompt(input: WorkerInput): string {
    const { subtask, dependencyResults, domainContext } = input;

    let prompt = `# Task

**Description**: ${subtask.description}

**Detailed Instructions**:
${subtask.instructions}

**Requirements**:
${this.formatRequirements(input)}

`;

    // Add dependency results if available
    if (dependencyResults && dependencyResults.length > 0) {
      prompt += `\n# Results from Previous Tasks\n\n`;
      dependencyResults.forEach((result) => {
        prompt += `## ${result.workerType} (${result.subtaskId})\n`;
        prompt += `${result.output}\n\n`;
        if (result.files) {
          prompt += `**Files Created**:\n`;
          result.files.forEach((file) => {
            prompt += `- ${file.path}: ${file.description}\n`;
          });
          prompt += '\n';
        }
      });
    }

    // Add domain context if provided
    if (domainContext) {
      prompt += `\n# Domain Context\n\n${domainContext}\n\n`;
    }

    prompt += `# Output Format

Provide your response in the following format:

\`\`\`json
{
  "status": "success",
  "output": "Summary of what was accomplished",
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "file content here",
      "description": "Brief description of this file"
    }
  ],
  "confidence": 0.9,
  "metadata": {
    "filesChanged": ["file1.ts", "file2.tsx"],
    "dependenciesAdded": ["package-name"],
    "qualityChecksPassed": true
  }
}
\`\`\`

If you encounter an error:

\`\`\`json
{
  "status": "failure",
  "output": "Description of the problem",
  "error": {
    "message": "Error message",
    "recoverable": true
  },
  "confidence": 0.5
}
\`\`\`

**Important**:
- Return ONLY the JSON, no other text
- Use CircleTel standards (see system prompt)
- Be specific and actionable
- Include all file content needed`;

    return prompt;
  }

  /**
   * Format requirements section
   */
  protected formatRequirements(input: WorkerInput): string {
    const { standards, subtask } = input;
    const lines: string[] = [];

    if (standards.typeScriptStrict) {
      lines.push('- TypeScript strict mode (no `any` types)');
    }

    if (standards.rbacRequired && subtask.requirements?.enforceRBAC) {
      lines.push(
        '- RBAC: Admin features must have permission gates (UI + API + database)'
      );
    }

    if (subtask.requirements?.applyDesignSystem) {
      lines.push(
        `- Design System: Use CircleTel colors (${standards.designSystemColors.join(', ')})`
      );
      lines.push('- Components: Use shadcn/ui primitives');
    }

    if (subtask.requirements?.minTestCoverage) {
      lines.push(
        `- Test Coverage: Minimum ${subtask.requirements.minTestCoverage}%`
      );
    }

    if (lines.length === 0) {
      lines.push('- Follow CircleTel best practices');
    }

    return lines.join('\n');
  }

  /**
   * Parse worker response
   */
  protected parseWorkerResponse(response: string, subtaskId: string): WorkerResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[1]);

      // Construct full WorkerResult
      const result: WorkerResult = {
        subtaskId,
        workerType: this.workerType,
        status: parsed.status,
        files: parsed.files,
        output: parsed.output,
        error: parsed.error,
        confidence: parsed.confidence ?? 0.7,
        executionMinutes: 0, // Will be set by caller
        metadata: parsed.metadata,
      };

      return result;
    } catch (error) {
      // Failed to parse, return error result
      return {
        subtaskId,
        workerType: this.workerType,
        status: 'failure',
        output: response,
        error: {
          message: `Failed to parse worker response: ${error instanceof Error ? error.message : String(error)}`,
          recoverable: false,
        },
        confidence: 0,
        executionMinutes: 0,
      };
    }
  }

  /**
   * Execute with retries and error handling
   */
  async executeWithRetries(input: WorkerInput): Promise<WorkerResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
      try {
        if (this.verbose && attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt - 1}/${this.config.maxRetries}`);
        }

        const result = await this.execute(input);

        // Calculate execution time
        const executionMinutes = (Date.now() - startTime) / 60000;
        result.executionMinutes = Math.round(executionMinutes * 10) / 10;

        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt <= this.config.maxRetries) {
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelayMs)
          );
        }
      }
    }

    // All retries failed
    const executionMinutes = (Date.now() - startTime) / 60000;

    return {
      subtaskId: input.subtask.id,
      workerType: this.workerType,
      status: 'failure',
      output: `Worker failed after ${this.config.maxRetries + 1} attempts`,
      error: {
        message: lastError?.message || 'Unknown error',
        stack: lastError?.stack,
        recoverable: false,
      },
      confidence: 0,
      executionMinutes: Math.round(executionMinutes * 10) / 10,
    };
  }

  /**
   * Validate CircleTel standards in generated files
   */
  protected validateStandards(files: WorkerResult['files']): {
    passed: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!files || files.length === 0) {
      return { passed: true, issues: [] };
    }

    files.forEach((file) => {
      // Check TypeScript files
      if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
        // Check for 'any' type
        if (file.content.includes(': any') || file.content.includes('<any>')) {
          issues.push(`${file.path}: Contains 'any' type (violates strict TypeScript)`);
        }

        // Check for proper imports
        if (
          file.content.includes('import ') &&
          !file.content.includes("from '@/")
        ) {
          issues.push(
            `${file.path}: Uses relative imports instead of '@/' alias`
          );
        }
      }

      // Check React components
      if (file.path.endsWith('.tsx') && file.content.includes('export')) {
        // Check for CircleTel colors
        if (
          file.content.includes('bg-') ||
          file.content.includes('text-')
        ) {
          if (!file.content.includes('circleTel-')) {
            issues.push(
              `${file.path}: Uses generic colors instead of CircleTel design system`
            );
          }
        }
      }

      // Check API routes
      if (file.path.includes('/api/') && file.path.endsWith('.ts')) {
        // Check for proper error handling
        if (!file.content.includes('try') || !file.content.includes('catch')) {
          issues.push(`${file.path}: Missing try-catch error handling`);
        }

        // Check for proper response types
        if (!file.content.includes('NextResponse')) {
          issues.push(`${file.path}: Should use NextResponse for API routes`);
        }
      }

      // Check migrations
      if (file.path.includes('migrations/') && file.path.endsWith('.sql')) {
        // Check for RLS
        if (!file.content.toLowerCase().includes('rls')) {
          issues.push(
            `${file.path}: Missing RLS (Row Level Security) policies`
          );
        }
      }
    });

    return {
      passed: issues.length === 0,
      issues,
    };
  }
}
