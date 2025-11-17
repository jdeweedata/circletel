import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/orders/[orderId]/installation
 * Returns installation task details for an order
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch installation task with technician details
    const { data: task, error } = await supabase
      .from('installation_tasks')
      .select(`
        *,
        technician:technicians(
          id,
          name,
          email,
          phone
        )
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching installation task:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch installation details',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // No installation task found is okay - return 404
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'No installation task found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error('Error fetching installation task:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
