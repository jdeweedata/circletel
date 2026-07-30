/**
 * DEPRECATED (Phase 1b sole-generate authority).
 *
 * Recurring generation is only via:
 *   POST /api/cron/generate-monthly-invoices → billingEngine.generateRecurring
 *
 * Removed from vercel.json schedules. Returns 410 so accidental crontab hits fail loudly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cronLogger } from '@/lib/logging';

const DEPRECATION = {
  success: false,
  error: 'gone',
  message:
    'This cron is disabled. Use POST /api/cron/generate-monthly-invoices (billingEngine.generateRecurring).',
  replacement: '/api/cron/generate-monthly-invoices',
};

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  cronLogger.warn('Deprecated generate-invoices cron invoked — returning 410');
  return NextResponse.json(DEPRECATION, { status: 410 });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
