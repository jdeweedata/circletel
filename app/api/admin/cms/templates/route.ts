/**
 * CMS Templates API
 *
 * GET /api/admin/cms/templates - List all templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET - List templates
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user using proper admin auth
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabase = await createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Build query
    // Note: Using created_at for ordering since sort_order column may not exist yet
    let query = supabase
      .from('pb_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Failed to fetch templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
    });
  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
