/**
 * Error Handling Module
 *
 * Provides typed error classes and utilities for consistent error handling
 * across the application.
 *
 * @example
 * // In API routes
 * import { NotFoundError, handleError, successResponse } from '@/lib/errors';
 *
 * export async function GET(request: NextRequest) {
 *   try {
 *     const data = await fetchData();
 *     if (!data) throw new NotFoundError('Resource');
 *     return successResponse(data);
 *   } catch (error) {
 *     return handleError(error);
 *   }
 * }
 *
 * @example
 * // Validation errors
 * import { ValidationError } from '@/lib/errors';
 *
 * throw ValidationError.fromFields({
 *   email: 'Invalid email format',
 *   phone: 'Phone number is required',
 * });
 */

// Error classes
export {
  // Base error
  AppError,
  type AppErrorOptions,

  // Error codes
  ErrorCodes,
  type ErrorCode,

  // Authentication errors
  UnauthorizedError,
  ForbiddenError,
  SessionExpiredError,

  // Validation errors
  ValidationError,
  MissingFieldError,
  type ValidationIssue,

  // Resource errors
  NotFoundError,
  ConflictError,
  AlreadyExistsError,

  // Database errors
  DatabaseError,
  QueryFailedError,

  // External service errors
  ExternalServiceError,
  NetCashError,
  ZohoError,

  // Payment errors
  PaymentError,
  InsufficientFundsError,

  // Business logic errors
  BusinessRuleError,
  InvalidStateTransitionError,

  // System errors
  InternalError,
  NotImplementedError,
  ServiceUnavailableError,
  TimeoutError,
  RateLimitedError,
} from './app-error';

// API response utilities
export {
  // Response types
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,

  // Success responses
  successResponse,
  noContentResponse,
  createdResponse,
  paginatedResponse,

  // Error responses
  errorResponse,
  handleError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  badRequestResponse,
  conflictResponse,
  internalErrorResponse,
  serviceUnavailableResponse,

  // Utilities
  getErrorMessage,
  getErrorStack,
  isOperationalError,
  logError,
} from './api-response';
