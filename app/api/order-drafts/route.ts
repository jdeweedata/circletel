'use server'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const { data, error } = await supabase
    .from('order_drafts')
    .select('id, data, updated_at')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ draft: data || null })
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const dataField = body?.data
  if (!dataField) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('order_drafts')
    .upsert({ auth_user_id: userData.user.id, data: dataField })
    .select('id, data, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ draft: data })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const { error } = await supabase
    .from('order_drafts')
    .delete()
    .eq('auth_user_id', userData.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
