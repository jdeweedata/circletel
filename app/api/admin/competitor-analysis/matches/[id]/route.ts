/**
 * Single Product Match API
 *
 * GET /api/admin/competitor-analysis/matches/[id]
 * Returns a single match with full details.
 *
 * PATCH /api/admin/competitor-analysis/matches/[id]
 * Updates a match's confidence or notes.
 *
 * DELETE /api/admin/competitor-analysis/matches/[id]
 * Deletes a match.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('product_competitor_matches')
      .select(`
        *,
        competitor_products (
          *,
          competitor_providers (
            id,
            name,
            slug,
            logo_url,
            website
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    apiLogger.error('[Match API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    // Verify match exists
    const { data: existing, error: existError } = await supabase
      .from('product_competitor_matches')
      .select('id')
      .eq('id', id)
      .single();

    if (existError || !existing) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (body.match_confidence !== undefined) {
      if (body.match_confidence < 0 || body.match_confidence > 1) {
        return NextResponse.json(
          { error: 'match_confidence must be between 0 and 1' },
          { status: 400 }
        );
      }
      updates.match_confidence = body.match_confidence;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the match
    const { data, error } = await supabase
      .from('product_competitor_matches')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        competitor_products (
          id,
          product_name,
          monthly_price,
          competitor_providers (
            id,
            name,
            slug
          )
        )
      `)
      .single();

    if (error) {
      apiLogger.error('[Match API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update match' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    apiLogger.error('[Match API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify match exists
    const { data: existing, error: existError } = await supabase
      .from('product_competitor_matches')
      .select('id')
      .eq('id', id)
      .single();

    if (existError || !existing) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Delete the match
    const { error } = await supabase
      .from('product_competitor_matches')
      .delete()
      .eq('id', id);

    if (error) {
      apiLogger.error('[Match API] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete match' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Match deleted successfully',
    });
  } catch (error) {
    apiLogger.error('[Match API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    );
  }
}
