import 'server-only';

import type { OCRResponse } from '@mistralai/mistralai/models/components/ocrresponse';

export const MISTRAL_OCR_DEFAULT_MODEL = 'mistral-ocr-4-0';

export interface NormalizedOcrPage {
  index: number;
  markdown: string;
  confidence: Record<string, unknown> | null;
  blockCount: number;
}

export interface NormalizedOcrBlock {
  pageIndex: number;
  type: string;
  content: string;
  bbox: unknown;
}

export interface NormalizedMistralOcrResult {
  model: string;
  markdown: string;
  pages: NormalizedOcrPage[];
  blocks: NormalizedOcrBlock[];
  confidence: Record<string, unknown> | null;
  usageInfo: Record<string, unknown>;
}

export type MistralOcrRunResult =
  | ({ status: 'succeeded' } & NormalizedMistralOcrResult)
  | {
      status: 'skipped' | 'failed';
      model: string;
      errorMessage: string;
    };

export function getMistralOcrModel() {
  return process.env.MISTRAL_OCR_MODEL?.trim() || MISTRAL_OCR_DEFAULT_MODEL;
}

export function isMistralOcrEnabled() {
  return process.env.MISTRAL_OCR_ENABLED === 'true' && Boolean(process.env.MISTRAL_API_KEY);
}

export function normalizeMistralOcrResponse(
  response: OCRResponse
): NormalizedMistralOcrResult {
  const pages = response.pages.map((page) => ({
    index: page.index,
    markdown: page.markdown,
    confidence: page.confidenceScores ? { ...page.confidenceScores } : null,
    blockCount: page.blocks?.length ?? 0,
  }));

  const blocks = response.pages.flatMap((page) =>
    (page.blocks ?? []).map((block) => {
      const record = block as Record<string, unknown>;
      return {
        pageIndex: page.index,
        type: typeof record.type === 'string' ? record.type : 'unknown',
        content: blockContent(record),
        bbox: record.bbox ?? null,
      };
    })
  );

  return {
    model: response.model,
    markdown: response.pages.map((page) => page.markdown).filter(Boolean).join('\n\n'),
    pages,
    blocks,
    confidence: summarizePageConfidence(pages),
    usageInfo: { ...response.usageInfo },
  };
}

export async function processDocumentWithMistralOcr(
  file: File,
  options?: { model?: string; apiKey?: string }
): Promise<MistralOcrRunResult> {
  const model = options?.model || getMistralOcrModel();
  const apiKey = options?.apiKey || process.env.MISTRAL_API_KEY;

  if (!isMistralOcrEnabled() || !apiKey) {
    return {
      status: 'skipped',
      model,
      errorMessage: 'Mistral OCR is disabled or missing MISTRAL_API_KEY',
    };
  }

  const { Mistral } = await import('@mistralai/mistralai');
  const client = new Mistral({ apiKey });
  let mistralFileId: string | null = null;

  try {
    const uploaded = await client.files.upload({
      file,
      purpose: 'ocr',
      visibility: 'workspace',
    });
    mistralFileId = uploaded.id;

    const response = await client.ocr.process({
      model,
      document: { type: 'file', fileId: uploaded.id },
      includeBlocks: true,
      confidenceScoresGranularity: 'page',
      tableFormat: 'markdown',
      extractHeader: true,
      extractFooter: true,
    });

    return {
      status: 'succeeded',
      ...normalizeMistralOcrResponse(response),
    };
  } catch (error) {
    return {
      status: 'failed',
      model,
      errorMessage: error instanceof Error ? error.message : 'Mistral OCR failed',
    };
  } finally {
    if (mistralFileId) {
      await client.files.delete({ fileId: mistralFileId }).catch(() => undefined);
    }
  }
}

function blockContent(block: Record<string, unknown>) {
  for (const key of ['content', 'text', 'markdown']) {
    const value = block[key];
    if (typeof value === 'string') return value;
  }
  return '';
}

function summarizePageConfidence(pages: NormalizedOcrPage[]) {
  const averageScores = pages
    .map((page) => page.confidence?.averagePageConfidenceScore)
    .filter((score): score is number => typeof score === 'number');
  const minimumScores = pages
    .map((page) => page.confidence?.minimumPageConfidenceScore)
    .filter((score): score is number => typeof score === 'number');

  if (averageScores.length === 0 && minimumScores.length === 0) return null;

  return {
    averagePageConfidenceScore:
      averageScores.length > 0
        ? averageScores.reduce((sum, score) => sum + score, 0) / averageScores.length
        : null,
    minimumPageConfidenceScore:
      minimumScores.length > 0 ? Math.min(...minimumScores) : null,
  };
}
