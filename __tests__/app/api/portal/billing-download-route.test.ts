/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

const mockRequire = jest.fn();
const mockBuildNpcInvoicePdf = jest.fn();

jest.mock('@/lib/portal/require-portal-user', () => ({
  requirePortalCapability: (...args: unknown[]) => mockRequire(...args),
}));

jest.mock('@/lib/billing/unjani-npc-pack', () => ({
  buildNpcInvoicePdf: (...args: unknown[]) => mockBuildNpcInvoicePdf(...args),
}));

import { GET } from '@/app/api/portal/billing/[id]/download/route';

function makeChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> = {};
  const terminal = jest.fn().mockResolvedValue(result);
  for (const method of ['select', 'eq', 'maybeSingle']) {
    chain[method] = jest.fn(() => (method === 'maybeSingle' ? terminal() : chain));
  }
  // maybeSingle should return the promise
  chain.maybeSingle = terminal;
  chain.select = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  return chain;
}

describe('GET /api/portal/billing/[id]/download', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401/403 response when capability check fails', async () => {
    mockRequire.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const res = await GET(new NextRequest('http://localhost/api/portal/billing/inv-1/download'), {
      params: Promise.resolve({ id: 'inv-1' }),
    });

    expect(res.status).toBe(403);
  });

  it('returns 404 when invoice is outside the organisation scope', async () => {
    const chain = makeChain({ data: null, error: null });
    mockRequire.mockResolvedValue({
      ok: true,
      portalUser: { organisation_id: 'org-a' },
      adminDb: { from: jest.fn(() => chain) },
    });

    const res = await GET(new NextRequest('http://localhost/api/portal/billing/inv-x/download'), {
      params: Promise.resolve({ id: 'inv-x' }),
    });

    expect(res.status).toBe(404);
    expect(chain.eq).toHaveBeenCalledWith('corporate_account_id', 'org-a');
    expect(mockBuildNpcInvoicePdf).not.toHaveBeenCalled();
  });

  it('generates PDF when pdf_url is missing and sets attachment disposition by default', async () => {
    const chain = makeChain({
      data: {
        id: 'inv-1',
        invoice_number: 'INV-NPC-001',
        pdf_url: null,
        corporate_account_id: 'org-a',
      },
      error: null,
    });
    mockRequire.mockResolvedValue({
      ok: true,
      portalUser: { organisation_id: 'org-a' },
      adminDb: { from: jest.fn(() => chain) },
    });
    mockBuildNpcInvoicePdf.mockResolvedValue({
      filename: 'INV-NPC-001.pdf',
      bytes: Buffer.from('%PDF-1.4 npc'),
    });

    const res = await GET(new NextRequest('http://localhost/api/portal/billing/inv-1/download'), {
      params: Promise.resolve({ id: 'inv-1' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toBe(
      'attachment; filename="INV-NPC-001.pdf"'
    );
    expect(mockBuildNpcInvoicePdf).toHaveBeenCalled();
    const body = Buffer.from(await res.arrayBuffer()).toString('utf8');
    expect(body).toContain('%PDF-1.4 npc');
  });

  it('uses inline Content-Disposition when disposition=inline', async () => {
    const chain = makeChain({
      data: {
        id: 'inv-1',
        invoice_number: 'INV-NPC-001',
        pdf_url: null,
        corporate_account_id: 'org-a',
      },
      error: null,
    });
    mockRequire.mockResolvedValue({
      ok: true,
      portalUser: { organisation_id: 'org-a' },
      adminDb: { from: jest.fn(() => chain) },
    });
    mockBuildNpcInvoicePdf.mockResolvedValue({
      filename: 'INV-NPC-001.pdf',
      bytes: Buffer.from('%PDF'),
    });

    const res = await GET(
      new NextRequest(
        'http://localhost/api/portal/billing/inv-1/download?disposition=inline'
      ),
      { params: Promise.resolve({ id: 'inv-1' }) }
    );

    expect(res.headers.get('Content-Disposition')).toBe(
      'inline; filename="INV-NPC-001.pdf"'
    );
  });
});
