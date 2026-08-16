import { NextRequest, NextResponse } from 'next/server';
import { requireUnjaniAdmin } from '@/lib/admin/require-unjani-admin';
import { placeUnjaniInstallOrder } from '@/lib/admin/unjani-install-orders';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUnjaniAdmin(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await auth.supabase
      .from('unjani_install_orders')
      .select('*')
      .eq('organisation_id', auth.org.id)
      .order('ordered_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ orders: data ?? [] });
  } catch (error: unknown) {
    apiLogger.error('[Unjani install-orders] GET failed', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUnjaniAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const coverageCheckId = String(body.coverage_check_id || '');
    if (!coverageCheckId) {
      return NextResponse.json({ error: 'coverage_check_id is required' }, { status: 400 });
    }

    const { order, created } = await placeUnjaniInstallOrder(auth.supabase, {
      organisationId: auth.org.id,
      coverageCheckId,
      clinicName: String(body.clinic_name || ''),
      address: String(body.address || ''),
      contactName: typeof body.contact_name === 'string' ? body.contact_name : undefined,
      contactMobile: typeof body.contact_mobile === 'string' ? body.contact_mobile : undefined,
      contactEmail: typeof body.contact_email === 'string' ? body.contact_email : undefined,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
      createdBy: auth.adminUser.id,
    });

    return NextResponse.json(
      { order, created },
      { status: created ? 201 : 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = /not found|coverage is not confirmed|only when coverage/i.test(message)
      ? 400
      : 500;
    apiLogger.error('[Unjani install-orders] POST failed', { error });
    return NextResponse.json({ error: message }, { status });
  }
}
