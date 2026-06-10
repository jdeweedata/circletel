/**
 * Admin Service Package Change API
 *
 * GET  /api/admin/customers/[id]/services/change-package
 *      List active packages the service can be changed to.
 *
 * POST /api/admin/customers/[id]/services/change-package
 *      Change a customer service to a different package. Updates the
 *      denormalized package fields on customer_services and writes an
 *      upgrade/downgrade entry to service_action_log. Billing follows the
 *      new monthly_price from the next generated invoice (no mid-cycle
 *      pro-rata adjustment).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    await context.params;
    const supabase = await createClient();

    const { data: packages, error } = await supabase
      .from('service_packages')
      .select('id, name, service_type, speed_down, speed_up, price, customer_type')
      .eq('active', true)
      .eq('status', 'active')
      .order('price', { ascending: true });

    if (error) {
      console.error('[Change Package] Package list failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load packages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, packages: packages || [] });
  } catch (error) {
    console.error('[Change Package] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id: customerId } = await context.params;
    const { user } = authResult;
    const body = await request.json();
    const { service_id, new_package_id, reason, notes } = body;

    if (!service_id || !new_package_id || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: service_id, new_package_id, reason' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify service belongs to this customer
    const { data: service, error: serviceError } = await supabase
      .from('customer_services')
      .select('*')
      .eq('id', service_id)
      .single();

    if (serviceError || !service || service.customer_id !== customerId) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.status !== 'active') {
      return NextResponse.json(
        { error: `Only active services can change package (current status: ${service.status})` },
        { status: 400 }
      );
    }

    if (service.package_id === new_package_id) {
      return NextResponse.json(
        { error: 'Service is already on this package' },
        { status: 400 }
      );
    }

    // Fetch and validate the target package
    const { data: newPackage, error: packageError } = await supabase
      .from('service_packages')
      .select('id, name, service_type, speed_down, speed_up, price, active, status')
      .eq('id', new_package_id)
      .single();

    if (packageError || !newPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    if (!newPackage.active || newPackage.status !== 'active') {
      return NextResponse.json(
        { error: 'Package is not available for new subscriptions' },
        { status: 400 }
      );
    }

    const previousPrice = Number(service.monthly_price) || 0;
    const newPrice = Number(newPackage.price) || 0;
    const actionType =
      newPrice > previousPrice ? 'upgrade' : newPrice < previousPrice ? 'downgrade' : 'edit';

    // Apply the change — keep denormalized package fields in sync
    const { data: updatedService, error: updateError } = await supabase
      .from('customer_services')
      .update({
        package_id: newPackage.id,
        package_name: newPackage.name,
        service_type: newPackage.service_type,
        monthly_price: newPackage.price,
        speed_down: newPackage.speed_down,
        speed_up: newPackage.speed_up,
        updated_at: new Date().toISOString(),
      })
      .eq('id', service_id)
      .select('*')
      .single();

    if (updateError || !updatedService) {
      console.error('[Change Package] Update failed:', updateError);
      return NextResponse.json(
        { error: 'Failed to change package' },
        { status: 500 }
      );
    }

    // Audit log (same table/shape as ServiceManager lifecycle actions)
    const { data: auditLog, error: auditError } = await supabase
      .from('service_action_log')
      .insert({
        service_id,
        customer_id: customerId,
        admin_user_id: user?.id,
        action_type: actionType,
        reason,
        notes,
        previous_status: service.status,
        new_status: updatedService.status,
        previous_data: service,
        new_data: updatedService,
      })
      .select('id')
      .single();

    if (auditError) {
      console.error('[Change Package] Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: `Package changed from ${service.package_name} to ${newPackage.name}`,
      action_type: actionType,
      service: updatedService,
      previous: { package_name: service.package_name, monthly_price: previousPrice },
      new: { package_name: newPackage.name, monthly_price: newPrice },
      billing_note: 'New price applies from the next generated invoice',
      audit_log_id: auditLog?.id,
    });
  } catch (error) {
    console.error('[Change Package] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
