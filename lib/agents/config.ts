/**
 * Agent Configuration Management
 *
 * Provides configuration defaults, validation, and environment-based
 * configuration for the CircleTel Agent System.
 *
 * @module lib/agents/config
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 */

import {
  AgentType,
  AgentConfig,
  AgentCapabilities,
  ModelConfig,
  ModelId,
  ToolDefinition,
  DEFAULT_MODEL_CONFIGS,
  ConfigurationError,
} from './types';

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Environment variables for agent configuration.
 * These can be overridden in .env files.
 */
export interface AgentEnvironmentConfig {
  /** Anthropic API key for Claude models */
  anthropicApiKey?: string;
  /** Google AI API key for Gemini models */
  googleAiApiKey?: string;
  /** Default model to use */
  defaultModel: ModelId;
  /** Fallback model when primary fails */
  fallbackModel: ModelId;
  /** Rate limit: requests per hour per user */
  rateLimitPerHour: number;
  /** Daily token budget */
  tokenBudgetDaily: number;
  /** Cost alert threshold in cents */
  costAlertThresholdCents: number;
  /** Enable verbose logging */
  verboseLogging: boolean;
  /** Working directory for file operations */
  workingDirectory: string;
  /** Output directory for specs */
  specsOutputDirectory: string;
}

/**
 * Load environment configuration with defaults.
 */
export function loadEnvironmentConfig(): AgentEnvironmentConfig {
  return {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY,
    defaultModel: (process.env.AGENT_DEFAULT_MODEL as ModelId) || 'claude-opus-4-5-20250929',
    fallbackModel: (process.env.AGENT_FALLBACK_MODEL as ModelId) || 'gemini-3-pro',
    rateLimitPerHour: parseInt(process.env.AGENT_RATE_LIMIT_PER_HOUR || '20', 10),
    tokenBudgetDaily: parseInt(process.env.AGENT_TOKEN_BUDGET_DAILY || '100000', 10),
    costAlertThresholdCents: parseInt(process.env.AGENT_COST_ALERT_THRESHOLD_CENTS || '5000', 10),
    verboseLogging: process.env.AGENT_VERBOSE === 'true',
    workingDirectory: process.cwd(),
    specsOutputDirectory: 'agent-os/specs',
  };
}

// ============================================================================
// Default Capabilities
// ============================================================================

/**
 * Default capabilities for each agent type.
 */
export const DEFAULT_CAPABILITIES: Record<AgentType, AgentCapabilities> = {
  pm: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: false,
    canQueryDatabase: true,
    canCallExternalAPIs: false,
    canSpawnAgents: true,
    canRequestApproval: true,
  },
  dev: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: true,
    canQueryDatabase: true,
    canCallExternalAPIs: true,
    canSpawnAgents: false,
    canRequestApproval: true,
  },
  qa: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: true,
    canQueryDatabase: true,
    canCallExternalAPIs: false,
    canSpawnAgents: false,
    canRequestApproval: false,
  },
  ops: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: true,
    canQueryDatabase: true,
    canCallExternalAPIs: true,
    canSpawnAgents: false,
    canRequestApproval: true,
  },
  database: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: false,
    canQueryDatabase: true,
    canCallExternalAPIs: false,
    canSpawnAgents: false,
    canRequestApproval: true,
  },
  frontend: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: true,
    canQueryDatabase: false,
    canCallExternalAPIs: false,
    canSpawnAgents: false,
    canRequestApproval: false,
  },
  backend: {
    canReadFiles: true,
    canWriteFiles: true,
    canExecuteCommands: true,
    canQueryDatabase: true,
    canCallExternalAPIs: true,
    canSpawnAgents: false,
    canRequestApproval: true,
  },
};

// ============================================================================
// Agent Descriptions
// ============================================================================

/**
 * Human-readable descriptions for each agent type.
 */
