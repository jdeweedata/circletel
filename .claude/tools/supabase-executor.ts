/**
 * Supabase Query Executor for MCP Code Execution
 *
 * Enables programmatic database queries with 80% token reduction (15K → 3K).
 * Supports SELECT, INSERT, UPDATE, DELETE, UPSERT operations with filters, joins, and ordering.
 *
 * Usage Examples:
 *
 * // Find failed ZOHO syncs
 * executeQuery({
 *   table: 'customers',
 *   operation: 'select',
 *   filters: [{ column: 'zoho_sync_status', operator: 'eq', value: 'failed' }],
 *   limit: 10
 * })
 *
 * // Get recent orders with customer details
 * executeQuery({
 *   table: 'consumer_orders',
 *   operation: 'select',
 *   columns: ['id', 'status', 'customer_id', 'customers(email,first_name)'],
 *   filters: [{ column: 'created_at', operator: 'gte', value: '2025-01-01' }],
 *   orderBy: [{ column: 'created_at', ascending: false }],
 *   limit: 20
 * })
 */

import { createClient } from '@/lib/supabase/server';
import {
  SupabaseQueryRequest,
  SupabaseQueryResponse,
  ExecutorConfig,
  FilterCondition,
  OrderByClause,
  DatabaseError,
  ValidationError
} from './types';
import {
  validateRequired,
  validateTableName,
  validateColumns,
  validateLimit,
  validateOffset,
  withTimeout,
  withRetry,
  handleError,
  createMetadata,
  mergeConfig,
  formatSuccessResponse,
  formatErrorResponse,
  logExecution,
  sanitizeForLogging,
  PerformanceTimer,
  getFromCache,
  setInCache,
  getCacheKey
} from './utils';

// ============================================================================
// Main Executor Function
// ============================================================================

