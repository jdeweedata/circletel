/**
 * Utility Functions for MCP Code Execution Tools
 *
 * Helper functions for caching, validation, logging, and error handling.
 */

import { createClient } from '@/lib/supabase/server';
import {
  CacheEntry,
  AuditLogEntry,
  ExecutorConfig,
  ExecutorError,
  ValidationError,
  TimeoutError,
  QueryMetadata
} from './types';

// ============================================================================
// Cache Management
// ============================================================================

// In-memory cache with TTL support
const cache = new Map<string, CacheEntry<any>>();

export function getCacheKey(tool: string, params: any): string {
  return `${tool}:${JSON.stringify(params)}`;
}

export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  const age = (now - entry.timestamp.getTime()) / 1000;

  if (age > entry.ttl) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setInCache<T>(key: string, data: T, ttl: number = 300): void {
  cache.set(key, {
    key,
    data,
    timestamp: new Date(),
    ttl
  });
}

export function clearCache(pattern?: string): number {
  if (!pattern) {
    const size = cache.size;
    cache.clear();
    return size;
  }

  let cleared = 0;
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      cleared++;
    }
  }
  return cleared;
}

export function getCacheStats(): { size: number; entries: Array<{ key: string; age: number }> } {
  const now = Date.now();
  const entries = Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    age: Math.floor((now - entry.timestamp.getTime()) / 1000)
  }));

  return {
    size: cache.size,
    entries
  };
}

// ============================================================================
// Input Validation
// ============================================================================

export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateTableName(tableName: string): void {
  validateRequired(tableName, 'table');

  // Prevent SQL injection
  if (!/^[a-z_][a-z0-9_]*$/.test(tableName)) {
    throw new ValidationError(
      `Invalid table name: ${tableName}. Must contain only lowercase letters, numbers, and underscores.`
    );
  }
}

export function validateColumnName(columnName: string): void {
  if (!/^[a-z_][a-z0-9_]*$/.test(columnName)) {
    throw new ValidationError(
      `Invalid column name: ${columnName}. Must contain only lowercase letters, numbers, and underscores.`
    );
  }
}

export function validateColumns(columns?: string[]): void {
  if (!columns) return;

  columns.forEach(col => {
    // Allow wildcard
    if (col === '*') return;

    // Allow table.column format
    if (col.includes('.')) {
      const [table, column] = col.split('.');
      validateTableName(table);
      validateColumnName(column);
      return;
    }

    validateColumnName(col);
  });
}

export function validateLimit(limit?: number): void {
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 10000) {
      throw new ValidationError('Limit must be an integer between 1 and 10000');
    }
  }
}

export function validateOffset(offset?: number): void {
  if (offset !== undefined) {
    if (!Number.isInteger(offset) || offset < 0) {
      throw new ValidationError('Offset must be a non-negative integer');
    }
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

export async function logExecution(entry: Omit<AuditLogEntry, 'id' | 'executedAt'>): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('executor_audit_logs')
      .insert({
        tool_name: entry.toolName,
        operation: entry.operation,
        request: entry.request,
        response: entry.response,
        executed_by: entry.executedBy,
        execution_time: entry.executionTime,
        success: entry.success,
        error: entry.error
      });

    if (error) {
      console.error('Failed to log execution:', error);
    }
  } catch (err) {
    // Don't throw - logging failures shouldn't break the operation
    console.error('Failed to log execution:', err);
  }
}

// ============================================================================
// Timeout Handling
// ============================================================================

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  operation: string = 'Operation'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new TimeoutError(`${operation} timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    )
  ]);
}

// ============================================================================
// Error Handling
// ============================================================================

export function handleError(error: unknown, operation: string): never {
  if (error instanceof ExecutorError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new ExecutorError(
      `${operation} failed: ${error.message}`,
      'UNKNOWN_ERROR',
      { originalError: error }
    );
  }

  throw new ExecutorError(
    `${operation} failed with unknown error`,
    'UNKNOWN_ERROR',
    { error }
  );
}

// ============================================================================
// Metadata Generation
// ============================================================================

export function createMetadata(
  rowCount: number = 0,
  executionTime: number = 0,
  cacheHit: boolean = false
): QueryMetadata {
  return {
    rowCount,
    executionTime,
    cacheHit
  };
}

// ============================================================================
// Retry Logic
// ============================================================================

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 0,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    // Don't retry validation errors
    if (error instanceof ValidationError) {
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2); // Exponential backoff
  }
}

// ============================================================================
// Configuration Helpers
// ============================================================================

const defaultConfig: Required<ExecutorConfig> = {
  timeout: 30000,
  retries: 0,
  cacheEnabled: false,
  cacheTTL: 300,
  logExecution: true
};

export function mergeConfig(config?: ExecutorConfig): Required<ExecutorConfig> {
  return {
    ...defaultConfig,
    ...config
  };
}

// ============================================================================
// Response Formatting
// ============================================================================

export function formatSuccessResponse<T>(
  data: T,
  metadata: QueryMetadata,
  count?: number
) {
  return {
    success: true,
    data,
    count,
    metadata
  };
}

export function formatErrorResponse(error: ExecutorError, metadata: QueryMetadata) {
  return {
    success: false,
    error: error.message,
    errorCode: error.code,
    metadata
  };
}

// ============================================================================
// Data Sanitization
// ============================================================================

export function sanitizeForLogging(data: any): any {
  if (!data) return data;

  const sensitive = ['password', 'token', 'secret', 'key', 'api_key', 'access_token'];

  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeForLogging);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// Performance Measurement
// ============================================================================

export class PerformanceTimer {
  private start: number;

  constructor() {
    this.start = Date.now();
  }

  elapsed(): number {
    return Date.now() - this.start;
  }

  reset(): void {
    this.start = Date.now();
  }
}

// ============================================================================
// Batch Processing
// ============================================================================

export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}
