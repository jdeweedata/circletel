import {
  classifySupportImSendProbe,
  decodeInboxThreadId,
  encodeInboxThreadId,
  deskTicketWebUrl,
  isInternalInboxMessage,
  toCustomerFacingText,
  toInboxTimestamp,
} from '../inbox-thread';

const AGENT_INSTRUCTIONS = [
  'AGENT REPLY (WhatsApp bridge)',
  '1. Best: add a Public Comment with reply text only (no quotes) — synced to WhatsApp ~1 min.',
].join('\n');

describe('inbox thread ids', () => {
  it('round-trips sales and support ids', () => {
    expect(decodeInboxThreadId(encodeInboxThreadId({ channel: 'sales', id: 'abc' }))).toEqual({
      channel: 'sales',
      id: 'abc',
    });
    expect(
      decodeInboxThreadId(
        encodeInboxThreadId({ channel: 'support', id: 'sess-1', kind: 'session' })
      )
    ).toEqual({ channel: 'support', id: 'sess-1', kind: 'session' });
    expect(
      decodeInboxThreadId(
        encodeInboxThreadId({ channel: 'support', id: '1100', kind: 'ticket' })
      )
    ).toEqual({ channel: 'support', id: '1100', kind: 'ticket' });
  });

  it('rejects malformed ids', () => {
    expect(decodeInboxThreadId('nope')).toBeNull();
    expect(decodeInboxThreadId('sales:')).toBeNull();
  });
});

describe('inbox message chrome', () => {
  it('hides internal notes and sync markers, but keeps inbound [WA-IN] customer text', () => {
    expect(isInternalInboxMessage('[WA-IN] Hi')).toBe(false);
    expect(isInternalInboxMessage('[WA-INTERNAL] AGENT REPLY (WhatsApp bridge)')).toBe(true);
    expect(isInternalInboxMessage('[WA-OUT-SYNCED] Sent to WhatsApp')).toBe(true);
    expect(isInternalInboxMessage(AGENT_INSTRUCTIONS)).toBe(true);
    expect(isInternalInboxMessage('We can help with your line.')).toBe(false);
  });

  it('strips leaked AGENT REPLY instructions from a mixed agent reply', () => {
    expect(toCustomerFacingText(`Test message\n\n${AGENT_INSTRUCTIONS}`)).toBe(
      'Test message'
    );
  });

  it('does not throw when Desk content is a non-string', () => {
    expect(isInternalInboxMessage({ html: '<p>Hi</p>' } as never)).toBe(true);
    expect(toCustomerFacingText({ html: '<p>Hi</p>' } as never)).toBe('');
  });
});

describe('deskTicketWebUrl', () => {
  it('builds an agent-console ticket deep link, not the customer Help Center', () => {
    expect(deskTicketWebUrl('1100825000005243001')).toBe(
      'https://desk.zoho.com/agent/circletelsaptyltd/all/tickets/details/1100825000005243001'
    );
  });
});

describe('toInboxTimestamp', () => {
  it('normalizes epoch millis and ISO strings', () => {
    expect(toInboxTimestamp(Date.parse('2024-03-22T07:57:13.000Z'))).toBe(
      '2024-03-22T07:57:13.000Z'
    );
    expect(toInboxTimestamp('2026-06-11T07:15:25.807Z')).toBe(
      '2026-06-11T07:15:25.807Z'
    );
  });
});

describe('classifySupportImSendProbe', () => {
  it('treats missing CREATE scope as read-only', () => {
    expect(classifySupportImSendProbe(401, 'OAUTH_SCOPE_MISMATCH').canSend).toBe(
      false
    );
    expect(classifySupportImSendProbe(403).canSend).toBe(false);
  });

  it('treats validation or resource-not-found on a sentinel session as send-capable', () => {
    expect(classifySupportImSendProbe(404, 'RESOURCE_NOT_FOUND').canSend).toBe(
      true
    );
    expect(classifySupportImSendProbe(400, 'INVALID_DATA').canSend).toBe(true);
    expect(classifySupportImSendProbe(422).canSend).toBe(true);
  });

  it('keeps composer off when the IM send URL itself is missing', () => {
    expect(classifySupportImSendProbe(404, 'URL_NOT_FOUND').canSend).toBe(false);
  });
});
