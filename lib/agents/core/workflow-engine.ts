/**
 * CircleTel Multi-Agent Orchestration System - Workflow Engine
 *
 * Purpose: Execute workers sequentially based on DAG execution plan
 * Architecture: Sequential execution (prompt-based, no parallel workers)
 *
 * Responsibilities:
 * - Execute workers in topological order
 * - Track progress and state
 * - Enforce quality gates
 * - Aggregate results
 * - Handle errors and retries
 */

import type {
  ExecutionPlan,
  WorkerInput,
  WorkerResult,
  QualityGateResult,
  WorkflowResult,
  ProgressCallback,
} from './types';
import { DatabaseWorker } from '../workers/database-worker';
import { UserStoriesWorker } from '../workers/user-stories-worker';
import { ApiWorker } from '../workers/api-worker';
import { UiWorker } from '../workers/ui-worker';
import { TestWorker } from '../workers/test-worker';
import { BaseWorker } from '../workers/base-worker';

// ============================================================================
// Workflow Engine Class
// ============================================================================

export class WorkflowEngine {
  private verbose: boolean;
  private workers: Map<string, BaseWorker>;

  constructor(options: { verbose?: boolean } = {}) {
    this.verbose = options.verbose ?? false;
    this.workers = new Map();

    // Initialize all workers
    this.workers.set('database', new DatabaseWorker({ verbose: this.verbose }));
    this.workers.set('user-stories', new UserStoriesWorker({ verbose: this.verbose }));
    this.workers.set('api', new ApiWorker({ verbose: this.verbose }));
    this.workers.set('ui', new UiWorker({ verbose: this.verbose }));
    this.workers.set('test', new TestWorker({ verbose: this.verbose }));
  }

  /**
   * Execute the full workflow based on execution plan
   */
  async execute(
    plan: ExecutionPlan,
    options: {
      onProgress?: ProgressCallback;
      stopOnError?: boolean;
    } = {}
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const { onProgress, stopOnError = true } = options;

    if (this.verbose) {
      console.log('\n' + '='.repeat(80));
      console.log('🚀 Workflow Engine: Starting execution');
      console.log('='.repeat(80));
      console.log(`\n📋 Plan: ${plan.request.userPrompt}`);
      console.log(`📊 Complexity: ${plan.analysis.complexity}`);
      console.log(`🎯 Layers: ${plan.analysis.layers.join(', ')}`);
      console.log(`⏱️  Estimated time: ${plan.dag.totalEstimatedMinutes} minutes`);
      console.log(`📦 Tasks: ${plan.dag.tasks.length}\n`);
    }

    const results: WorkerResult[] = [];
    const executionOrder = plan.dag.executionOrder;
    const taskMap = new Map(plan.dag.tasks.map((task) => [task.id, task]));

    // Execute tasks in topological order (sequential)
    for (let i = 0; i < executionOrder.length; i++) {
      const taskId = executionOrder[i];
      const subtask = taskMap.get(taskId);

      if (!subtask) {
        console.error(`❌ Task ${taskId} not found in plan`);
        continue;
      }

      const progress = ((i + 1) / executionOrder.length) * 100;

      if (this.verbose) {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`📌 Task ${i + 1}/${executionOrder.length}: ${subtask.description}`);
        console.log(`   Worker: ${subtask.worker}`);
        console.log(`   Progress: ${progress.toFixed(0)}%`);
        console.log(`${'─'.repeat(80)}`);
      }

      // Call progress callback
      if (onProgress) {
        onProgress({
          taskId: subtask.id,
          taskDescription: subtask.description,
          progress,
          completedTasks: i,
          totalTasks: executionOrder.length,
        });
      }

      try {
        // Get the worker
        const worker = this.workers.get(subtask.worker);

        if (!worker) {
          throw new Error(`Worker "${subtask.worker}" not found`);
        }

        // Prepare worker input
        const workerInput: WorkerInput = {
          subtask,
          context: {
            projectPath: process.cwd(),
            previousResults: results.filter((r) =>
              subtask.dependencies.includes(r.taskId)
            ),
            userPrompt: plan.request.userPrompt,
            analysis: plan.analysis,
          },
        };

        // Execute worker with retries
        const result = await worker.executeWithRetries(workerInput);

        // Store result
        results.push(result);

        if (this.verbose) {
          console.log(`\n✅ Task completed: ${result.status}`);
          if (result.files && result.files.length > 0) {
            console.log(`   Files: ${result.files.length}`);
            result.files.forEach((file) => {
              console.log(`   - ${file.path} (${file.action})`);
            });
          }
        }

        // Stop on error if configured
        if (result.status === 'error' && stopOnError) {
          console.error(`\n❌ Stopping workflow due to error in task ${taskId}`);
          break;
        }
      } catch (error) {
        const errorResult: WorkerResult = {
          taskId: subtask.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          files: [],
          metadata: {
            worker: subtask.worker,
            duration: 0,
            timestamp: new Date(),
          },
        };

        results.push(errorResult);

        if (this.verbose) {
          console.error(`\n❌ Task failed: ${errorResult.error}`);
        }

        if (stopOnError) {
          console.error(`\n❌ Stopping workflow due to error`);
          break;
        }
      }
    }

