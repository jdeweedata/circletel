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

export interface SubscriberProvider {
  listSubscribers(q?: ListQuery): Promise<Paginated<Subscriber>>
  getSubscriber(id: string): Promise<Subscriber>
  createSubscriber(data: CreateSubscriber): Promise<Subscriber>
  enableSubscriber(id: string): Promise<Subscriber>
  disableSubscriber(id: string): Promise<Subscriber>
  changeProfile(id: string, profileId: string): Promise<Subscriber>
  deleteSubscriber(id: string): Promise<void>
  listSessions(id: string): Promise<Session[]>
  disconnectSession(sessionId: string): Promise<void>
  getUsage(id: string, range: DateRange): Promise<Usage>
  listProfiles(): Promise<Profile[]>
}
