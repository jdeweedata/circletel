/**
 * Retain Mandate PDF (W4.1 — compliance)
 *
 * Downloads a signed NetCash mandate PDF and stores our own durable copy in Supabase storage.
 * NetCash-hosted links can expire, and PASA requires debit-order mandates to be retained for
 * 5 years — so we keep the authoritative copy ourselves.
 *
 * Returns the stored path prefixed with the bucket name (matching the `getSignedPdfUrl()`
 * convention in the admin payment-method routes), or null on failure (non-fatal — the mandate
 * still activates; retention is best-effort and logged).
 *
 * @module lib/payments/retain-mandate-pdf
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { webhookLogger } from '@/lib/logging';

const BUCKET = 'mandate-documents';

export async function retainMandatePdf(
  supabase: SupabaseClient,
  params: { customerId: string; mandateRef: string; pdfLink?: string | null }
): Promise<string | null> {
  const { customerId, mandateRef, pdfLink } = params;
  if (!pdfLink) return null;

  try {
    const res = await fetch(pdfLink);
    if (!res.ok) {
      webhookLogger.error('Mandate PDF download failed', { status: res.status, mandateRef });
      return null;
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    const safeRef = mandateRef.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${customerId}/${safeRef}.pdf`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: 'application/pdf', upsert: true });

    if (error) {
      webhookLogger.error('Mandate PDF upload failed', { error: error.message, mandateRef });
      return null;
    }

    // Prefixed with the bucket name to match getSignedPdfUrl() handling in the admin routes.
    return `${BUCKET}/${storagePath}`;
  } catch (e) {
    webhookLogger.error('Mandate PDF retention error', {
      error: e instanceof Error ? e.message : String(e),
      mandateRef,
    });
    return null;
  }
}
