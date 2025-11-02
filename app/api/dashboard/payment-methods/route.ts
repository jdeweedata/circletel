/**
 * Customer Payment Methods API
 * GET /api/dashboard/payment-methods - List payment methods
 * POST /api/dashboard/payment-methods - Add new payment method
 * 
 * Task 2.6: Payment Method API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentMethodService } from '@/lib/billing/payment-method-service';
import type { PaymentMethodType } from '@/lib/billing/types';

/**
 * GET /api/dashboard/payment-methods
 * 
 * Returns list of customer's payment methods (masked details only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get customer_id from auth_user_id
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Get payment methods (masked)
    const methods = await PaymentMethodService.getPaymentMethods(customer.id);
    
    return NextResponse.json({
      payment_methods: methods
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/payment-methods
 * 
 * Add new payment method
 * 
 * Body:
 * {
 *   method_type: 'debit_order' | 'card' | 'eft',
 *   details: {
 *     // For debit_order:
 *     bank_name: string,
 *     account_number: string,
 *     account_type: 'cheque' | 'savings',
 *     branch_code: string,
 *     account_holder: string
 *     
 *     // For card:
 *     card_number: string,
 *     card_holder: string,
 *     expiry_month: string,
 *     expiry_year: string,
 *     card_type: 'visa' | 'mastercard' | 'amex'
 *   },
 *   is_primary: boolean (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get customer_id from auth_user_id
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { method_type, details, is_primary = false } = body;
    
    // Validate required fields
    if (!method_type || !details) {
      return NextResponse.json(
        { error: 'Missing required fields: method_type, details' },
        { status: 400 }
      );
    }
    
    // Validate method_type
    if (!['debit_order', 'card', 'eft'].includes(method_type)) {
      return NextResponse.json(
        { error: 'Invalid method_type. Must be: debit_order, card, or eft' },
        { status: 400 }
      );
    }
    
    // Validate details based on method_type
    if (method_type === 'debit_order') {
      const required = ['bank_name', 'account_number', 'account_type', 'branch_code', 'account_holder'];
      const missing = required.filter(field => !details[field]);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields for debit_order: ${missing.join(', ')}` },
          { status: 400 }
        );
      }
    } else if (method_type === 'card') {
      const required = ['card_number', 'card_holder', 'expiry_month', 'expiry_year', 'card_type'];
      const missing = required.filter(field => !details[field]);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields for card: ${missing.join(', ')}` },
          { status: 400 }
        );
      }
    }
    
    // Add payment method
    const paymentMethod = await PaymentMethodService.addPaymentMethod({
      customer_id: customer.id,
      method_type: method_type as PaymentMethodType,
      details,
      is_primary
    });
    
    return NextResponse.json({
      payment_method: paymentMethod,
      message: 'Payment method added successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add payment method' },
      { status: 500 }
    );
  }
}