export const AGENT_DESCRIPTIONS: Record<AgentType, { name: string; description: string }> = {
  pm: {
    name: 'Product Manager Agent',
    description: 'Generates specifications, analyzes codebase, and breaks down tasks. Coordinates with other agents for implementation.',
  },
  dev: {
    name: 'Developer Agent',
    description: 'Implements code changes, creates features, and handles general development tasks.',
  },
  qa: {
    name: 'QA Agent',
    description: 'Creates and runs tests, validates implementations, and ensures quality standards.',
  },
  ops: {
    name: 'Operations Agent',
    description: 'Handles deployment, monitoring, and infrastructure tasks.',
  },
  database: {
    name: 'Database Engineer Agent',
    description: 'Creates migrations, designs schemas, and manages database operations.',
  },
  frontend: {
    name: 'Frontend Engineer Agent',
    description: 'Implements UI components, pages, and frontend functionality.',
  },
  backend: {
    name: 'Backend Engineer Agent',
    description: 'Creates API routes, services, and backend logic.',
  },
};

// ============================================================================
// System Prompts
// ============================================================================

/**
 * Base system prompt components.
 */
const SYSTEM_PROMPT_BASE = `You are an AI agent working on the CircleTel codebase, a B2B/B2C ISP platform for South Africa.

TECH STACK:
- Next.js 15, React 18, TypeScript
- Supabase PostgreSQL (project: agyjovdugmtopasyvlng)
- Tailwind CSS, Framer Motion
- NetCash Pay Now for payments

CRITICAL RULES:
1. NEVER generate or guess URLs - only use URLs from the codebase or user input
2. NEVER hallucinate - only reference files, functions, and variables that exist
3. Always verify assumptions against the codebase before making changes
4. Follow existing code patterns and conventions
5. Minimize blast radius - keep changes focused and contained
6. Use TypeScript with full type safety

FILE ORGANIZATION:
- Source code: app/, components/, lib/, hooks/, types/
- Database migrations: supabase/migrations/
- Documentation: docs/
- Agent specs: agent-os/specs/

BRAND COLORS:
- Primary (Orange): #F5831F
- Dark Neutral: #1F2937
- Light Neutral: #E6E9EF`;

/**
 * Agent-specific system prompts.
 */
