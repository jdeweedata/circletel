import {
  isMistralOcrEnabled,
  normalizeMistralOcrResponse,
} from '@/lib/integrations/mistral/ocr';

describe('normalizeMistralOcrResponse', () => {
  it('joins page markdown and extracts confidence plus structural blocks', () => {
    const normalized = normalizeMistralOcrResponse({
      model: 'mistral-ocr-4-0',
      usageInfo: { pagesProcessed: 2, docSizeBytes: 2048 },
      pages: [
        {
          index: 0,
          markdown: '# CIPC Registration',
          images: [],
          tables: [],
          dimensions: { dpi: 200, height: 1200, width: 800 },
          confidenceScores: {
            averagePageConfidenceScore: 0.97,
            minimumPageConfidenceScore: 0.91,
          },
          blocks: [
            {
              type: 'title',
              text: 'CIPC Registration',
              bbox: { topLeftX: 20, topLeftY: 30, bottomRightX: 500, bottomRightY: 80 },
            },
          ],
        },
        {
          index: 1,
          markdown: 'Director: Jane Doe',
          images: [],
          tables: [],
          dimensions: null,
          confidenceScores: {
            averagePageConfidenceScore: 0.88,
            minimumPageConfidenceScore: 0.84,
          },
          blocks: [
            {
              type: 'text',
              content: 'Director: Jane Doe',
              bbox: { topLeftX: 20, topLeftY: 100, bottomRightX: 600, bottomRightY: 140 },
            },
            {
              type: 'signature',
              content: '',
              bbox: { topLeftX: 20, topLeftY: 900, bottomRightX: 240, bottomRightY: 980 },
            },
          ],
        },
      ],
    } as any);

    expect(normalized).toEqual({
      model: 'mistral-ocr-4-0',
      markdown: '# CIPC Registration\n\nDirector: Jane Doe',
      pages: [
        {
          index: 0,
          markdown: '# CIPC Registration',
          confidence: {
            averagePageConfidenceScore: 0.97,
            minimumPageConfidenceScore: 0.91,
          },
          blockCount: 1,
        },
        {
          index: 1,
          markdown: 'Director: Jane Doe',
          confidence: {
            averagePageConfidenceScore: 0.88,
            minimumPageConfidenceScore: 0.84,
          },
          blockCount: 2,
        },
      ],
      blocks: [
        {
          pageIndex: 0,
          type: 'title',
          content: 'CIPC Registration',
          bbox: { topLeftX: 20, topLeftY: 30, bottomRightX: 500, bottomRightY: 80 },
        },
        {
          pageIndex: 1,
          type: 'text',
          content: 'Director: Jane Doe',
          bbox: { topLeftX: 20, topLeftY: 100, bottomRightX: 600, bottomRightY: 140 },
        },
        {
          pageIndex: 1,
          type: 'signature',
          content: '',
          bbox: { topLeftX: 20, topLeftY: 900, bottomRightX: 240, bottomRightY: 980 },
        },
      ],
      confidence: {
        averagePageConfidenceScore: 0.925,
        minimumPageConfidenceScore: 0.84,
      },
      usageInfo: { pagesProcessed: 2, docSizeBytes: 2048 },
    });
  });
});

describe('isMistralOcrEnabled', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('requires an enabled flag and API key', () => {
    process.env.MISTRAL_OCR_ENABLED = 'true';
    delete process.env.MISTRAL_API_KEY;

    expect(isMistralOcrEnabled()).toBe(false);

    process.env.MISTRAL_API_KEY = 'test-key';
    expect(isMistralOcrEnabled()).toBe(true);
  });
});
