/**
 * Application Error Classes
 *
 * Typed error classes for consistent error handling across the application.
 * All custom errors extend AppError for unified error processing.
 */

// ============================================================================
// ERROR CODES
// ============================================================================

export const ErrorCodes = {
  // Authentication & Authorization (1xxx)
  UNAUTHORIZED: 'AUTH_001',
  FORBIDDEN: 'AUTH_002',
  SESSION_EXPIRED: 'AUTH_003',
  INVALID_TOKEN: 'AUTH_004',
  INVALID_CREDENTIALS: 'AUTH_005',

  // Validation (2xxx)
  VALIDATION_ERROR: 'VAL_001',
  INVALID_INPUT: 'VAL_002',
  MISSING_REQUIRED_FIELD: 'VAL_003',
  INVALID_FORMAT: 'VAL_004',
  OUT_OF_RANGE: 'VAL_005',

  // Resource (3xxx)
  NOT_FOUND: 'RES_001',
  ALREADY_EXISTS: 'RES_002',
  CONFLICT: 'RES_003',
  GONE: 'RES_004',

  // Database (4xxx)
  DATABASE_ERROR: 'DB_001',
  QUERY_FAILED: 'DB_002',
  TRANSACTION_FAILED: 'DB_003',
  CONNECTION_FAILED: 'DB_004',

  // External Services (5xxx)
  EXTERNAL_SERVICE_ERROR: 'EXT_001',
  NETCASH_ERROR: 'EXT_002',
  ZOHO_ERROR: 'EXT_003',
  MTN_API_ERROR: 'EXT_004',
  INTERSTELLIO_ERROR: 'EXT_005',
  CLICKATELL_ERROR: 'EXT_006',
  RESEND_ERROR: 'EXT_007',

  // Payment (6xxx)
  PAYMENT_FAILED: 'PAY_001',
  INSUFFICIENT_FUNDS: 'PAY_002',
  CARD_DECLINED: 'PAY_003',
  MANDATE_ERROR: 'PAY_004',
  INVOICE_ERROR: 'PAY_005',

  // Business Logic (7xxx)
  BUSINESS_RULE_VIOLATION: 'BIZ_001',
  INVALID_STATE_TRANSITION: 'BIZ_002',
  QUOTA_EXCEEDED: 'BIZ_003',
  OPERATION_NOT_ALLOWED: 'BIZ_004',

  // System (9xxx)
  INTERNAL_ERROR: 'SYS_001',
  NOT_IMPLEMENTED: 'SYS_002',
  SERVICE_UNAVAILABLE: 'SYS_003',
  TIMEOUT: 'SYS_004',
  RATE_LIMITED: 'SYS_005',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

export interface AppErrorOptions {
  code?: ErrorCode;
  statusCode?: number;
  details?: Record<string, unknown>;
  cause?: Error;
  isOperational?: boolean;
}

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || ErrorCodes.INTERNAL_ERROR;
    this.statusCode = options.statusCode || 500;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    this.timestamp = new Date().toISOString();

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace for where our error was thrown (V8 engines)
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

// ============================================================================
// AUTHENTICATION ERRORS
// ============================================================================

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: Record<string, unknown>) {
    super(message, {
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 401,
      details,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', details?: Record<string, unknown>) {
    super(message, {
      code: ErrorCodes.FORBIDDEN,
      statusCode: 403,
      details,
    });
  }
}

export class SessionExpiredError extends AppError {
  constructor(message = 'Session has expired', details?: Record<string, unknown>) {
    super(message, {
      code: ErrorCodes.SESSION_EXPIRED,
      statusCode: 401,
      details,
    });
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export interface ValidationIssue {
  field: string;
  message: string;
  value?: unknown;
}

export class ValidationError extends AppError {
  public readonly issues: ValidationIssue[];

  constructor(message = 'Validation failed', issues: ValidationIssue[] = []) {
    super(message, {
      code: ErrorCodes.VALIDATION_ERROR,
      statusCode: 400,
      details: { issues },
    });
    this.issues = issues;
  }

  static fromFields(fields: Record<string, string>): ValidationError {
    const issues = Object.entries(fields).map(([field, message]) => ({
      field,
      message,
    }));
    return new ValidationError('Validation failed', issues);
  }
}

export class MissingFieldError extends AppError {
  constructor(fieldName: string) {
    super(`Missing required field: ${fieldName}`, {
      code: ErrorCodes.MISSING_REQUIRED_FIELD,
      statusCode: 400,
      details: { field: fieldName },
    });
  }
}

// ============================================================================
// RESOURCE ERRORS
// ============================================================================

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with ID '${identifier}' not found`
      : `${resource} not found`;
    super(message, {
      code: ErrorCodes.NOT_FOUND,
      statusCode: 404,
      details: { resource, identifier },
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: ErrorCodes.CONFLICT,
      statusCode: 409,
      details,
    });
  }
}

export class AlreadyExistsError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} '${identifier}' already exists`
      : `${resource} already exists`;
    super(message, {
      code: ErrorCodes.ALREADY_EXISTS,
      statusCode: 409,
      details: { resource, identifier },
    });
  }
}

// ============================================================================
// DATABASE ERRORS
// ============================================================================

export class DatabaseError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, {
      code: ErrorCodes.DATABASE_ERROR,
      statusCode: 500,
      cause,
      isOperational: false,
    });
  }
}