export const SYSTEM_PROMPTS: Record<AgentType, string> = {
  pm: `${SYSTEM_PROMPT_BASE}

YOUR ROLE: Product Manager Agent

You are the Product Manager for CircleTel. You have a strictly defined product map in \`lib/agents/pm/context/product-map.ts\`.

When generating specs:
1. Always identify which 'Domain' the feature belongs to:
   - PUBLIC: Marketing pages, landing pages, public-facing content (/connectivity, /services, /cloud, etc.)
   - DASHBOARD: Customer portal (/dashboard/*) - Services, Billing, Account, Help tabs
   - PARTNER: Partner portal (/partner/*) - Leads, Commissions, Resources
   - ADMIN: Admin panel (/admin/*) - Products, Quotes, Orders, Customers, CMS, Coverage, etc.

2. Reference existing routes from the Product Map:
   - Use CIRCLETEL_SITEMAP to verify routes exist before referencing them
   - Use findRoutes() to search for related features
   - Use getRouteSection() to confirm domain placement

3. If a feature spans multiple domains (e.g., a new Product requires Admin configuration AND a Public landing page), explicitly list changes for both areas in separate sections of the spec.

You specialize in:
1. Generating detailed technical specifications from natural language requests
2. Analyzing the codebase to understand patterns and suggest implementations
3. Breaking down specs into implementable tasks with story points
4. Coordinating with other agents for implementation

SPEC FORMAT:
When generating specs, follow the CircleTel format:
- Executive Summary with Goal and Success Criteria
- Domain Analysis (which domains are affected: Public, Dashboard, Partner, Admin)
- User Stories with story points (Fibonacci: 1, 2, 3, 5, 8, 13)
- System Architecture with ASCII diagrams
- Route Changes (new routes, modified routes per domain)
- Database Schema (if applicable)
- API Endpoints (if applicable)
- Testing Requirements

OUTPUT LOCATION:
Save specs to: agent-os/specs/[YYYYMMDD]-[feature-name]/

CONTEXT SOURCES:
- lib/agents/pm/context/product-map.ts - Product map and sitemap reference
- docs/architecture/SYSTEM_OVERVIEW.md - Main architecture reference
- Existing specs in agent-os/specs/ - Follow established patterns
- CLAUDE.md - Project guidelines`,

  dev: `${SYSTEM_PROMPT_BASE}

YOUR ROLE: Developer Agent

You specialize in implementing code changes across the full stack.

IMPLEMENTATION RULES:
1. Read existing code before making changes
2. Follow established patterns in the codebase
3. Keep implementations simple and focused
4. Run type-check before considering work complete
5. Document complex logic with comments

COMMON PATTERNS:
- API Routes: app/api/[endpoint]/route.ts with async params
- Components: components/[domain]/ComponentName.tsx
- Services: lib/[domain]/[name]-service.ts
- Hooks: hooks/use-[name].ts`,

  qa: `${SYSTEM_PROMPT_BASE}

YOUR ROLE: QA Agent

You specialize in testing and validation.

TESTING GUIDELINES:
1. Unit tests for business logic
2. Integration tests for API routes
3. E2E tests with Playwright for critical flows
4. Type coverage with TypeScript

TEST LOCATIONS:
- Unit tests: alongside source files or __tests__/
- E2E tests: tests/e2e/
- Integration tests: __tests__/integration/`,

  ops: `${SYSTEM_PROMPT_BASE}

YOUR ROLE: Operations Agent

You specialize in deployment and infrastructure.

DEPLOYMENT:
- Vercel for production (www.circletel.co.za)
- Staging branch for testing
- Database: Supabase Cloud

ENVIRONMENT:
- Always check env vars before deployment
- Verify database migrations are applied
- Monitor Vercel dashboard for errors`,

  database: `${SYSTEM_PROMPT_BASE}

YOUR ROLE: Database Engineer Agent

You specialize in database design and migrations.

MIGRATION RULES:
1. Create migrations in: supabase/migrations/[timestamp]_[name].sql
2. Always include RLS policies
3. Add indexes for frequently queried columns
4. Use foreign keys with appropriate ON DELETE behavior
5. Document schema changes

TABLE NAMING:
- Use snake_case
- Plural form (customers, orders)
- Prefix related tables (customer_services, customer_billing)

RLS PATTERNS:
- Admin: Service role bypasses RLS
- Customer: auth.uid() matches customer_id
- Public: Read-only where applicable`,

  frontend: `${SYSTEM_PROMPT_BASE}

YOUR ROLE: Frontend Engineer Agent

You specialize in UI components and pages.

COMPONENT RULES:
1. Use TypeScript with proper prop types
2. Follow shadcn/ui patterns for base components
3. Use Tailwind for styling
4. Implement loading and error states
5. Make components accessible (ARIA labels)

STYLING:
- Use CircleTel brand colors
- Consistent spacing with Tailwind scale
- Responsive design (mobile-first)
- Framer Motion for animations`,

  backend: `${SYSTEM_PROMPT_BASE}

YOUR ROLE: Backend Engineer Agent

You specialize in API routes and services.

API PATTERNS:
- Next.js 15 route handlers with async params
- Supabase server client for database
- Service role for admin operations
- RLS-protected queries for user data

ERROR HANDLING:
- Return consistent JSON error responses
- Log errors for debugging
- Use appropriate HTTP status codes

AUTHENTICATION:
- Check Authorization header AND cookies
- Validate admin permissions via RBAC
- Use service role sparingly`,
};

// ============================================================================
// Configuration Builders
// ============================================================================

/**
 * Create model configuration for a specific task type.
 *
 * @param taskType - Type of task (planning, analysis, execution, simple)
 * @param overrides - Optional configuration overrides
 * @returns Model configuration
 */
export function createModelConfig(
  taskType: keyof typeof DEFAULT_MODEL_CONFIGS = 'planning',
  overrides?: Partial<ModelConfig>
): ModelConfig {
  const base = DEFAULT_MODEL_CONFIGS[taskType] || DEFAULT_MODEL_CONFIGS.planning;
  return { ...base, ...overrides };
}

/**
 * Create capabilities with overrides.
 *
 * @param agentType - Agent type for defaults
 * @param overrides - Optional capability overrides
 * @returns Agent capabilities
 */
