/**
 * CircleTel Multi-Agent Orchestration System - Prompt-Based Orchestrator
 *
 * Purpose: Strategic planner that analyzes tasks and creates structured execution plans
 * Architecture: Analyzes requests → Creates execution plan (DAG) → Generates worker prompts
 *
 * Key Responsibilities:
 * - Task analysis and complexity assessment
 * - Worker selection and task decomposition
 * - DAG construction for sequential execution (via Claude Code)
 * - Progress tracking and quality gates
 * - Prompt generation for workers
 *
 * Note: Prompt-based approach - works with Claude Code + Claude Max (no API key needed)
 */

import { ClaudeClient, formatCircleTelSystemPrompt, extractJSON } from './claude-client';
import type {
  UserRequest,
  TaskAnalysis,
  ExecutionPlan,
  ExecutionDAG,
  Subtask,
  WorkerType,
  Complexity,
  Layer,
  QualityGate,
  OrchestrationSession,
} from './types';

// ============================================================================
// Task Analysis
// ============================================================================

export class SonnetOrchestrator {
  private client: ClaudeClient;
  private verbose: boolean;

  constructor(options: { verbose?: boolean } = {}) {
    this.verbose = options.verbose ?? true;
    this.client = ClaudeClient.forRole('orchestrator', this.verbose);
  }

