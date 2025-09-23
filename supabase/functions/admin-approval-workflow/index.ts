import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function getPendingApprovals(req: Request) {
  const url = new URL(req.url)
  const entityType = url.searchParams.get('entity_type')
  const userId = url.searchParams.get('user_id')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('admin_product_changes')
    .select(`
      *,
      admin_products!admin_product_changes_product_id_fkey(name, category),
      admin_users!admin_product_changes_requested_by_fkey(full_name, email)
    `)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (entityType) {
    query = query.eq('change_type', entityType)
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

async function approveChange(req: Request) {
  const { changeId, reviewNotes, userId } = await req.json()

  if (!changeId || !userId) {
    return new Response(JSON.stringify({ error: 'Change ID and User ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Get the change record
  const { data: change, error: changeError } = await supabase
    .from('admin_product_changes')
    .select('*')
    .eq('id', changeId)
    .single()

  if (changeError || !change) {
    return new Response(JSON.stringify({ error: 'Change not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Update the change status
  const { error: updateError } = await supabase
    .from('admin_product_changes')
    .update({
      status: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes
    })
    .eq('id', changeId)

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Apply the approved changes based on change type
  if (change.change_type === 'update' && change.product_id) {
    // Update the product with approved changes
    await supabase
      .from('admin_products')
      .update({
        ...change.new_value,
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString()
      })
      .eq('id', change.product_id)

    // Update pricing approval if it exists
    await supabase
      .from('admin_product_pricing')
      .update({
        approval_status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString()
      })
      .eq('product_id', change.product_id)
  } else if (change.change_type === 'create' && change.product_id) {
    // Approve new product
    await supabase
      .from('admin_products')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString()
      })
      .eq('id', change.product_id)
  } else if (change.change_type === 'delete' && change.product_id) {
    // Finalize product deletion
    await supabase
      .from('admin_products')
      .update({
        status: 'archived',
        approved_by: userId,
        approved_at: new Date().toISOString()
      })
      .eq('id', change.product_id)
  }

  // Log audit
  await supabase.from('admin_audit_logs').insert({
    user_id: userId,
    action: 'APPROVE',
    entity_type: 'admin_product_changes',
    entity_id: changeId,
    changes: { changeId, reviewNotes },
    timestamp: new Date().toISOString()
  })

  return new Response(JSON.stringify({
    success: true,
    message: 'Change approved successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function rejectChange(req: Request) {
  const { changeId, reviewNotes, userId } = await req.json()

  if (!changeId || !userId) {
    return new Response(JSON.stringify({ error: 'Change ID and User ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Update the change status
  const { error } = await supabase
    .from('admin_product_changes')
    .update({
      status: 'rejected',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes
    })
    .eq('id', changeId)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Log audit
  await supabase.from('admin_audit_logs').insert({
    user_id: userId,
    action: 'REJECT',
    entity_type: 'admin_product_changes',
    entity_id: changeId,
    changes: { changeId, reviewNotes },
    timestamp: new Date().toISOString()
  })

  return new Response(JSON.stringify({
    success: true,
    message: 'Change rejected successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getApprovalHistory(req: Request) {
  const url = new URL(req.url)
  const productId = url.searchParams.get('product_id')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('admin_product_changes')
    .select(`
      *,
      admin_users!admin_product_changes_requested_by_fkey(full_name, email),
      admin_users!admin_product_changes_reviewed_by_fkey(full_name, email)
    `)
    .order('requested_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (productId) {
    query = query.eq('product_id', productId)
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

async function bulkApprove(req: Request) {
  const { changeIds, reviewNotes, userId } = await req.json()

  if (!changeIds || !Array.isArray(changeIds) || !userId) {
    return new Response(JSON.stringify({ error: 'Change IDs array and User ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const results = []

  for (const changeId of changeIds) {
    try {
      // Get the change record
      const { data: change } = await supabase
        .from('admin_product_changes')
        .select('*')
        .eq('id', changeId)
        .single()

      if (change) {
        // Update the change status
        await supabase
          .from('admin_product_changes')
          .update({
            status: 'approved',
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
            review_notes: reviewNotes
          })
          .eq('id', changeId)

        // Apply the changes (similar logic as single approve)
        if (change.change_type === 'update' && change.product_id) {
          await supabase
            .from('admin_products')
            .update({
              ...change.new_value,
              status: 'approved',
              approved_by: userId,
              approved_at: new Date().toISOString()
            })
            .eq('id', change.product_id)
        }

        results.push({ changeId, status: 'approved', success: true })
      } else {
        results.push({ changeId, status: 'error', message: 'Change not found' })
      }
    } catch (error) {
      results.push({ changeId, status: 'error', message: error.message })
    }
  }

  // Log audit
  await supabase.from('admin_audit_logs').insert({
    user_id: userId,
    action: 'BULK_APPROVE',
    entity_type: 'admin_product_changes',
    entity_id: '',
    changes: { changeIds, results, reviewNotes },
    timestamp: new Date().toISOString()
  })

  return new Response(JSON.stringify({
    success: true,
    results
  }), {
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
    if (method === 'GET' && url.pathname.includes('/pending')) {
      return await getPendingApprovals(req)
    } else if (method === 'GET' && url.pathname.includes('/history')) {
      return await getApprovalHistory(req)
    } else if (method === 'POST' && url.pathname.includes('/approve')) {
      return await approveChange(req)
    } else if (method === 'POST' && url.pathname.includes('/reject')) {
      return await rejectChange(req)
    } else if (method === 'POST' && url.pathname.includes('/bulk-approve')) {
      return await bulkApprove(req)
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