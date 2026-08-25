import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RadiusSubscriberProvider } from '@/lib/provisioning/radius'

describe('provisioning adapter import isolation', () => {
  it('does not import lib/radius from the Interstellio adapter', () => {
    const source = readFileSync(
      join(process.cwd(), 'lib/provisioning/interstellio.ts'),
      'utf8'
    )

    expect(source).not.toMatch(/(?:@\/lib\/radius|\.\.\/radius)/)
  })

  it('does not import lib/interstellio from the radius adapter', () => {
    const source = readFileSync(
      join(process.cwd(), 'lib/provisioning/radius.ts'),
      'utf8'
    )

    expect(source).not.toMatch(/(?:@\/lib\/interstellio|\.\.\/interstellio)/)
  })
})

describe('RadiusSubscriberProvider', () => {
  const subscriber = {
    username: 'subscriber-1',
    siteCode: 'SITE-001',
    profile: 'profile-1',
    paidThrough: '2026-09-30',
    enabled: true,
  }

  it('delegates subscriber listing and maps the neutral result', async () => {
    const client = {
      listSubscribers: jest.fn().mockResolvedValue([subscriber]),
    }
    const provider = new RadiusSubscriberProvider(client as never, 'SITE-001')

    await expect(provider.listSubscribers()).resolves.toEqual({
      items: [{
        id: subscriber.username,
        username: subscriber.username,
        profileId: subscriber.profile,
        siteCode: subscriber.siteCode,
        paidThrough: subscriber.paidThrough,
        enabled: subscriber.enabled,
      }],
      total: 1,
      page: 1,
      pages: 1,
      perPage: 1,
    })
    expect(client.listSubscribers).toHaveBeenCalledWith()
  })

  it('delegates subscriber lookup and maps the neutral result', async () => {
    const client = {
      getSubscriber: jest.fn().mockResolvedValue(subscriber),
    }
    const provider = new RadiusSubscriberProvider(client as never, 'SITE-001')

    await expect(provider.getSubscriber(subscriber.username)).resolves.toMatchObject({
      id: subscriber.username,
      username: subscriber.username,
      profileId: subscriber.profile,
    })
    expect(client.getSubscriber).toHaveBeenCalledWith(subscriber.username)
  })

  it('only lists subscribers belonging to the selected site', async () => {
    const otherSiteSubscriber = {
      ...subscriber,
      username: 'subscriber-2',
      siteCode: 'SITE-002',
    }
    const client = {
      listSubscribers: jest.fn().mockResolvedValue([subscriber, otherSiteSubscriber]),
    }
    const provider = new RadiusSubscriberProvider(client as never, 'SITE-001')

    const result = await provider.listSubscribers()

    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.username).toBe(subscriber.username)
  })

  it('overwrites a client site code with the selected corporate site code', async () => {
    const client = {
      createSubscriber: jest.fn().mockResolvedValue(subscriber),
    }
    const provider = new RadiusSubscriberProvider(client as never, 'SITE-001')
    const maliciousInput = {
      username: subscriber.username,
      password: 'secret',
      profileId: subscriber.profile,
      paidThrough: subscriber.paidThrough,
      siteCode: 'SITE-999',
    }

    await provider.createSubscriber(maliciousInput)

    expect(client.createSubscriber).toHaveBeenCalledWith({
      username: subscriber.username,
      password: 'secret',
      profile: subscriber.profile,
      paidThrough: subscriber.paidThrough,
      siteCode: 'SITE-001',
    })
  })

  it('rejects a mutation for a subscriber belonging to another site', async () => {
    const client = {
      getSubscriber: jest.fn().mockResolvedValue({
        ...subscriber,
        siteCode: 'SITE-002',
      }),
      enableSubscriber: jest.fn(),
    }
    const provider = new RadiusSubscriberProvider(client as never, 'SITE-001')

    await expect(provider.enableSubscriber(subscriber.username)).rejects.toMatchObject({
      status: 404,
    })
    expect(client.enableSubscriber).not.toHaveBeenCalled()
  })

  it('rejects when Packet-of-Disconnect is not delivered', async () => {
    const client = {
      disconnectSession: jest.fn().mockResolvedValue({ pod: false }),
    }
    const provider = new RadiusSubscriberProvider(client as never, 'SITE-001')

    await expect(provider.disconnectSession('session-1')).rejects.toThrow(
      'Packet-of-Disconnect failed'
    )
  })
})
