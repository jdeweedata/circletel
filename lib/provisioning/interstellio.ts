import type {
  DataUsageEntry,
  InterstellioClient,
  InterstellioProfile,
  InterstellioSession,
  InterstellioSubscriber,
} from '@/lib/interstellio'
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

function mapSubscriber(subscriber: InterstellioSubscriber): Subscriber {
  return {
    id: subscriber.id,
    username: subscriber.username,
    profileId: subscriber.profile_id,
    enabled: subscriber.enabled,
    name: subscriber.name,
    expiresAt: subscriber.expire,
    createdAt: subscriber.creation_time,
    updatedAt: subscriber.updated_time,
    lastSeenAt: subscriber.last_seen,
  }
}

function mapSession(session: InterstellioSession): Session {
  return {
    sessionId: session.id,
    subscriberId: session.subscriber_id,
    username: session.username,
    nasIpAddress: session.nas_ip_address,
    startedAt: session.start_time,
    updatedAt: session.updated_time,
    framedIpAddress: session.framed_ip_address,
    callingStationId: session.calling_station_id,
  }
}

function mapProfile(profile: InterstellioProfile): Profile {
  return { id: profile.id, name: profile.name }
}

function sumUsage(subscriberId: string, entries: DataUsageEntry[]): Usage {
  const kilobytes = entries.reduce(
    (sum, entry) => ({
      input: sum.input + entry.upload_kb,
      output: sum.output + entry.download_kb,
      total: sum.total + entry.combined_kb,
    }),
    { input: 0, output: 0, total: 0 }
  )

  return {
    subscriberId,
    inputBytes: kilobytes.input * 1024,
    outputBytes: kilobytes.output * 1024,
    totalBytes: kilobytes.total * 1024,
    sessionSeconds: 0,
  }
}

export class InterstellioSubscriberProvider implements SubscriberProvider {
  readonly kind = 'interstellio' as const

  constructor(private readonly client: InterstellioClient) {}

  async listSubscribers(q?: ListQuery): Promise<Paginated<Subscriber>> {
    const response = await this.client.listSubscribers({
      p: q?.page,
      l: q?.perPage,
      username: q?.search,
    })

    return {
      items: response.payload.map(mapSubscriber),
      total: response.metadata.records,
      page: response.metadata.page,
      pages: response.metadata.pages,
      perPage: response.metadata.per_page,
    }
  }

  async getSubscriber(id: string): Promise<Subscriber> {
    return mapSubscriber(await this.client.getSubscriber(id))
  }

  async createSubscriber(data: CreateSubscriber): Promise<Subscriber> {
    const subscriber = await this.client.createSubscriber({
      username: data.username,
      password: data.password,
      profile_id: data.profileId,
      virtual_id: data.virtualId!,
      service_id: data.serviceId!,
      ...(data.name === undefined ? {} : { name: data.name }),
      ...(data.enabled === undefined ? {} : { enabled: data.enabled }),
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
    return mapSubscriber(await this.client.changeSubscriberProfile(id, profileId))
  }

  deleteSubscriber(id: string): Promise<void> {
    return this.client.deleteSubscriber(id)
  }

  async listSessions(id: string): Promise<Session[]> {
    const response = await this.client.listSessions(id)
    return response.payload.map(mapSession)
  }

  disconnectSession(sessionId: string): Promise<void> {
    return this.client.disconnectSession(sessionId)
  }

  async getUsage(id: string, range: DateRange): Promise<Usage> {
    const entries = await this.client.getSubscriberUsage(id, 'daily', {
      start: range.from.toISOString(),
      end: range.to.toISOString(),
    })
    return sumUsage(id, entries)
  }

  async listProfiles(): Promise<Profile[]> {
    const response = await this.client.listProfiles()
    return response.payload.map(mapProfile)
  }
}
