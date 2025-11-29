/**
 * PM Agent Module
 *
 * Exports for the Product Manager Agent that generates Agent-OS specifications
 * from natural language feature requests.
 *
 * @module lib/agents/pm
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 *
 * @example
 * ```typescript
 * import { PMAgent } from '@/lib/agents/pm';
 *
 * const agent = PMAgent.forDevelopment();
 * await agent.start();
 *
 * const spec = await agent.generateSpec({
 *   description: 'Add user dashboard with usage tracking',
 *   priority: 'high',
 * });
 *
 * console.log(`Spec: ${spec.specId}`);
 * console.log(`Points: ${spec.estimatedPoints}`);
 * ```
 */

// ============================================================================
// Main Agent Export
// ============================================================================

export { PMAgent, default } from './agent';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Feature Request
  FeatureRequest,
  Complexity,

  // Analysis Types
  CodebaseAnalysis,
  PatternInfo,
  RelevantCodeSection,
  ImpactAnalysis,
  FileChange,
  DatabaseChange,
  APIChange,
  DependencyChange,

  // Spec Generation Types
  SpecOutput,
  SpecMetadata,
  UserStory,

  // Task Types
  TaskGroup,
  Task,
  SubTask,

  // Architecture Types
  ArchitectureSection,
  WorkflowStage,
  Integration,

  // Database Schema Types
  DatabaseSchema,
  TableDefinition,
  ColumnDefinition,
  ForeignKey,
  IndexDefinition,
  RLSPolicy,
  FunctionDefinition,

  // Configuration
  PMAgentConfig,
} from './types';

export { STORY_POINT_MAP, DEFAULT_PM_CONFIG } from './types';

// ============================================================================
// Analyzer Exports
// ============================================================================

export {
  CodebaseAnalyzer,
  FILE_CATEGORIES,
  IGNORE_DIRS,
  KEY_DIRECTORIES,
} from './analyzers/codebase-analyzer';

export {
  ImpactAnalyzer,
  FEATURE_SYSTEM_MAP,
  RISK_WEIGHTS,
} from './analyzers/impact-analyzer';

// ============================================================================
// Generator Exports
// ============================================================================

export {
  SpecGenerator,
  type GeneratedSpec,
  type SpecGeneratorOptions,
} from './generators/spec-generator';

export {
  TaskGenerator,
  type AgentRole,
  type GeneratedTasks,
  type TaskGeneratorOptions,
} from './generators/task-generator';

export {
  ArchitectureGenerator,
  type GeneratedArchitecture,
  type ArchitectureGeneratorOptions,
  INTEGRATION_PATTERNS,
} from './generators/architecture-generator';

// ============================================================================
// Template Exports
// ============================================================================

export {
  templates,
  generateReadmeContent,
  generateProgressContent,
  generateMigrationTemplate,
  generateAPIRouteTemplate,
  generateComponentTemplate,
  generateServiceTemplate,
} from './templates';

// ============================================================================
// Convenience Factories
// ============================================================================

/**
 * Create a new PM Agent with default settings.
 *
 * @returns New PM Agent instance
 */
export function createPMAgent(): import('./agent').PMAgent {
  const { PMAgent } = require('./agent');
  return PMAgent.create();
}

/**
 * Create a PM Agent configured for development.
 *
 * @returns New PM Agent instance for development
 */
export function createDevelopmentPMAgent(): import('./agent').PMAgent {
  const { PMAgent } = require('./agent');
  return PMAgent.forDevelopment();
}

/**
 * Create a PM Agent configured for API use.
 *
 * @returns New PM Agent instance for API
 */
export function createAPIPMAgent(): import('./agent').PMAgent {
  const { PMAgent } = require('./agent');
  return PMAgent.forAPI();
}
