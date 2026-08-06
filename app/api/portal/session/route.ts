import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@/lib/supabase/server';

/**
 * Sync an existing browser (localStorage) session into SSR cookies
 * so /portal middleware can authorize the user.
 */
export async function POST(request: NextRequest) {
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options?: CookieOptions;
  }> = [];

  try {
    const body = await request.json();
    const access_token =
      typeof body.access_token === 'string' ? body.access_token : '';
    const refresh_token =
      typeof body.refresh_token === 'string' ? body.refresh_token : '';

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { success: false, error: 'Missing session tokens' },
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

    const { data, error } = await supabaseSSR.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const adminDb = await createClient();
    const { data: portalUser } = await adminDb
      .from('b2b_portal_users')
      .select('id')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    if (!portalUser) {
      await supabaseSSR.auth.signOut();
      return NextResponse.json(
        { success: false, error: 'No portal access' },
        { status: 403 }
      );
    }

    const res = NextResponse.json({ success: true });
    cookiesToSet.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  } catch (error) {
    console.error('[Portal session sync]', error);
    return NextResponse.json(
      { success: false, error: 'Session sync failed' },
      { status: 500 }
    );
  }
}
