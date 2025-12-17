/**
 * Admin Field Jobs API
 * GET - List all jobs with filters
 * POST - Create new job
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { getFieldJobs, createFieldJob } from '@/lib/services/technician-service';
import { CreateFieldJobInput, FieldJobStatus } from '@/lib/types/technician-tracking';

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin (checks Authorization header first, then cookies)
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as FieldJobStatus | null;
    const technician_id = searchParams.get('technician_id');
    const scheduled_date = searchParams.get('scheduled_date');
    const limit = searchParams.get('limit');

    const jobs = await getFieldJobs({
      status: status || undefined,
      technician_id: technician_id || undefined,
      scheduled_date: scheduled_date || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('[Admin Jobs API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin (checks Authorization header first, then cookies)
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const body: CreateFieldJobInput = await request.json();

    // Validate required fields
    if (!body.job_type || !body.title || !body.address) {
      return NextResponse.json(
        { error: 'Job type, title, and address are required' },
        { status: 400 }
      );
    }

    const job = await createFieldJob(body);

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('[Admin Jobs API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
