/**
 * Tarana Base Station Sync Cron Job
 *
 * Syncs base station data from Tarana Portal API to database.
 * Run daily at 2:00 AM SAST or on-demand via POST.
 *
 * POST /api/cron/tarana-sync
 * Body: { "dryRun": true } for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncBaseStations, SyncResult } from '@/lib/tarana/sync-service';
import { cronLogger } from '@/lib/logging';

// Verify cron secret for Vercel Cron
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest): Promise<NextResponse<SyncResult>> {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      cronLogger.warn('Tarana sync: unauthorized request');
      return NextResponse.json(
        {
          success: false,
          inserted: 0,
          updated: 0,
          deleted: 0,
          errors: ['Unauthorized'],
          duration: 0,
          syncedAt: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Parse options from body
    let dryRun = false;
    let deleteStale = false;

    try {
      const body = await request.json();
      dryRun = body.dryRun === true;
      deleteStale = body.deleteStale === true;
    } catch {
      // No body or invalid JSON, use defaults
    }

    cronLogger.info('Starting Tarana base station sync', { dryRun, deleteStale });

    const result = await syncBaseStations({ dryRun, deleteStale });

    if (result.success) {
      cronLogger.info('Tarana sync completed successfully', {
        inserted: result.inserted,
        updated: result.updated,
        deleted: result.deleted,
        duration: result.duration,
      });
    } else {
      cronLogger.error('Tarana sync completed with errors', {
        errors: result.errors,
        duration: result.duration,
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    cronLogger.error('Tarana sync failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: 0,
        syncedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET for health check
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/cron/tarana-sync',
    description: 'Tarana base station sync cron job',
    usage: 'POST with optional { "dryRun": true, "deleteStale": true }',
  });
}
