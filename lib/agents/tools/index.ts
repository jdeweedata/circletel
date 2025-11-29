/**
 * Agent Tool Registry
 *
 * Central registry for all agent tools. Provides tool definitions and executors
 * that agents can use to interact with the system.
 *
 * @module lib/agents/tools
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 */

import { ToolDefinition, ToolExecutor, ToolResult, ExecutionContext } from '../types';
import { fileToolDefinitions, fileToolExecutors } from './file-tools';
import { databaseToolDefinitions, databaseToolExecutors } from './database-tools';

// ============================================================================
// Tool Registry
// ============================================================================

/**
 * Registry entry for a tool.
 */
export interface ToolRegistryEntry {
  definition: ToolDefinition;
  executor: ToolExecutor;
}

/**
 * Central tool registry.
 * Maps tool names to their definitions and executors.
 */
class ToolRegistry {
  private tools: Map<string, ToolRegistryEntry> = new Map();

  /**
   * Register a tool.
   *
   * @param definition - Tool definition
   * @param executor - Tool executor function
   */
  register(definition: ToolDefinition, executor: ToolExecutor): void {
    this.tools.set(definition.name, { definition, executor });
  }

  /**
   * Get a tool by name.
   *
   * @param name - Tool name
   * @returns Tool entry or undefined
   */
  get(name: string): ToolRegistryEntry | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tool definitions.
   *
   * @param categories - Optional filter by categories
   * @returns Array of tool definitions
   */
  getDefinitions(categories?: string[]): ToolDefinition[] {
    const definitions = Array.from(this.tools.values()).map(t => t.definition);

    if (categories && categories.length > 0) {
      return definitions.filter(d =>
        d.categories?.some(c => categories.includes(c))
      );
    }

    return definitions;
  }

  /**
   * Get all tool names.
   *
   * @returns Array of tool names
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool exists.
   *
   * @param name - Tool name
   * @returns Whether tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Execute a tool by name.
   *
   * @param name - Tool name
   * @param input - Tool input
   * @param context - Execution context
   * @returns Tool result
   */
  async execute<TInput = unknown, TOutput = unknown>(
    name: string,
    input: TInput,
    context: ExecutionContext
  ): Promise<ToolResult<TOutput>> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found in registry`,
        errorCode: 'TOOL_NOT_FOUND',
        metadata: {
          executionTime: 0,
          toolName: name,
        },
      };
    }

    const startTime = Date.now();

    try {
      const result = await tool.executor(input, context) as ToolResult<TOutput>;
      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime: Date.now() - startTime,
          toolName: name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'EXECUTION_ERROR',
        metadata: {
          executionTime: Date.now() - startTime,
          toolName: name,
        },
      };
    }
  }
}

// ============================================================================
// Global Registry Instance
// ============================================================================

/**
 * Global tool registry instance.
 */
export const toolRegistry = new ToolRegistry();

// ============================================================================
// Initialize Built-in Tools
// ============================================================================

/**
 * Register all built-in tools.
 */
export function initializeBuiltInTools(): void {
  // Register file tools
  for (const definition of fileToolDefinitions) {
    const executor = fileToolExecutors[definition.name];
    if (executor) {
      toolRegistry.register(definition, executor);
    }
  }

  // Register database tools
  for (const definition of databaseToolDefinitions) {
    const executor = databaseToolExecutors[definition.name];
    if (executor) {
      toolRegistry.register(definition, executor);
    }
  }
}

// Auto-initialize on import
initializeBuiltInTools();

// ============================================================================
// Tool Collections
// ============================================================================

/**
 * Get tools for a specific agent type.
 *
 * @param agentType - Type of agent
 * @returns Array of tool definitions
 */
export function getToolsForAgent(agentType: string): ToolDefinition[] {
  const toolSets: Record<string, string[]> = {
    pm: ['read_file', 'glob_files', 'grep_search', 'database_query', 'database_count'],
    dev: ['read_file', 'write_file', 'glob_files', 'grep_search', 'database_query', 'database_count'],
    qa: ['read_file', 'glob_files', 'grep_search', 'database_query'],
    ops: ['read_file', 'glob_files', 'database_query', 'database_count'],
    database: ['read_file', 'database_query', 'database_count', 'database_insert', 'database_update'],
    frontend: ['read_file', 'write_file', 'glob_files', 'grep_search'],
    backend: ['read_file', 'write_file', 'glob_files', 'grep_search', 'database_query', 'database_count'],
  };

  const allowedTools = toolSets[agentType] || [];

  return toolRegistry.getDefinitions().filter(d => allowedTools.includes(d.name));
}

// ============================================================================
// Exports
// ============================================================================

export { fileToolDefinitions, fileToolExecutors } from './file-tools';
export {
  databaseToolDefinitions,
  databaseToolExecutors,
  SAFE_TABLES,
  READ_ONLY_TABLES,
  validateTableAccess,
} from './database-tools';
