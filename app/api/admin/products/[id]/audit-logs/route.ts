import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

// GET /api/admin/products/[id]/audit-logs - Get audit trail for a product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action'); // Filter by action type (INSERT, UPDATE, DELETE)
    const field = searchParams.get('field'); // Filter by specific changed field

    // Build query
    let query = supabase
      .from('product_audit_logs')
      .select('*', { count: 'exact' })
      .eq('product_id', id)
      .order('changed_at', { ascending: false });

    // Apply filters
    if (action) {
      query = query.eq('action', action.toUpperCase());
    }

    if (field) {
      query = query.contains('changed_fields', [field]);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: auditLogs, error, count } = await query;

    if (error) {
      apiLogger.error('Error fetching audit logs', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    // Parse JSONB fields for easier frontend consumption
    const parsedLogs = auditLogs?.map(log => {
      const oldValues = log.old_values as Record<string, any> | null;
      const newValues = log.new_values as Record<string, any> | null;

      // Extract price-specific changes for easier display
      const priceChanges = {
        monthly_price: {
          old: oldValues?.monthly_price,
          new: newValues?.monthly_price,
          changed: log.changed_fields?.includes('monthly_price')
        },
        setup_fee: {
          old: oldValues?.setup_fee,
          new: newValues?.setup_fee,
          changed: log.changed_fields?.includes('setup_fee')
        }
      };

      return {
        ...log,
        old_values: oldValues,
        new_values: newValues,
        price_changes: priceChanges
      };
    });

    return NextResponse.json({
      success: true,
      data: parsedLogs,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error) {
    apiLogger.error('Error in GET /api/admin/products/[id]/audit-logs', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


// GET /api/admin/products/[id]/audit-logs/summary - Get summary of changes
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    // Get total number of changes
    const { count: totalChanges } = await supabase
      .from('product_audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    // Get price changes count
    const { count: priceChanges } = await supabase
      .from('product_audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id)
      .contains('changed_fields', ['monthly_price']);

    // Get last 5 updates with user info
    const { data: recentChanges } = await supabase
      .from('product_audit_logs')
      .select('changed_at, changed_by_name, changed_by_email, action, changed_fields')
      .eq('product_id', id)
      .order('changed_at', { ascending: false })
      .limit(5);

    // Get unique contributors
    const { data: contributors } = await supabase
      .from('product_audit_logs')
      .select('changed_by_email, changed_by_name')
      .eq('product_id', id)
      .not('changed_by_email', 'is', null);

    const uniqueContributors = contributors
      ? Array.from(
        new Map(
          contributors.map(c => [c.changed_by_email, c])
        ).values()
      )
      : [];

    // Get price change history for trend analysis
    const { data: priceHistory } = await supabase
      .from('product_price_changes')
      .select('*')
      .eq('product_id', id)
      .order('changed_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        total_changes: totalChanges || 0,
        price_changes: priceChanges || 0,
        recent_changes: recentChanges || [],
        contributors: uniqueContributors,
        price_history: priceHistory || []
      }
    });
  } catch (error) {
    apiLogger.error('Error in POST /api/admin/products/[id]/audit-logs/summary', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
