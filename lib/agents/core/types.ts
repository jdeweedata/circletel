/**
 * CircleTel Multi-Agent Orchestration System - Type Definitions
 *
 * Purpose: TypeScript interfaces for Sonnet 4.5 orchestrator + Haiku 4.5 workers
 * Architecture: Production-grade multi-agent system for parallel task execution
 *
 * @see docs/agents/SONNET_HAIKU_ORCHESTRATION.md
 */

// ============================================================================
// Core Agent Types
// ============================================================================

/**
 * Supported Claude models for orchestration
 */
export type ClaudeModel =
  | 'claude-sonnet-4-5-20250929'  // Orchestrator (strategic planning)
  | 'claude-haiku-4-5-20250929';  // Workers (fast execution)

/**
 * Agent role in the orchestration system
 */
export type AgentRole = 'orchestrator' | 'worker';

/**
 * Task complexity levels
 */
export type Complexity = 'simple' | 'medium' | 'complex';

/**
 * Application layers
 */
export type Layer =
  | 'product'      // User stories, requirements
  | 'database'     // Schema, migrations, RLS
  | 'backend'      // API routes, business logic
  | 'frontend'     // UI components, forms
  | 'testing'      // Tests (unit, integration, E2E)
  | 'integration'  // Third-party APIs
  | 'documentation'; // Docs, guides

/**
 * Worker specializations matching Layer types
 */
export type WorkerType =
  | 'user-stories'  // Product analysis worker
  | 'database'      // Database worker
  | 'api'           // Backend API worker
  | 'ui'            // Frontend UI worker
  | 'test'          // Testing worker
  | 'integration'   // Integration worker
  | 'documentation'; // Documentation worker

/**
 * Task execution status
 */
export type TaskStatus =
  | 'pending'      // Not started
  | 'in_progress'  // Currently executing
  | 'completed'    // Successfully finished
  | 'failed'       // Execution failed
  | 'retrying';    // Retrying after failure

// ============================================================================
// Task & Request Types
// ============================================================================

/**
 * User request to the orchestrator
 */
export interface UserRequest {
  /** Original user message */
  message: string;

  /** Request timestamp */
  timestamp: Date;

  /** Optional context hints */
  context?: {
    /** Current file being worked on */
    currentFile?: string;

    /** Recent changes */
    recentChanges?: string[];

    /** Relevant documentation */
    docs?: string[];
  };
}

/**
 * Orchestrator's analysis of the user request
 */
export interface TaskAnalysis {
  /** Detected user intent */
  intent: string;

  /** Task complexity level */
  complexity: Complexity;

  /** Application layers involved */
  layers: Layer[];

  /** Estimated completion time (minutes) */
  timeEstimate: number;

  /** Whether multiple agents are needed */
  requiresMultipleAgents: boolean;

  /** Extracted keywords */
  keywords: string[];

  /** Confidence in analysis (0-1) */
  confidence: number;

  /** Suggested worker types */
  suggestedWorkers: WorkerType[];
}

/**
 * Subtask assigned to a worker
 */
export interface Subtask {
  /** Unique subtask ID */
  id: string;

  /** Worker type to execute this subtask */
  workerType: WorkerType;

  /** Subtask description */
  description: string;

  /** Task-specific instructions */
  instructions: string;

  /** Dependencies (other subtask IDs that must complete first) */
  dependencies: string[];

  /** Parallel execution group (subtasks in same group run concurrently) */
  parallelGroup?: number;

  /** Estimated duration (minutes) */
  estimatedMinutes: number;

  /** Current status */
  status: TaskStatus;

  /** Domain memory context to load */
  contextDomain?: Layer;

  /** CircleTel-specific requirements */
  requirements?: {
    /** Enforce RBAC permissions */
    enforceRBAC?: boolean;

    /** Apply CircleTel design system */
    applyDesignSystem?: boolean;

    /** Minimum test coverage */
    minTestCoverage?: number;
  };
}

// ============================================================================
// Execution Plan Types
// ============================================================================

/**
 * Directed Acyclic Graph (DAG) for task execution
 */
export interface ExecutionDAG {
  /** All subtasks in the workflow */
  tasks: Subtask[];

  /** Parallel execution groups */
  parallelGroups: {
    group: number;
    taskIds: string[];
  }[];

  /** Execution order (topological sort) */
  executionOrder: string[];

  /** Total estimated duration (accounts for parallelization) */
  totalEstimatedMinutes: number;
}

/**
 * Complete execution plan from orchestrator
 */
export interface ExecutionPlan {
  /** Original user request */
  request: UserRequest;

  /** Task analysis */
  analysis: TaskAnalysis;

  /** Execution DAG */
  dag: ExecutionDAG;

  /** Quality gates to enforce */
  qualityGates: QualityGate[];

  /** Checkpoints for progress tracking */
  checkpoints: string[];

  /** Plan creation timestamp */
  createdAt: Date;
}

// ============================================================================
// Worker Execution Types
// ============================================================================

/**
 * Input provided to a worker
 */
export interface WorkerInput {
  /** Subtask to execute */
  subtask: Subtask;

  /** Results from dependency tasks */
  dependencyResults?: WorkerResult[];

  /** Domain memory context */
  domainContext?: string;

  /** CircleTel project standards */
  standards: {
    typeScriptStrict: boolean;
    designSystemColors: string[];
    rbacRequired: boolean;
    minTestCoverage: number;
  };
}

/**
 * Result from a worker execution
 */
