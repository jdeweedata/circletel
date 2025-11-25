/**
 * Shared Types for MCP Code Execution Tools
 *
 * These types enable structured data exchange between AI assistants and CircleTel systems,
 * reducing token usage by 75%+ through programmatic execution instead of text-based interaction.
 */

// ============================================================================
// Supabase Query Executor Types
// ============================================================================

export type QueryOperation = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

export type FilterOperator =
  | 'eq'      // equals
  | 'neq'     // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'like'    // pattern matching
  | 'ilike'   // case-insensitive pattern matching
  | 'in'      // in array
  | 'is'      // is null/not null
  | 'contains'// array contains
  | 'containedBy' // array contained by
  | 'overlaps'; // array overlap

export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: any;
}

export interface JoinClause {
  table: string;
  on: {
    leftColumn: string;
    rightColumn: string;
  };
  type?: 'inner' | 'left' | 'right';
}

export interface OrderByClause {
  column: string;
  ascending?: boolean;
}

export interface SupabaseQueryRequest {
  table: string;
  operation: QueryOperation;

  // SELECT options
  columns?: string[];           // Columns to select (default: '*')
  filters?: FilterCondition[];  // WHERE conditions
  joins?: JoinClause[];         // JOIN clauses
  orderBy?: OrderByClause[];    // ORDER BY clauses
  limit?: number;               // LIMIT
  offset?: number;              // OFFSET

  // INSERT/UPDATE/UPSERT options
  data?: Record<string, any> | Record<string, any>[]; // Data to insert/update
  returning?: string[];         // Columns to return after mutation

  // UPSERT options
  onConflict?: string[];        // Columns for conflict resolution

  // Advanced options
  count?: 'exact' | 'planned' | 'estimated'; // Include row count
  single?: boolean;             // Return single object instead of array
}

export interface QueryMetadata {
  rowCount: number;
  executionTime: number;
  bytesProcessed?: number;
  cacheHit?: boolean;
}

export interface SupabaseQueryResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  errorCode?: string;
  metadata: QueryMetadata;
}

// ============================================================================
// Coverage Executor Types
// ============================================================================

export type ServiceType =
  | 'fibre'
  | 'lte'
  | 'wireless'
  | '5g'
  | 'vdsl'
  | 'adsl';

export type ProviderType =
  | 'mtn'
  | 'dfa'
  | 'openserve'
  | 'vumatel'
  | 'octotel'
  | 'metrofibre';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CoverageCheckRequest {
  // Address or coordinates (one required)
  address?: string;
  coordinates?: Coordinates;

  // Filtering options
  providers?: ProviderType[];
  serviceTypes?: ServiceType[];

  // Response options
  includeDetails?: boolean;
  includePricing?: boolean;
}

export interface ProviderCoverage {
  provider: ProviderType;
  available: boolean;
  serviceType: ServiceType;
  signalStrength?: number;
  estimatedSpeed?: {
    download: number;
    upload: number;
  };
  confidence: number; // 0-100
}

export interface CoverageCheckResponse {
  success: boolean;
  coverage: {
    address: string;
    coordinates: Coordinates;
    providers: Record<ProviderType, ProviderCoverage>;
    bestServices: ProviderCoverage[];
  };
  summary: {
    totalProviders: number;
    availableProviders: number;
    bestService: ServiceType | 'none';
  };
  metadata: QueryMetadata;
}

// ============================================================================
// ZOHO Health Check Types
// ============================================================================

export type ZohoEntity =
  | 'customers'
  | 'services'
  | 'invoices'
  | 'payments'
  | 'subscriptions';

export type SyncStatus =
  | 'synced'
  | 'pending'
  | 'failed'
  | 'never_synced';

export interface ZohoHealthCheckRequest {
  detailed?: boolean;
  entities?: ZohoEntity[];
  includeFailures?: boolean;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface EntityHealthResult {
  entity: ZohoEntity;
  total: number;
  synced: number;
  pending: number;
  failed: number;
  neverSynced: number;
  syncRate: string; // Percentage
  lastSyncTime?: Date;
  failures?: Array<{
    id: string;
    errorMessage: string;
    attemptCount: number;
  }>;
}

export interface ZohoHealthCheckResponse {
  success: boolean;
  results: EntityHealthResult[];
  overallHealth: 'healthy' | 'degraded' | 'critical';
  summary: {
    totalEntities: number;
    healthyEntities: number;
    totalSynced: number;
    totalFailed: number;
  };
  metadata: QueryMetadata;
}

// ============================================================================
// Migration Validator Types
// ============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  type: string;
  severity: ValidationSeverity;
  message: string;
  table?: string;
  column?: string;
  file?: string;
  lineNumber?: number;
  suggestion?: string;
}

export interface MigrationValidationRequest {
  migrationFile?: string;    // Validate specific file
  checkPending?: boolean;    // Check all pending migrations
  validateRLS?: boolean;     // Verify RLS policies
  checkIndexes?: boolean;    // Verify index coverage
  checkDependencies?: boolean; // Check table dependencies
}

export interface MigrationInfo {
  version: string;
  filename: string;
  appliedAt?: Date;
  isPending: boolean;
}

export interface MigrationValidationResponse {
  success: boolean;
  issues: ValidationIssue[];
  migrations: {
    applied: MigrationInfo[];
    pending: MigrationInfo[];
  };
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    pendingCount: number;
  };
  metadata: QueryMetadata;
}

// ============================================================================
// Admin Actions Executor Types
// ============================================================================

export type AdminAction =
  | 'reset_password'
  | 'unlock_account'
  | 'retry_zoho_sync'
  | 'cancel_order'
  | 'refund_payment'
  | 'activate_service'
  | 'deactivate_service';

export interface AdminActionRequest {
  action: AdminAction;
  entityType: 'customer' | 'order' | 'service' | 'payment';
  entityId: string;
  reason?: string;
  performedBy: string;
  options?: Record<string, any>;
}

export interface AdminActionResponse {
  success: boolean;
  action: AdminAction;
  entityId: string;
  result: any;
  auditLog: {
    id: string;
    performedBy: string;
    timestamp: Date;
    changes: Record<string, any>;
  };
  error?: string;
  metadata: QueryMetadata;
}

// ============================================================================
// Common Utility Types
// ============================================================================

export interface ExecutorConfig {
  timeout?: number;           // Operation timeout in ms (default: 30000)
  retries?: number;           // Number of retries on failure (default: 0)
  cacheEnabled?: boolean;     // Enable caching (default: false)
  cacheTTL?: number;          // Cache TTL in seconds (default: 300)
  logExecution?: boolean;     // Log to audit table (default: true)
}

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: Date;
  ttl: number;
}

export interface AuditLogEntry {
  id: string;
  toolName: string;
  operation: string;
  request: any;
  response: any;
  executedBy: string;
  executedAt: Date;
  executionTime: number;
  success: boolean;
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class ExecutorError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ExecutorError';
  }
}

export class ValidationError extends ExecutorError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends ExecutorError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

export class TimeoutError extends ExecutorError {
  constructor(message: string, details?: any) {
    super(message, 'TIMEOUT_ERROR', details);
    this.name = 'TimeoutError';
  }
}

export class AuthenticationError extends ExecutorError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}
