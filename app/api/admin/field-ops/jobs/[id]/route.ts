/**
 * Admin Field Job Detail API
 * GET - Get single job
 * PUT - Update job (status, assignment, details)
 * DELETE - Cancel job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFieldJobById, updateFieldJob, assignJob } from '@/lib/services/technician-service';
import { UpdateFieldJobInput } from '@/lib/types/technician-tracking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const job = await getFieldJobById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    return NextResponse.json(job);
  } catch (error) {
    console.error('[Admin Job API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body: UpdateFieldJobInput = await request.json();
    
    // If assigning technician, use assignJob function
    if (body.assigned_technician_id && Object.keys(body).length === 1) {
      const job = await assignJob(id, body.assigned_technician_id);
      return NextResponse.json(job);
    }
    
    const job = await updateFieldJob(id, body);
    return NextResponse.json(job);
  } catch (error) {
    console.error('[Admin Job API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Cancel job instead of deleting
    const job = await updateFieldJob(id, { status: 'cancelled' });
    
    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('[Admin Job API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
