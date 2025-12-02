/**
 * PM Agent
 *
 * Product Manager Agent that generates Agent-OS specifications from
 * natural language feature requests. Analyzes the codebase, identifies
 * impact, and produces comprehensive specs with task breakdowns.
 *
 * @module lib/agents/pm/agent
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { BaseAgent } from '../base-agent';
import { AgentConfig, AgentTask, ModelId } from '../types';
import { createAgentConfig, SYSTEM_PROMPTS } from '../config';
import { getToolsForAgent } from '../tools';
import {
  FeatureRequest,
  SpecOutput,
  CodebaseAnalysis,
  ImpactAnalysis,
  PMAgentConfig,
  DEFAULT_PM_CONFIG,
  SpecMetadata,
} from './types';
import { CodebaseAnalyzer } from './analyzers/codebase-analyzer';
import { ImpactAnalyzer } from './analyzers/impact-analyzer';
import { SpecGenerator, GeneratedSpec } from './generators/spec-generator';
import { TaskGenerator, GeneratedTasks } from './generators/task-generator';
import { ArchitectureGenerator, GeneratedArchitecture } from './generators/architecture-generator';
import {
  generateReadmeContent,
  generateProgressContent,
} from './templates';
import {
  ProductGapAnalyzer,
  ProductGapInput,
  ProductGapOutput,
} from './capabilities/product-analysis';

// ============================================================================
// PM Agent Class
// ============================================================================

/**
 * Product Manager Agent.
 *
 * Generates comprehensive Agent-OS specifications from feature requests.
 * Analyzes codebase, identifies impact, and creates specs with task breakdowns.
 *
 * @example
 * ```typescript
 * const pmAgent = new PMAgent();
 * await pmAgent.start();
 *
 * const spec = await pmAgent.generateSpec({
 *   description: 'Add user dashboard with usage tracking',
 *   priority: 'high',
 * });
 *
 * console.log(`Spec saved to: ${spec.specPath}`);
 * console.log(`Estimated points: ${spec.estimatedPoints}`);
 * ```
 */
export class PMAgent extends BaseAgent {
  /** PM-specific configuration */
  private readonly pmConfig: PMAgentConfig;

  /** Codebase analyzer instance */
  private readonly codebaseAnalyzer: CodebaseAnalyzer;

  /** Impact analyzer instance */
  private readonly impactAnalyzer: ImpactAnalyzer;

  /** Spec generator instance */
  private readonly specGenerator: SpecGenerator;

  /** Task generator instance */
  private readonly taskGenerator: TaskGenerator;

  /** Architecture generator instance */
  private readonly architectureGenerator: ArchitectureGenerator;

  /** Product gap analyzer instance */
  private readonly productGapAnalyzer: ProductGapAnalyzer;

