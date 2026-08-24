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
  sessionId: string
  nasIpAddress?: string | null
  startedAt?: string | null
  updatedAt?: string | null
  stoppedAt?: string | null
  sessionSeconds?: number
  inputOctets?: number
  outputOctets?: number
  framedIpAddress?: string | null
  callingStationId?: string | null
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

export interface EstateSite {
  code: string
  name: string
  nasType: 'routeros' | 'generic'
  tunnelType: 'wireguard' | 'openvpn' | 'direct'
  overlayIp: string | null
  openSessions: number
  voucherCount: number
  voucherGrossCents: number
  lastAcceptAt: string | null
}

export interface Estate {
  sites: EstateSite[]
  voucherCount: number
  voucherGrossCents: number
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
