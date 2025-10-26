import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 Supabase Connection Test');
  console.log('URL:', supabaseUrl);
  console.log('Key exists:', !!supabaseKey);
  console.log('Key prefix:', supabaseKey?.substring(0, 20));

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      success: false,
      error: 'Missing credentials',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    }, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Test simple query
    const { data, error } = await supabase
      .from('coverage_leads')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase query error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        url: supabaseUrl.substring(0, 40)
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      url: supabaseUrl.substring(0, 40),
      recordCount: data?.length || 0
    });

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
}
