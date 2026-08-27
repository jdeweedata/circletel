import type { EsquireFeedEnv } from './esquire-types'

export const ESQUIRE_FEED_HOST = 'https://api.esquire.co.za/api/DataFeed'

export function buildEsquireFeedUrl(env: EsquireFeedEnv = process.env): string {
  const user = env.ESQUIRE_FEED_USER?.trim()
  const password = env.ESQUIRE_FEED_PASSWORD?.trim()

  if (!user || !password) {
    throw new Error(
      'Esquire feed credentials missing: set ESQUIRE_FEED_USER and ESQUIRE_FEED_PASSWORD'
    )
  }

  const params = new URLSearchParams({
    u: user,
    p: password,
    t: 'xml',
    m: '0',
    o: 'ascending',
    r: 'RoundNone',
    rm: '0',
    min: '0',
  })

  return `${ESQUIRE_FEED_HOST}?${params.toString()}`
}

export async function fetchEsquireXml(
  env: EsquireFeedEnv = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const url = buildEsquireFeedUrl(env)
  const response = await fetchImpl(url, {
    headers: { 'User-Agent': 'CircleTel-esquire-sync/1.0' },
  })
  if (!response.ok) {
    throw new Error(`Esquire feed HTTP ${response.status}`)
  }
  return response.text()
}
