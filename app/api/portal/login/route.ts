import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@/lib/supabase/server';

/**
 * Business portal login — sets SSR auth cookies so middleware can authorize
 * /portal/* and /unjani/*. Browser CustomerAuth uses localStorage; portal
 * middleware reads cookies only.
 */
export async function POST(request: NextRequest) {
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options?: CookieOptions;
  }> = [];

  try {
    const body = await request.json();
    const email =
      typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookiesToSet.push(...cookies);
          },
        },
      }
    );

    const { data: authData, error: authError } =
      await supabaseSSR.auth.signInWithPassword({ email, password });

    if (authError || !authData.user || !authData.session) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const adminDb = await createClient();
    const { data: portalUser, error: portalError } = await adminDb
      .from('b2b_portal_users')
      .select('id, role, organisation_id, display_name, email')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (portalError || !portalUser) {
      await supabaseSSR.auth.signOut();
      return NextResponse.json(
        {
          success: false,
          error:
            'No business portal access for this account. Ask your Super User to invite you.',
        },
        { status: 403 }
      );
    }

    const { data: org } = await adminDb
      .from('corporate_accounts')
      .select('corporate_code')
      .eq('id', portalUser.organisation_id)
      .maybeSingle();

    const organisationCode = org?.corporate_code ?? '';

    const successResponse = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      portalUser: {
        id: portalUser.id,
        role: portalUser.role,
        organisation_id: portalUser.organisation_id,
        display_name: portalUser.display_name,
        organisation_code: organisationCode,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      },
    });

    cookiesToSet.forEach(({ name, value, options }) => {
      successResponse.cookies.set(name, value, options);
    });

    return successResponse;
  } catch (error) {
    console.error('[Portal login]', error);
    return NextResponse.json(
      { success: false, error: 'Sign in failed. Please try again.' },
      { status: 500 }
    );
  }
}
