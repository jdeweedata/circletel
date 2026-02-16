import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60 // Cache for 60 seconds

type ProviderStatus = 'operational' | 'degraded' | 'outage' | 'unknown'
type OverallStatus = 'operational' | 'degraded' | 'outage'

interface ProviderHealth {
  name: string
  status: ProviderStatus
  latency: number | null
  lastCheck: string | null
}

interface PublicIncident {
  id: string
  incident_number: string
  title: string
  severity: 'critical' | 'major' | 'minor' | 'maintenance'
  status: string
  affected_providers: string[]
  affected_regions: string[]
  started_at: string
  updates: {
    status: string
    message: string
    is_public: boolean
    created_at: string
  }[]
}

interface StatusResponse {
  overallStatus: OverallStatus
  providers: ProviderHealth[]
  activeIncidents: PublicIncident[]
  lastUpdated: string
}

// Provider display names mapping
const PROVIDER_NAMES: Record<string, string> = {
  interstellio: 'Interstellio',
  mtn: 'MTN',
  openserve: 'Openserve',
  telkom: 'Telkom',
  vumatel: 'Vumatel',
  metrofibre: 'MetroFibre',
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch latest provider status (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: providerLogs } = await supabase
      .from('provider_status_logs')
      .select('provider_name, status, latency_ms, checked_at')
      .gte('checked_at', fiveMinutesAgo)
      .order('checked_at', { ascending: false })

    // Group by provider, get latest status for each
    const providerMap = new Map<string, ProviderHealth>()

    if (providerLogs) {
      for (const log of providerLogs) {
        if (!providerMap.has(log.provider_name)) {
          providerMap.set(log.provider_name, {
            name: PROVIDER_NAMES[log.provider_name] || log.provider_name,
            status: log.status as ProviderStatus,
            latency: log.latency_ms,
            lastCheck: log.checked_at,
          })
        }
      }
    }

    // Add default providers if not in logs (show as unknown)
    const defaultProviders = ['interstellio', 'mtn', 'openserve', 'telkom']
    for (const provider of defaultProviders) {
      if (!providerMap.has(provider)) {
        providerMap.set(provider, {
          name: PROVIDER_NAMES[provider] || provider,
          status: 'operational', // Default to operational if no issues logged
          latency: null,
          lastCheck: null,
        })
      }
    }

    const providers = Array.from(providerMap.values())

    // Fetch active public incidents
    const { data: incidents } = await supabase
      .from('outage_incidents')
      .select(`
        id,
        incident_number,
        title,
        severity,
        status,
        affected_providers,
        affected_regions,
        started_at,
        outage_updates (
          status,
          message,
          is_public,
          created_at
        )
      `)
      .eq('is_public', true)
      .in('status', ['investigating', 'identified', 'monitoring'])
      .order('started_at', { ascending: false })

    // Filter to only public updates and format
    const activeIncidents: PublicIncident[] = (incidents || []).map((incident) => ({
      id: incident.id,
      incident_number: incident.incident_number,
      title: incident.title,
      severity: incident.severity as PublicIncident['severity'],
      status: incident.status,
      affected_providers: incident.affected_providers || [],
      affected_regions: incident.affected_regions || [],
      started_at: incident.started_at,
      updates: (incident.outage_updates || [])
        .filter((u: { is_public: boolean }) => u.is_public)
        .sort((a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    }))

    // Determine overall status
    let overallStatus: OverallStatus = 'operational'

    // Check for critical/major incidents
    const hasCritical = activeIncidents.some((i) => i.severity === 'critical')
    const hasMajor = activeIncidents.some((i) => i.severity === 'major')
    const hasMinor = activeIncidents.some((i) => i.severity === 'minor' || i.severity === 'maintenance')

    // Check provider statuses
    const hasOutage = providers.some((p) => p.status === 'outage')
    const hasDegraded = providers.some((p) => p.status === 'degraded')

    if (hasCritical || hasOutage) {
      overallStatus = 'outage'
    } else if (hasMajor || hasDegraded) {
      overallStatus = 'degraded'
    } else if (hasMinor) {
      overallStatus = 'degraded'
    }

    const response: StatusResponse = {
      overallStatus,
      providers,
      activeIncidents,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('Error fetching public status:', error)

    // Return degraded status on error rather than failing
    return NextResponse.json(
      {
        overallStatus: 'operational',
        providers: [
          { name: 'Interstellio', status: 'operational', latency: null, lastCheck: null },
          { name: 'MTN', status: 'operational', latency: null, lastCheck: null },
          { name: 'Openserve', status: 'operational', latency: null, lastCheck: null },
          { name: 'Telkom', status: 'operational', latency: null, lastCheck: null },
        ],
        activeIncidents: [],
        lastUpdated: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30',
        },
      }
    )
  }
}
