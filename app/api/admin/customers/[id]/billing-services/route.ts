/**
 * Get customer services with billing information
 * Returns services with billing_day, last_invoice_date, and recent invoices
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await context.params;
    const supabase = await createClient();

    // Get customer services with package info
    const { data: services, error: servicesError } = await supabase
      .from('customer_services')
      .select(`
        id,
        customer_id,
        package_id,
        status,
        monthly_price,
        billing_day,
        last_invoice_date,
        created_at,
        package:service_packages(
          id,
          name,
          description,
          price
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (servicesError) {
      return NextResponse.json({ error: servicesError.message }, { status: 500 });
    }

    // Get recent invoices for this customer
    const { data: invoices, error: invoicesError } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, total_amount, status, invoice_date, due_date, service_id, paynow_url')
      .eq('customer_id', customerId)
      .order('invoice_date', { ascending: false })
      .limit(10);

    if (invoicesError) {
      return NextResponse.json({ error: invoicesError.message }, { status: 500 });
    }

    // Handle Supabase join returning arrays
    const formattedServices = (services || []).map(service => ({
      ...service,
      package: Array.isArray(service.package) ? service.package[0] : service.package,
    }));

    return NextResponse.json({
      services: formattedServices,
      invoices: invoices || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
