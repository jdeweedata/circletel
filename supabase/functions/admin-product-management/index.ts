import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface Database {
  public: {
    Tables: {
      admin_products: {
        Row: {
          id: string
          name: string
          slug: string
          category: 'business_fibre' | 'fixed_wireless_business' | 'fixed_wireless_residential'
          service_type: string
          description: string | null
          long_description: string | null
          speed_down: number
          speed_up: number
          is_symmetrical: boolean
          contract_terms: number[]
          status: 'draft' | 'pending' | 'approved' | 'archived'
          version: number
          is_current: boolean
          sort_order: number
          is_featured: boolean
          created_by: string | null
          updated_by: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['admin_products']['Insert']>
      }
      admin_product_pricing: {
        Row: {
          id: string
          product_id: string
          price_regular: number
          price_promo: number | null
          installation_fee: number
          hardware_contribution: number
          router_rental: number
          is_promotional: boolean
          promo_start_date: string | null
          promo_end_date: string | null
          effective_from: string
          effective_to: string | null
          approval_status: 'pending' | 'approved' | 'rejected'
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_product_pricing']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['admin_product_pricing']['Insert']>
      }
    }
  }
}

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function logAudit(userId: string, action: string, entityType: string, entityId: string, changes: any) {
  await supabase.from('admin_audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    changes,
    timestamp: new Date().toISOString()
  })
}

async function createProduct(req: Request) {
  const { product, pricing, features, hardware } = await req.json()
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authorization required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Create slug from name
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // Insert product
  const { data: newProduct, error: productError } = await supabase
    .from('admin_products')
    .insert({
      ...product,
      slug,
      status: 'draft'
    })
    .select()
    .single()

  if (productError) {
    return new Response(JSON.stringify({ error: productError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Insert pricing
  if (pricing) {
    await supabase.from('admin_product_pricing').insert({
      ...pricing,
      product_id: newProduct.id,
      approval_status: 'pending'
    })
  }

  // Insert features
  if (features && features.length > 0) {
    const featureData = features.map((feature: any) => ({
      ...feature,
      product_id: newProduct.id
    }))
    await supabase.from('admin_product_features').insert(featureData)
  }

  // Insert hardware
  if (hardware && hardware.length > 0) {
    const hardwareData = hardware.map((hw: any) => ({
      ...hw,
      product_id: newProduct.id
    }))
    await supabase.from('admin_product_hardware').insert(hardwareData)
  }

  // Log audit
  await logAudit(
    product.created_by,
    'CREATE',
    'admin_products',
    newProduct.id,
    { product, pricing, features, hardware }
  )

  return new Response(JSON.stringify({ data: newProduct }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function updateProduct(req: Request) {
  const url = new URL(req.url)
  const productId = url.pathname.split('/').pop()
  const { product, pricing, reason } = await req.json()

  if (!productId) {
    return new Response(JSON.stringify({ error: 'Product ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Get current product for change tracking
  const { data: currentProduct } = await supabase
    .from('admin_products')
    .select('*')
    .eq('id', productId)
    .single()

  // Update product
  const { data: updatedProduct, error } = await supabase
    .from('admin_products')
    .update({
      ...product,
      status: 'pending', // Set to pending for approval
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Create change record for approval
  await supabase.from('admin_product_changes').insert({
    product_id: productId,
    change_type: 'update',
    old_value: currentProduct,
    new_value: product,
    reason,
    requested_by: product.updated_by,
    status: 'pending'
  })

  // Update pricing if provided
  if (pricing) {
    await supabase
      .from('admin_product_pricing')
      .update({
        ...pricing,
        approval_status: 'pending'
      })
      .eq('product_id', productId)
  }

  // Log audit
  await logAudit(
    product.updated_by,
    'UPDATE',
    'admin_products',
    productId,
    { old: currentProduct, new: product, reason }
  )

  return new Response(JSON.stringify({ data: updatedProduct }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getProducts(req: Request) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const status = url.searchParams.get('status')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('admin_products')
    .select(`
      *,
      admin_product_pricing(*),
      admin_product_features(*),
      admin_product_hardware(*)
    `)
    .eq('is_current', true)
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('category', category)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    data,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit)
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getProduct(req: Request) {
  const url = new URL(req.url)
  const productId = url.pathname.split('/').pop()

  if (!productId) {
    return new Response(JSON.stringify({ error: 'Product ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { data, error } = await supabase
    .from('admin_products')
    .select(`
      *,
      admin_product_pricing(*),
      admin_product_features(*),
      admin_product_hardware(*),
      admin_product_changes(*)
    `)
    .eq('id', productId)
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function deleteProduct(req: Request) {
  const url = new URL(req.url)
  const productId = url.pathname.split('/').pop()
  const { reason, user_id } = await req.json()

  if (!productId) {
    return new Response(JSON.stringify({ error: 'Product ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Soft delete by archiving
  const { data, error } = await supabase
    .from('admin_products')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Create change record
  await supabase.from('admin_product_changes').insert({
    product_id: productId,
    change_type: 'delete',
    reason,
    requested_by: user_id,
    status: 'pending'
  })

  // Log audit
  await logAudit(user_id, 'DELETE', 'admin_products', productId, { reason })

  return new Response(JSON.stringify({ data }), {
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
    if (method === 'GET' && url.pathname.includes('/products/')) {
      return await getProduct(req)
    } else if (method === 'GET') {
      return await getProducts(req)
    } else if (method === 'POST') {
      return await createProduct(req)
    } else if (method === 'PUT' || method === 'PATCH') {
      return await updateProduct(req)
    } else if (method === 'DELETE') {
      return await deleteProduct(req)
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