import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'product_manager' | 'editor' | 'viewer'
  permissions: Record<string, unknown>
  is_active: boolean
  last_login?: string
}

interface LoginRequest {
  email: string
  password: string
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

    const authHeader = req.headers.get('Authorization')

    if (authHeader && req.method === 'POST') {
      const token = authHeader.replace('Bearer ', '')

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

      if (authError || !user) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: 'Invalid or expired session'
          }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { data: adminUser, error: adminError } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .single()

      if (adminError || !adminUser) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: 'Admin user not found or inactive'
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      await supabaseClient
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)

      return new Response(
        JSON.stringify({
          valid: true,
          user: {
            id: adminUser.id,
            email: adminUser.email,
            full_name: adminUser.full_name,
            role: adminUser.role,
            permissions: adminUser.permissions,
            is_active: adminUser.is_active,
            last_login: adminUser.last_login
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (req.method === 'POST') {
      const body = await req.json() as LoginRequest

      if (!body.email || !body.password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      })

      if (authError || !authData.user) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const { data: adminUser, error: adminError } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('is_active', true)
        .single()

      if (adminError || !adminUser) {
        return new Response(
          JSON.stringify({
            error: 'User is not an admin or account is inactive'
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      await supabaseClient
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id)

      await supabaseClient
        .from('admin_activity_log')
        .insert({
          admin_user_id: adminUser.id,
          action: 'login',
          resource_type: 'auth',
          details: { method: 'password' }
        })

      return new Response(
        JSON.stringify({
          user: {
            id: adminUser.id,
            email: adminUser.email,
            full_name: adminUser.full_name,
            role: adminUser.role,
            permissions: adminUser.permissions,
            is_active: adminUser.is_active,
            last_login: new Date().toISOString()
          },
          session: {
            access_token: authData.session?.access_token,
            refresh_token: authData.session?.refresh_token,
            expires_at: authData.session?.expires_at,
            expires_in: authData.session?.expires_in
          }
        }),
        {
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
    console.error('Admin auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
