/**
 * PM Agent Types
 *
 * Type definitions specific to the Product Manager Agent.
 * Includes spec generation, task breakdown, and analysis types.
 *
 * @module lib/agents/pm/types
 */

// ============================================================================
// Feature Request Types
// ============================================================================

/**
 * Input for spec generation - what the user wants to build.
 */
export interface FeatureRequest {
  /** Natural language description of the feature */
  description: string;
  /** Optional priority level */
  priority?: 'low' | 'medium' | 'high' | 'critical';
  /** Optional target completion date */
  targetDate?: string;
  /** Optional business justification */
  businessJustification?: string;
  /** Optional technical constraints */
  constraints?: string[];
  /** Optional related features or specs */
  relatedSpecs?: string[];
}

/**
 * Complexity levels for story point estimation.
 */
export type Complexity = 'trivial' | 'simple' | 'moderate' | 'complex' | 'very_complex';

/**
 * Story point mapping based on Fibonacci scale.
 */
export const STORY_POINT_MAP: Record<Complexity, number> = {
  trivial: 1,
  simple: 2,
  moderate: 3,
  complex: 5,
  very_complex: 8,
};

// ============================================================================
// Analysis Types
// ============================================================================

/**
 * Result of codebase analysis.
 */
export interface CodebaseAnalysis {
  /** Project structure summary */
  structure: {
    /** Total files analyzed */
    totalFiles: number;
    /** Files by category */
    filesByCategory: Record<string, number>;
    /** Key directories identified */
    keyDirectories: string[];
  };
  /** Existing patterns found */
  patterns: {
    /** API route patterns */
    apiPatterns: PatternInfo[];
    /** Component patterns */
    componentPatterns: PatternInfo[];
    /** Service patterns */
    servicePatterns: PatternInfo[];
    /** Database patterns */
    databasePatterns: PatternInfo[];
  };
  /** Technology stack detected */
  techStack: {
    framework: string;
    language: string;
    database: string;
    styling: string;
    testing: string;
  };
  /** Relevant existing implementations */
  relevantCode: RelevantCodeSection[];
}

/**
 * Information about a code pattern.
 */
export interface PatternInfo {
  /** Pattern name */
  name: string;
  /** Example file path */
  examplePath: string;
  /** Description of the pattern */
  description: string;
  /** Usage count in codebase */
  usageCount: number;
}

/**
 * A section of code relevant to the feature request.
 */
export interface RelevantCodeSection {
  /** File path */
  path: string;
  /** Start line */
  startLine: number;
  /** End line */
  endLine: number;
  /** Why it's relevant */
  relevance: string;
  /** Code snippet */
  snippet?: string;
}

/**
 * Result of impact analysis.
 */
export interface ImpactAnalysis {
  /** Files that will be created */
  filesToCreate: FileChange[];
  /** Files that will be modified */
  filesToModify: FileChange[];
  /** Files that may be affected */
  potentiallyAffected: string[];
  /** Database tables affected */
  databaseTables: DatabaseChange[];
  /** API endpoints affected */
  apiEndpoints: APIChange[];
  /** Dependencies to add */
  dependencies: DependencyChange[];
  /** Risk assessment */
  riskLevel: 'low' | 'medium' | 'high';
  /** Risk factors */
  riskFactors: string[];
}

/**
 * A file change (create or modify).
 */
export interface FileChange {
  /** File path */
  path: string;
  /** Type of change */
  changeType: 'create' | 'modify' | 'delete';
  /** Description of change */
  description: string;
  /** Estimated lines of code */
  estimatedLines?: number;
}

/**
 * A database table change.
 */
export interface DatabaseChange {
  /** Table name */
  table: string;
  /** Type of change */
  changeType: 'create' | 'alter' | 'drop';
  /** Columns affected */
  columns?: string[];
  /** Description */
  description: string;
}

/**
 * An API endpoint change.
 */
