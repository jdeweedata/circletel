/**
 * Base Agent Class
 *
 * Provides the foundational implementation for all CircleTel agents.
 * Handles message management, tool execution, event emission, and lifecycle.
 *
 * @module lib/agents/base-agent
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 */

import { randomUUID } from 'crypto';
import {
  AgentCapabilities,
  AgentConfig,
  AgentMetadata,
  AgentStatus,
  AgentMessage,
  AgentTask,
  AgentEvent,
  AgentEventType,
  AgentEventHandler,
  ExecutionContext,
  ToolDefinition,
  ToolResult,
  ToolExecutor,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,
  AgentError,
  ToolExecutionError,
  ContextOverflowError,
  TaskTimeoutError,
} from './types';
import { validateAgentConfig, calculateCost } from './config';

// ============================================================================
// Base Agent Class
// ============================================================================

/**
 * Abstract base class for all agents.
 *
 * Provides common functionality:
 * - Message history management
 * - Tool registration and execution
 * - Event emission for observability
 * - Context and token budget tracking
 * - Lifecycle management
 *
 * @example
 * ```typescript
 * class PMAgent extends BaseAgent {
 *   async generateSpec(request: string): Promise<SpecOutput> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class BaseAgent {
  /** Agent metadata */
  protected readonly metadata: AgentMetadata;

  /** Agent configuration */
  protected readonly config: AgentConfig;

  /** Current agent status */
  protected status: AgentStatus = 'idle';

  /** Conversation message history */
  protected messages: AgentMessage[] = [];

  /** Registered tools */
  protected tools: Map<string, { definition: ToolDefinition; executor: ToolExecutor }> = new Map();

  /** Event handlers */
  protected eventHandlers: Map<AgentEventType, AgentEventHandler[]> = new Map();

  /** Current execution context */
  protected context: ExecutionContext | null = null;

  /** Token usage tracking */
  protected tokenUsage = {
    input: 0,
    output: 0,
    total: 0,
  };

  /** Cost tracking in cents */
  protected costCents = 0;

  /**
   * Create a new agent instance.
   *
   * @param config - Agent configuration
   * @throws ConfigurationError if config is invalid
   */
  constructor(config: AgentConfig) {
    // Validate configuration
    validateAgentConfig(config);

    this.config = config;

    // Default capabilities
    const defaultCapabilities: AgentCapabilities = {
      canReadFiles: false,
      canWriteFiles: false,
      canExecuteCommands: false,
      canQueryDatabase: false,
      canCallExternalAPIs: false,
      canSpawnAgents: false,
      canRequestApproval: false,
    };

    // Generate metadata
    this.metadata = {
      id: randomUUID(),
      type: config.type,
      name: config.name || `${config.type}-agent`,
      description: config.systemPrompt.slice(0, 200),
      version: '1.0.0',
      capabilities: { ...defaultCapabilities, ...config.capabilities },
      createdAt: new Date(),
    };

    // Register tools from config
    for (const toolDef of config.tools) {
      this.registerToolDefinition(toolDef);
    }
  }

  // ==========================================================================
  // Public Getters
  // ==========================================================================

  /** Get agent ID */
  get id(): string {
    return this.metadata.id;
  }

  /** Get agent type */
  get type(): string {
    return this.metadata.type;
  }

  /** Get agent name */
  get name(): string {
    return this.metadata.name;
  }

  /** Get current status */
  get currentStatus(): AgentStatus {
    return this.status;
  }

  /** Get message count */
  get messageCount(): number {
    return this.messages.length;
  }

  /** Get token usage */
  get tokens(): { input: number; output: number; total: number } {
    return { ...this.tokenUsage };
  }

  /** Get cost in cents */
  get cost(): number {
    return this.costCents;
  }

  // ==========================================================================
  // Message Management
  // ==========================================================================

  /**
   * Add a message to the conversation history.
   *
   * @param role - Message role
   * @param content - Message content
   * @param tokenCount - Optional token count for the message
   * @returns The created message
   */
  protected addMessage(
    role: AgentMessage['role'],
    content: string | ContentBlock[],
    tokenCount?: number
  ): AgentMessage {
    const message: AgentMessage = {
      id: randomUUID(),
      role,
      content,
      timestamp: new Date(),
      tokenCount,
    };

    this.messages.push(message);

    // Track tokens
    if (tokenCount) {
      if (role === 'user' || role === 'system') {
        this.tokenUsage.input += tokenCount;
      } else {
        this.tokenUsage.output += tokenCount;
      }
      this.tokenUsage.total = this.tokenUsage.input + this.tokenUsage.output;
    }

    // Emit event
    this.emit('message:sent', { message });

    return message;
  }

  /**
   * Get conversation history for API calls.
   *
   * @returns Array of messages formatted for API
   */
  protected getConversationHistory(): Array<{
    role: 'user' | 'assistant';
    content: string | ContentBlock[];
  }> {
    return this.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  /**
   * Clear conversation history.
   * Optionally keeps system message.
   *
   * @param keepSystemMessage - Whether to preserve system messages
   */
  protected clearHistory(keepSystemMessage = true): void {
    if (keepSystemMessage) {
      this.messages = this.messages.filter(m => m.role === 'system');
    } else {
      this.messages = [];
    }

    this.tokenUsage = { input: 0, output: 0, total: 0 };
    this.costCents = 0;
  }

  /**
   * Summarize conversation history to reduce context.
   * Called when approaching token limits.
   *
   * @returns Summary of conversation
   */
  protected async summarizeHistory(): Promise<string> {
    // This should be implemented by subclasses with actual LLM calls
    // For now, return a simple summary
    const messageCount = this.messages.length;
    const turns = Math.floor(messageCount / 2);

    return `[Conversation summary: ${turns} turns, ${this.tokenUsage.total} tokens used]`;
  }

  // ==========================================================================
  // Tool Management
  // ==========================================================================

  /**
   * Register a tool definition (without executor).
   * Executor must be registered separately via registerToolExecutor.
   *
   * @param definition - Tool definition
   */
  protected registerToolDefinition(definition: ToolDefinition): void {
    if (this.tools.has(definition.name)) {
      const existing = this.tools.get(definition.name)!;
      this.tools.set(definition.name, { ...existing, definition });
    } else {
      this.tools.set(definition.name, {
        definition,
        executor: this.createPlaceholderExecutor(definition.name),
      });
    }
  }

  /**
   * Register a tool executor.
   *
   * @param name - Tool name
   * @param executor - Executor function
   */
  public registerToolExecutor<TInput = unknown, TOutput = unknown>(
    name: string,
    executor: ToolExecutor<TInput, TOutput>
  ): void {
    const existing = this.tools.get(name);
    if (existing) {
      this.tools.set(name, { ...existing, executor: executor as ToolExecutor });
    } else {
      throw new AgentError(`Tool "${name}" not defined. Register definition first.`, 'TOOL_NOT_FOUND');
    }
  }

  /**
   * Get all tool definitions for API calls.
   *
   * @returns Array of tool definitions
   */
  protected getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  /**
   * Execute a tool by name.
   *
   * @param name - Tool name
   * @param input - Tool input
   * @returns Tool result
   * @throws ToolExecutionError if tool execution fails
   */
  protected async executeTool<TInput = unknown, TOutput = unknown>(
    name: string,
    input: TInput
  ): Promise<ToolResult<TOutput>> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new ToolExecutionError(`Tool "${name}" not found`, name);
    }

    // Check capabilities
    if (!this.canUseTool(tool.definition)) {
      throw new ToolExecutionError(
        `Agent lacks capability to use tool "${name}"`,
        name,
        { capabilities: this.metadata.capabilities }
      );
    }

    // Emit tool:called event
    this.emit('tool:called', { toolName: name, input });

    const startTime = Date.now();

    try {
      // Check for approval requirement
      if (tool.definition.requiresApproval && this.metadata.capabilities.canRequestApproval) {
        await this.requestApproval(`Tool "${name}" requires approval`, { toolName: name, input });
      }

      // Execute the tool
      const result = await tool.executor(input, this.context!) as ToolResult<TOutput>;

      // Emit success event
      this.emit('tool:completed', {
        toolName: name,
        input,
        result,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Emit failure event
      this.emit('tool:failed', {
        toolName: name,
        input,
        error: errorMessage,
        duration: Date.now() - startTime,
      });

      throw new ToolExecutionError(errorMessage, name, { originalError: error });
    }
  }

  /**
   * Check if agent can use a specific tool based on capabilities.
   *
   * @param tool - Tool definition
   * @returns Whether agent can use the tool
   */
  private canUseTool(tool: ToolDefinition): boolean {
    const caps = this.metadata.capabilities;
    const categories = tool.categories || [];

    // Check category-based capabilities
    if (categories.includes('file:read') && !caps.canReadFiles) return false;
    if (categories.includes('file:write') && !caps.canWriteFiles) return false;
    if (categories.includes('command') && !caps.canExecuteCommands) return false;
    if (categories.includes('database') && !caps.canQueryDatabase) return false;
    if (categories.includes('external-api') && !caps.canCallExternalAPIs) return false;

    return true;
  }

  /**
   * Create a placeholder executor for tools without implementation.
   *
   * @param toolName - Name of the tool
   * @returns Placeholder executor
   */
  private createPlaceholderExecutor(toolName: string): ToolExecutor {
    return async () => ({
      success: false,
      error: `Tool "${toolName}" has no executor registered`,
      metadata: {
        executionTime: 0,
        toolName,
      },
    });
  }

  // ==========================================================================
  // Event System
  // ==========================================================================

  /**
   * Register an event handler.
   *
   * @param eventType - Event type to listen for
   * @param handler - Handler function
   */
  public on(eventType: AgentEventType, handler: AgentEventHandler): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }

  /**
   * Remove an event handler.
   *
   * @param eventType - Event type
   * @param handler - Handler to remove
   */
  public off(eventType: AgentEventType, handler: AgentEventHandler): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(eventType, handlers);
    }
  }

  /**
   * Emit an event.
   *
   * @param eventType - Event type
   * @param data - Event data
   */
  protected emit(eventType: AgentEventType, data: Record<string, unknown> = {}): void {
    const event: AgentEvent = {
      type: eventType,
      timestamp: new Date(),
      agentId: this.metadata.id,
      sessionId: this.context?.sessionId || 'no-session',
      data,
    };

    const handlers = this.eventHandlers.get(eventType) || [];
    for (const handler of handlers) {
      try {
        // Fire and forget - don't block on handler execution
        Promise.resolve(handler(event)).catch(err => {
          console.error(`Event handler error for ${eventType}:`, err);
        });
      } catch (err) {
        console.error(`Sync event handler error for ${eventType}:`, err);
      }
    }
  }

  // ==========================================================================
  // Context Management
  // ==========================================================================

  /**
   * Create an execution context for a task.
   *
   * @param options - Context options
   * @returns Execution context
   */
  protected createContext(options: {
    sessionId?: string;
    userId?: string;
    parentAgentId?: string;
    tokenBudget?: number;
    costBudgetCents?: number;
  } = {}): ExecutionContext {
    const context: ExecutionContext = {
      sessionId: options.sessionId || randomUUID(),
      agentId: this.metadata.id,
      userId: options.userId,
      parentAgentId: options.parentAgentId,
      workingDirectory: process.cwd(),
      environment: this.getEnvironmentVariables(),
      tokenBudget: {
        total: options.tokenBudget || 100000,
        used: this.tokenUsage.total,
        remaining: (options.tokenBudget || 100000) - this.tokenUsage.total,
      },
      costTracking: {
        totalCostCents: this.costCents,
        dailyLimitCents: options.costBudgetCents || 5000,
        remainingCents: (options.costBudgetCents || 5000) - this.costCents,
      },
      sharedState: new Map(),
      fileLocks: new Set(),
    };

    this.context = context;
    return context;
  }

  /**
   * Update context with new token/cost usage.
   *
   * @param inputTokens - Input tokens used
   * @param outputTokens - Output tokens used
   */
  protected updateContextUsage(inputTokens: number, outputTokens: number): void {
    this.tokenUsage.input += inputTokens;
    this.tokenUsage.output += outputTokens;
    this.tokenUsage.total = this.tokenUsage.input + this.tokenUsage.output;

    // Calculate cost
    const cost = calculateCost(this.config.model.primary, inputTokens, outputTokens);
    this.costCents += cost;

    // Update context
    if (this.context) {
      this.context.tokenBudget.used = this.tokenUsage.total;
      this.context.tokenBudget.remaining = this.context.tokenBudget.total - this.tokenUsage.total;
      this.context.costTracking.totalCostCents = this.costCents;
      this.context.costTracking.remainingCents =
        this.context.costTracking.dailyLimitCents - this.costCents;
    }

    // Check for overflows
    if (this.context && this.context.tokenBudget.remaining < 0) {
      throw new ContextOverflowError('Token budget exceeded', {
        used: this.tokenUsage.total,
        budget: this.context.tokenBudget.total,
      });
    }
  }

  /**
   * Get safe environment variables.
   *
   * @returns Filtered environment variables
   */
  private getEnvironmentVariables(): Record<string, string> {
    const allowedVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_SUPABASE_URL',
      'VERCEL_ENV',
      'VERCEL_URL',
    ];

    const env: Record<string, string> = {};
    for (const key of allowedVars) {
      if (process.env[key]) {
        env[key] = process.env[key]!;
      }
    }

    return env;
  }

  // ==========================================================================
  // Lifecycle Management
  // ==========================================================================

  /**
   * Start the agent.
   * Initialize resources and prepare for task execution.
   *
   * @param options - Start options
   */
  public async start(options: {
    sessionId?: string;
    userId?: string;
    tokenBudget?: number;
    costBudgetCents?: number;
  } = {}): Promise<void> {
    if (this.status !== 'idle' && this.status !== 'completed' && this.status !== 'failed') {
      throw new AgentError('Agent is already running', 'INVALID_STATE');
    }

    // Create context
    this.createContext(options);

    // Add system message
    this.addMessage('system', this.config.systemPrompt);

    // Update status
    this.status = 'idle';
    this.emit('agent:started', { config: this.config });
  }

  /**
   * Stop the agent.
   * Clean up resources and save state.
   */
  public async stop(): Promise<void> {
    this.status = 'idle';
    this.context = null;
    this.emit('agent:stopped', { tokenUsage: this.tokenUsage, cost: this.costCents });
  }

  /**
   * Request human approval for an action.
   *
   * @param message - Approval message
   * @param data - Data related to the action
   * @returns Whether approval was granted
   */
  protected async requestApproval(
    message: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    if (!this.metadata.capabilities.canRequestApproval) {
      return true; // Skip approval if not capable
    }

    this.status = 'waiting';
    this.emit('approval:requested', { message, data });

    // In development mode, auto-approve
    // In production, this would wait for external approval
    const approved = true;

    this.emit('approval:received', { approved, message, data });
    this.status = 'executing';

    return approved;
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  /**
   * Execute a task with timeout handling.
   *
   * @param task - Task to execute
   * @returns Task result
   */
  public async executeTask(task: AgentTask): Promise<AgentTask> {
    const timeout = this.config.taskTimeout || 300000;

    this.status = 'thinking';
    this.emit('task:started', { task });

    const startTime = Date.now();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TaskTimeoutError(`Task timed out after ${timeout}ms`, { taskId: task.id }));
        }, timeout);
      });

      // Execute task with timeout
      const result = await Promise.race([
        this.executeTaskInternal(task),
        timeoutPromise,
      ]);

      task.status = 'completed';
      task.completedAt = new Date();
      task.output = result;

      this.emit('task:completed', {
        task,
        duration: Date.now() - startTime,
        tokenUsage: this.tokenUsage,
      });

      this.status = 'completed';
      return task;
    } catch (error) {
      task.status = 'failed';
      task.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof AgentError ? error.code : 'UNKNOWN_ERROR',
        stack: error instanceof Error ? error.stack : undefined,
      };

      this.emit('task:failed', {
        task,
        error: task.error,
        duration: Date.now() - startTime,
      });

      this.status = 'failed';
      throw error;
    }
  }

  /**
   * Internal task execution logic.
   * Must be implemented by subclasses.
   *
   * @param task - Task to execute
   * @returns Task result
   */
  protected abstract executeTaskInternal(task: AgentTask): Promise<Record<string, unknown>>;

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Process tool calls from an assistant message.
   *
   * @param toolCalls - Array of tool use blocks
   * @returns Array of tool result blocks
   */
  protected async processToolCalls(toolCalls: ToolUseBlock[]): Promise<ToolResultBlock[]> {
    const results: ToolResultBlock[] = [];

    for (const toolCall of toolCalls) {
      try {
        const result = await this.executeTool(toolCall.name, toolCall.input);

        results.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result.data),
          is_error: !result.success,
        });
      } catch (error) {
        results.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: error instanceof Error ? error.message : 'Tool execution failed',
          is_error: true,
        });
      }
    }

    return results;
  }

  /**
   * Extract text content from a message.
   *
   * @param content - Message content
   * @returns Text content
   */
  protected extractTextContent(content: string | ContentBlock[]): string {
    if (typeof content === 'string') {
      return content;
    }

    return content
      .filter((block): block is TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  }

  /**
   * Extract tool use blocks from content.
   *
   * @param content - Message content
   * @returns Array of tool use blocks
   */
  protected extractToolUseBlocks(content: string | ContentBlock[]): ToolUseBlock[] {
    if (typeof content === 'string') {
      return [];
    }

    return content.filter((block): block is ToolUseBlock => block.type === 'tool_use');
  }

  /**
   * Get agent state for serialization/persistence.
   *
   * @returns Agent state
   */
  public getState(): {
    metadata: AgentMetadata;
    status: AgentStatus;
    messages: AgentMessage[];
    tokenUsage: { input: number; output: number; total: number };
    costCents: number;
  } {
    return {
      metadata: this.metadata,
      status: this.status,
      messages: this.messages,
      tokenUsage: { ...this.tokenUsage },
      costCents: this.costCents,
    };
  }

  /**
   * Restore agent state from serialized data.
   *
   * @param state - Saved state
   */
  public restoreState(state: {
    messages: AgentMessage[];
    tokenUsage: { input: number; output: number; total: number };
    costCents: number;
  }): void {
    this.messages = state.messages;
    this.tokenUsage = { ...state.tokenUsage };
    this.costCents = state.costCents;
  }
}
