export type ProviderKind = 'interstellio' | 'radius'

export interface ListQuery {
  page?: number
  perPage?: number
  search?: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pages: number
  perPage: number
}

export interface Subscriber {
  id: string
  username: string
  profileId: string
  enabled: boolean
  siteCode?: string
  name?: string | null
  paidThrough?: string | null
  expiresAt?: string | null
  createdAt?: string
  updatedAt?: string
  lastSeenAt?: string | null
}

export interface CreateSubscriber {
  username: string
  password: string
  profileId: string
  siteCode: string
  paidThrough: string
  virtualId: string
  serviceId: string
  name?: string
  enabled?: boolean
}

export interface Session {
  sessionId: string
  subscriberId?: string
  username?: string
  nasIpAddress?: string | null
  startedAt?: string | null
  updatedAt?: string | null
  stoppedAt?: string | null
  sessionSeconds?: number
  inputBytes?: number
  outputBytes?: number
  framedIpAddress?: string | null
  callingStationId?: string | null
}

export interface DateRange {
  from: Date
  to: Date
}

export interface Usage {
  subscriberId: string
  inputBytes: number
  outputBytes: number
  totalBytes: number
  sessionSeconds: number
}

export interface Profile {
  id: string
  name: string
}
