/**
 * Technician Job API
 * GET - Get job details
 * PUT - Update job status (start, arrive, complete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getTechnicianByUserId,
  getFieldJobById,
  updateJobStatus,
} from '@/lib/services/technician-service';
import { FieldJobStatus } from '@/lib/types/technician-tracking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get technician by user ID
    const technician = await getTechnicianByUserId(user.id);
    if (!technician) {
      return NextResponse.json({ error: 'Technician profile not found' }, { status: 404 });
    }
    
    // Get job
    const job = await getFieldJobById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Verify technician is assigned to this job
    if (job.assigned_technician_id !== technician.id) {
      return NextResponse.json({ error: 'Not authorized to view this job' }, { status: 403 });
    }
    
    return NextResponse.json(job);
  } catch (error) {
    console.error('[Technician Job API] Error:', error);
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
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get technician by user ID
    const technician = await getTechnicianByUserId(user.id);
    if (!technician) {
      return NextResponse.json({ error: 'Technician profile not found' }, { status: 404 });
    }
    
    // Get job
    const job = await getFieldJobById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Verify technician is assigned to this job
    if (job.assigned_technician_id !== technician.id) {
      return NextResponse.json({ error: 'Not authorized to update this job' }, { status: 403 });
    }
    
    const body = await request.json();
    const { status, location, notes, completion_photos, customer_signature_url } = body;
    
    // Validate status transition
    const validTransitions: Record<FieldJobStatus, FieldJobStatus[]> = {
      pending: ['assigned'],
      assigned: ['en_route', 'cancelled'],
      en_route: ['arrived', 'on_hold', 'cancelled'],
      arrived: ['in_progress', 'on_hold', 'cancelled'],
      in_progress: ['completed', 'on_hold', 'cancelled'],
      completed: [],
      cancelled: [],
      on_hold: ['en_route', 'arrived', 'in_progress', 'cancelled'],
    };
    
    if (status && !validTransitions[job.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${job.status} to ${status}` },
        { status: 400 }
      );
    }
    
    // Update job
    const updatedJob = await updateJobStatus(
      id,
      status as FieldJobStatus,
      location,
      notes
    );
    
    // If completing, update with photos and signature
    if (status === 'completed' && (completion_photos || customer_signature_url)) {
      const { data: finalJob, error: updateError } = await supabase
        .from('field_jobs')
        .update({
          completion_photos: completion_photos || [],
          customer_signature_url: customer_signature_url || null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('[Technician Job API] Error updating completion data:', updateError);
      } else {
        return NextResponse.json(finalJob);
      }
    }
    
    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('[Technician Job API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
