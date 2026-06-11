/**
 * Register-clinic API — creates a new Unjani clinic in the onboarding pipeline
 * from the network register (the "Start onboarding" button on the Register view).
 *
 * POST /api/admin/unjani/register-clinic
 * Body: {
 *   clinicName: string;       // register clinic name, e.g. "Elim"
 *   nurseName?: string;       // overrides the register contact
 *   phone?: string;           // overrides the register contact
 *   email?: string;           // overrides the register contact
 * }
 *
 * Creates:
 *  - customers row (next CT-2026-NNNNN, onboarding_status 'pending')
 *  - billing-safe customer_services row (status 'pending', active false,
 *    no activation date — cannot invoice until ops activates at install)
 *
 * The clinic then appears on the pipeline at "Awaiting invite".
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import { apiLogger } from '@/lib/logging/logger';
// Server-side only: nurse contact details must not ship in the client bundle
import registerContacts from '@/lib/data/unjani-register-contacts.json';

const UNJANI_PACKAGE_ID = 'f6828ecf-4a8d-42c0-9fd7-d7cac5c1537e'; // Unjani Managed Connectivity
const MONTHLY_PRICE = 450;
// Suffixes >= 9000 are reserved for test/training records (e.g. CT-2026-09999)
const RESERVED_SUFFIX_FLOOR = 9000;

interface RegisterContact {
  nurse: string | null;
  phone: string | null;
  email: string | null;
  province: string | null;
  area_type: string | null;
}

const CONTACTS = registerContacts as Record<string, RegisterContact>;

/** Next account number in the CT-YYYY-NNNNN sequence, skipping the reserved test range. */
async function nextAccountNumber(supabase: ReturnType<typeof svc>): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CT-${year}-`;
  const { data, error } = await supabase
    .from('customers')
    .select('account_number')
    .like('account_number', `${prefix}%`);
  if (error) throw new Error(`Failed to read account sequence: ${error.message}`);

  let max = 0;
  for (const row of data || []) {
    const m = (row.account_number as string).match(/^CT-\d{4}-(\d{5})$/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (n >= RESERVED_SUFFIX_FLOOR) continue;
    if (n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(5, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request);
    if (!auth.success) return auth.response;
    const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
    if (perm) return perm;

    const body = await request.json().catch(() => ({}));
    const clinicName: string = (body.clinicName || '').trim();
    if (!clinicName) {
      return NextResponse.json(
        { success: false, error: 'clinicName is required' },
        { status: 400 }
      );
    }

    const registerEntry = CONTACTS[clinicName.toLowerCase()] as RegisterContact | undefined;
    const nurseName: string = (body.nurseName || registerEntry?.nurse || '').trim();
    const phone: string = (body.phone || registerEntry?.phone || '').trim();
    const email: string = (body.email || registerEntry?.email || '').trim().toLowerCase();
    const province = registerEntry?.province || '';
    const areaType = registerEntry?.area_type || '';

    if (!phone || !email) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The register has no contact details for this clinic — please provide a phone number and email address.',
        },
        { status: 400 }
      );
    }

    const businessName = clinicName.toLowerCase().startsWith('unjani')
      ? clinicName
      : `Unjani Clinic - ${clinicName}`;

    const supabase = svc();

    // Duplicate guards: same clinic already in the pipeline, or email already taken
    const { data: existingByName } = await supabase
      .from('customers')
      .select('id, account_number')
      .ilike('business_name', businessName)
      .maybeSingle();
    if (existingByName) {
      return NextResponse.json(
        {
          success: false,
          error: `${businessName} is already in the pipeline (${existingByName.account_number}).`,
        },
        { status: 409 }
      );
    }
    const { data: existingByEmail } = await supabase
      .from('customers')
      .select('id, business_name')
      .ilike('email', email)
      .maybeSingle();
    if (existingByEmail) {
      return NextResponse.json(
        {
          success: false,
          error: `Email ${email} is already used by ${existingByEmail.business_name || 'another customer'}.`,
        },
        { status: 409 }
      );
    }

    const [firstName = 'Clinic', ...rest] = nurseName.split(/\s+/).filter(Boolean);
    const lastName = rest.join(' ') || 'Owner';

    const accountNumber = await nextAccountNumber(supabase);

    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .insert({
        account_number: accountNumber,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        account_type: 'business',
        status: 'pending',
        onboarding_status: 'pending',
        business_name: businessName,
        clinic_details: {
          clinic_name: clinicName,
          province,
          area_type: areaType,
          nurse_owner_name: nurseName || null,
        },
      })
      .select('id')
      .single();
    if (custErr || !customer) {
      apiLogger.error('[Register clinic] customer insert failed', { clinicName, error: custErr });
      return NextResponse.json(
        { success: false, error: custErr?.message || 'Failed to create customer' },
        { status: 500 }
      );
    }

    // Billing-safe service: pending + inactive + no activation date — cannot invoice
    const { error: svcErr } = await supabase.from('customer_services').insert({
      customer_id: customer.id,
      package_id: UNJANI_PACKAGE_ID,
      package_name: 'Unjani Managed Connectivity',
      service_type: 'fibre',
      product_category: 'corporate',
      monthly_price: MONTHLY_PRICE,
      setup_fee: 0,
      status: 'pending',
      active: false,
      installation_address: businessName,
      contract_months: 24,
      billing_day: 1,
    });
    if (svcErr) {
      // Roll back the customer so a retry isn't blocked by the duplicate guard
      await supabase.from('customers').delete().eq('id', customer.id);
      apiLogger.error('[Register clinic] service insert failed', { clinicName, error: svcErr });
      return NextResponse.json(
        { success: false, error: `Failed to create service: ${svcErr.message}` },
        { status: 500 }
      );
    }

    apiLogger.info('[Register clinic] Clinic created', {
      clinicName,
      accountNumber,
      customerId: customer.id,
      createdBy: auth.adminUser.email,
    });

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      accountNumber,
      businessName,
    });
  } catch (error: unknown) {
    apiLogger.error('[Register clinic] API error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