export class QueryFailedError extends AppError {
  constructor(operation: string, cause?: Error) {
    super(`Database query failed: ${operation}`, {
      code: ErrorCodes.QUERY_FAILED,
      statusCode: 500,
      details: { operation },
      cause,
    });
  }
}

// ============================================================================
// EXTERNAL SERVICE ERRORS
// ============================================================================

export class ExternalServiceError extends AppError {
  public readonly serviceName: string;

  constructor(serviceName: string, message: string, cause?: Error) {
    super(`${serviceName} error: ${message}`, {
      code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
      statusCode: 502,
      details: { service: serviceName },
      cause,
    });
    this.serviceName = serviceName;
  }
}

export class NetCashError extends ExternalServiceError {
  constructor(message: string, cause?: Error) {
    super('NetCash', message, cause);
    this.code = ErrorCodes.NETCASH_ERROR;
  }
}

export class ZohoError extends ExternalServiceError {
  constructor(message: string, cause?: Error) {
    super('Zoho', message, cause);
    this.code = ErrorCodes.ZOHO_ERROR;
  }
}

// ============================================================================
// PAYMENT ERRORS
// ============================================================================

export class PaymentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: ErrorCodes.PAYMENT_FAILED,
      statusCode: 402,
      details,
    });
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor(details?: Record<string, unknown>) {
    super('Insufficient funds', details);
    this.code = ErrorCodes.INSUFFICIENT_FUNDS;
  }
}

// ============================================================================
// BUSINESS LOGIC ERRORS
// ============================================================================

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: ErrorCodes.BUSINESS_RULE_VIOLATION,
      statusCode: 422,
      details,
    });
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(from: string, to: string, resource?: string) {
    const message = resource
      ? `Invalid state transition for ${resource}: ${from} → ${to}`
      : `Invalid state transition: ${from} → ${to}`;
    super(message, {
      code: ErrorCodes.INVALID_STATE_TRANSITION,
      statusCode: 422,
      details: { from, to, resource },
    });
  }
}

// ============================================================================
// SYSTEM ERRORS
// ============================================================================

export class InternalError extends AppError {
  constructor(message = 'An unexpected error occurred', cause?: Error) {
    super(message, {
      code: ErrorCodes.INTERNAL_ERROR,
      statusCode: 500,
      cause,
      isOperational: false,
    });
  }
}

export class NotImplementedError extends AppError {
  constructor(feature: string) {
    super(`${feature} is not implemented`, {
      code: ErrorCodes.NOT_IMPLEMENTED,
      statusCode: 501,
      details: { feature },
    });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service?: string) {
    const message = service ? `${service} is temporarily unavailable` : 'Service temporarily unavailable';
    super(message, {
      code: ErrorCodes.SERVICE_UNAVAILABLE,
      statusCode: 503,
      details: service ? { service } : undefined,
    });
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeoutMs?: number) {
    const message = timeoutMs
      ? `${operation} timed out after ${timeoutMs}ms`
      : `${operation} timed out`;
    super(message, {
      code: ErrorCodes.TIMEOUT,
      statusCode: 504,
      details: { operation, timeoutMs },
    });
  }
}

export class RateLimitedError extends AppError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number) {
    super('Rate limit exceeded', {
      code: ErrorCodes.RATE_LIMITED,
      statusCode: 429,
      details: retryAfter ? { retryAfter } : undefined,
    });
    this.retryAfter = retryAfter;
  }
}
