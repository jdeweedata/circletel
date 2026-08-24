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

function unsupported(message: string, code: string): UnsupportedError {
  const error = new Error(message) as UnsupportedError
  error.status = 501
  error.code = code
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
  constructor(private readonly client: RadiusClient) {}

  async listSubscribers(_q?: ListQuery): Promise<Paginated<Subscriber>> {
    const subscribers = await this.client.listSubscribers()
    return {
      items: subscribers.map(mapSubscriber),
      total: subscribers.length,
      page: 1,
      pages: 1,
      perPage: subscribers.length,
    }
  }

  async getSubscriber(id: string): Promise<Subscriber> {
    return mapSubscriber(await this.client.getSubscriber(id))
  }

  async createSubscriber(data: CreateSubscriber): Promise<Subscriber> {
    const subscriber = await this.client.createSubscriber({
      username: data.username,
      password: data.password,
      siteCode: data.siteCode,
      profile: data.profileId,
      paidThrough: data.paidThrough,
    })
    return mapSubscriber(subscriber)
  }

  async enableSubscriber(id: string): Promise<Subscriber> {
    return mapSubscriber(await this.client.enableSubscriber(id))
  }

  async disableSubscriber(id: string): Promise<Subscriber> {
    return mapSubscriber(await this.client.disableSubscriber(id))
  }

  async changeProfile(id: string, profileId: string): Promise<Subscriber> {
    return mapSubscriber(await this.client.changeProfile(id, profileId))
  }

  deleteSubscriber(_id: string): Promise<void> {
    return Promise.reject(
      unsupported('RADIUS subscriber deletion is not supported', 'RADIUS_DELETE_UNSUPPORTED')
    )
  }

  async listSessions(id: string): Promise<Session[]> {
    const sessions = await this.client.listSessions(id)
    return sessions.map(mapSession)
  }

  async disconnectSession(sessionId: string): Promise<void> {
    await this.client.disconnectSession(sessionId)
  }

  async getUsage(id: string, range: DateRange): Promise<Usage> {
    return mapUsage(id, await this.client.getUsage(id, range))
  }

  listProfiles(): Promise<Profile[]> {
    return this.client.listProfiles()
  }
}
