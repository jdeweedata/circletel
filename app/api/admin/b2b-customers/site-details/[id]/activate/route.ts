import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['ready', 'provisioned'],
  ready: ['provisioned'],
  provisioned: ['active'],
  active: ['suspended', 'decommissioned'],
  suspended: ['active'],
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: siteId } = await context.params;

  const sessionClient = await createClientWithSession();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, is_active')
    .eq('id', user.id)
    .single();

  if (!adminUser || !adminUser.is_active) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { status, technology, package_id, monthly_fee, wholesale_order_ref, installed_at, installed_by, notes } = body;

  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const { data: site, error: fetchError } = await supabase
    .from('corporate_sites')
    .select('id, site_name, status, corporate_id, service_id, package_id, monthly_fee')
    .eq('id', siteId)
    .single();

  if (fetchError || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[site.status];
  if (!allowed || !allowed.includes(status)) {
    return NextResponse.json(
      { error: `Invalid transition: ${site.status} → ${status}` },
      { status: 400 }
    );
  }

  const updateFields: Record<string, unknown> = { status };
  if (technology !== undefined) updateFields.technology = technology;
  if (package_id !== undefined) updateFields.package_id = package_id;
  if (monthly_fee !== undefined) updateFields.monthly_fee = monthly_fee;
  if (wholesale_order_ref !== undefined) updateFields.wholesale_order_ref = wholesale_order_ref;
  if (installed_at !== undefined) updateFields.installed_at = installed_at;
  if (installed_by !== undefined) updateFields.installed_by = installed_by;
  if (status === 'active' && !installed_at) {
    updateFields.installed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('corporate_sites')
    .update(updateFields)
    .eq('id', siteId);

  if (updateError) {
    console.error('[Admin Activate Site] Update error:', updateError.message);
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
  }

  await supabase.from('corporate_site_events').insert({
    site_id: siteId,
    event_type: `status_change:${site.status}→${status}`,
    old_value: { status: site.status },
    new_value: { status, ...updateFields },
    performed_by: user.id,
    notes: notes || null,
  });

  if (status === 'active') {
    const resolvedFee = monthly_fee ?? site.monthly_fee;
    const resolvedPackageId = package_id ?? site.package_id;

    await inngest.send({
      name: 'b2b/site.activated',
      data: {
        site_id: siteId,
        organisation_id: site.corporate_id,
        activated_at: new Date().toISOString(),
        activated_by: user.id,
        package_id: resolvedPackageId,
        monthly_fee: resolvedFee,
        service_id: site.service_id,
      },
    });
  }

  return NextResponse.json({ success: true, status });
}
