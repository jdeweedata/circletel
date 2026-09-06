import { NextResponse } from 'next/server';
import { requirePortalCapability } from '@/lib/portal/require-portal-user';
import {
  buildPortalBillingSummary,
  invoiceBucket,
  splitLiveServices,
} from '@/lib/portal/billing-summary';

export async function GET() {
  const auth = await requirePortalCapability('billing.read');
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  const { data: invoices, error } = await adminDb
    .from('customer_invoices')
    .select(`
      id,
      invoice_number,
      invoice_date,
      due_date,
      period_start,
      period_end,
      subtotal,
      vat_rate,
      tax_amount,
      total_amount,
      amount_paid,
      amount_due,
      line_items,
      invoice_type,
      status,
      paid_at,
      customer_id,
      corporate_site_id
    `)
    .eq('corporate_account_id', portalUser.organisation_id)
    .order('invoice_date', { ascending: false });

  if (error) {
    console.error('[Portal /billing] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 });
  }

  const invoiceRows = invoices ?? [];
  const customerIds = [
    ...new Set(invoiceRows.map((inv) => inv.customer_id).filter((id): id is string => !!id)),
  ];

  const { data: invoiceCustomers } = customerIds.length
    ? await adminDb.from('customers').select('id, business_name').in('id', customerIds)
    : { data: [] as Array<{ id: string; business_name: string | null }> };

  const clinicByCustomer = new Map(
    (invoiceCustomers ?? []).map((row) => [row.id, row.business_name ?? ''])
  );

  const normalised = invoiceRows.map((inv) => ({
    ...inv,
    vat_amount: inv.tax_amount ?? 0,
    clinic_name: clinicByCustomer.get(inv.customer_id) || null,
    bucket: invoiceBucket(inv.status),
  }));

  const { data: sites } = await adminDb
    .from('corporate_sites')
    .select('id, site_name, monthly_fee, status')
    .eq('corporate_id', portalUser.organisation_id)
    .eq('status', 'active');

  const siteList = sites ?? [];
  const siteIds = siteList.map((site) => site.id);

  const { data: siteCustomers } = siteIds.length
    ? await adminDb
        .from('customers')
        .select('id, corporate_site_id, business_name')
        .in('corporate_site_id', siteIds)
    : { data: [] as Array<{ id: string; corporate_site_id: string | null; business_name: string | null }> };

  const siteCustomerIds = (siteCustomers ?? []).map((row) => row.id);
  const { data: siteServices } = siteCustomerIds.length
    ? await adminDb
        .from('customer_services')
        .select('customer_id, billing_start_date, status, active, monthly_price')
        .in('customer_id', siteCustomerIds)
    : {
        data: [] as Array<{
          customer_id: string;
          billing_start_date: string | null;
          status: string | null;
          active: boolean | null;
          monthly_price: number | string | null;
        }>,
      };

  const serviceByCustomer = new Map((siteServices ?? []).map((row) => [row.customer_id, row]));
  const siteById = new Map(siteList.map((site) => [site.id, site]));

  const liveServices = (siteCustomers ?? []).flatMap((customer) => {
    const service = serviceByCustomer.get(customer.id);
    const site = customer.corporate_site_id ? siteById.get(customer.corporate_site_id) : undefined;
    if (!service || !site) return [];
    return [
      {
        name: site.site_name || customer.business_name || 'Clinic',
        monthlyFee: Number(service.monthly_price ?? site.monthly_fee ?? 0),
        billingStartDate: service.billing_start_date,
        status: service.status,
        active: service.active,
        siteId: site.id,
        customerId: customer.id,
      },
    ];
  });

  const { billedNow, deferredLive, monthlySpend } = splitLiveServices(liveServices);
  const summary = buildPortalBillingSummary({
    invoices: normalised,
    billedNow,
  });

  return NextResponse.json({
    invoices: normalised,
    billedServices: billedNow,
    deferredLive,
    summary: {
      ...summary,
      monthlySpend,
    },
  });
}
