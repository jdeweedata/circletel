/**
 * Agent System Types
 *
 * Core type definitions for the CircleTel Agentic AI System.
 * Provides interfaces for agents, tools, messages, and execution contexts.
 *
 * @module lib/agents/types
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 */

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Available agent types in the system.
 * Each agent specializes in specific tasks.
 */
export type AgentType =
  | 'pm'           // Product Manager - specs, analysis, task breakdown
  | 'dev'          // Developer - code implementation
  | 'qa'           // QA Engineer - testing, validation
  | 'ops'          // Operations - deployment, monitoring
  | 'database'     // Database Engineer - schemas, migrations
  | 'frontend'     // Frontend Engineer - UI components
  | 'backend';     // Backend Engineer - API routes, services

/**
 * Agent execution status.
 */
export type AgentStatus =
  | 'idle'           // Ready to accept tasks
  | 'thinking'       // Processing/reasoning
  | 'executing'      // Running tools
  | 'waiting'        // Waiting for user input or approval
  | 'completed'      // Task completed successfully
  | 'failed'         // Task failed
  | 'cancelled';     // Task was cancelled

/**
 * Agent capability flags.
 * Define what an agent can do.
 */
export interface AgentCapabilities {
  /** Can read files from the filesystem */
  canReadFiles: boolean;
  /** Can write/edit files */
  canWriteFiles: boolean;
  /** Can execute shell commands */
  canExecuteCommands: boolean;
  /** Can make database queries */
  canQueryDatabase: boolean;
  /** Can make external API calls */
  canCallExternalAPIs: boolean;
  /** Can create sub-agents */
  canSpawnAgents: boolean;
  /** Can request human approval */
  canRequestApproval: boolean;
}

/**
 * Agent metadata for identification and tracking.
 */
export interface AgentMetadata {
  /** Unique agent identifier */
  id: string;
  /** Agent type */
  type: AgentType;
  /** Human-readable name */
  name: string;
  /** Description of agent's role */
  description: string;
  /** Version string */
  version: string;
  /** Agent capabilities */
  capabilities: AgentCapabilities;
  /** Creation timestamp */
  createdAt: Date;
}

// ============================================================================
// Model Types
// ============================================================================

/**
 * Supported AI models.
 */
export type ModelId =
  | 'claude-opus-4-5-20250929'    // Best reasoning (primary)
  | 'claude-sonnet-4-5-20250929'  // Balanced
  | 'gemini-3-pro'                // Cost-effective fallback
  | 'gemini-3-flash';             // Fast, cheap

/**
 * Model configuration for an agent.
 */
export interface ModelConfig {
  /** Primary model to use */
  primary: ModelId;
  /** Fallback model if primary fails */
  fallback?: ModelId;
  /** Maximum tokens for context window */
  maxContextTokens: number;
  /** Maximum tokens for output */
  maxOutputTokens: number;
  /** Temperature for generation (0-1) */
  temperature: number;
  /** Top-p sampling */
  topP?: number;
}

/**
 * Default model configurations by task type.
 */
export const DEFAULT_MODEL_CONFIGS: Record<string, ModelConfig> = {
  planning: {
    primary: 'claude-opus-4-5-20250929',
    maxContextTokens: 200000,
    maxOutputTokens: 16000,
    temperature: 0.7,
  },
  analysis: {
    primary: 'claude-opus-4-5-20250929',
    maxContextTokens: 200000,
    maxOutputTokens: 8000,
    temperature: 0.3,
  },
  execution: {
    primary: 'gemini-3-pro',
    fallback: 'claude-sonnet-4-5-20250929',
    maxContextTokens: 100000,
    maxOutputTokens: 4000,
    temperature: 0.2,
  },
  simple: {
    primary: 'gemini-3-flash',
    maxContextTokens: 32000,
    maxOutputTokens: 2000,
    temperature: 0.1,
  },
};

// ============================================================================
// Message Types
// ============================================================================

/**
 * Role of a message participant.
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Content block types within a message.
 */
export type ContentBlockType = 'text' | 'tool_use' | 'tool_result' | 'image';

/**
 * Text content block.
 */
export interface TextBlock {
  type: 'text';
  text: string;
}

