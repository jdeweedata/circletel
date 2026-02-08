/**
 * CircleTel Logging Module
 *
 * Provides environment-aware logging to replace console.log usage.
 *
 * @example
 * // Basic usage
 * import { logger } from '@/lib/logging'
 * logger.info('Operation completed', { result })
 *
 * @example
 * // Module-specific logger
 * import { paymentLogger } from '@/lib/logging'
 * paymentLogger.error('Payment failed', { orderId, error: err.message })
 *
 * @example
 * // Create custom logger
 * import { createLogger } from '@/lib/logging'
 * const myLogger = createLogger('my-module')
 * myLogger.debug('Debugging info')
 */

export {
  logger,
  createLogger,
  paymentLogger,
  authLogger,
  webhookLogger,
  billingLogger,
  coverageLogger,
  zohoLogger,
  activationLogger,
  notificationLogger,
  apiLogger,
  cronLogger,
  kycLogger,
} from './logger'

export { logger as default } from './logger'
