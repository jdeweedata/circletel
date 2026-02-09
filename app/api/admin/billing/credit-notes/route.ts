/**
 * Credit Notes API
 * POST /api/admin/billing/credit-notes - Create credit note
 * GET /api/admin/billing/credit-notes - List credit notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { CompliantBillingService, CreditNoteReason } from '@/lib/billing/compliant-billing-service';
import { apiLogger } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      original_invoice_id,
      line_items,
      reason,
      reason_category,
      notes,
      auto_apply = false
    } = body;

    // Validate required fields
    if (!original_invoice_id || !line_items || !reason || !reason_category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: original_invoice_id, line_items, reason, reason_category' },
        { status: 400 }
      );
    }

    // Validate reason_category
    const validCategories: CreditNoteReason[] = [
      'billing_error', 'service_issue', 'cancellation', 
      'price_adjustment', 'duplicate', 'other'
    ];
    if (!validCategories.includes(reason_category)) {
      return NextResponse.json(
        { success: false, error: `Invalid reason_category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Authenticate
    const sessionClient = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const supabase = await createClient();
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Create credit note
    const creditNote = await CompliantBillingService.createCreditNote(
      {
        original_invoice_id,
        line_items,
        reason,
        reason_category,
        notes,
        auto_apply
      },
      {
        user_id: user.id,
        user_email: user.email || undefined,
        user_role: adminUser.role,
        reason
      }
    );

    // Log admin action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_user_id: adminUser.id,
        action: 'create_credit_note',
        resource_type: 'credit_note',
        resource_id: creditNote.id,
        details: {
          credit_note_number: creditNote.credit_note_number,
          original_invoice_id,
          total_amount: creditNote.total_amount,
          reason_category,
          auto_applied: auto_apply
        }
      });

    return NextResponse.json({
      success: true,
      message: auto_apply ? 'Credit note created and applied' : 'Credit note created',
      credit_note: creditNote
    });

  } catch (error: any) {
    apiLogger.error('Create credit note failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create credit note' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const invoiceId = searchParams.get('invoice_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Authenticate
    const sessionClient = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const supabase = await createClient();
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('credit_notes')
      .select(`
        *,
        customer:customers(id, first_name, last_name, email, account_number),
        original_invoice:customer_invoices(id, invoice_number, total_amount)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (invoiceId) {
      query = query.eq('original_invoice_id', invoiceId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: creditNotes, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      credit_notes: creditNotes,
      total: count,
      limit,
      offset
    });

  } catch (error: any) {
    apiLogger.error('List credit notes failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list credit notes' },
      { status: 500 }
    );
  }
}