  /**
   * Main entry point: Analyze request and create execution plan
   */
  async analyzeAndPlan(request: UserRequest): Promise<ExecutionPlan> {
    if (this.verbose) {
      console.log('\n🎭 Sonnet Orchestrator: Analyzing request...');
      console.log(`   Request: "${request.message}"\n`);
    }

    // Step 1: Analyze the task
    const analysis = await this.analyzeTask(request);

    if (this.verbose) {
      console.log('📊 Task Analysis:');
      console.log(`   Intent: ${analysis.intent}`);
      console.log(`   Complexity: ${analysis.complexity}`);
      console.log(`   Layers: ${analysis.layers.join(', ')}`);
      console.log(`   Time Estimate: ${analysis.timeEstimate} minutes`);
      console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(0)}%\n`);
    }

    // Step 2: Decompose into subtasks
    const subtasks = await this.decomposeIntoSubtasks(request, analysis);

    if (this.verbose) {
      console.log('🔀 Subtasks Created:');
      subtasks.forEach((task, i) => {
        const deps = task.dependencies.length > 0 ? ` (depends on: ${task.dependencies.join(', ')})` : '';
        console.log(`   ${i + 1}. [${task.workerType}] ${task.description}${deps}`);
      });
      console.log();
    }

    // Step 3: Build execution DAG
    const dag = this.buildExecutionDAG(subtasks);

    if (this.verbose) {
      console.log('📋 Execution Plan (DAG):');
      console.log(`   Total Subtasks: ${dag.tasks.length}`);
      console.log(`   Parallel Groups: ${dag.parallelGroups.length}`);
      console.log(`   Estimated Duration: ${dag.totalEstimatedMinutes} minutes\n`);
    }

    // Step 4: Define quality gates
    const qualityGates = this.defineQualityGates(analysis);

    // Step 5: Define checkpoints
    const checkpoints = this.defineCheckpoints(subtasks);

    return {
      request,
      analysis,
      dag,
      qualityGates,
      checkpoints,
      createdAt: new Date(),
    };
  }

  /**
   * Analyze the user request to determine intent, complexity, and requirements
   */
  private async analyzeTask(request: UserRequest): Promise<TaskAnalysis> {
    const systemPrompt = formatCircleTelSystemPrompt('orchestrator');

    const prompt = `Analyze this feature request and provide a structured analysis.

**User Request**: "${request.message}"

Provide your analysis in the following JSON format:
\`\`\`json
{
  "intent": "feature_implementation | bug_fix | refactoring | performance_optimization | testing | documentation | integration",
  "complexity": "simple | medium | complex",
  "layers": ["product", "database", "backend", "frontend", "testing", "integration", "documentation"],
  "timeEstimate": <minutes>,
  "requiresMultipleAgents": <boolean>,
  "keywords": ["keyword1", "keyword2"],
  "confidence": <0-1>,
  "suggestedWorkers": ["user-stories", "database", "api", "ui", "test", "documentation"]
}
\`\`\`

**Guidelines**:
- **complexity**: simple (1 layer, <30 min), medium (2 layers, 30-90 min), complex (3+ layers, 90+ min)
- **layers**: Which parts of the stack are affected
- **suggestedWorkers**: Which Haiku workers should execute this
- **confidence**: How certain you are about this analysis (0-1)

Respond ONLY with the JSON, no other text.`;

    const response = await this.client.prompt(prompt, {
      systemContext: systemPrompt,
      temperature: 0.3, // Low temperature for consistent analysis
    });

    // Parse JSON response using helper
    try {
      const analysis = extractJSON<TaskAnalysis>(response);
      return analysis;
    } catch (error) {
      throw new Error(`Failed to parse task analysis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decompose the task into subtasks for workers
   */
  private async decomposeIntoSubtasks(
    request: UserRequest,
    analysis: TaskAnalysis
  ): Promise<Subtask[]> {
    const systemPrompt = formatCircleTelSystemPrompt('orchestrator');

    const prompt = `Create a detailed execution plan by breaking down this task into subtasks for specialist workers.

**User Request**: "${request.message}"

**Analysis**:
- Intent: ${analysis.intent}
- Complexity: ${analysis.complexity}
- Layers: ${analysis.layers.join(', ')}
- Suggested Workers: ${analysis.suggestedWorkers.join(', ')}

**Available Workers**:
1. **user-stories**: Product analysis, user stories, acceptance criteria
2. **database**: Schema design, migrations, RLS policies
3. **api**: Backend API routes, validation, business logic
4. **ui**: React components, forms, CircleTel design system
5. **test**: Unit/integration/E2E tests, coverage validation
6. **documentation**: User guides, API docs, technical documentation

Create a JSON array of subtasks. Each subtask should have:
- **id**: Unique identifier (e.g., "task-1", "task-2")
- **workerType**: Which worker executes this
- **description**: Brief description (1 sentence)
- **instructions**: Detailed instructions for the worker
- **dependencies**: Array of task IDs that must complete first (empty array if none)
- **parallelGroup**: Optional group number for parallel execution
- **estimatedMinutes**: Time estimate
- **contextDomain**: Domain memory to load (product, database, backend, frontend, testing, documentation)

**Parallel Execution Rules**:
- Tasks with no dependencies or same dependencies can run in parallel
- Assign same \`parallelGroup\` number to tasks that should run together
- Max 3 tasks per parallel group

**CircleTel Standards to Include**:
- Database tasks: Require RLS policies, use proper migration naming
- API tasks: RBAC permission checks, Zod validation, error handling
- UI tasks: CircleTel design system, permission gates for admin features
- Test tasks: Min 80% coverage, real test scenarios

Respond with JSON array only:
\`\`\`json
[
  {
    "id": "task-1",
    "workerType": "user-stories",
    "description": "...",
    "instructions": "...",
    "dependencies": [],
    "parallelGroup": 1,
    "estimatedMinutes": 10,
    "contextDomain": "product"
  }
]
\`\`\``;

    const response = await this.client.prompt(prompt, {
      systemContext: systemPrompt,
      temperature: 0.5, // Medium temperature for creative planning
    });

    // Parse JSON response using helper
    let subtasksData: Partial<Subtask>[];
    try {
      subtasksData = extractJSON<Partial<Subtask>[]>(response);
    } catch (error) {
      throw new Error(`Failed to parse subtasks: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Convert to full Subtask objects with defaults
    const subtasks: Subtask[] = subtasksData.map((task) => ({
      id: task.id!,
      workerType: task.workerType!,
      description: task.description!,
      instructions: task.instructions!,
      dependencies: task.dependencies || [],
      parallelGroup: task.parallelGroup,
      estimatedMinutes: task.estimatedMinutes || 15,
      status: 'pending',
      contextDomain: task.contextDomain,
      requirements: {
        enforceRBAC: task.workerType === 'api' || task.workerType === 'ui',
        applyDesignSystem: task.workerType === 'ui',
        minTestCoverage: task.workerType === 'test' ? 80 : undefined,
      },
    }));

    return subtasks;
  }

  /**
   * Build Directed Acyclic Graph (DAG) for task execution
   */
  private buildExecutionDAG(subtasks: Subtask[]): ExecutionDAG {
    // Group tasks by parallel group
    const parallelGroups: { group: number; taskIds: string[] }[] = [];
    const groupMap = new Map<number, string[]>();

    subtasks.forEach((task) => {
      if (task.parallelGroup !== undefined) {
        if (!groupMap.has(task.parallelGroup)) {
          groupMap.set(task.parallelGroup, []);
        }
        groupMap.get(task.parallelGroup)!.push(task.id);
      }
    });

    groupMap.forEach((taskIds, group) => {
      parallelGroups.push({ group, taskIds });
    });

    // Topological sort for execution order
    const executionOrder = this.topologicalSort(subtasks);

    // Calculate total estimated time (accounting for parallelization)
    const totalEstimatedMinutes = this.calculateTotalTime(subtasks, parallelGroups);

    return {
      tasks: subtasks,
      parallelGroups,
      executionOrder,
      totalEstimatedMinutes,
    };
  }

  /**
   * Topological sort of tasks based on dependencies
   */
  private topologicalSort(subtasks: Subtask[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const taskMap = new Map(subtasks.map((t) => [t.id, t]));

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected involving task ${taskId}`);
      }

      visiting.add(taskId);

      const task = taskMap.get(taskId);
      if (task) {
        task.dependencies.forEach((depId) => visit(depId));
      }

      visiting.delete(taskId);
      visited.add(taskId);
      sorted.push(taskId);
    };

    subtasks.forEach((task) => visit(task.id));

    return sorted;
  }

  /**
   * Calculate total execution time accounting for parallel groups
   */
  private calculateTotalTime(
    subtasks: Subtask[],
    parallelGroups: { group: number; taskIds: string[] }[]
  ): number {
    const taskMap = new Map(subtasks.map((t) => [t.id, t]));
    let total = 0;

    // Calculate time for each parallel group (max time within group)
    parallelGroups.forEach(({ taskIds }) => {
      const maxTime = Math.max(
        ...taskIds.map((id) => taskMap.get(id)?.estimatedMinutes || 0)
      );
      total += maxTime;
    });

    // Add time for tasks not in any parallel group
    const tasksInGroups = new Set(parallelGroups.flatMap((g) => g.taskIds));
    subtasks.forEach((task) => {
      if (!tasksInGroups.has(task.id)) {
        total += task.estimatedMinutes;
      }
    });

    return total;
  }

  /**
   * Define quality gates based on task analysis
   */
  private defineQualityGates(analysis: TaskAnalysis): QualityGate[] {
    const gates: QualityGate[] = [];

    // Always require TypeScript validation
    gates.push({
      name: 'typescript_validation',
      description: 'TypeScript compilation with 0 errors',
      required: true,
      command: 'npm run type-check',
    });

    // Require tests if complexity is medium or high
    if (analysis.complexity !== 'simple') {
      gates.push({
        name: 'tests_passing',
        description: 'All tests pass with >80% coverage',
        required: true,
        command: 'npm test',
      });
    }

    // Require RBAC checks for backend/frontend tasks
    if (analysis.layers.includes('backend') || analysis.layers.includes('frontend')) {
      gates.push({
        name: 'rbac_permissions',
        description: 'Admin features have permission gates',
        required: true,
      });
    }

    // Require build validation
    gates.push({
      name: 'build_validation',
      description: 'Production build succeeds',
      required: true,
      command: 'npm run build',
    });

    return gates;
  }

  /**
   * Define checkpoints for progress tracking
   */
  private defineCheckpoints(subtasks: Subtask[]): string[] {
    const checkpoints: string[] = [];

    // Add checkpoint after each major phase
    const phases = new Map<string, number>();
    subtasks.forEach((task) => {
      const phase = task.parallelGroup?.toString() || 'sequential';
      phases.set(phase, (phases.get(phase) || 0) + 1);
    });

    let checkpointNum = 1;
    phases.forEach((count, phase) => {
      checkpoints.push(
        `Checkpoint ${checkpointNum++}: ${phase} phase complete (${count} tasks)`
      );
    });

    checkpoints.push(`Checkpoint ${checkpointNum}: All quality gates passed`);

    return checkpoints;
  }
}
