import {
  classifySupportImReadProbe,
  classifySupportImSendProbe,
  decodeInboxThreadId,
  encodeInboxThreadId,
  deskCollection,
  deskTicketWebUrl,
  isInternalInboxMessage,
  isWhatsAppSupportTicket,
  mergeDeskHistory,
  shouldAutoShowClosedSupport,
  SUPPORT_IM_SEND_SENTINEL_SESSION_ID,
  supportImReplyBody,
  supportImSendPath,
  supportInboxEmptyCopy,
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

  it('strips the bridge From: name prefix from inbound WhatsApp comments', () => {
    expect(toCustomerFacingText('[WA-IN] From: Jeffrey NewGen\nHi')).toBe('Hi');
    expect(toCustomerFacingText('[WA-IN] From: Jeffrey NewGen\nHello')).toBe('Hello');
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

  it('does not stamp missing Desk times as now', () => {
    expect(toInboxTimestamp(undefined)).toBe('');
    expect(toInboxTimestamp('not-a-date')).toBe('');
  });
});

describe('mergeDeskHistory', () => {
  it('does not show a public agent comment again as an inbound conversation', () => {
    const messages = mergeDeskHistory(
      [
        {
          id: 'c-in',
          content: '[WA-IN] From: Jeffrey NewGen\nHi',
          isPublic: false,
          createdTime: '2026-08-20T15:44:00.000Z',
        },
        {
          id: 'c-out',
          content: 'Hello Jeff',
          isPublic: true,
          createdTime: '2026-08-20T19:41:00.000Z',
        },
      ],
      [
        {
          id: 'v-dup',
          direction: 'in',
          summary: 'Hello Jeff',
          createdTime: '2026-08-20T19:41:00.000Z',
        },
        {
          id: 'v-from',
          direction: 'in',
          summary: 'From: Jeffrey NewGen Hi',
          createdTime: '2026-08-20T15:44:00.000Z',
        },
      ]
    );
    expect(messages.map((m) => `${m.direction}:${m.text}`)).toEqual([
      'in:Hi',
      'out:Hello Jeff',
    ]);
  });
});

describe('isWhatsAppSupportTicket', () => {
  it('matches WhatsApp and Instant Messaging channels, not exact-only whatsapp', () => {
    expect(isWhatsAppSupportTicket('WhatsApp', 'Line down')).toBe(true);
    expect(isWhatsAppSupportTicket('WHATSAPP', '')).toBe(true);
    expect(isWhatsAppSupportTicket('Instant Messaging', 'Hi')).toBe(true);
    expect(isWhatsAppSupportTicket('Email', 'Fibre quote')).toBe(false);
  });

  it('matches tickets whose subject mentions WhatsApp even on another channel', () => {
    expect(isWhatsAppSupportTicket('Circle Tel', 'WhatsApp support from Jeff')).toBe(
      true
    );
    expect(isWhatsAppSupportTicket('Email', 'whatsapp lead')).toBe(true);
  });
});

describe('deskCollection', () => {
  it('treats HTTP 204 as an empty Desk list, not a parse failure', () => {
    expect(deskCollection({ success: true, status: 204 })).toEqual([]);
  });

  it('returns data when Desk wraps the array', () => {
    expect(
      deskCollection({ success: true, status: 200, data: { data: [{ id: '1' }] } })
    ).toEqual([{ id: '1' }]);
  });
});

describe('classifySupportImReadProbe', () => {
  it('treats SCOPE_MISMATCH 403 as missing InstantMessages.READ', () => {
    const result = classifySupportImReadProbe(
      403,
      '{"errorCode":"SCOPE_MISMATCH"}'
    );
    expect(result.canRead).toBe(false);
    expect(result.reason).toMatch(/Desk\.InstantMessages\.READ/);
  });

  it('treats 204 as readable empty IM list', () => {
    expect(classifySupportImReadProbe(204).canRead).toBe(true);
  });
});

describe('support inbox empty copy', () => {
  it('points at Closed when Open is empty but closed WhatsApp tickets exist', () => {
    expect(
      shouldAutoShowClosedSupport(0, 7, 'open')
    ).toBe(true);
    expect(shouldAutoShowClosedSupport(1, 7, 'open')).toBe(false);
    expect(
      supportInboxEmptyCopy({
        listFilter: 'open',
        openCount: 0,
        closedCount: 7,
      })
    ).toMatch(/Closed/i);
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

  it('probes send with an empty body on a well-formed sentinel id', () => {
    expect(SUPPORT_IM_SEND_SENTINEL_SESSION_ID).toMatch(/^\d{16,19}$/);
    expect(SUPPORT_IM_SEND_SENTINEL_SESSION_ID).not.toBe('0');
    expect(supportImSendPath(SUPPORT_IM_SEND_SENTINEL_SESSION_ID)).toBe(
      `/im/sessions/${SUPPORT_IM_SEND_SENTINEL_SESSION_ID}/messages`
    );
    expect(supportImReplyBody('Hello Jeff')).toEqual({ message: 'Hello Jeff' });
  });
});
