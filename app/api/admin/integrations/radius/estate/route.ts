import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { getRadiusClient } from '@/lib/radius'
import type { Estate } from '@/lib/radius'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  if (!authResult.success) {
    return authResult.response
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('corporate_sites')
      .select('id, name, site_code, radius_provider, status')
      .order('name')
    if (error) throw error

    let estate: Estate | null = null
    try {
      estate = await getRadiusClient().listEstate()
    } catch (radiusError) {
      const status =
        radiusError instanceof Error && 'status' in radiusError
          ? Number((radiusError as Error & { status: number }).status)
          : 0
      if (status !== 500 && status !== 404) throw radiusError
    }

    const byCode = new Map((estate?.sites ?? []).map((site) => [site.code, site]))
    const sites = (data ?? []).map((row) => {
      const aaa = row.site_code ? byCode.get(row.site_code) : undefined
      return {
        id: row.id,
        name: row.name,
        siteCode: row.site_code,
        status: row.status,
        radiusProvider: row.radius_provider === 'radius' ? 'radius' : 'interstellio',
        nasType: aaa?.nasType ?? null,
        tunnelType: aaa?.tunnelType ?? null,
        overlayIp: aaa?.overlayIp ?? null,
        openSessions: aaa?.openSessions ?? 0,
        voucherCount: estate?.voucherCount ?? 0,
        voucherGrossCents: estate?.voucherGrossCents ?? 0,
        lastAcceptAt: aaa?.lastAcceptAt ?? null,
      }
    })

    return NextResponse.json({
      sites,
      voucherCount: estate?.voucherCount ?? 0,
      voucherGrossCents: estate?.voucherGrossCents ?? 0,
    })
  } catch (error) {
    const status =
      error instanceof Error && 'status' in error
        ? Number((error as Error & { status: number }).status)
        : 500
    return NextResponse.json(
      { error: 'Failed to load RADIUS estate' },
      { status: status >= 400 && status < 600 ? status : 500 }
    )
  }
}