export async function executeQuery<T = any>(
  request: SupabaseQueryRequest,
  config?: ExecutorConfig,
  executedBy: string = 'system'
): Promise<SupabaseQueryResponse<T>> {
  const timer = new PerformanceTimer();
  const cfg = mergeConfig(config);

  try {
    // Validate request
    validateRequest(request);

    // Check cache
    if (cfg.cacheEnabled && request.operation === 'select') {
      const cacheKey = getCacheKey('supabase-query', request);
      const cached = getFromCache<SupabaseQueryResponse<T>>(cacheKey);

      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cacheHit: true,
            executionTime: timer.elapsed()
          }
        };
      }
    }

    // Execute with timeout and retry
    const response = await withTimeout(
      withRetry(() => executeQueryInternal<T>(request), cfg.retries),
      cfg.timeout,
      'Database query'
    );

    // Cache successful SELECT responses
    if (cfg.cacheEnabled && request.operation === 'select' && response.success) {
      const cacheKey = getCacheKey('supabase-query', request);
      setInCache(cacheKey, response, cfg.cacheTTL);
    }

    // Log execution
    if (cfg.logExecution) {
      await logExecution({
        toolName: 'supabase-executor',
        operation: request.operation,
        request: sanitizeForLogging(request),
        response: sanitizeForLogging(response),
        executedBy,
        executionTime: timer.elapsed(),
        success: response.success,
        error: response.error
      });
    }

    return response;

  } catch (error) {
    const metadata = createMetadata(0, timer.elapsed());

    // Log error
    if (cfg.logExecution) {
      await logExecution({
        toolName: 'supabase-executor',
        operation: request.operation,
        request: sanitizeForLogging(request),
        response: null,
        executedBy,
        executionTime: timer.elapsed(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    if (error instanceof ValidationError || error instanceof DatabaseError) {
      return formatErrorResponse(error, metadata);
    }

    return formatErrorResponse(
      new DatabaseError('Query execution failed', { error }),
      metadata
    );
  }
}

// ============================================================================
// Internal Execution Logic
// ============================================================================

async function executeQueryInternal<T>(
  request: SupabaseQueryRequest
): Promise<SupabaseQueryResponse<T>> {
  const timer = new PerformanceTimer();
  const supabase = await createClient();

  try {
    switch (request.operation) {
      case 'select':
        return await executeSelect<T>(supabase, request, timer);

      case 'insert':
        return await executeInsert<T>(supabase, request, timer);

      case 'update':
        return await executeUpdate<T>(supabase, request, timer);

      case 'delete':
        return await executeDelete<T>(supabase, request, timer);

      case 'upsert':
        return await executeUpsert<T>(supabase, request, timer);

      default:
        throw new ValidationError(`Unsupported operation: ${request.operation}`);
    }
  } catch (error) {
    handleError(error, `${request.operation.toUpperCase()} operation`);
  }
}

// ============================================================================
// SELECT Operation
// ============================================================================

async function executeSelect<T>(
  supabase: any,
  request: SupabaseQueryRequest,
  timer: PerformanceTimer
): Promise<SupabaseQueryResponse<T>> {
  let query = supabase.from(request.table);

  // Select columns
  const columns = request.columns && request.columns.length > 0
    ? request.columns.join(',')
    : '*';
  query = query.select(columns, { count: request.count });

  // Apply filters
  if (request.filters && request.filters.length > 0) {
    query = applyFilters(query, request.filters);
  }

  // Apply ordering
  if (request.orderBy && request.orderBy.length > 0) {
    request.orderBy.forEach(order => {
      query = query.order(order.column, { ascending: order.ascending !== false });
    });
  }

  // Apply pagination
  if (request.limit !== undefined) {
    query = query.limit(request.limit);
  }

  if (request.offset !== undefined) {
    query = query.range(
      request.offset,
      request.offset + (request.limit || 1000) - 1
    );
  }

  // Single result mode
  if (request.single) {
    query = query.single();
  }

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    throw new DatabaseError(error.message, { code: error.code, details: error.details });
  }

  return formatSuccessResponse<T>(
    data,
    createMetadata(
      Array.isArray(data) ? data.length : (data ? 1 : 0),
      timer.elapsed()
    ),
    count ?? undefined
  );
}

// ============================================================================
// INSERT Operation
// ============================================================================

async function executeInsert<T>(
  supabase: any,
  request: SupabaseQueryRequest,
  timer: PerformanceTimer
): Promise<SupabaseQueryResponse<T>> {
  if (!request.data) {
    throw new ValidationError('INSERT requires data field');
  }

  let query = supabase.from(request.table).insert(request.data);

  // Specify columns to return
  if (request.returning) {
    query = query.select(request.returning.join(','));
  }

  const { data, error } = await query;

  if (error) {
    throw new DatabaseError(error.message, { code: error.code, details: error.details });
  }

  return formatSuccessResponse<T>(
    data,
    createMetadata(
      Array.isArray(data) ? data.length : (data ? 1 : 0),
      timer.elapsed()
    )
  );
}

// ============================================================================
// UPDATE Operation
// ============================================================================

async function executeUpdate<T>(
  supabase: any,
  request: SupabaseQueryRequest,
  timer: PerformanceTimer
): Promise<SupabaseQueryResponse<T>> {
  if (!request.data || Array.isArray(request.data)) {
    throw new ValidationError('UPDATE requires data field as a single object');
  }

  let query = supabase.from(request.table).update(request.data);

  // Apply filters (WHERE clause)
  if (request.filters && request.filters.length > 0) {
    query = applyFilters(query, request.filters);
  } else {
    throw new ValidationError('UPDATE requires at least one filter (safety check)');
  }

  // Specify columns to return
  if (request.returning) {
    query = query.select(request.returning.join(','));
  }

  const { data, error } = await query;

  if (error) {
    throw new DatabaseError(error.message, { code: error.code, details: error.details });
  }

  return formatSuccessResponse<T>(
    data,
    createMetadata(
      Array.isArray(data) ? data.length : (data ? 1 : 0),
      timer.elapsed()
    )
  );
}

// ============================================================================
// DELETE Operation
// ============================================================================

async function executeDelete<T>(
  supabase: any,
  request: SupabaseQueryRequest,
  timer: PerformanceTimer
): Promise<SupabaseQueryResponse<T>> {
  let query = supabase.from(request.table).delete();

  // Apply filters (WHERE clause)
  if (request.filters && request.filters.length > 0) {
    query = applyFilters(query, request.filters);
  } else {
    throw new ValidationError('DELETE requires at least one filter (safety check)');
  }

  // Specify columns to return
  if (request.returning) {
    query = query.select(request.returning.join(','));
  }

  const { data, error } = await query;

  if (error) {
    throw new DatabaseError(error.message, { code: error.code, details: error.details });
  }

  return formatSuccessResponse<T>(
    data,
    createMetadata(
      Array.isArray(data) ? data.length : (data ? 1 : 0),
      timer.elapsed()
    )
  );
}

// ============================================================================
// UPSERT Operation
// ============================================================================

async function executeUpsert<T>(
  supabase: any,
  request: SupabaseQueryRequest,
  timer: PerformanceTimer
): Promise<SupabaseQueryResponse<T>> {
  if (!request.data) {
    throw new ValidationError('UPSERT requires data field');
  }

  const upsertOptions: any = {};

  if (request.onConflict) {
    upsertOptions.onConflict = request.onConflict.join(',');
  }

  let query = supabase.from(request.table).upsert(request.data, upsertOptions);

  // Specify columns to return
  if (request.returning) {
    query = query.select(request.returning.join(','));
  }

  const { data, error } = await query;

  if (error) {
    throw new DatabaseError(error.message, { code: error.code, details: error.details });
  }

  return formatSuccessResponse<T>(
    data,
    createMetadata(
      Array.isArray(data) ? data.length : (data ? 1 : 0),
      timer.elapsed()
    )
  );
}

// ============================================================================
// Filter Application
// ============================================================================

function applyFilters(query: any, filters: FilterCondition[]): any {
  filters.forEach(filter => {
    const { column, operator, value } = filter;

    switch (operator) {
      case 'eq':
        query = query.eq(column, value);
        break;
      case 'neq':
        query = query.neq(column, value);
        break;
      case 'gt':
        query = query.gt(column, value);
        break;
      case 'gte':
        query = query.gte(column, value);
        break;
      case 'lt':
        query = query.lt(column, value);
        break;
      case 'lte':
        query = query.lte(column, value);
        break;
      case 'like':
        query = query.like(column, value);
        break;
      case 'ilike':
        query = query.ilike(column, value);
        break;
      case 'in':
        query = query.in(column, value);
        break;
      case 'is':
        query = query.is(column, value);
        break;
      case 'contains':
        query = query.contains(column, value);
        break;
      case 'containedBy':
        query = query.containedBy(column, value);
        break;
      case 'overlaps':
        query = query.overlaps(column, value);
        break;
      default:
        throw new ValidationError(`Unsupported filter operator: ${operator}`);
    }
  });

  return query;
}

// ============================================================================
// Request Validation
// ============================================================================

function validateRequest(request: SupabaseQueryRequest): void {
  validateRequired(request.table, 'table');
  validateRequired(request.operation, 'operation');

  validateTableName(request.table);
  validateColumns(request.columns);
  validateLimit(request.limit);
  validateOffset(request.offset);

  // Validate filters
  if (request.filters) {
    request.filters.forEach((filter, index) => {
      validateRequired(filter.column, `filters[${index}].column`);
      validateRequired(filter.operator, `filters[${index}].operator`);
    });
  }

  // Validate operation-specific requirements
  if (['insert', 'update', 'upsert'].includes(request.operation) && !request.data) {
    throw new ValidationError(`${request.operation.toUpperCase()} operation requires data field`);
  }

  if (['update', 'delete'].includes(request.operation) && (!request.filters || request.filters.length === 0)) {
    throw new ValidationError(
      `${request.operation.toUpperCase()} operation requires at least one filter for safety`
    );
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function quickSelect<T = any>(
  table: string,
  filters?: FilterCondition[],
  options?: { columns?: string[]; limit?: number; orderBy?: OrderByClause[] }
): Promise<SupabaseQueryResponse<T>> {
  return executeQuery<T>({
    table,
    operation: 'select',
    filters,
    columns: options?.columns,
    limit: options?.limit,
    orderBy: options?.orderBy
  });
}

export async function quickCount(
  table: string,
  filters?: FilterCondition[]
): Promise<number> {
  const response = await executeQuery({
    table,
    operation: 'select',
    filters,
    columns: ['id'],
    count: 'exact',
    limit: 1
  });

  return response.count ?? 0;
}

export async function quickFind<T = any>(
  table: string,
  id: string,
  idColumn: string = 'id'
): Promise<T | null> {
  const response = await executeQuery<T>({
    table,
    operation: 'select',
    filters: [{ column: idColumn, operator: 'eq', value: id }],
    single: true
  });

  return response.data ?? null;
}
