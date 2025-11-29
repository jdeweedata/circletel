/**
 * CircleTel Agent System
 *
 * Main entry point for the agentic AI system.
 * Provides agents for product management, development, QA, and operations.
 *
 * @module lib/agents
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 *
 * @example
 * ```typescript
 * import { BaseAgent, createAgentConfig, toolRegistry } from '@/lib/agents';
 *
 * // Create PM Agent configuration
 * const config = createAgentConfig('pm', {
 *   tools: toolRegistry.getDefinitions(['file:read', 'database']),
 * });
 *
 * // Extend BaseAgent for custom implementation
 * class PMAgent extends BaseAgent {
 *   async generateSpec(request: string): Promise<SpecOutput> {
 *     // Implementation
 *   }
 * }
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Agent types
  AgentType,
  AgentStatus,
  AgentCapabilities,
  AgentMetadata,
  AgentConfig,
  AgentTask,
  AgentEvent,
  AgentEventType,
  AgentEventHandler,

  // Model types
  ModelId,
  ModelConfig,

  // Message types
  MessageRole,
  ContentBlockType,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,
  ImageBlock,
  AgentMessage,

  // Tool types
  ToolParameter,
  ToolDefinition,
  ToolResult,
  ToolExecutor,

  // Context types
  ExecutionContext,
  TaskPriority,
  TaskStatus,

  // Handoff types
  HandoffContext,
  HandoffResult,
} from './types';

// ============================================================================
// Error Classes
// ============================================================================

export {
  AgentError,
  ConfigurationError,
  ToolExecutionError,
  ContextOverflowError,
  TaskTimeoutError,
  HandoffError,
} from './types';

// ============================================================================
// Constants
// ============================================================================

export { DEFAULT_MODEL_CONFIGS } from './types';

// ============================================================================
// Configuration
// ============================================================================

export {
  // Environment config
  loadEnvironmentConfig,
  type AgentEnvironmentConfig,

  // Default configurations
  DEFAULT_CAPABILITIES,
  AGENT_DESCRIPTIONS,
  SYSTEM_PROMPTS,

  // Configuration builders
  createModelConfig,
  createCapabilities,
  createAgentConfig,

  // Validation
  validateAgentConfig,

  // Cost calculation
  MODEL_PRICING,
  calculateCost,
  estimateCost,
} from './config';

// ============================================================================
// Base Agent
// ============================================================================

export { BaseAgent } from './base-agent';

// ============================================================================
// Tool System
// ============================================================================

export {
  // Registry
  toolRegistry,
  initializeBuiltInTools,
  getToolsForAgent,

  // File tools
  fileToolDefinitions,
  fileToolExecutors,

  // Database tools
  databaseToolDefinitions,
  databaseToolExecutors,
  SAFE_TABLES,
  READ_ONLY_TABLES,
  validateTableAccess,
} from './tools';

// ============================================================================
// Utility Functions
// ============================================================================

import { randomUUID } from 'crypto';
import { AgentTask, TaskPriority, TaskStatus } from './types';

/**
 * Create a new agent task.
 *
 * @param options - Task options
 * @returns New agent task
 */
export function createTask(options: {
  title: string;
  description: string;
  type: string;
  priority?: TaskPriority;
  assignedAgent?: string;
  storyPoints?: number;
  dependencies?: string[];
  input?: Record<string, unknown>;
}): AgentTask {
  return {
    id: randomUUID(),
    title: options.title,
    description: options.description,
    type: options.type,
    priority: options.priority || 'medium',
    status: 'pending' as TaskStatus,
    assignedAgent: options.assignedAgent as any,
    storyPoints: options.storyPoints,
    dependencies: options.dependencies,
    input: options.input,
    createdAt: new Date(),
  };
}

/**
 * Generate a unique session ID.
 *
 * @param prefix - Optional prefix
 * @returns Session ID
 */
export function generateSessionId(prefix?: string): string {
  const id = randomUUID();
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Format token count for display.
 *
 * @param tokens - Token count
 * @returns Formatted string
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  }
  return `${(tokens / 1000).toFixed(1)}K tokens`;
}

/**
 * Format cost for display.
 *
 * @param cents - Cost in cents
 * @returns Formatted string
 */
export function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ============================================================================
// Version
// ============================================================================

/**
 * Agent system version.
 */
export const AGENT_SYSTEM_VERSION = '1.0.0';