/**
 * Tool use content block.
 */
export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result content block.
 */
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | Array<TextBlock>;
  is_error?: boolean;
}

/**
 * Image content block.
 */
export interface ImageBlock {
  type: 'image';
  source: {
    type: 'base64' | 'url';
    media_type: string;
    data: string;
  };
}

/**
 * Union type for all content blocks.
 */
export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | ImageBlock;

/**
 * A message in an agent conversation.
 */
export interface AgentMessage {
  /** Unique message identifier */
  id: string;
  /** Message role */
  role: MessageRole;
  /** Message content (can be string or content blocks) */
  content: string | ContentBlock[];
  /** Timestamp */
  timestamp: Date;
  /** Token count for this message */
  tokenCount?: number;
  /** Associated tool calls */
  toolCalls?: ToolUseBlock[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Tool parameter definition.
 */
export interface ToolParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** Description for the AI */
  description: string;
  /** Whether required */
  required: boolean;
  /** Default value */
  default?: unknown;
  /** Enum values if applicable */
  enum?: string[];
  /** Nested properties for object type */
  properties?: Record<string, ToolParameter>;
}

/**
 * Tool definition for agent use.
 */
export interface ToolDefinition {
  /** Tool name (unique identifier) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Tool parameters schema */
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
  };
  /** Whether tool requires human approval */
  requiresApproval?: boolean;
  /** Categories for filtering */
  categories?: string[];
}

/**
 * Result from tool execution.
 */
export interface ToolResult<T = unknown> {
  /** Whether execution succeeded */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Error code if failed */
  errorCode?: string;
  /** Execution metadata */
  metadata: {
    /** Execution time in milliseconds */
    executionTime: number;
    /** Tool name */
    toolName: string;
    /** Cache hit indicator */
    cacheHit?: boolean;
  };
}

/**
 * Tool executor function signature.
 */
export type ToolExecutor<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: ExecutionContext
) => Promise<ToolResult<TOutput>>;

// ============================================================================
// Execution Context
// ============================================================================

/**
 * Context passed to agents and tools during execution.
 */
