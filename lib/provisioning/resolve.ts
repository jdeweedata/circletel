import {
  getInterstellioClient,
  type InterstellioClient,
} from '@/lib/interstellio'
import { getRadiusClient, type RadiusClient } from '@/lib/radius'
import { createClient } from '@/lib/supabase/server'
import { InterstellioSubscriberProvider } from './interstellio'
import type { SubscriberProvider } from './provider'
import { RadiusSubscriberProvider } from './radius'
import type { ProviderKind } from './types'

interface SiteProviderContext {
  provider: ProviderKind
  siteCode: string | null
}

export interface ProviderDependencies {
  readSiteProvider?: (siteId: string) => Promise<SiteProviderContext | null>
  interstellioClient?: InterstellioClient
  radiusClient?: RadiusClient
}

type RadiusSiteCodeError = Error & {
  status: number
  code: string
}

function missingRadiusSiteCode(): RadiusSiteCodeError {
  const error = new Error(
    'The selected corporate site has no RADIUS site code'
  ) as RadiusSiteCodeError
  error.status = 409
  error.code = 'RADIUS_SITE_CODE_MISSING'
  return error
}

async function readSiteProvider(siteId: string): Promise<SiteProviderContext | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('corporate_sites')
    .select('id, radius_provider, site_code')
    .eq('id', siteId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`Corporate site not found: ${siteId}`)

  return {
    provider: data.radius_provider === 'radius' ? 'radius' : 'interstellio',
    siteCode: data.site_code,
  }
}

export async function getProviderForSite(
  siteId: string,
  deps: ProviderDependencies = {}
): Promise<SubscriberProvider> {
  const site = (await (deps.readSiteProvider ?? readSiteProvider)(siteId)) ?? {
    provider: 'interstellio',
    siteCode: null,
  }

  if (site.provider === 'radius') {
    const siteCode = site.siteCode?.trim()
    if (!siteCode) throw missingRadiusSiteCode()

    return new RadiusSubscriberProvider(
      deps.radiusClient ?? getRadiusClient(),
      siteCode
    )
  }

  return new InterstellioSubscriberProvider(
    deps.interstellioClient ?? getInterstellioClient()
  )
}
