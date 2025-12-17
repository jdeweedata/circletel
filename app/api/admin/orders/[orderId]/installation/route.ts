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

    // Fetch installation task (without technician join - no FK relationship exists)
    const { data: task, error } = await supabase
      .from('installation_tasks')
      .select('*')
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

    // Fetch technician separately if technician_id exists
    let technician = null;
    if (task.technician_id) {
      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .select('id, first_name, last_name, email, phone')
        .eq('id', task.technician_id)
        .single();

      if (!techError && techData) {
        technician = {
          id: techData.id,
          name: `${techData.first_name || ''} ${techData.last_name || ''}`.trim(),
          email: techData.email,
          phone: techData.phone,
        };
      }
    }

    // Build transformed task
    const transformedTask = {
      ...task,
      technician,
    };

    return NextResponse.json({
      success: true,
      data: transformedTask,
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
