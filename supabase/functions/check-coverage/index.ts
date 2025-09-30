import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address, coordinates } = await req.json()

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // For now, do a simple query based on area_name
    // In production, you'd use PostGIS for actual polygon checks
    const { data: coverageAreas, error } = await supabase
      .from('coverage_areas')
      .select('*')
      .eq('status', 'active')

    if (error) throw error

    // For demo, check if address contains any area name
    const addressLower = address.toLowerCase()
    const availableServices = coverageAreas.filter(area =>
      addressLower.includes(area.area_name.toLowerCase().split(' - ')[1]?.toLowerCase() || area.area_name.toLowerCase())
    )

    // Get unique service types
    const serviceTypes = [...new Set(availableServices.map(a => a.service_type))]

    // Get all available speeds
    const speeds = availableServices.flatMap(a => a.available_speeds || [])

    const response = {
      available: availableServices.length > 0,
      services: serviceTypes,
      speeds: speeds,
      areas: availableServices.map(a => ({
        service_type: a.service_type,
        area_name: a.area_name,
        activation_days: a.activation_days
      }))
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})