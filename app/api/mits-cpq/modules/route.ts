/**
 * MITS CPQ Modules API
 *
 * GET /api/mits-cpq/modules - Return active add-on modules from database
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch active modules ordered by sort_order
    const { data: modules, error } = await supabase
      .from('mits_module_catalogue')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[mits-cpq/modules] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch modules', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      modules: modules ?? [],
    });
  } catch (error) {
    console.error('[mits-cpq/modules] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
