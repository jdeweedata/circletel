export interface IssueVoucherBatch {
  count: number
  profile: string
  priceCents: number
  agentCode?: string
  expiresAt: string
}

export interface CreateSubscriber {
  username: string
  password: string
  siteCode: string
  profile: string
  paidThrough: string
}

export interface Subscriber {
  username: string
  siteCode: string
  profile: string
  paidThrough: string
  enabled: boolean
}

export interface Session {
  id: string
  username: string
  startedAt?: string
  updatedAt?: string
  framedIpAddress?: string | null
  callingStationId?: string | null
  nasIpAddress?: string | null
  inputOctets?: number
  outputOctets?: number
  sessionSeconds?: number
}

export interface DateRange {
  from?: Date
  to?: Date
}

export interface Usage {
  username: string
  inputOctets: number
  outputOctets: number
  totalOctets: number
  sessionSeconds: number
}

export interface Profile {
  id: string
  name: string
}

export interface RadiusClientOptions {
  baseUrl: string
  token: string
  fetch?: typeof fetch
}

export type RadiusError = Error & {
  status: number
  code?: string
}
