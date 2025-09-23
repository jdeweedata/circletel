import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function validateAdminUser(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Check if user is an admin
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()

  if (adminError || !adminUser) {
    return new Response(JSON.stringify({ error: 'Access denied - Admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Update last login
  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', adminUser.id)

  // Log audit
  await supabase.from('admin_audit_logs').insert({
    user_id: adminUser.id,
    action: 'LOGIN',
    entity_type: 'auth',
    entity_id: adminUser.id,
    changes: { email },
    timestamp: new Date().toISOString()
  })

  return new Response(JSON.stringify({
    user: adminUser,
    session: authData.session,
    permissions: adminUser.permissions
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function validateSession(req: Request) {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authorization header required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const token = authHeader.replace('Bearer ', '')

  // Verify the JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Check admin status
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', user.email)
    .eq('is_active', true)
    .single()

  if (!adminUser) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    valid: true,
    user: adminUser,
    permissions: adminUser.permissions
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getAdminUsers(req: Request) {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authorization required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Validate session first
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Check if user is super admin
  const { data: currentUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('email', user.email)
    .single()

  if (!currentUser || currentUser.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Super admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { data: adminUsers, error: adminError } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, is_active, last_login, created_at')
    .order('created_at', { ascending: false })

  if (adminError) {
    return new Response(JSON.stringify({ error: adminError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ data: adminUsers }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function createAdminUser(req: Request) {
  const { email, fullName, role, permissions } = await req.json()
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authorization required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Validate session and super admin role
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { data: currentUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('email', user.email)
    .single()

  if (!currentUser || currentUser.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Super admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Create new admin user
  const { data: newAdminUser, error: createError } = await supabase
    .from('admin_users')
    .insert({
      email,
      full_name: fullName,
      role,
      permissions: permissions || {},
      is_active: true
    })
    .select()
    .single()

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Log audit
  await supabase.from('admin_audit_logs').insert({
    user_id: currentUser.id,
    action: 'CREATE_ADMIN_USER',
    entity_type: 'admin_users',
    entity_id: newAdminUser.id,
    changes: { email, fullName, role },
    timestamp: new Date().toISOString()
  })

  return new Response(JSON.stringify({ data: newAdminUser }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const method = req.method

    // Route handling
    if (method === 'POST' && url.pathname.includes('/login')) {
      return await validateAdminUser(req)
    } else if (method === 'GET' && url.pathname.includes('/validate')) {
      return await validateSession(req)
    } else if (method === 'GET' && url.pathname.includes('/users')) {
      return await getAdminUsers(req)
    } else if (method === 'POST' && url.pathname.includes('/users')) {
      return await createAdminUser(req)
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})