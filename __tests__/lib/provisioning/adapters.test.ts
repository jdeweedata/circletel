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
    const provider = new RadiusSubscriberProvider(client as never)

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
    const provider = new RadiusSubscriberProvider(client as never)

    await expect(provider.getSubscriber(subscriber.username)).resolves.toMatchObject({
      id: subscriber.username,
      username: subscriber.username,
      profileId: subscriber.profile,
    })
    expect(client.getSubscriber).toHaveBeenCalledWith(subscriber.username)
  })
})
