import { NextRequest, NextResponse } from 'next/server';
import { requireUnjaniAdmin } from '@/lib/admin/require-unjani-admin';
import { getTechnicians, createFieldJob, getFieldJobs } from '@/lib/services/technician-service';
import { UNJANI_CONNECT_KIT } from '@/lib/admin/unjani-warehouse';
import { candidateVisitDays, installJobType, OPEN_FIELD_JOB_STATUSES } from '@/lib/admin/unjani-install-schedule';
import { toCalendarDate } from '@/lib/admin/unjani-warehouse';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUnjaniAdmin(request);
    if (!auth.ok) return auth.response;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fromDate = toCalendarDate(tomorrow);

    const [{ data: stock, error: stockError }, { data: orders, error: orderError }, { data: replenishments }] =
      await Promise.all([
        auth.supabase.from('warehouse_stock').select('sku, qty_on_hand, qty_reserved'),
        auth.supabase
          .from('unjani_install_orders')
          .select('*')
          .eq('organisation_id', auth.org.id)
          .order('ordered_at', { ascending: false }),
        auth.supabase
          .from('warehouse_replenishments')
          .select('*')
          .is('received_at', null)
          .order('due_at', { ascending: true }),
      ]);

    if (stockError) {
      return NextResponse.json({ error: stockError.message }, { status: 500 });
    }
    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const technicians = await getTechnicians();
    const jobs = await getFieldJobs({
      status: OPEN_FIELD_JOB_STATUSES,
      limit: 500,
    });

    const maxFulfil = (orders ?? []).reduce((max, order) => {
      const value = String(order.fulfil_by_max || '');
      return value > max ? value : max;
    }, fromDate);

    const visitDays = candidateVisitDays({ fromDate, fulfilByMax: maxFulfil || fromDate });

    return NextResponse.json({
      kit: UNJANI_CONNECT_KIT,
      stock: stock ?? [],
      replenishments: replenishments ?? [],
      orders: orders ?? [],
      technicians,
      jobs,
      visitDays,
    });
  } catch (error: unknown) {
    apiLogger.error('[Unjani fulfilment] GET failed', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