    // Run quality gates
    if (this.verbose) {
      console.log(`\n${'='.repeat(80)}`);
      console.log('🔍 Running Quality Gates');
      console.log('='.repeat(80));
    }

    const qualityResults = await this.runQualityGates(plan, results);

    // Calculate final result
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;
    const totalQualityPassed = qualityResults.filter((q) => q.passed).length;
    const totalQualityFailed = qualityResults.filter((q) => !q.passed).length;

    const overallSuccess =
      errorCount === 0 && totalQualityFailed === 0 && successCount === results.length;

    if (this.verbose) {
      console.log(`\n${'='.repeat(80)}`);
      console.log('📊 Workflow Summary');
      console.log('='.repeat(80));
      console.log(`✅ Success: ${successCount}/${results.length} tasks`);
      console.log(`❌ Errors: ${errorCount} tasks`);
      console.log(`🔍 Quality Gates: ${totalQualityPassed} passed, ${totalQualityFailed} failed`);
      console.log(`⏱️  Duration: ${duration} minutes`);
      console.log(`🎯 Overall: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log('='.repeat(80) + '\n');
    }

    return {
      plan,
      results,
      qualityResults,
      summary: {
        totalTasks: results.length,
        successfulTasks: successCount,
        failedTasks: errorCount,
        totalDuration: duration,
        qualityGatesPassed: totalQualityPassed,
        qualityGatesFailed: totalQualityFailed,
      },
      status: overallSuccess ? 'success' : 'failed',
      completedAt: new Date(),
    };
  }

  /**
   * Run quality gates on the results
   */
  private async runQualityGates(
    plan: ExecutionPlan,
    results: WorkerResult[]
  ): Promise<QualityGateResult[]> {
    const qualityResults: QualityGateResult[] = [];

    for (const gate of plan.qualityGates) {
      if (this.verbose) {
        console.log(`\n🔍 Quality Gate: ${gate.name}`);
      }

      try {
        const passed = await this.executeQualityGate(gate, results);

        qualityResults.push({
          gateName: gate.name,
          passed,
          message: passed
            ? `${gate.name} passed`
            : `${gate.name} failed - ${gate.description}`,
          checkedAt: new Date(),
        });

        if (this.verbose) {
          console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}`);
        }
      } catch (error) {
        qualityResults.push({
          gateName: gate.name,
          passed: false,
          message: `Error checking ${gate.name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          checkedAt: new Date(),
        });

        if (this.verbose) {
          console.error(`   ❌ ERROR: ${error}`);
        }
      }
    }

    return qualityResults;
  }

  /**
   * Execute a single quality gate
   */
  private async executeQualityGate(
    gate: ExecutionPlan['qualityGates'][0],
    results: WorkerResult[]
  ): Promise<boolean> {
    switch (gate.type) {
      case 'typescript':
        return this.checkTypeScript(results);

      case 'build':
        return this.checkBuild(results);

      case 'tests':
        return this.checkTests(results);

      case 'rbac':
        return this.checkRBAC(results);

      case 'standards':
        return this.checkStandards(results);

      default:
        console.warn(`Unknown quality gate type: ${gate.type}`);
        return true; // Don't fail on unknown gates
    }
  }

  /**
   * Check TypeScript compilation
   */
  private async checkTypeScript(results: WorkerResult[]): Promise<boolean> {
    // Check if any worker reported TypeScript errors
    for (const result of results) {
      if (result.metadata?.qualityChecksPassed === false) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check build success
   */
  private async checkBuild(results: WorkerResult[]): Promise<boolean> {
    // In prompt-based approach, we rely on worker validation
    // Real build check would run `npm run build`
    return results.every((r) => r.status !== 'error');
  }

  /**
   * Check test coverage
   */
  private async checkTests(results: WorkerResult[]): Promise<boolean> {
    // Check if test worker ran successfully
    const testResults = results.filter(
      (r) => r.metadata?.worker === 'test'
    );

    if (testResults.length === 0) {
      return true; // No tests required
    }

    return testResults.every((r) => r.status === 'success');
  }

  /**
   * Check RBAC enforcement
   */
  private async checkRBAC(results: WorkerResult[]): Promise<boolean> {
    // Check if RBAC patterns are present in generated files
    for (const result of results) {
      if (!result.files) continue;

      for (const file of result.files) {
        // Check API routes have auth checks
        if (file.path.includes('/api/') && file.path.endsWith('route.ts')) {
          const hasAuth =
            file.content.includes('getUser()') ||
            file.content.includes('checkPermission') ||
            file.content.includes('requireRole');

          if (!hasAuth) {
            if (this.verbose) {
              console.warn(`   ⚠️  Missing auth check in ${file.path}`);
            }
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Check CircleTel standards compliance
   */
  private async checkStandards(results: WorkerResult[]): Promise<boolean> {
    // Aggregate standards validation from workers
    const hasStandardsIssues = results.some(
      (r) => r.metadata?.qualityChecksPassed === false
    );

    return !hasStandardsIssues;
  }

  /**
   * Get aggregated files from all results
   */
  getAggregatedFiles(result: WorkflowResult): WorkerResult['files'] {
    const allFiles: NonNullable<WorkerResult['files']> = [];

    for (const workerResult of result.results) {
      if (workerResult.files) {
        allFiles.push(...workerResult.files);
      }
    }

    return allFiles;
  }

  /**
   * Get execution summary as markdown
   */
  getSummaryMarkdown(result: WorkflowResult): string {
    const lines: string[] = [];

    lines.push('# Workflow Execution Summary\n');
    lines.push(`**Status**: ${result.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    lines.push(`**Duration**: ${result.summary.totalDuration} minutes`);
    lines.push(`**Completed**: ${new Date(result.completedAt).toLocaleString()}\n`);

    lines.push('## Task Results\n');
    lines.push(`- **Total Tasks**: ${result.summary.totalTasks}`);
    lines.push(`- **Successful**: ${result.summary.successfulTasks}`);
    lines.push(`- **Failed**: ${result.summary.failedTasks}\n`);

    lines.push('## Quality Gates\n');
    lines.push(`- **Passed**: ${result.summary.qualityGatesPassed}`);
    lines.push(`- **Failed**: ${result.summary.qualityGatesFailed}\n`);

    if (result.qualityResults.length > 0) {
      lines.push('### Details\n');
      for (const qr of result.qualityResults) {
        lines.push(`- ${qr.passed ? '✅' : '❌'} ${qr.gateName}: ${qr.message}`);
      }
      lines.push('');
    }

    lines.push('## Generated Files\n');
    const files = this.getAggregatedFiles(result);
    if (files.length > 0) {
      for (const file of files) {
        lines.push(`- \`${file.path}\` (${file.action})`);
      }
    } else {
      lines.push('No files generated.');
    }

    return lines.join('\n');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalWorkflowEngine: WorkflowEngine | null = null;

/**
 * Get the global workflow engine instance
 */
export function getWorkflowEngine(options?: { verbose?: boolean }): WorkflowEngine {
  if (!globalWorkflowEngine) {
    globalWorkflowEngine = new WorkflowEngine(options);
  }
  return globalWorkflowEngine;
}

/**
 * Reset the global workflow engine (useful for testing)
 */
export function resetWorkflowEngine(): void {
  globalWorkflowEngine = null;
}
