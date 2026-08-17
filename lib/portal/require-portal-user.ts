import { NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isUnjaniCorporateCode } from '@/lib/portal/paths';
import {
  can,
  isPortalRole,
  type PortalCapability,
  type PortalRole,
} from '@/lib/portal/access-templates';

export interface PortalUserRow {
  id: string;
  auth_user_id: string;
  organisation_id: string;
  site_id: string | null;
  role: PortalRole;
  display_name: string;
  email: string;
  organisation_name: string;
  organisation_code: string;
}

type PortalAuthSuccess = {
  ok: true;
  authUserId: string;
  portalUser: PortalUserRow;
  /** Service-role client for privileged writes after authz */
  adminDb: SupabaseClient;
  /** Session client (RLS) */
  sessionDb: SupabaseClient;
};

type PortalAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type PortalAuthResult = PortalAuthSuccess | PortalAuthFailure;

async function loadPortalUser(
  adminDb: SupabaseClient,
  authUserId: string
): Promise<PortalUserRow | null> {
  const { data, error } = await adminDb
    .from('b2b_portal_users')
    .select(`
      id,
      auth_user_id,
      organisation_id,
      site_id,
      role,
      display_name,
      email,
      corporate_accounts!inner (
        company_name,
        corporate_code
      )
    `)
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error || !data) return null;

  const org = data.corporate_accounts as unknown as {
    company_name: string;
    corporate_code: string;
  };

  return {
    id: data.id,
    auth_user_id: data.auth_user_id,
    organisation_id: data.organisation_id,
    site_id: data.site_id,
    role: isPortalRole(data.role) ? data.role : 'viewer',
    display_name: data.display_name,
    email: data.email,
    organisation_name: org?.company_name ?? '',
    organisation_code: org?.corporate_code ?? '',
  };
}

export async function requirePortalUser(): Promise<PortalAuthResult> {
  const sessionDb = await createClientWithSession();
  const {
    data: { user },
    error: authError,
  } = await sessionDb.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const adminDb = await createClient();
  const portalUser = await loadPortalUser(adminDb, user.id);

  if (!portalUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No portal access' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    authUserId: user.id,
    portalUser,
    adminDb,
    sessionDb,
  };
}

export async function requireUnjaniPortalUser(): Promise<PortalAuthResult> {
  const result = await requirePortalUser();
  if (!result.ok) return result;

  if (!isUnjaniCorporateCode(result.portalUser.organisation_code)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unjani Connect access required' },
        { status: 403 }
      ),
    };
  }

  return result;
}

/** Super User = DB role `admin` (max one per organisation). */
export async function requirePortalSuperUser(): Promise<PortalAuthResult> {
  const result = await requirePortalUser();
  if (!result.ok) return result;

  if (result.portalUser.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Super User access required' },
        { status: 403 }
      ),
    };
  }

  return result;
}

export async function requireUnjaniSuperUser(): Promise<PortalAuthResult> {
  const result = await requireUnjaniPortalUser();
  if (!result.ok) return result;

  if (result.portalUser.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Super User access required' },
        { status: 403 }
      ),
    };
  }

  return result;
}

export async function requirePortalCapability(
  capability: PortalCapability
): Promise<PortalAuthResult> {
  const result = await requirePortalUser();
  if (!result.ok) return result;

  if (!can(result.portalUser.role, capability)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return result;
}

export async function requireUnjaniCapability(
  capability: PortalCapability
): Promise<PortalAuthResult> {
  const result = await requireUnjaniPortalUser();
  if (!result.ok) return result;

  if (!can(result.portalUser.role, capability)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return result;
}
