/**
 * Public cold F1 send — MARKETING template with Flow button.
 *
 * POST /api/leads/whatsapp-f1
 * { phone, first_name?, entry_source?, source_campaign?, website? }
 *
 * Honeypot: `website` must be empty.
 * Rate limit: 5 requests / IP / hour (in-memory).
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendFlowTemplate } from '@/lib/integrations/whatsapp';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ENTRY_SOURCES = [
  'website',
  'qr',
  'manual',
  'ctwa_ad',
  'admin',
  'followup',
] as const;

type EntrySource = (typeof VALID_ENTRY_SOURCES)[number];

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return { allowed: true };
  }
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, resetTime: record.resetTime };
  }
  record.count += 1;
  return { allowed: true };
}

function isPlausiblePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // SA local 10 digits starting 0, or 27 + 9 digits
  if (digits.length === 10 && digits.startsWith('0')) return true;
  if (digits.length === 11 && digits.startsWith('27')) return true;
  if (digits.length >= 10 && digits.length <= 15) return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil(((rate.resetTime ?? Date.now()) - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      phone,
      first_name,
      entry_source = 'website',
      source_campaign,
      website,
    } = body as {
      phone?: string;
      first_name?: string;
      entry_source?: string;
      source_campaign?: string;
      website?: string;
    };

    // Honeypot — bots fill hidden fields
    if (website && String(website).trim() !== '') {
      apiLogger.info('[Public F1] Honeypot tripped', { ip });
      return NextResponse.json({ success: true, message: 'ok' });
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp number is required' },
        { status: 400 }
      );
    }

    if (!isPlausiblePhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid South African mobile number' },
        { status: 400 }
      );
    }

    if (
      !VALID_ENTRY_SOURCES.includes(entry_source as EntrySource)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry source' },
        { status: 400 }
      );
    }

    const firstName =
      typeof first_name === 'string' && first_name.trim()
        ? first_name.trim().slice(0, 40)
        : undefined;

    const campaign =
      typeof source_campaign === 'string' && source_campaign.trim()
        ? source_campaign.trim().slice(0, 120)
        : `public-${entry_source}`;

    apiLogger.info('[Public F1] Cold template send', {
      entrySource: entry_source,
      campaign,
      ip,
    });

    const result = await sendFlowTemplate({
      to: phone.trim(),
      customerName: firstName,
      entrySource: entry_source,
      sourceCampaign: campaign,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message:
          'Check WhatsApp for a message from CircleTel and tap Get started.',
        // Do not expose full session internals to anonymous clients
      });
    }

    apiLogger.error('[Public F1] Send failed', {
      error: result.error,
      errorCode: result.errorCode,
    });

    // Generic client message — avoid leaking Meta/internal errors
    const isConfig =
      result.error?.includes('not configured') ||
      result.error?.includes('Supabase');

    return NextResponse.json(
      {
        success: false,
        error: isConfig
          ? 'Service temporarily unavailable. Please try again shortly.'
          : result.error || 'Could not send WhatsApp form. Please try again.',
      },
      { status: isConfig ? 503 : 502 }
    );
  } catch (error) {
    apiLogger.error('[Public F1] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
