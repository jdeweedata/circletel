/**
 * CircleTel Logging Utility
 *
 * Environment-aware logger that replaces console.log usage throughout the codebase.
 * - Development: Logs to console with colors and formatting
 * - Production: Logs structured JSON, suppresses debug/info logs
 *
 * Usage:
 *   import { logger } from '@/lib/logging/logger'
 *   logger.info('User logged in', { userId: '123' })
 *   logger.error('Payment failed', { orderId, error })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  service: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

// In production, only show warnings and errors by default
// Can be overridden with LOG_LEVEL env var
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isProduction ? 'warn' : 'debug')

function shouldLog(level: LogLevel): boolean {
  if (isTest) return false // Suppress logs during tests
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
}

function formatForDev(entry: LogEntry): string {
  const colors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  }
  const reset = '\x1b[0m'
  const color = colors[entry.level]

  let output = `${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`
  if (entry.context && Object.keys(entry.context).length > 0) {
    output += ` ${JSON.stringify(entry.context)}`
  }
  return output
}

function formatForProd(entry: LogEntry): string {
  return JSON.stringify(entry)
}

function createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    service: 'circletel',
  }
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return

  const entry = createLogEntry(level, message, context)
  const formatted = isProduction ? formatForProd(entry) : formatForDev(entry)

  switch (level) {
    case 'debug':
    case 'info':
      // eslint-disable-next-line no-console
      console.log(formatted)
      break
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(formatted)
      break
    case 'error':
      // eslint-disable-next-line no-console
      console.error(formatted)
      break
  }
}

/**
 * Main logger instance
 */
export const logger = {
  /**
   * Debug-level logging (suppressed in production)
   * Use for detailed debugging information
   */
  debug: (message: string, context?: LogContext) => log('debug', message, context),

  /**
   * Info-level logging (suppressed in production by default)
   * Use for general operational messages
   */
  info: (message: string, context?: LogContext) => log('info', message, context),

  /**
   * Warning-level logging
   * Use for potentially problematic situations
   */
  warn: (message: string, context?: LogContext) => log('warn', message, context),

  /**
   * Error-level logging
   * Use for errors that need attention
   */
  error: (message: string, context?: LogContext) => log('error', message, context),
}

/**
 * Create a child logger with a specific prefix/module name
 * Useful for tracking logs from specific parts of the system
 *
 * Usage:
 *   const paymentLogger = createLogger('payment')
 *   paymentLogger.info('Processing payment', { orderId })
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, context?: LogContext) =>
      log('debug', `[${module}] ${message}`, context),
    info: (message: string, context?: LogContext) =>
      log('info', `[${module}] ${message}`, context),
    warn: (message: string, context?: LogContext) =>
      log('warn', `[${module}] ${message}`, context),
    error: (message: string, context?: LogContext) =>
      log('error', `[${module}] ${message}`, context),
  }
}

/**
 * Specialized loggers for critical system areas
 */
export const paymentLogger = createLogger('payment')
export const authLogger = createLogger('auth')
export const webhookLogger = createLogger('webhook')
export const billingLogger = createLogger('billing')
export const coverageLogger = createLogger('coverage')
export const zohoLogger = createLogger('zoho')
export const activationLogger = createLogger('activation')
export const notificationLogger = createLogger('notification')
export const apiLogger = createLogger('api')
export const cronLogger = createLogger('cron')
export const kycLogger = createLogger('kyc')

export default logger
