/**
 * F1 flow-response-handler tests (TDD)
 *
 * Real parse logic against nfm_reply fixtures; Supabase mocked at the client boundary.
 */

import {
  buildCoverageLeadInsert,
  handleFlowCompletion,
  parseNfmReplyResponseJson,
} from '../flow-response-handler';
import {
  coerceF1LeadQualificationResponse,
  isF1LeadQualificationResponse,
  normalizeCustomerType,
} from '../types';
import type { WhatsAppFlowSession } from '../types';

import happyFixture from './fixtures/nfm_reply_f1.json';
import popiaFalseFixture from './fixtures/nfm_reply_f1_popia_false.json';
import malformedFixture from './fixtures/nfm_reply_f1_malformed.json';

// =============================================================================
// MOCK SUPABASE
// =============================================================================

type SessionRow = WhatsAppFlowSession;
type LeadInsert = Record<string, unknown>;

function makeSession(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: 'session-uuid-1',
    flow_token: 'f1-token-happy-path-0001',
    flow_id: 'flow-id-f1',
    flow_name: 'lead_qualification',
    phone: '27821234567',
    entry_source: 'website',
    source_campaign: 'near-term-f1',
    status: 'sent',
    response_payload: null,
    raw_webhook: null,
    coverage_lead_id: null,
    whatsapp_message_id: 'wamid.outbound-1',
    created_at: '2026-07-30T10:00:00.000Z',
    updated_at: '2026-07-30T10:00:00.000Z',
    completed_at: null,
    ...overrides,
  };
}

interface MockState {
  sessions: Map<string, SessionRow>;
  insertedLeads: LeadInsert[];
  sessionUpdates: Array<{ token: string; patch: Record<string, unknown> }>;
}

