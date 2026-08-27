import { describe, expect, it } from '@jest/globals'

import { buildEsquireFeedUrl } from '../esquire-feed'

describe('buildEsquireFeedUrl', () => {
  it('fails closed when credentials are missing', () => {
    expect(() =>
      buildEsquireFeedUrl({
        ESQUIRE_FEED_USER: '',
        ESQUIRE_FEED_PASSWORD: '',
      })
    ).toThrow(/ESQUIRE_FEED_USER|ESQUIRE_FEED_PASSWORD/i)
  })

  it('does not embed a hardcoded password and uses env values', () => {
    const url = buildEsquireFeedUrl({
      ESQUIRE_FEED_USER: 'buyer@example.com',
      ESQUIRE_FEED_PASSWORD: 'secret-from-env',
    })

    expect(url).toContain('https://api.esquire.co.za/api/DataFeed')
    expect(url).toContain('u=buyer%40example.com')
    expect(url).toContain('p=secret-from-env')
    expect(url).toContain('t=xml')
    expect(url).not.toContain('ak4qrbdATun')
  })
})
