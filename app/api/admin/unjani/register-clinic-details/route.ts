/**
 * GET /api/admin/unjani/register-clinic-details?name=<clinicName>
 *
 * Returns the normalized drawer shape for a NOT-yet-onboarded register clinic:
 * public register fields merged with the server-only contact (nurse/phone/email/
 * address). Also reports whether the clinic already exists in the pipeline so the
 * UI can route to pipeline mode. Keeps the contacts file server-side.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import {
  registerEntryForClinic,
  incumbentForClinic,
  normClinicName,
} from '@/lib/onboarding/clinic-incumbent';
import registerContacts from '@/lib/data/unjani-register-contacts.json';

interface RegisterContact {
  nurse: string | null;
  phone: string | null;
  email: string | null;
  province: string | null;
  area_type: string | null;
  address: string | null;
}
const CONTACTS = registerContacts as Record<string, RegisterContact>;

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
  if (perm) return perm;

  const name = request.nextUrl.searchParams.get('name')?.trim();
  if (!name) {
    return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
  }

  const entry = registerEntryForClinic(name);
  if (!entry) {
    return NextResponse.json({ success: false, error: 'Clinic not found in register' }, { status: 404 });
  }
  const contact = CONTACTS[normClinicName(name)];
  const inc = incumbentForClinic(name);

  const businessName = name.toLowerCase().startsWith('unjani') ? name : `Unjani Clinic - ${name}`;
  const supabase = svc();
  const { data: existing } = await supabase
    .from('customers')
    .select('id, account_number')
    .ilike('business_name', businessName)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    alreadyInPipeline: !!existing,
    accountNumber: existing?.account_number ?? null,
    clinic: {
      registerName: entry.name,
      businessName,
      nurseName: contact?.nurse ?? entry.nurse ?? null,
      phone: contact?.phone ?? null,
      email: contact?.email ?? null,
      province: contact?.province ?? entry.province ?? null,
      siteAddress: contact?.address ?? null,
      incumbentIsp: inc.incumbent_isp,
      incumbentCost: inc.incumbent_cost,
      contractStatus: inc.contract_status,
      savingPerMonth: entry.saving ?? null,
    },
  });
}
