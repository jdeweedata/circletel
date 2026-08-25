import type { CreateSubscriber, ProviderKind } from '@/lib/provisioning'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

export function isCreateSubscriber(
  value: unknown,
  provider: ProviderKind
): value is CreateSubscriber {
  if (!value || typeof value !== 'object') return false

  const subscriber = value as Partial<CreateSubscriber>
  const requiredStrings: Array<keyof CreateSubscriber> = [
    'username',
    'password',
    'profileId',
    ...(provider === 'radius'
      ? ['paidThrough' as const]
      : ['virtualId' as const, 'serviceId' as const]),
  ]

  return requiredStrings.every(
    (field) => typeof subscriber[field] === 'string' && subscriber[field].length > 0
  )
    && (subscriber.name === undefined || typeof subscriber.name === 'string')
    && (subscriber.enabled === undefined || typeof subscriber.enabled === 'boolean')
}
