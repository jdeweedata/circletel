import { enrichKycDocumentWithOcr } from '@/lib/kyc/document-ocr';
import {
  getMistralOcrModel,
  processDocumentWithMistralOcr,
} from '@/lib/integrations/mistral/ocr';

jest.mock('@/lib/integrations/mistral/ocr', () => ({
  getMistralOcrModel: jest.fn(() => 'mistral-ocr-4-0'),
  processDocumentWithMistralOcr: jest.fn(),
}));

const mockProcessDocumentWithMistralOcr =
  processDocumentWithMistralOcr as jest.MockedFunction<typeof processDocumentWithMistralOcr>;
const mockGetMistralOcrModel =
  getMistralOcrModel as jest.MockedFunction<typeof getMistralOcrModel>;

function supabaseMock() {
  const upsert = jest.fn().mockResolvedValue({ error: null });
  return {
    upsert,
    client: {
      from: jest.fn().mockReturnValue({ upsert }),
    },
  };
}

function testFile() {
  return new File(['hello'], 'document.pdf', { type: 'application/pdf' });
}

describe('enrichKycDocumentWithOcr', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMistralOcrModel.mockReturnValue('mistral-ocr-4-0');
  });

  it('persists a successful OCR result for the uploaded KYC document', async () => {
    const supabase = supabaseMock();
    mockProcessDocumentWithMistralOcr.mockResolvedValue({
      status: 'succeeded',
      model: 'mistral-ocr-4-0',
      markdown: 'Extracted document text',
      pages: [{ index: 0, markdown: 'Extracted document text', confidence: null, blockCount: 1 }],
      blocks: [{ pageIndex: 0, type: 'signature', content: '', bbox: null }],
      confidence: null,
      usageInfo: { pagesProcessed: 1, docSizeBytes: 5 },
    });

    const result = await enrichKycDocumentWithOcr({
      supabase: supabase.client as any,
      documentId: 'doc-1',
      file: testFile(),
    });

    expect(result.status).toBe('succeeded');
    expect(supabase.upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        kyc_document_id: 'doc-1',
        status: 'processing',
        model: 'mistral-ocr-4-0',
      }),
      { onConflict: 'kyc_document_id' }
    );
    expect(supabase.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        kyc_document_id: 'doc-1',
        status: 'succeeded',
        markdown: 'Extracted document text',
        blocks: [{ pageIndex: 0, type: 'signature', content: '', bbox: null }],
        usage_info: { pagesProcessed: 1, docSizeBytes: 5 },
        error_message: null,
      }),
      { onConflict: 'kyc_document_id' }
    );
  });

  it('records a failed OCR result instead of throwing', async () => {
    const supabase = supabaseMock();
    mockProcessDocumentWithMistralOcr.mockResolvedValue({
      status: 'failed',
      model: 'mistral-ocr-4-0',
      errorMessage: 'Mistral is unavailable',
    });

    const result = await enrichKycDocumentWithOcr({
      supabase: supabase.client as any,
      documentId: 'doc-2',
      file: testFile(),
    });

    expect(result.status).toBe('failed');
    expect(supabase.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kyc_document_id: 'doc-2',
        status: 'failed',
        error_message: 'Mistral is unavailable',
      }),
      { onConflict: 'kyc_document_id' }
    );
  });
});