export interface APIChange {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Endpoint path */
  path: string;
  /** Type of change */
  changeType: 'create' | 'modify';
  /** Description */
  description: string;
}

/**
 * A dependency change.
 */
export interface DependencyChange {
  /** Package name */
  name: string;
  /** Version (if specific) */
  version?: string;
  /** Why it's needed */
  reason: string;
  /** Dev dependency */
  devDependency?: boolean;
}

// ============================================================================
// Spec Generation Types
// ============================================================================

/**
 * Complete spec output from the PM Agent.
 */
export interface SpecOutput {
  /** Spec identifier (YYYYMMDD-feature-name) */
  specId: string;
  /** Directory path where spec is saved */
  specPath: string;
  /** Generated spec content (markdown) */
  specContent: string;
  /** Generated tasks content (markdown) */
  tasksContent: string;
  /** Generated README content (markdown) */
  readmeContent: string;
  /** Total estimated story points */
  estimatedPoints: number;
  /** List of affected files */
  affectedFiles: string[];
  /** Dependencies identified */
  dependencies: string[];
  /** Codebase analysis results */
  analysis: CodebaseAnalysis;
  /** Impact analysis results */
  impact: ImpactAnalysis;
  /** Generation metadata */
  metadata: SpecMetadata;
}

/**
 * Metadata about spec generation.
 */
export interface SpecMetadata {
  /** When spec was generated */
  generatedAt: Date;
  /** Model used for generation */
  model: string;
  /** Tokens used */
  tokensUsed: number;
  /** Generation time in ms */
  generationTime: number;
  /** Version of the spec format */
  formatVersion: string;
}

// ============================================================================
// User Story Types
// ============================================================================

/**
 * A user story in the spec.
 */
export interface UserStory {
  /** Story ID (US-1, US-2, etc.) */
  id: string;
  /** Story title */
  title: string;
  /** Story description */
  description: string;
  /** Acceptance criteria */
  acceptanceCriteria: string[];
  /** Story points */
  storyPoints: number;
  /** Story type */
  type: 'primary' | 'technical' | 'enhancement';
  /** Priority */
  priority: 'must_have' | 'should_have' | 'nice_to_have';
  /** Dependencies on other stories */
  dependencies?: string[];
}

// ============================================================================
// Task Types
// ============================================================================

/**
 * A task group for implementation.
 */
export interface TaskGroup {
  /** Group number */
  groupNumber: number;
  /** Group title */
  title: string;
  /** Assigned role */
  assignedTo: 'database-engineer' | 'backend-engineer' | 'frontend-engineer' | 'testing-engineer' | 'ops-engineer';
  /** Dependencies (other task group numbers) */
  dependencies: number[];
  /** Priority */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Story points */
  storyPoints: number;
  /** Individual tasks */
  tasks: Task[];
  /** Related user stories */
  relatedStories: string[];
  /** Acceptance criteria */
  acceptanceCriteria: string[];
  /** Files to create */
  filesToCreate: string[];
}

/**
 * An individual task within a task group.
 */
export interface Task {
  /** Task ID (e.g., 1.1, 1.2) */
  id: string;
  /** Task title */
  title: string;
  /** Task description */
  description: string;
  /** Subtasks */
  subtasks?: SubTask[];
  /** Status */
  status: 'not_started' | 'in_progress' | 'complete' | 'blocked';
}

/**
 * A subtask within a task.
 */
export interface SubTask {
  /** Subtask ID (e.g., 1.1.1) */
  id: string;
  /** Subtask description */
  description: string;
  /** Status */
  status: 'not_started' | 'in_progress' | 'complete';
}

// ============================================================================
// Architecture Types
// ============================================================================

/**
 * System architecture section of the spec.
 */
export interface ArchitectureSection {
  /** High-level workflow */
  workflow: WorkflowStage[];
  /** Integration points */
  integrations: Integration[];
  /** Data flow diagram (ASCII) */
  dataFlowDiagram: string;
  /** Component diagram (ASCII) */
  componentDiagram: string;
}

