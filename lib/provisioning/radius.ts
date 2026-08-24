import type {
  RadiusClient,
  Session as RadiusSession,
  Subscriber as RadiusSubscriber,
  Usage as RadiusUsage,
} from '@/lib/radius'
import type { SubscriberProvider } from './provider'
import type {
  CreateSubscriber,
  DateRange,
  ListQuery,
  Paginated,
  Profile,
  Session,
  Subscriber,
  Usage,
} from './types'

type UnsupportedError = Error & {
  status: number
  code: string
}

type NotFoundError = Error & {
  status: number
}

function unsupported(message: string, code: string): UnsupportedError {
  const error = new Error(message) as UnsupportedError
  error.status = 501
  error.code = code
  return error
}

function notFound(): NotFoundError {
  const error = new Error('Subscriber not found') as NotFoundError
  error.status = 404
  return error
}

function mapSubscriber(subscriber: RadiusSubscriber): Subscriber {
  return {
    id: subscriber.username,
    username: subscriber.username,
    profileId: subscriber.profile,
    siteCode: subscriber.siteCode,
    paidThrough: subscriber.paidThrough,
    enabled: subscriber.enabled,
  }
}

function mapSession(session: RadiusSession): Session {
  return {
    sessionId: session.sessionId,
    nasIpAddress: session.nasIpAddress,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    stoppedAt: session.stoppedAt,
    sessionSeconds: session.sessionSeconds,
    inputBytes: session.inputOctets,
    outputBytes: session.outputOctets,
    framedIpAddress: session.framedIpAddress,
    callingStationId: session.callingStationId,
  }
}

function mapUsage(id: string, usage: RadiusUsage): Usage {
  return {
    subscriberId: id,
    inputBytes: usage.inputOctets,
    outputBytes: usage.outputOctets,
    totalBytes: usage.totalOctets,
    sessionSeconds: usage.sessionSeconds,
  }
}

export class RadiusSubscriberProvider implements SubscriberProvider {
  readonly kind = 'radius' as const

  constructor(
    private readonly client: RadiusClient,
    private readonly siteCode: string
  ) {}

  async listSubscribers(_q?: ListQuery): Promise<Paginated<Subscriber>> {
    const subscribers = (await this.client.listSubscribers()).filter(
      (subscriber) => subscriber.siteCode === this.siteCode
    )
    return {
      items: subscribers.map(mapSubscriber),
      total: subscribers.length,
      page: 1,
      pages: 1,
      perPage: subscribers.length,
    }
  }

  async getSubscriber(id: string): Promise<Subscriber> {
    return mapSubscriber(await this.getOwnedSubscriber(id))
  }

  async createSubscriber(data: CreateSubscriber): Promise<Subscriber> {
    const subscriber = await this.client.createSubscriber({
      username: data.username,
      password: data.password,
      siteCode: this.siteCode,
      profile: data.profileId,
      paidThrough: data.paidThrough!,
    })
    return mapSubscriber(subscriber)
  }

  async enableSubscriber(id: string): Promise<Subscriber> {
    await this.getOwnedSubscriber(id)
    return mapSubscriber(await this.client.enableSubscriber(id))
  }

  async disableSubscriber(id: string): Promise<Subscriber> {
    await this.getOwnedSubscriber(id)
    return mapSubscriber(await this.client.disableSubscriber(id))
  }

  async changeProfile(id: string, profileId: string): Promise<Subscriber> {
    await this.getOwnedSubscriber(id)
    return mapSubscriber(await this.client.changeProfile(id, profileId))
  }

  deleteSubscriber(_id: string): Promise<void> {
    return Promise.reject(
      unsupported('RADIUS subscriber deletion is not supported', 'RADIUS_DELETE_UNSUPPORTED')
    )
  }

  async listSessions(id: string): Promise<Session[]> {
    await this.getOwnedSubscriber(id)
    const sessions = await this.client.listSessions(id)
    return sessions.map(mapSession)
  }

  async disconnectSession(sessionId: string): Promise<void> {
    const result = await this.client.disconnectSession(sessionId)
    if (!result.pod) {
      throw new Error('Packet-of-Disconnect failed')
    }
  }

  async getUsage(id: string, range: DateRange): Promise<Usage> {
    await this.getOwnedSubscriber(id)
    return mapUsage(id, await this.client.getUsage(id, range))
  }

  listProfiles(): Promise<Profile[]> {
    return this.client.listProfiles()
  }

  private async getOwnedSubscriber(id: string): Promise<RadiusSubscriber> {
    const subscriber = await this.client.getSubscriber(id)
    if (subscriber.siteCode !== this.siteCode) {
      throw notFound()
    }
    return subscriber
  }
}