export function createCapabilities(
  agentType: AgentType,
  overrides?: Partial<AgentCapabilities>
): AgentCapabilities {
  const base = DEFAULT_CAPABILITIES[agentType];
  return { ...base, ...overrides };
}

/**
 * Create a full agent configuration.
 *
 * @param type - Agent type
 * @param options - Configuration options
 * @returns Complete agent configuration
 */
export function createAgentConfig(
  type: AgentType,
  options: {
    name?: string;
    model?: Partial<ModelConfig>;
    capabilities?: Partial<AgentCapabilities>;
    tools?: ToolDefinition[];
    maxTurns?: number;
    taskTimeout?: number;
    verbose?: boolean;
  } = {}
): AgentConfig {
  const description = AGENT_DESCRIPTIONS[type];
  const envConfig = loadEnvironmentConfig();

  return {
    type,
    name: options.name || description.name,
    model: createModelConfig('planning', options.model),
    systemPrompt: SYSTEM_PROMPTS[type],
    tools: options.tools || [],
    capabilities: createCapabilities(type, options.capabilities),
    maxTurns: options.maxTurns || 50,
    taskTimeout: options.taskTimeout || 300000, // 5 minutes default
    verbose: options.verbose ?? envConfig.verboseLogging,
  };
}

// ============================================================================
// Configuration Validation
// ============================================================================

/**
 * Validate agent configuration.
 *
 * @param config - Configuration to validate
 * @throws ConfigurationError if validation fails
 */
export function validateAgentConfig(config: AgentConfig): void {
  const errors: string[] = [];

  // Check required fields
  if (!config.type) {
    errors.push('Agent type is required');
  }

  if (!config.model) {
    errors.push('Model configuration is required');
  }

  if (!config.systemPrompt) {
    errors.push('System prompt is required');
  }

  // Validate model configuration
  if (config.model) {
    if (!config.model.primary) {
      errors.push('Primary model is required');
    }

    if (config.model.maxContextTokens < 1000) {
      errors.push('Max context tokens must be at least 1000');
    }

    if (config.model.maxOutputTokens < 100) {
      errors.push('Max output tokens must be at least 100');
    }

    if (config.model.temperature < 0 || config.model.temperature > 1) {
      errors.push('Temperature must be between 0 and 1');
    }
  }

  // Validate timeouts
  if (config.taskTimeout && config.taskTimeout < 1000) {
    errors.push('Task timeout must be at least 1000ms');
  }

  if (config.maxTurns && config.maxTurns < 1) {
    errors.push('Max turns must be at least 1');
  }

  if (errors.length > 0) {
    throw new ConfigurationError('Invalid agent configuration', { errors });
  }
}

// ============================================================================
// Cost Calculation
// ============================================================================

/**
 * Token pricing per model (per 1K tokens in cents).
 */
export const MODEL_PRICING: Record<ModelId, { input: number; output: number }> = {
  'claude-opus-4-5-20250929': { input: 1.5, output: 7.5 },
  'claude-sonnet-4-5-20250929': { input: 0.3, output: 1.5 },
  'gemini-3-pro': { input: 0.125, output: 0.5 },
  'gemini-3-flash': { input: 0.0375, output: 0.15 },
};

/**
 * Calculate cost for token usage.
 *
 * @param modelId - Model used
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Cost in cents
 */
export function calculateCost(
  modelId: ModelId,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) {
    return 0;
  }

  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;

  return Math.round((inputCost + outputCost) * 100) / 100; // Round to 2 decimal places
}

/**
 * Estimate cost for a task based on expected token usage.
 *
 * @param modelId - Model to use
 * @param estimatedInputTokens - Expected input tokens
 * @param estimatedOutputTokens - Expected output tokens
 * @returns Estimated cost in cents with breakdown
 */
export function estimateCost(
  modelId: ModelId,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): { total: number; input: number; output: number } {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) {
    return { total: 0, input: 0, output: 0 };
  }

  const inputCost = (estimatedInputTokens / 1000) * pricing.input;
  const outputCost = (estimatedOutputTokens / 1000) * pricing.output;

  return {
    total: Math.round((inputCost + outputCost) * 100) / 100,
    input: Math.round(inputCost * 100) / 100,
    output: Math.round(outputCost * 100) / 100,
  };
}
