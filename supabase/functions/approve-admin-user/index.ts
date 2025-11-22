import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApproveRequest {
  request_id: string
  password?: string
  reviewer_id: string
  notes?: string
}

function generateStrongPassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
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
      const body = await req.json() as ApproveRequest

      // Validate required fields
      if (!body.request_id || !body.reviewer_id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Request ID and reviewer ID are required'
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const temporaryPassword = body.password && body.password.length >= 12
        ? body.password
        : generateStrongPassword(16)

      // Fetch the pending request
      const { data: pendingRequest, error: fetchError } = await supabaseAdmin
        .from('pending_admin_users')
        .select(`
          *,
          role_template:role_templates!pending_admin_users_requested_role_template_id_fkey(*)
        `)
        .eq('id', body.request_id)
        .eq('status', 'pending')
        .single()

      if (fetchError || !pendingRequest) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Request not found or already processed'
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Step 1: Create Supabase Auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: pendingRequest.email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: pendingRequest.full_name
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to create auth user: ${authError.message}`
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Step 2: Create admin_users record
      const roleTemplateId = pendingRequest.requested_role_template_id || pendingRequest.requested_role
      const { data: adminUser, error: adminInsertError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          id: authUser.user.id,
          email: pendingRequest.email,
          full_name: pendingRequest.full_name,
          role: roleTemplateId, // Legacy role field
          role_template_id: roleTemplateId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (adminInsertError) {
        console.error('Error creating admin user:', adminInsertError)

        // Rollback: Delete auth user
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)

        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to create admin user: ${adminInsertError.message}`
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Step 3: Update pending request status
      const { error: updateError } = await supabaseAdmin
        .from('pending_admin_users')
        .update({
          status: 'approved',
          reviewed_by: body.reviewer_id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', body.request_id)

      if (updateError) {
        console.error('Error updating pending request:', updateError)
      }

      // Step 4: Log audit trail
      await supabaseAdmin.from('admin_audit_logs').insert({
        user_id: body.reviewer_id,
        action: 'APPROVE_ADMIN_USER',
        entity_type: 'admin_users',
        entity_id: adminUser.id,
        changes: {
          request_id: body.request_id,
          approved_user_email: pendingRequest.email,
          role: roleTemplateId,
          notes: body.notes
        },
        timestamp: new Date().toISOString()
      })

      // Step 5: Send welcome email notification
      try {
        await supabaseAdmin.functions.invoke('send-admin-notification', {
          body: {
            type: 'approval',
            email: pendingRequest.email,
            full_name: pendingRequest.full_name,
            role_name: pendingRequest.role_template?.name || roleTemplateId,
            temporary_password: temporaryPassword
          }
        })
      } catch (emailError) {
        console.error('Error sending notification email:', emailError)
        // Don't fail the approval if email fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'User approved successfully and notification sent',
          data: {
            user_id: adminUser.id,
            email: adminUser.email,
            role: roleTemplateId
          }
        }),
        {
          status: 200,
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
    console.error('Approve admin user error:', error)
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
