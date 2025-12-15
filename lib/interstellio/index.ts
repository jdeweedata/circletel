/**
 * Interstellio (NebularStack) Integration
 *
 * RADIUS service for customer provisioning and usage tracking.
 *
 * @example
 * ```typescript
 * import { getInterstellioClient } from '@/lib/interstellio'
 *
 * const client = getInterstellioClient()
 * await client.authenticate({
 *   domain: 'circletel.co.za',
 *   username: 'api@circletel.co.za',
 *   password: process.env.INTERSTELLIO_PASSWORD!
 * })
 *
 * // Create a subscriber
 * const subscriber = await client.createSubscriber({
 *   virtual_id: 'vs-uuid',
 *   service_id: 'svc-uuid',
 *   profile_id: 'prof-uuid',
 *   username: 'customer@circletel.co.za',
 *   enabled: true,
 *   timezone: 'Africa/Johannesburg'
 * })
 *
 * // Get usage data
 * const usage = await client.getSubscriberUsage(subscriber.id, 'daily', {
 *   start: '2025-12-01T00:00:00Z',
 *   end: '2025-12-15T23:59:59Z'
 * })
 * ```
 *
 * @see docs/api/INTERSTELLIO_API.md for full API documentation
 */

export {
  InterstellioClient,
  getInterstellioClient,
  createInterstellioClient,
} from './client'

export * from './types'
