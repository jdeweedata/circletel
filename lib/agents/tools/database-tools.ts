/**
 * Database Tools for Agents
 *
 * Provides database query capabilities for agents.
 * Wraps the existing Supabase executor from .claude/tools/.
 *
 * @module lib/agents/tools/database-tools
 * @see .claude/tools/supabase-executor.ts
 */

import { ToolDefinition, ToolExecutor, ToolResult, ExecutionContext } from '../types';

// Import types from existing tools (these will be resolved at runtime)
// We define our own types here to avoid circular dependencies
type FilterOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'like' | 'ilike' | 'in' | 'is' | 'contains' | 'containedBy' | 'overlaps';

interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

interface OrderByClause {
  column: string;
  ascending?: boolean;
}

// ============================================================================
// Types
// ============================================================================

interface DatabaseQueryInput {
  table: string;
  columns?: string[];
  filters?: FilterCondition[];
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
  single?: boolean;
}

interface DatabaseCountInput {
  table: string;
  filters?: FilterCondition[];
}

interface DatabaseInsertInput {
  table: string;
  data: Record<string, unknown> | Record<string, unknown>[];
  returning?: string[];
}

interface DatabaseUpdateInput {
  table: string;
  data: Record<string, unknown>;
  filters: FilterCondition[];
  returning?: string[];
}

interface DatabaseDeleteInput {
  table: string;
  filters: FilterCondition[];
}

// ============================================================================
// Safe Table List
// ============================================================================

/**
 * Tables that agents are allowed to query.
 * Excludes sensitive tables like auth, admin credentials, etc.
 */
const SAFE_TABLES = new Set([
  // Core business tables
  'customers',
  'consumer_orders',
  'service_packages',
  'coverage_leads',
  'business_quotes',

  // B2B KYC tables
  'kyc_sessions',
  'contracts',
  'invoices',
  'rica_submissions',

  // Partner tables
  'partners',
  'partner_commissions',

  // Customer dashboard
  'customer_services',
  'customer_billing',
  'customer_invoices',
  'usage_history',
  'support_tickets',

  // CMS tables
  'pb_pages',
  'pb_templates',
  'pb_media',

  // Product tables
  'product_cost_components',

  // Integration logs (read-only)
  'zoho_sync_logs',
  'payment_webhooks',
  'notification_logs',
  'api_health_checks',
]);

/**
 * Tables that are read-only for agents.
 */
const READ_ONLY_TABLES = new Set([
  'zoho_sync_logs',
  'payment_webhooks',
  'notification_logs',
  'api_health_checks',
  'audit_logs',
]);

/**
 * Validate table access.
 *
 * @param table - Table name
 * @param operation - Operation type
 * @throws Error if table is not allowed
 */
