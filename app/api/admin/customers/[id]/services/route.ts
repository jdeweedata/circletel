/**
 * API Route: /api/admin/customers/[id]/services
 *
 * GET: Get all services for a customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request)
  if (!authResult.success) return authResult.response

  try {
    const { id: customerId } = await context.params

    const supabaseAdmin = await createClient()

    // Fetch customer services with package details
    const { data: services, error } = await supabaseAdmin
      .from('customer_services')
      .select(`
        id,
        customer_id,
        package_id,
        connection_id,
        status,
        start_date,
        end_date,
        created_at,
        updated_at,
        service_packages (
          name,
          speed_down,
          speed_up,
          price
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customer services:', error)
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
    }

    // Transform data to include package details
    const transformedServices = (services || []).map((service) => {
      const packageData = service.service_packages as unknown as {
        name: string
        speed_down: number | null
        speed_up: number | null
        price: number
      } | null

      return {
        id: service.id,
        customer_id: service.customer_id,
        package_id: service.package_id,
        connection_id: service.connection_id,
        status: service.status,
        start_date: service.start_date,
        end_date: service.end_date,
        created_at: service.created_at,
        updated_at: service.updated_at,
        package_name: packageData?.name || 'Unknown Package',
        package_speed_down: packageData?.speed_down || null,
        package_speed_up: packageData?.speed_up || null,
        package_price: packageData?.price || 0,
      }
    })

    return NextResponse.json({
      services: transformedServices,
      count: transformedServices.length,
    })
  } catch (error) {
    console.error('Error in customer services endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