export interface ExecutionContext {
  /** Session identifier */
  sessionId: string;
  /** Current agent */
  agentId: string;
  /** User who initiated the request */
  userId?: string;
  /** Parent agent if this is a sub-agent */
  parentAgentId?: string;
  /** Working directory */
  workingDirectory: string;
  /** Environment variables available */
  environment: Record<string, string>;
  /** Token budget remaining */
  tokenBudget: {
    total: number;
    used: number;
    remaining: number;
  };
  /** Cost tracking */
  costTracking: {
    totalCostCents: number;
    dailyLimitCents: number;
    remainingCents: number;
  };
  /** Shared state between agents */
  sharedState: Map<string, unknown>;
  /** File locks held by this agent */
  fileLocks: Set<string>;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

// ============================================================================
// Task Types
// ============================================================================

/**
 * Task priority levels.
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Task status.
 */
export type TaskStatus =
  | 'pending'
  | 'queued'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * A task to be executed by an agent.
 */
export interface AgentTask {
  /** Unique task identifier */
  id: string;
  /** Task title */
  title: string;
  /** Detailed description */
  description: string;
  /** Task type for routing */
  type: string;
  /** Priority level */
  priority: TaskPriority;
  /** Current status */
  status: TaskStatus;
  /** Assigned agent type */
  assignedAgent?: AgentType;
  /** Story points estimate */
  storyPoints?: number;
  /** Dependencies (task IDs) */
  dependencies?: string[];
  /** Input data */
  input?: Record<string, unknown>;
  /** Output data (when completed) */
  output?: Record<string, unknown>;
  /** Error information (if failed) */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  /** Creation timestamp */
  createdAt: Date;
  /** Start timestamp */
  startedAt?: Date;
  /** Completion timestamp */
  completedAt?: Date;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Agent Configuration
// ============================================================================

/**
 * Configuration for agent initialization.
 */
export interface AgentConfig {
  /** Agent type */
  type: AgentType;
  /** Custom name override */
  name?: string;
  /** Model configuration */
  model: ModelConfig;
  /** System prompt */
  systemPrompt: string;
  /** Available tools */
  tools: ToolDefinition[];
  /** Capability overrides */
  capabilities?: Partial<AgentCapabilities>;
  /** Maximum conversation turns before summarization */
  maxTurns?: number;
  /** Maximum time for a single task (ms) */
  taskTimeout?: number;
  /** Whether to enable verbose logging */
  verbose?: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Agent event types for observability.
 */
export type AgentEventType =
  | 'agent:started'
  | 'agent:stopped'
  | 'task:started'
  | 'task:completed'
  | 'task:failed'
  | 'tool:called'
  | 'tool:completed'
  | 'tool:failed'
  | 'message:sent'
  | 'message:received'
  | 'approval:requested'
  | 'approval:received'
  | 'handoff:initiated'
  | 'handoff:completed'
  | 'error:occurred'
  // PM Agent specific events
  | 'spec:generation:started'
  | 'spec:generation:completed'
  | 'spec:generation:failed'
  | 'spec:analyzing:codebase'
  | 'spec:analyzing:impact'
  | 'spec:generating:spec'
  | 'spec:generating:tasks'
  | 'spec:generating:architecture';

/**
 * Agent event payload.
 */
export interface AgentEvent {
  /** Event type */
  type: AgentEventType;
  /** Event timestamp */
  timestamp: Date;
  /** Agent ID */
  agentId: string;
  /** Session ID */
  sessionId: string;
  /** Event-specific data */
  data: Record<string, unknown>;
}

/**
 * Event handler function signature.
 */
export type AgentEventHandler = (event: AgentEvent) => void | Promise<void>;

// ============================================================================
// Handoff Types
// ============================================================================

/**
 * Context for agent-to-agent handoff.
 */
export interface HandoffContext {
  /** Source agent */
  sourceAgent: AgentType;
  /** Target agent */
  targetAgent: AgentType;
  /** Task being handed off */
  taskId: string;
  /** Context to transfer */
  context: {
    /** Spec ID if applicable */
    specId?: string;
    /** Current progress summary */
    currentProgress: string;
    /** Relevant file paths */
    relevantFiles: string[];
    /** Decisions made so far */
    decisions: Array<{
      type: string;
      decision: string;
      rationale: string;
      timestamp: Date;
    }>;
    /** Known blockers */
    blockers: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  /** Priority of the handoff */
  priority: TaskPriority;
  /** Whether human approval is required */
  requiresApproval: boolean;
}

/**
 * Result of a handoff operation.
 */
export interface HandoffResult {
  /** Whether handoff succeeded */
  success: boolean;
  /** Handoff ID for tracking */
  handoffId: string;
  /** Status */
  status: 'completed' | 'pending_approval' | 'failed';
  /** Error message if failed */
  error?: string;
  /** Target agent ID after handoff */
  targetAgentId?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error class for agent system.
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentError';
    Object.setPrototypeOf(this, AgentError.prototype);
  }
}

/**
 * Error thrown when agent configuration is invalid.
 */
export class ConfigurationError extends AgentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error thrown when tool execution fails.
 */
export class ToolExecutionError extends AgentError {
  constructor(
    message: string,
    public toolName: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'TOOL_EXECUTION_ERROR', { ...details, toolName });
    this.name = 'ToolExecutionError';
    Object.setPrototypeOf(this, ToolExecutionError.prototype);
  }
}

/**
 * Error thrown when context/token budget exceeded.
 */
export class ContextOverflowError extends AgentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONTEXT_OVERFLOW_ERROR', details);
    this.name = 'ContextOverflowError';
    Object.setPrototypeOf(this, ContextOverflowError.prototype);
  }
}

/**
 * Error thrown when task times out.
 */
export class TaskTimeoutError extends AgentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TASK_TIMEOUT_ERROR', details);
    this.name = 'TaskTimeoutError';
    Object.setPrototypeOf(this, TaskTimeoutError.prototype);
  }
}

/**
 * Error thrown when handoff fails.
 */
export class HandoffError extends AgentError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'HANDOFF_ERROR', details);
    this.name = 'HandoffError';
    Object.setPrototypeOf(this, HandoffError.prototype);
  }
}