  /**
   * Create a new PM Agent.
   *
   * @param config - Optional PM agent configuration
   */
  constructor(config?: Partial<PMAgentConfig>) {
    // Merge with default config
    const pmConfig: PMAgentConfig = {
      ...DEFAULT_PM_CONFIG,
      ...config,
    };

    // Create base agent config
    const agentConfig: AgentConfig = createAgentConfig('pm', {
      name: 'PM Agent',
      model: {
        primary: pmConfig.model as ModelId,
      },
      tools: getToolsForAgent('pm'),
      capabilities: {
        canReadFiles: true,
        canWriteFiles: true,
        canQueryDatabase: true,
        canSpawnAgents: false,
        canRequestApproval: true,
      },
      taskTimeout: 600000, // 10 minutes
    });

    super(agentConfig);

    this.pmConfig = pmConfig;

    // Initialize analyzers and generators
    this.codebaseAnalyzer = new CodebaseAnalyzer();
    this.impactAnalyzer = new ImpactAnalyzer();
    this.specGenerator = new SpecGenerator({
      includeCodeSnippets: pmConfig.includeCodeSnippets,
    });
    this.taskGenerator = new TaskGenerator({
      includeSubtasks: true,
    });
    this.architectureGenerator = new ArchitectureGenerator();
    this.productGapAnalyzer = new ProductGapAnalyzer();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Generate a complete spec from a feature request.
   *
   * This is the main entry point for the PM Agent.
   *
   * @param request - Feature request (string or FeatureRequest object)
   * @returns Complete spec output
   */
  async generateSpec(
    request: string | FeatureRequest
  ): Promise<SpecOutput> {
    const startTime = Date.now();

    // Normalize request
    const featureRequest: FeatureRequest =
      typeof request === 'string'
        ? { description: request }
        : request;

    this.emit('spec:generation:started', { featureRequest });

    try {
      // Step 1: Analyze codebase
      this.emit('spec:analyzing:codebase', {});
      const codebaseAnalysis = await this.codebaseAnalyzer.analyze(
        featureRequest.description
      );

      // Step 2: Analyze impact
      this.emit('spec:analyzing:impact', {});
      const impactAnalysis = await this.impactAnalyzer.analyze(
        featureRequest,
        codebaseAnalysis
      );

      // Step 3: Generate spec
      this.emit('spec:generating:spec', {});
      const generatedSpec = this.specGenerator.generate(
        featureRequest,
        codebaseAnalysis,
        impactAnalysis
      );

      // Step 4: Generate tasks
      this.emit('spec:generating:tasks', {});
      const generatedTasks = this.taskGenerator.generate(
        generatedSpec.userStories,
        impactAnalysis,
        generatedSpec.specId
      );

      // Step 5: Generate architecture (optional)
      this.emit('spec:generating:architecture', {});
      const generatedArchitecture = this.architectureGenerator.generate(
        featureRequest,
        codebaseAnalysis,
        impactAnalysis
      );

      // Step 6: Generate supporting files
      const readmeContent = generateReadmeContent({
        specId: generatedSpec.specId,
        title: generatedSpec.title,
        description: featureRequest.description,
        totalPoints: generatedSpec.totalPoints,
        priority: featureRequest.priority || 'medium',
        taskGroups: generatedTasks.taskGroups.length,
        createdDate: new Date().toISOString().split('T')[0],
      });

      const progressContent = generateProgressContent({
        specId: generatedSpec.specId,
        title: generatedSpec.title,
        totalPoints: generatedSpec.totalPoints,
        taskGroups: generatedTasks.taskGroups.map(g => ({
          number: g.groupNumber,
          title: g.title,
          points: g.storyPoints,
          agent: g.assignedTo,
        })),
      });

      // Step 7: Save files (if autoSave enabled)
      let specPath = '';
      if (this.pmConfig.autoSave) {
        specPath = await this.saveSpec({
          specId: generatedSpec.specId,
          specContent: generatedSpec.content,
          tasksContent: generatedTasks.content,
          readmeContent,
          progressContent,
          architectureContent: generatedArchitecture.content,
        });
      }

      // Build output
      const metadata: SpecMetadata = {
        generatedAt: new Date(),
        model: this.pmConfig.model,
        tokensUsed: this.tokenUsage.total,
        generationTime: Date.now() - startTime,
        formatVersion: '1.0.0',
      };

      const output: SpecOutput = {
        specId: generatedSpec.specId,
        specPath,
        specContent: generatedSpec.content,
        tasksContent: generatedTasks.content,
        readmeContent,
        estimatedPoints: generatedSpec.totalPoints,
        affectedFiles: [
          ...impactAnalysis.filesToCreate.map(f => f.path),
          ...impactAnalysis.filesToModify.map(f => f.path),
        ],
        dependencies: impactAnalysis.dependencies.map(d => d.name),
        analysis: codebaseAnalysis,
        impact: impactAnalysis,
        metadata,
      };

      this.emit('spec:generation:completed', {
        specId: output.specId,
        specPath: output.specPath,
        estimatedPoints: output.estimatedPoints,
        duration: Date.now() - startTime,
      });

      return output;
    } catch (error) {
      this.emit('spec:generation:failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Quick analysis without full spec generation.
   *
   * @param description - Feature description
   * @returns Quick analysis results
   */
  async quickAnalysis(description: string): Promise<{
    codebase: CodebaseAnalysis;
    impact: ImpactAnalysis;
    estimatedPoints: number;
  }> {
    const codebase = await this.codebaseAnalyzer.analyze(description);
    const impact = await this.impactAnalyzer.analyze({ description }, codebase);

    // Quick estimate based on file count and risk
    const fileCount = impact.filesToCreate.length + impact.filesToModify.length;
    let estimatedPoints = fileCount * 2;
    if (impact.riskLevel === 'high') estimatedPoints *= 1.5;
    if (impact.riskLevel === 'medium') estimatedPoints *= 1.2;

    return {
      codebase,
      impact,
      estimatedPoints: Math.ceil(estimatedPoints),
    };
  }

  /**
   * Regenerate tasks for an existing spec.
   *
   * @param specPath - Path to existing spec
   * @returns Updated tasks content
   */
  async regenerateTasks(specPath: string): Promise<string> {
    // Read existing spec
    const specContent = await fs.promises.readFile(
      path.join(specPath, 'spec.md'),
      'utf-8'
    );

    // Extract spec ID
    const specIdMatch = specContent.match(/spec_id:\s*(\S+)/);
    const specId = specIdMatch ? specIdMatch[1] : 'unknown';

    // Re-analyze
    const description = this.extractDescriptionFromSpec(specContent);
    const codebase = await this.codebaseAnalyzer.analyze(description);
    const impact = await this.impactAnalyzer.analyze({ description }, codebase);

    // Generate new spec to get user stories
    const spec = this.specGenerator.generate({ description }, codebase, impact);

    // Regenerate tasks
    const tasks = this.taskGenerator.generate(spec.userStories, impact, specId);

    // Save if autoSave
    if (this.pmConfig.autoSave) {
      await fs.promises.writeFile(
        path.join(specPath, 'tasks.md'),
        tasks.content,
        'utf-8'
      );
    }

    return tasks.content;
  }

  /**
   * Analyze product gaps for a business goal.
   *
   * Identifies relevant sections in the product map and suggests features
   * with impact and effort scores.
   *
   * @param input - Product gap analysis input
   * @returns Product gap analysis output
   *
   * @example
   * ```typescript
   * const result = await pmAgent.analyzeProductGap({
   *   goal: 'We need to improve B2B retention',
   *   maxFeatures: 10,
   * });
   *
   * console.log('Quick wins:', result.summary.quickWins);
   * for (const feature of result.suggestedFeatures) {
   *   console.log(`${feature.name}: Impact ${feature.impactScore}, Effort ${feature.effortScore}`);
   * }
   * ```
   */
  async analyzeProductGap(input: ProductGapInput): Promise<ProductGapOutput> {
    this.emit('spec:analyzing:codebase', { type: 'product-gap', goal: input.goal });

    const result = await this.productGapAnalyzer.analyze(input);

    this.emit('spec:generation:completed', {
      type: 'product-gap',
      goal: input.goal,
      featuresFound: result.suggestedFeatures.length,
      quickWins: result.summary.quickWins,
    });

    return result;
  }

  // ==========================================================================
  // Task Execution (Required by BaseAgent)
  // ==========================================================================

  /**
   * Execute a task internally.
   * Required implementation from BaseAgent.
   *
   * @param task - Task to execute
   * @returns Task result
   */
  protected async executeTaskInternal(
    task: AgentTask
  ): Promise<Record<string, unknown>> {
    const { type } = task.input as { type: string; data?: unknown };

    switch (type) {
      case 'generate-spec': {
        const { featureRequest } = task.input as {
          type: string;
          featureRequest: FeatureRequest;
        };
        const result = await this.generateSpec(featureRequest);
        return {
          specId: result.specId,
          specPath: result.specPath,
          estimatedPoints: result.estimatedPoints,
        };
      }

      case 'quick-analysis': {
        const { description } = task.input as {
          type: string;
          description: string;
        };
        return await this.quickAnalysis(description);
      }

      case 'regenerate-tasks': {
        const { specPath } = task.input as {
          type: string;
          specPath: string;
        };
        const content = await this.regenerateTasks(specPath);
        return { content };
      }

      case 'analyze-product-gap': {
        const { input: gapInput } = task.input as {
          type: string;
          input: ProductGapInput;
        };
        const gapResult = await this.analyzeProductGap(gapInput);
        return {
          goal: gapResult.goal,
          suggestedFeatures: gapResult.suggestedFeatures,
          summary: gapResult.summary,
          relevantSections: gapResult.relevantSections,
        };
      }

      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Save spec files to disk.
   */
  private async saveSpec(params: {
    specId: string;
    specContent: string;
    tasksContent: string;
    readmeContent: string;
    progressContent: string;
    architectureContent?: string;
  }): Promise<string> {
    const specDir = path.join(
      process.cwd(),
      this.pmConfig.outputDirectory,
      params.specId
    );

    // Create directory
    await fs.promises.mkdir(specDir, { recursive: true });

    // Write files
    await Promise.all([
      fs.promises.writeFile(
        path.join(specDir, 'spec.md'),
        params.specContent,
        'utf-8'
      ),
      fs.promises.writeFile(
        path.join(specDir, 'tasks.md'),
        params.tasksContent,
        'utf-8'
      ),
      fs.promises.writeFile(
        path.join(specDir, 'README.md'),
        params.readmeContent,
        'utf-8'
      ),
      fs.promises.writeFile(
        path.join(specDir, 'PROGRESS.md'),
        params.progressContent,
        'utf-8'
      ),
    ]);

    // Write architecture if provided
    if (params.architectureContent) {
      await fs.promises.writeFile(
        path.join(specDir, 'architecture.md'),
        params.architectureContent,
        'utf-8'
      );
    }

    if (this.pmConfig.verbose) {
      console.log(`Spec saved to: ${specDir}`);
    }

    return specDir;
  }

  /**
   * Extract description from spec content.
   */
  private extractDescriptionFromSpec(specContent: string): string {
    // Look for description in Overview section
    const overviewMatch = specContent.match(
      /## Overview[\s\S]*?### Description\s*\n\n([^\n#]+)/
    );
    if (overviewMatch) {
      return overviewMatch[1].trim();
    }

    // Fallback to title
    const titleMatch = specContent.match(/^# (.+)$/m);
    return titleMatch ? titleMatch[1] : 'Unknown feature';
  }

  // ==========================================================================
  // Static Factory Methods
  // ==========================================================================

  /**
   * Create a PM Agent with default configuration.
   *
   * @returns New PM Agent instance
   */
  static create(): PMAgent {
    return new PMAgent();
  }

  /**
   * Create a PM Agent with custom configuration.
   *
   * @param config - PM Agent configuration
   * @returns New PM Agent instance
   */
  static withConfig(config: Partial<PMAgentConfig>): PMAgent {
    return new PMAgent(config);
  }

  /**
   * Create a PM Agent for development (verbose, auto-save).
   *
   * @returns New PM Agent instance for development
   */
  static forDevelopment(): PMAgent {
    return new PMAgent({
      verbose: true,
      autoSave: true,
      includeCodeSnippets: true,
    });
  }

  /**
   * Create a PM Agent for API use (no auto-save, not verbose).
   *
   * @returns New PM Agent instance for API
   */
  static forAPI(): PMAgent {
    return new PMAgent({
      verbose: false,
      autoSave: false,
      includeCodeSnippets: false,
    });
  }
}

// ============================================================================
// Exports
// ============================================================================

export default PMAgent;