export interface WorkerResult {
  /** Subtask that was executed */
  subtaskId: string;

  /** Worker type that executed */
  workerType: WorkerType;

  /** Execution status */
  status: 'success' | 'failure';

  /** Generated files */
  files?: {
    path: string;
    content: string;
    description: string;
  }[];

  /** Execution output/logs */
  output: string;

  /** Error details if failed */
  error?: {
    message: string;
    stack?: string;
    recoverable: boolean;
  };

  /** Confidence in result (0-1) */
  confidence: number;

  /** Actual execution time (minutes) */
  executionMinutes: number;

  /** Metadata for orchestrator */
  metadata?: {
    /** Files created/modified */
    filesChanged: string[];

    /** Dependencies installed */
    dependenciesAdded?: string[];

    /** Quality checks passed */
    qualityChecksPassed: boolean;
  };
}

// ============================================================================
// Quality Gate Types
// ============================================================================

/**
 * Quality gate to enforce before completion
 */
export interface QualityGate {
  /** Gate name */
  name: string;

  /** Gate description */
  description: string;

  /** Whether this gate is required */
  required: boolean;

  /** Command to run (if applicable) */
  command?: string;

  /** Validation function */
  validate?: (results: WorkerResult[]) => Promise<QualityGateResult>;
}

/**
 * Result of a quality gate check
 */
export interface QualityGateResult {
  /** Gate that was checked */
  gateName: string;

  /** Whether gate passed */
  passed: boolean;

  /** Failure reason if not passed */
  reason?: string;

  /** Suggested fix */
  suggestedFix?: string;
}

// ============================================================================
// Orchestration Session Types
// ============================================================================

/**
 * Complete orchestration session
 */
export interface OrchestrationSession {
  /** Unique session ID */
  id: string;

  /** User request */
  request: UserRequest;

  /** Execution plan */
  plan: ExecutionPlan;

  /** Worker results */
  results: WorkerResult[];

  /** Quality gate results */
  qualityGateResults: QualityGateResult[];

  /** Session status */
  status: 'planning' | 'executing' | 'aggregating' | 'completed' | 'failed';

  /** Session timestamps */
  timestamps: {
    started: Date;
    completed?: Date;
  };

  /** Total cost (if tracked) */
  cost?: {
    sonnetCalls: number;
    haikuCalls: number;
    estimatedDollars: number;
  };

  /** Final aggregated output */
  finalOutput?: string;
}

// ============================================================================
// Agent Configuration Types
// ============================================================================

/**
 * Configuration for Sonnet orchestrator
 */
export interface OrchestratorConfig {
  /** Model to use */
  model: 'claude-sonnet-4-5-20250929';

  /** Max planning tokens */
  maxPlanningTokens: number;

  /** Temperature for planning */
  temperature: number;

  /** Enable verbose logging */
  verbose: boolean;
}

/**
 * Configuration for Haiku workers
 */
export interface WorkerConfig {
  /** Model to use */
  model: 'claude-haiku-4-5-20250929';

  /** Max execution tokens */
  maxExecutionTokens: number;

  /** Temperature for execution */
  temperature: number;

  /** Max retries on failure */
  maxRetries: number;

  /** Retry delay (ms) */
  retryDelayMs: number;

  /** Timeout per worker (ms) */
  timeoutMs: number;
}

/**
 * Workflow engine configuration
 */
export interface WorkflowEngineConfig {
  /** Max parallel workers */
  maxParallelWorkers: number;

  /** Enable progress tracking */
  trackProgress: boolean;

  /** Progress update interval (ms) */
  progressUpdateIntervalMs: number;

  /** Enable checkpointing */
  enableCheckpoints: boolean;

  /** Checkpoint interval (minutes) */
  checkpointIntervalMinutes: number;
}

// ============================================================================
// Domain Memory Types
// ============================================================================

/**
 * Domain-specific context loaded from .claude/memory/
 */
export interface DomainContext {
  /** Domain name */
  domain: Layer;

  /** Context content from CLAUDE.md */
  content: string;

  /** Key patterns and standards */
  patterns: string[];

  /** Common pitfalls to avoid */
  antiPatterns: string[];
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

/**
 * Real-time progress update
 */
export interface ProgressUpdate {
  /** Session ID */
  sessionId: string;

  /** Current phase */
  phase: 'planning' | 'executing' | 'quality_checks' | 'aggregating';

  /** Completed subtasks */
  completedSubtasks: number;

  /** Total subtasks */
  totalSubtasks: number;

  /** Percent complete */
  percentComplete: number;

  /** Currently executing workers */
  activeWorkers: {
    workerId: string;
    workerType: WorkerType;
    subtaskId: string;
    startedAt: Date;
  }[];

  /** Estimated time remaining (minutes) */
  estimatedTimeRemaining: number;

  /** Update timestamp */
  timestamp: Date;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Orchestration error
 */
export class OrchestrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OrchestrationError';
  }
}

/**
 * Worker execution error
 */
export class WorkerExecutionError extends Error {
  constructor(
    message: string,
    public workerType: WorkerType,
    public subtaskId: string,
    public retriesLeft: number
  ) {
    super(message);
    this.name = 'WorkerExecutionError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Claude Code tool types (for reference)
 */
export type ClaudeCodeTool =
  | 'Read'
  | 'Write'
  | 'Edit'
  | 'Glob'
  | 'Grep'
  | 'Bash'
  | 'Task'
  | 'TodoWrite';

/**
 * File operation
 */
export interface FileOperation {
  type: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
  reason: string;
}
