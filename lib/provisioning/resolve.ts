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

export interface ProviderDependencies {
  readSiteProvider?: (siteId: string) => Promise<ProviderKind | null>
  interstellioClient?: InterstellioClient
  radiusClient?: RadiusClient
}

async function readSiteProvider(siteId: string): Promise<ProviderKind | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('corporate_sites')
    .select('id, radius_provider')
    .eq('id', siteId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`Corporate site not found: ${siteId}`)

  return data.radius_provider === 'radius' ? 'radius' : 'interstellio'
}

export async function getProviderForSite(
  siteId: string,
  deps: ProviderDependencies = {}
): Promise<SubscriberProvider> {
  const provider = (await (deps.readSiteProvider ?? readSiteProvider)(siteId))
    ?? 'interstellio'

  if (provider === 'radius') {
    return new RadiusSubscriberProvider(deps.radiusClient ?? getRadiusClient())
  }

  return new InterstellioSubscriberProvider(
    deps.interstellioClient ?? getInterstellioClient()
  )
}