/**
 * A stage in the workflow.
 */
export interface WorkflowStage {
  /** Stage number */
  number: number;
  /** Stage name */
  name: string;
  /** Description */
  description: string;
  /** Inputs */
  inputs: string[];
  /** Outputs */
  outputs: string[];
}

/**
 * An external integration.
 */
export interface Integration {
  /** Integration name */
  name: string;
  /** Type */
  type: 'api' | 'webhook' | 'database' | 'storage' | 'email' | 'sms' | 'payment';
  /** Description */
  description: string;
  /** Required env vars */
  envVars?: string[];
}

// ============================================================================
// Database Schema Types
// ============================================================================

/**
 * Database schema section of the spec.
 */
export interface DatabaseSchema {
  /** Tables to create */
  tables: TableDefinition[];
  /** Indexes to create */
  indexes: IndexDefinition[];
  /** RLS policies */
  rlsPolicies: RLSPolicy[];
  /** Functions/triggers */
  functions: FunctionDefinition[];
}

/**
 * A table definition.
 */
export interface TableDefinition {
  /** Table name */
  name: string;
  /** Description */
  description: string;
  /** Columns */
  columns: ColumnDefinition[];
  /** Foreign keys */
  foreignKeys: ForeignKey[];
  /** Primary key columns */
  primaryKey: string[];
  /** Unique constraints */
  uniqueConstraints?: string[][];
}

/**
 * A column definition.
 */
export interface ColumnDefinition {
  /** Column name */
  name: string;
  /** Data type */
  type: string;
  /** Is nullable */
  nullable: boolean;
  /** Default value */
  default?: string;
  /** Description */
  description?: string;
  /** Check constraint */
  check?: string;
}

/**
 * A foreign key definition.
 */
export interface ForeignKey {
  /** Column name */
  column: string;
  /** Referenced table */
  references: {
    table: string;
    column: string;
  };
  /** On delete behavior */
  onDelete: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'NO ACTION';
}

/**
 * An index definition.
 */
export interface IndexDefinition {
  /** Index name */
  name: string;
  /** Table */
  table: string;
  /** Columns */
  columns: string[];
  /** Is unique */
  unique: boolean;
}

/**
 * An RLS policy definition.
 */
export interface RLSPolicy {
  /** Policy name */
  name: string;
  /** Table */
  table: string;
  /** Operation (SELECT, INSERT, UPDATE, DELETE, ALL) */
  operation: string;
  /** Using clause */
  using: string;
  /** With check clause */
  withCheck?: string;
  /** Description */
  description: string;
}

/**
 * A function/trigger definition.
 */
export interface FunctionDefinition {
  /** Function name */
  name: string;
  /** Description */
  description: string;
  /** SQL body */
  sql: string;
}

// ============================================================================
// PM Agent Configuration
// ============================================================================

/**
 * Supported model IDs (imported from parent types for consistency).
 */
export type PMModelId =
  | 'claude-opus-4-5-20250929'
  | 'claude-sonnet-4-5-20250929'
  | 'gemini-3-pro'
  | 'gemini-3-flash';

/**
 * Configuration options for the PM Agent.
 */
export interface PMAgentConfig {
  /** Output directory for specs */
  outputDirectory: string;
  /** Model to use for generation */
  model: PMModelId;
  /** Maximum tokens for context */
  maxContextTokens: number;
  /** Whether to include code snippets */
  includeCodeSnippets: boolean;
  /** Whether to auto-save generated specs */
  autoSave: boolean;
  /** Verbose logging */
  verbose: boolean;
}

/**
 * Default PM Agent configuration.
 */
export const DEFAULT_PM_CONFIG: PMAgentConfig = {
  outputDirectory: 'agent-os/specs',
  model: 'claude-opus-4-5-20250929',
  maxContextTokens: 150000,
  includeCodeSnippets: true,
  autoSave: true,
  verbose: false,
};
