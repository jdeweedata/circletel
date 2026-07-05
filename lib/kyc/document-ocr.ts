import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getMistralOcrModel,
  processDocumentWithMistralOcr,
  type MistralOcrRunResult,
} from '@/lib/integrations/mistral/ocr';
import { apiLogger } from '@/lib/logging/logger';

export type KycDocumentOcrStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'skipped';

export interface KycDocumentOcrSummary {
  id?: string;
  status: KycDocumentOcrStatus;
  model: string | null;
  markdown: string | null;
  markdownExcerpt: string | null;
  pages: unknown;
  blocks: unknown;
  confidence: unknown;
  usageInfo: unknown;
  errorMessage: string | null;
  processedAt: string | null;
}

export async function enrichKycDocumentWithOcr({
  supabase,
  documentId,
  file,
}: {
  supabase: SupabaseClient;
  documentId: string;
  file: File;
}): Promise<MistralOcrRunResult> {
  const model = getMistralOcrModel();

  try {
    await persistOcrRow(supabase, {
      kyc_document_id: documentId,
      status: 'processing',
      model,
      error_message: null,
      updated_at: new Date().toISOString(),
    });

    const result = await processDocumentWithMistralOcr(file);
    await persistOcrRunResult(supabase, documentId, result);

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to persist OCR result';
    apiLogger.error('[KYC OCR] enrichment failed', { documentId, status: 'failed', errorMessage });

    const failedResult: MistralOcrRunResult = {
      status: 'failed',
      model,
      errorMessage,
    };
    await persistOcrRunResult(supabase, documentId, failedResult).catch(() => undefined);
    return failedResult;
  }
}

export async function getOcrResultsByDocumentIds(
  supabase: SupabaseClient,
  documentIds: string[]
): Promise<Map<string, KycDocumentOcrSummary>> {
  if (documentIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('kyc_document_ocr_results')
    .select(
      'id, kyc_document_id, status, model, markdown, pages, blocks, confidence, usage_info, error_message, processed_at'
    )
    .in('kyc_document_id', documentIds);

  if (error || !data) {
    apiLogger.error('[KYC OCR] failed to fetch OCR results', { error });
    return new Map();
  }

  return new Map(
    data.map((row: any) => [
      row.kyc_document_id,
      {
        id: row.id,
        status: row.status,
        model: row.model,
        markdown: row.markdown,
        markdownExcerpt: buildMarkdownExcerpt(row.markdown),
        pages: row.pages,
        blocks: row.blocks,
        confidence: row.confidence,
        usageInfo: row.usage_info,
        errorMessage: row.error_message,
        processedAt: row.processed_at,
      },
    ])
  );
}

async function persistOcrRunResult(
  supabase: SupabaseClient,
  documentId: string,
  result: MistralOcrRunResult
) {
  const now = new Date().toISOString();

  if (result.status === 'succeeded') {
    await persistOcrRow(supabase, {
      kyc_document_id: documentId,
      status: 'succeeded',
      model: result.model,
      markdown: result.markdown,
      pages: result.pages,
      blocks: result.blocks,
      confidence: result.confidence,
      usage_info: result.usageInfo,
      error_message: null,
      processed_at: now,
      updated_at: now,
    });
    return;
  }

  await persistOcrRow(supabase, {
    kyc_document_id: documentId,
    status: result.status,
    model: result.model,
    markdown: null,
    pages: null,
    blocks: null,
    confidence: null,
    usage_info: null,
    error_message: result.errorMessage,
    processed_at: now,
    updated_at: now,
  });
}

async function persistOcrRow(supabase: SupabaseClient, row: Record<string, unknown>) {
  const { error } = await supabase
    .from('kyc_document_ocr_results')
    .upsert(row, { onConflict: 'kyc_document_id' });

  if (error) throw new Error(error.message);
}

function buildMarkdownExcerpt(markdown: string | null) {
  if (!markdown) return null;
  const compact = markdown.replace(/\s+/g, ' ').trim();
  return compact.length > 500 ? `${compact.slice(0, 497)}...` : compact;
}
