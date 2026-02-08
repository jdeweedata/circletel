/**
 * Standardized API Response Utilities
 *
 * Provides consistent response formats for all API routes.
 * All responses follow the format: { success, data?, error?, message?, code? }
 */

import { NextResponse } from 'next/server';
import { AppError, ErrorCodes, InternalError } from './app-error';

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  options: {
    message?: string;
    status?: number;
    headers?: HeadersInit;
    meta?: ApiSuccessResponse['meta'];
  } = {}
): NextResponse<ApiSuccessResponse<T>> {
  const { message, status = 200, headers, meta } = options;

  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };

  return NextResponse.json(response, { status, headers });
}

/**
 * Create a success response with no content
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create a created response (201)
 */
export function createdResponse<T>(
  data: T,
  message = 'Resource created successfully'
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, { message, status: 201 });
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    perPage: number;
    total: number;
  }
): NextResponse<ApiSuccessResponse<T[]>> {
  return successResponse(data, {
    meta: {
      page: pagination.page,
      perPage: pagination.perPage,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.perPage),
    },
  });
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Create an error response from an AppError
 */
export function errorResponse(error: AppError): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: error.name,
    message: error.message,
    code: error.code,
    ...(error.details && { details: error.details }),
    timestamp: error.timestamp,
  };

  return NextResponse.json(response, { status: error.statusCode });
}

/**
 * Create an error response from any error
 * Converts unknown errors to appropriate AppError types
 */
export function handleError(error: unknown): NextResponse<ApiErrorResponse> {
  // Already an AppError
  if (error instanceof AppError) {
    return errorResponse(error);
  }

  // Standard Error
  if (error instanceof Error) {
    const internalError = new InternalError(
      process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      error
    );
    return errorResponse(internalError);
  }

  // Unknown error type
  const unknownError = new InternalError('An unexpected error occurred');
  return errorResponse(unknownError);
}

// ============================================================================
// COMMON ERROR RESPONSES
// ============================================================================

/**
 * Unauthorized (401)
 */
export function unauthorizedResponse(message = 'Authentication required'): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'UnauthorizedError',
      message,
      code: ErrorCodes.UNAUTHORIZED,
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );
}

/**
 * Forbidden (403)
 */
export function forbiddenResponse(message = 'Access denied'): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'ForbiddenError',
      message,
      code: ErrorCodes.FORBIDDEN,
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );
}

/**
 * Not Found (404)
 */
export function notFoundResponse(resource: string, id?: string): NextResponse<ApiErrorResponse> {
  const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
  return NextResponse.json(
    {
      success: false,
      error: 'NotFoundError',
      message,
      code: ErrorCodes.NOT_FOUND,
      details: { resource, id },
      timestamp: new Date().toISOString(),
    },
    { status: 404 }
  );
}

/**
 * Validation Error (400)
 */
export function validationErrorResponse(
  message: string,
  issues?: Array<{ field: string; message: string }>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'ValidationError',
      message,
      code: ErrorCodes.VALIDATION_ERROR,
      details: issues ? { issues } : undefined,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

/**
 * Bad Request (400)
 */
export function badRequestResponse(message: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'BadRequestError',
      message,
      code: ErrorCodes.INVALID_INPUT,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

/**
 * Conflict (409)
 */
export function conflictResponse(message: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'ConflictError',
      message,
      code: ErrorCodes.CONFLICT,
      timestamp: new Date().toISOString(),
    },
    { status: 409 }
  );
}

/**
 * Internal Server Error (500)
 */
export function internalErrorResponse(message = 'An unexpected error occurred'): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'InternalError',
      message,
      code: ErrorCodes.INTERNAL_ERROR,
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Service Unavailable (503)
 */
export function serviceUnavailableResponse(service?: string): NextResponse<ApiErrorResponse> {
  const message = service ? `${service} is temporarily unavailable` : 'Service temporarily unavailable';
  return NextResponse.json(
    {
      success: false,
      error: 'ServiceUnavailableError',
      message,
      code: ErrorCodes.SERVICE_UNAVAILABLE,
      timestamp: new Date().toISOString(),
    },
    { status: 503 }
  );
}

// ============================================================================
// ERROR EXTRACTION UTILITIES
// ============================================================================

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}

/**
 * Extract error stack from unknown error
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * Check if error is an operational error (expected, can be handled)
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Safely log error with context
 */
export function logError(
  error: unknown,
  context?: {
    operation?: string;
    userId?: string;
    requestId?: string;
    [key: string]: unknown;
  }
): void {
  const errorInfo = {
    message: getErrorMessage(error),
    stack: getErrorStack(error),
    isOperational: isOperationalError(error),
    context,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AppError) {
    Object.assign(errorInfo, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });
  }

  // Use proper logger in production
  if (process.env.NODE_ENV === 'production') {
    // Would use paymentLogger, apiLogger, etc. based on context
    console.error('[ERROR]', JSON.stringify(errorInfo));
  } else {
    console.error('[ERROR]', errorInfo);
  }
}
