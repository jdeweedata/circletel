import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission, type AdminUser } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { UNJANI_CORPORATE_CODE } from '@/lib/billing/unjani-connect-rules';

export async function requireUnjaniAdmin(request: NextRequest): Promise<
  | { ok: false; response: NextResponse }
  | {
      ok: true;
      adminUser: AdminUser;
      supabase: Awaited<ReturnType<typeof createClient>>;
      org: { id: string; company_name: string; corporate_code: string };
    }
> {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return { ok: false, response: auth.response };
  const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
  if (perm) return { ok: false, response: perm };

  const supabase = await createClient();
  const { data: org, error } = await supabase
    .from('corporate_accounts')
    .select('id, company_name, corporate_code')
    .eq('corporate_code', UNJANI_CORPORATE_CODE)
    .maybeSingle();

  if (error || !org) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unjani corporate account (UNJ) was not found' },
        { status: 404 }
      ),
    };
  }

  return { ok: true, adminUser: auth.adminUser, supabase, org };
}
