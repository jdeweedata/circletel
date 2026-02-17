/**
 * Update service billing settings (billing_day)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id: customerId, serviceId } = await context.params;
    const body = await request.json();
    const { billing_day } = body;

    // Validate billing_day
    if (billing_day !== undefined) {
      const day = parseInt(billing_day);
      if (isNaN(day) || day < 1 || day > 28) {
        return NextResponse.json(
          { error: 'billing_day must be between 1 and 28' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Verify service belongs to customer
    const { data: service, error: verifyError } = await supabase
      .from('customer_services')
      .select('id')
      .eq('id', serviceId)
      .eq('customer_id', customerId)
      .single();

    if (verifyError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Update billing_day
    const { data: updated, error: updateError } = await supabase
      .from('customer_services')
      .update({ billing_day: parseInt(billing_day) })
      .eq('id', serviceId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ service: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
