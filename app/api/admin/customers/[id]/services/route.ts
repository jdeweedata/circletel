import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await context.params

    // Verify admin access
    const adminCheck = await verifyAdminAccess()
    if (!adminCheck.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch customer services with package details
    const { data: services, error } = await supabase
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
        service_packages!inner (
          name,
          speed,
          price_monthly
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
        speed: string | null
        price_monthly: number
      }

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
        package_speed: packageData?.speed || null,
        package_price: packageData?.price_monthly || 0,
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