function createMockSupabase(state: MockState) {
  const from = jest.fn((table: string) => {
    if (table === 'whatsapp_flow_sessions') {
      return {
        select: jest.fn(() => ({
          eq: jest.fn((_col: string, token: string) => ({
            maybeSingle: jest.fn(async () => {
              const row = state.sessions.get(token) ?? null;
              return { data: row, error: null };
            }),
            single: jest.fn(async () => {
              const row = state.sessions.get(token) ?? null;
              return {
                data: row,
                error: row ? null : { message: 'not found' },
              };
            }),
          })),
        })),
        update: jest.fn((patch: Record<string, unknown>) => ({
          eq: jest.fn(async (_col: string, token: string) => {
            state.sessionUpdates.push({ token, patch });
            const existing = state.sessions.get(token);
            if (existing) {
              state.sessions.set(token, {
                ...existing,
                ...patch,
              } as SessionRow);
            }
            return { error: null };
          }),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(async () => ({ data: null, error: null })),
          })),
        })),
      };
    }

    if (table === 'coverage_leads') {
      return {
        insert: jest.fn((row: LeadInsert) => {
          state.insertedLeads.push(row);
          return {
            select: jest.fn(() => ({
              single: jest.fn(async () => ({
                data: { id: 'lead-uuid-new-1' },
                error: null,
              })),
            })),
          };
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return { from };
}

// =============================================================================
// TYPE GUARD / PARSE
// =============================================================================

describe('isF1LeadQualificationResponse', () => {
  it('accepts a valid happy-path form object', () => {
    const raw = JSON.parse(happyFixture.interactive.nfm_reply.response_json);
    expect(isF1LeadQualificationResponse(raw)).toBe(true);
  });

  it('rejects missing required fields', () => {
    expect(
      isF1LeadQualificationResponse({ first_name: 'A', last_name: 'B' })
    ).toBe(false);
  });

  it('accepts string popia_optin "true"', () => {
    const raw = JSON.parse(happyFixture.interactive.nfm_reply.response_json);
    raw.popia_optin = 'true';
    expect(isF1LeadQualificationResponse(raw)).toBe(true);
    expect(coerceF1LeadQualificationResponse(raw).popia_optin).toBe(true);
  });
});

describe('normalizeCustomerType', () => {
  it('maps business → smme and consumer → consumer', () => {
    expect(normalizeCustomerType('business')).toBe('smme');
    expect(normalizeCustomerType('Consumer')).toBe('consumer');
    expect(normalizeCustomerType('enterprise')).toBe('enterprise');
  });
});

describe('parseNfmReplyResponseJson', () => {
  it('parses happy fixture', () => {
    const result = parseNfmReplyResponseJson(
      happyFixture.interactive.nfm_reply.response_json
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.flowToken).toBe('f1-token-happy-path-0001');
      expect(result.form.first_name).toBe('Thabo');
      expect(result.form.popia_optin).toBe(true);
    }
  });

  it('returns malformed_json for invalid JSON', () => {
    const result = parseNfmReplyResponseJson(
      malformedFixture.interactive.nfm_reply.response_json
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed_json');
    }
  });
});

// =============================================================================
// HANDLER
// =============================================================================

describe('handleFlowCompletion', () => {
  const fixedNow = () => new Date('2026-07-30T12:00:00.000Z');

  it('happy path: inserts coverage_leads and completes session', async () => {
    const state: MockState = {
      sessions: new Map([
        [
          'f1-token-happy-path-0001',
          makeSession({ flow_token: 'f1-token-happy-path-0001' }),
        ],
      ]),
      insertedLeads: [],
      sessionUpdates: [],
    };
    const onLeadCreated = jest.fn(async () => undefined);
    const supabase = createMockSupabase(state);

    const result = await handleFlowCompletion(happyFixture, {
      supabase: supabase as never,
      now: fixedNow,
      onLeadCreated,
      log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(result.success).toBe(true);
    expect(result.reason).toBe('created');
    expect(result.coverageLeadId).toBe('lead-uuid-new-1');
    expect(state.insertedLeads).toHaveLength(1);

    const lead = state.insertedLeads[0];
    expect(lead.lead_source).toBe('whatsapp_flow');
    expect(lead.status).toBe('new');
    expect(lead.first_name).toBe('Thabo');
    expect(lead.last_name).toBe('Molefe');
    expect(lead.requested_service_type).toBe('fibre');
    expect(lead.source_campaign).toBe('near-term-f1');
    expect(lead.phone).toBe('27821234567'); // form empty → webhook sender
    expect(lead.customer_type).toBe('consumer');
    expect(lead.first_response_due_at).toBeDefined();
    expect((lead.metadata as Record<string, unknown>).popia_optin).toBe(true);
    expect((lead.metadata as Record<string, unknown>).entry_source).toBe(
      'website'
    );
    expect((lead.metadata as Record<string, unknown>).flow_token).toBe(
      'f1-token-happy-path-0001'
    );
    expect((lead.metadata as Record<string, unknown>).flow_id).toBe(
      'flow-id-f1'
    );

    const completeUpdate = state.sessionUpdates.find(
      (u) => u.patch.status === 'completed'
    );
    expect(completeUpdate).toBeDefined();
    expect(completeUpdate?.patch.coverage_lead_id).toBe('lead-uuid-new-1');
    expect(onLeadCreated).toHaveBeenCalledTimes(1);
  });

  it('unknown token: no lead insert', async () => {
    const state: MockState = {
      sessions: new Map(),
      insertedLeads: [],
      sessionUpdates: [],
    };
    const supabase = createMockSupabase(state);

    const result = await handleFlowCompletion(happyFixture, {
      supabase: supabase as never,
      now: fixedNow,
      log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('unknown_token');
    expect(state.insertedLeads).toHaveLength(0);
  });

  it('duplicate complete: idempotent — returns existing lead, no second insert', async () => {
    const state: MockState = {
      sessions: new Map([
        [
          'f1-token-happy-path-0001',
          makeSession({
            flow_token: 'f1-token-happy-path-0001',
            status: 'completed',
            coverage_lead_id: 'lead-existing-99',
          }),
        ],
      ]),
      insertedLeads: [],
      sessionUpdates: [],
    };
    const supabase = createMockSupabase(state);

    const result = await handleFlowCompletion(happyFixture, {
      supabase: supabase as never,
      now: fixedNow,
      log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(result.success).toBe(true);
    expect(result.reason).toBe('idempotent');
    expect(result.coverageLeadId).toBe('lead-existing-99');
    expect(state.insertedLeads).toHaveLength(0);
  });

  it('popia false: marks failed_parse, no lead', async () => {
    const token = 'f1-token-popia-false-0002';
    const state: MockState = {
      sessions: new Map([
        [token, makeSession({ flow_token: token, status: 'sent' })],
      ]),
      insertedLeads: [],
      sessionUpdates: [],
    };
    const supabase = createMockSupabase(state);

    const result = await handleFlowCompletion(popiaFalseFixture, {
      supabase: supabase as never,
      now: fixedNow,
      log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('popia_rejected');
    expect(state.insertedLeads).toHaveLength(0);
    expect(
      state.sessionUpdates.some((u) => u.patch.status === 'failed_parse')
    ).toBe(true);
  });

  it('malformed JSON: no lead insert', async () => {
    const state: MockState = {
      sessions: new Map([
        [
          'f1-token-happy-path-0001',
          makeSession({ flow_token: 'f1-token-happy-path-0001' }),
        ],
      ]),
      insertedLeads: [],
      sessionUpdates: [],
    };
    const supabase = createMockSupabase(state);

    const result = await handleFlowCompletion(malformedFixture, {
      supabase: supabase as never,
      now: fixedNow,
      log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('malformed_json');
    expect(state.insertedLeads).toHaveLength(0);
  });
});

describe('buildCoverageLeadInsert', () => {
  it('prefers form phone over sender when present', () => {
    const form = coerceF1LeadQualificationResponse(
      JSON.parse(happyFixture.interactive.nfm_reply.response_json)
    );
    form.phone = '0829998877';
    const row = buildCoverageLeadInsert({
      form,
      session: makeSession(),
      senderPhone: '27821234567',
      createdAt: new Date('2026-07-30T12:00:00.000Z'),
    });
    expect(row.phone).toBe('0829998877');
  });
});
