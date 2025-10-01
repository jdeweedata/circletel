import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SignupRequest {
  email: string
  full_name: string
  requested_role: 'product_manager' | 'editor' | 'viewer'
  reason?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    if (req.method === 'POST') {
      const body = await req.json() as SignupRequest

      // Validate required fields
      if (!body.email || !body.full_name || !body.requested_role) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email, full name, and requested role are required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid email format'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if email already exists in admin_users
      const { data: existingAdmin } = await supabaseClient
        .from('admin_users')
        .select('id')
        .eq('email', body.email)
        .single()

      if (existingAdmin) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'An admin account with this email already exists'
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if pending request already exists
      const { data: existingRequest } = await supabaseClient
        .from('pending_admin_users')
        .select('id, status')
        .eq('email', body.email)
        .single()

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'A pending access request already exists for this email'
            }),
            {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } else if (existingRequest.status === 'rejected') {
          // Allow resubmission after rejection
          const { error: deleteError } = await supabaseClient
            .from('pending_admin_users')
            .delete()
            .eq('id', existingRequest.id)

          if (deleteError) {
            console.error('Error deleting rejected request:', deleteError)
          }
        }
      }

      // Create pending admin user request
      const { data: pendingUser, error: insertError } = await supabaseClient
        .from('pending_admin_users')
        .insert({
          email: body.email,
          full_name: body.full_name,
          requested_role: body.requested_role,
          reason: body.reason || null,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating pending user:', insertError)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to submit access request'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // TODO: Send notification email to super admins about new access request

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Access request submitted successfully. You will be notified once reviewed.',
          request_id: pendingUser.id
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Admin signup error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