function validateTableAccess(table: string, operation: 'read' | 'write'): void {
  if (!SAFE_TABLES.has(table)) {
    throw new Error(`Table "${table}" is not accessible to agents`);
  }

  if (operation === 'write' && READ_ONLY_TABLES.has(table)) {
    throw new Error(`Table "${table}" is read-only for agents`);
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const databaseToolDefinitions: ToolDefinition[] = [
  {
    name: 'database_query',
    description: 'Query data from the database. Returns rows matching the criteria.',
    parameters: {
      type: 'object',
      properties: {
        table: {
          name: 'table',
          type: 'string',
          description: 'Table name to query',
          required: true,
        },
        columns: {
          name: 'columns',
          type: 'array',
          description: 'Columns to select (default: all)',
          required: false,
        },
        filters: {
          name: 'filters',
          type: 'array',
          description: 'Filter conditions [{ column, operator, value }]',
          required: false,
        },
        orderBy: {
          name: 'orderBy',
          type: 'array',
          description: 'Order by clauses [{ column, ascending }]',
          required: false,
        },
        limit: {
          name: 'limit',
          type: 'number',
          description: 'Maximum rows to return (default: 100)',
          required: false,
          default: 100,
        },
        offset: {
          name: 'offset',
          type: 'number',
          description: 'Number of rows to skip',
          required: false,
        },
        single: {
          name: 'single',
          type: 'boolean',
          description: 'Return single object instead of array',
          required: false,
        },
      },
      required: ['table'],
    },
    categories: ['database'],
  },
  {
    name: 'database_count',
    description: 'Count rows in a table matching criteria.',
    parameters: {
      type: 'object',
      properties: {
        table: {
          name: 'table',
          type: 'string',
          description: 'Table name to count',
          required: true,
        },
        filters: {
          name: 'filters',
          type: 'array',
          description: 'Filter conditions [{ column, operator, value }]',
          required: false,
        },
      },
      required: ['table'],
    },
    categories: ['database'],
  },
  {
    name: 'database_insert',
    description: 'Insert data into a table. Requires approval.',
    parameters: {
      type: 'object',
      properties: {
        table: {
          name: 'table',
          type: 'string',
          description: 'Table name to insert into',
          required: true,
        },
        data: {
          name: 'data',
          type: 'object',
          description: 'Data to insert (object or array of objects)',
          required: true,
        },
        returning: {
          name: 'returning',
          type: 'array',
          description: 'Columns to return after insert',
          required: false,
        },
      },
      required: ['table', 'data'],
    },
    categories: ['database'],
    requiresApproval: true,
  },
  {
    name: 'database_update',
    description: 'Update data in a table. Requires filters for safety.',
    parameters: {
      type: 'object',
      properties: {
        table: {
          name: 'table',
          type: 'string',
          description: 'Table name to update',
          required: true,
        },
        data: {
          name: 'data',
          type: 'object',
          description: 'Data to update',
          required: true,
        },
        filters: {
          name: 'filters',
          type: 'array',
          description: 'Filter conditions (required for safety)',
          required: true,
        },
        returning: {
          name: 'returning',
          type: 'array',
          description: 'Columns to return after update',
          required: false,
        },
      },
      required: ['table', 'data', 'filters'],
    },
    categories: ['database'],
    requiresApproval: true,
  },
  {
    name: 'database_delete',
    description: 'Delete data from a table. Requires filters for safety.',
    parameters: {
      type: 'object',
      properties: {
        table: {
          name: 'table',
          type: 'string',
          description: 'Table name to delete from',
          required: true,
        },
        filters: {
          name: 'filters',
          type: 'array',
          description: 'Filter conditions (required for safety)',
          required: true,
        },
      },
      required: ['table', 'filters'],
    },
    categories: ['database'],
    requiresApproval: true,
  },
];

// ============================================================================
// Tool Executors
// ============================================================================

/**
 * Database query executor.
 * Wraps the Supabase executor for SELECT operations.
 */
async function executeDatabaseQuery(
  input: DatabaseQueryInput,
  context: ExecutionContext
): Promise<ToolResult<unknown[]>> {
  const startTime = Date.now();

  try {
    // Validate table access
    validateTableAccess(input.table, 'read');

    // Dynamically import the Supabase executor to avoid circular deps
    const { executeQuery } = await import('../../../.claude/tools/supabase-executor');

    const result = await executeQuery({
      table: input.table,
      operation: 'select',
      columns: input.columns,
      filters: input.filters,
      orderBy: input.orderBy,
      limit: input.limit || 100,
      offset: input.offset,
      single: input.single,
    }, {
      timeout: 30000,
      logExecution: true,
    }, context.userId || 'agent');

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Query failed',
        errorCode: result.errorCode,
        metadata: {
          executionTime: Date.now() - startTime,
          toolName: 'database_query',
        },
      };
    }

    return {
      success: true,
      data: Array.isArray(result.data) ? result.data : [result.data],
      metadata: {
        executionTime: Date.now() - startTime,
        toolName: 'database_query',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Query failed',
      errorCode: 'QUERY_ERROR',
      metadata: {
        executionTime: Date.now() - startTime,
        toolName: 'database_query',
      },
    };
  }
}

/**
 * Database count executor.
 */
async function executeDatabaseCount(
  input: DatabaseCountInput,
  context: ExecutionContext
): Promise<ToolResult<{ count: number }>> {
  const startTime = Date.now();

  try {
    // Validate table access
    validateTableAccess(input.table, 'read');

    const { quickCount } = await import('../../../.claude/tools/supabase-executor');

    const count = await quickCount(input.table, input.filters);

    return {
      success: true,
      data: { count },
      metadata: {
        executionTime: Date.now() - startTime,
        toolName: 'database_count',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Count failed',
      errorCode: 'COUNT_ERROR',
      metadata: {
        executionTime: Date.now() - startTime,
        toolName: 'database_count',
      },
    };
  }
}

/**
 * Database insert executor.
 */
async function executeDatabaseInsert(
  input: DatabaseInsertInput,
  context: ExecutionContext
): Promise<ToolResult<unknown>> {
  const startTime = Date.now();

  try {
    // Validate table access
    validateTableAccess(input.table, 'write');

    const { executeQuery } = await import('../../../.claude/tools/supabase-executor');

    const result = await executeQuery({
      table: input.table,
      operation: 'insert',
      data: input.data,
      returning: input.returning,
    }, {
      timeout: 30000,
      logExecution: true,
    }, context.userId || 'agent');

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Insert failed',
        errorCode: result.errorCode,
        metadata: {
          executionTime: Date.now() - startTime,
          toolName: 'database_insert',
        },
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: {
        executionTime: Date.now() - startTime,
        toolName: 'database_insert',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Insert failed',
      errorCode: 'INSERT_ERROR',
      metadata: {
        executionTime: Date.now() - startTime,
        toolName: 'database_insert',
      },
    };
  }
}

/**
 * Database update executor.
 */
async function executeDatabaseUpdate(
  input: DatabaseUpdateInput,
  context: ExecutionContext
): Promise<ToolResult<unknown>> {
  const startTime = Date.now();

  try {
    // Validate table access
    validateTableAccess(input.table, 'write');

    // Require at least one filter
    if (!input.filters || input.filters.length === 0) {
      return {
        success: false,
        error: 'UPDATE requires at least one filter for safety',
        errorCode: 'MISSING_FILTERS',
        metadata: {
          executionTime: Date.now() - startTime,
          toolName: 'database_update',
        },
      };
    }

    const { executeQuery } = await import('../../../.claude/tools/supabase-executor');

    const result = await executeQuery({
      table: input.table,
      operation: 'update',
      data: input.data,
      filters: input.filters,
      returning: input.returning,
    }, {
      timeout: 30000,
      logExecution: true,
    }, context.userId || 'agent');

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Update failed',
        errorCode: result.errorCode,
        metadata: {
          executionTime: Date.now() - startTime,
          toolName: 'database_update',
        },
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: {
        executionTime: Date.now() - startTime,
        toolName: 'database_update',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
      errorCode: 'UPDATE_ERROR',
      metadata: {
        executionTime: Date.now() - startTime,
        toolName: 'database_update',
      },
    };
  }
}

/**
 * Database delete executor.
 */
async function executeDatabaseDelete(
  input: DatabaseDeleteInput,
  context: ExecutionContext
): Promise<ToolResult<{ deleted: number }>> {
  const startTime = Date.now();

  try {
    // Validate table access
    validateTableAccess(input.table, 'write');

    // Require at least one filter
    if (!input.filters || input.filters.length === 0) {
      return {
        success: false,
        error: 'DELETE requires at least one filter for safety',
        errorCode: 'MISSING_FILTERS',
        metadata: {
          executionTime: Date.now() - startTime,
          toolName: 'database_delete',
        },
      };
    }

    const { executeQuery } = await import('../../../.claude/tools/supabase-executor');

    const result = await executeQuery({
      table: input.table,
      operation: 'delete',
      filters: input.filters,
      returning: ['id'],
    }, {
      timeout: 30000,
      logExecution: true,
    }, context.userId || 'agent');

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Delete failed',
        errorCode: result.errorCode,
        metadata: {
          executionTime: Date.now() - startTime,
          toolName: 'database_delete',
        },
      };
    }

    const deleted = Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0);

    return {
      success: true,
      data: { deleted },
      metadata: {
        executionTime: Date.now() - startTime,
        toolName: 'database_delete',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
      errorCode: 'DELETE_ERROR',
      metadata: {
        executionTime: Date.now() - startTime,
        toolName: 'database_delete',
      },
    };
  }
}

// ============================================================================
// Executor Map
// ============================================================================

export const databaseToolExecutors: Record<string, ToolExecutor> = {
  database_query: executeDatabaseQuery as ToolExecutor,
  database_count: executeDatabaseCount as ToolExecutor,
  database_insert: executeDatabaseInsert as ToolExecutor,
  database_update: executeDatabaseUpdate as ToolExecutor,
  database_delete: executeDatabaseDelete as ToolExecutor,
};

// ============================================================================
// Exports
// ============================================================================

export { SAFE_TABLES, READ_ONLY_TABLES, validateTableAccess };
