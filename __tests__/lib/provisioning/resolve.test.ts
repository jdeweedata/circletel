import { getProviderForSite } from '@/lib/provisioning'

const createInput = {
  username: 'subscriber@example.com',
  password: 'secret',
  siteCode: 'SITE-001',
  profileId: 'profile-1',
  paidThrough: '2026-09-30',
  virtualId: 'virtual-1',
  serviceId: 'service-1',
}

describe('getProviderForSite', () => {
  it('uses Interstellio when the site provider is interstellio', async () => {
    const interstellioSubscriber = {
      id: 'subscriber-1',
      username: createInput.username,
      profile_id: createInput.profileId,
      enabled: true,
    }
    const interstellioClient = {
      createSubscriber: jest.fn().mockResolvedValue(interstellioSubscriber),
    }
    const radiusClient = {
      createSubscriber: jest.fn(),
    }

    const provider = await getProviderForSite('site-1', {
      readSiteProvider: jest.fn().mockResolvedValue({
        provider: 'interstellio',
        siteCode: null,
      }),
      interstellioClient: interstellioClient as never,
      radiusClient: radiusClient as never,
    })

    await provider.createSubscriber(createInput)

    expect(interstellioClient.createSubscriber).toHaveBeenCalledWith({
      username: createInput.username,
      password: createInput.password,
      profile_id: createInput.profileId,
      virtual_id: createInput.virtualId,
      service_id: createInput.serviceId,
    })
    expect(radiusClient.createSubscriber).not.toHaveBeenCalled()
  })

  it('uses RadiusClient when the site provider is radius', async () => {
    const radiusSubscriber = {
      username: createInput.username,
      siteCode: createInput.siteCode,
      profile: createInput.profileId,
      paidThrough: createInput.paidThrough,
      enabled: true,
    }
    const interstellioClient = {
      createSubscriber: jest.fn(),
    }
    const radiusClient = {
      createSubscriber: jest.fn().mockResolvedValue(radiusSubscriber),
    }

    const provider = await getProviderForSite('site-1', {
      readSiteProvider: jest.fn().mockResolvedValue({
        provider: 'radius',
        siteCode: '  CORPORATE-SITE-001  ',
      }),
      interstellioClient: interstellioClient as never,
      radiusClient: radiusClient as never,
    })

    await provider.createSubscriber(createInput)

    expect(radiusClient.createSubscriber).toHaveBeenCalledWith({
      username: createInput.username,
      password: createInput.password,
      siteCode: 'CORPORATE-SITE-001',
      profile: createInput.profileId,
      paidThrough: createInput.paidThrough,
    })
    expect(interstellioClient.createSubscriber).not.toHaveBeenCalled()
  })

  it('rejects a RADIUS site without a corporate site code', async () => {
    await expect(getProviderForSite('site-1', {
      readSiteProvider: jest.fn().mockResolvedValue({
        provider: 'radius',
        siteCode: '   ',
      }),
      radiusClient: {} as never,
    })).rejects.toMatchObject({
      status: 409,
      code: 'RADIUS_SITE_CODE_MISSING',
    })
  })
})
