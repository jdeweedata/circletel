/**
 * Unit tests for WhatsApp Desk bridge comment filtering / reply extraction.
 */

import {
  extractAgentReplyBody,
  getNativeDeskImPhoneNumberIds,
  isSalesPhoneNumberId,
  resolveBridgeDepartmentId,
  resolveBridgeSubjectPrefix,
  shouldSkipDeskBridgeForPhone,
  shouldSyncCommentToWhatsApp,
  WA_IN_PREFIX,
  WA_INTERNAL_MARKER,
  WA_OUT_MARKER,
} from '../desk-bridge';

const AGENT_INSTRUCTIONS = [
  'AGENT REPLY (WhatsApp bridge)',
  '1. Best: add a Public Comment with reply text only (no quotes) — synced to WhatsApp ~1 min.',
  '2. Or click Send — reply text is synced to WhatsApp via Cloud API (~1 min). The contact email is only a Desk placeholder.',
  '3. Prefer a short reply without CSAT / quoted history.',
  '4. Ignore mailer-daemon bounces if any — WhatsApp delivery is via the bridge, not email.',
].join('\n');

describe('WhatsApp Desk bridge comment sync filter', () => {
  it('syncs public agent replies', () => {
    expect(
      shouldSyncCommentToWhatsApp({
        isPublic: true,
        content: 'Hi, we can help with your line.',
      })
    ).toBe(true);
  });

  it('skips private inbound bridge comments', () => {
    expect(
      shouldSyncCommentToWhatsApp({
        isPublic: false,
        content: `${WA_IN_PREFIX} Customer hello`,
      })
    ).toBe(false);
  });

  it('skips public comments that look like inbound bridge posts', () => {
    expect(
      shouldSyncCommentToWhatsApp({
        isPublic: true,
        content: `${WA_IN_PREFIX} should not loop`,
      })
    ).toBe(false);
  });

  it('skips already-synced markers', () => {
    expect(
      shouldSyncCommentToWhatsApp({
        isPublic: true,
        content: `${WA_OUT_MARKER} Sent to WhatsApp (wamid.x)`,
      })
    ).toBe(false);
  });

  it('skips empty content', () => {
    expect(shouldSyncCommentToWhatsApp({ isPublic: true, content: '   ' })).toBe(
      false
    );
  });

  it('skips public AGENT REPLY instruction notes', () => {
    expect(
      shouldSyncCommentToWhatsApp({
        isPublic: true,
        content: AGENT_INSTRUCTIONS,
      })
    ).toBe(false);
  });

  it('skips public comments marked [WA-INTERNAL]', () => {
    expect(
      shouldSyncCommentToWhatsApp({
        isPublic: true,
        content: `${WA_INTERNAL_MARKER} AGENT REPLY (WhatsApp bridge)\n1. Best: Public Comment`,
      })
    ).toBe(false);
  });

  it('still syncs a public reply that quotes AGENT REPLY instructions', () => {
    expect(
      shouldSyncCommentToWhatsApp({
        isPublic: true,
        content: `Test message\n\n${AGENT_INSTRUCTIONS}`,
      })
    ).toBe(true);
  });
});

describe('native Desk IM phone skip', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env.WHATSAPP_SALES_NATIVE_IM = prev.WHATSAPP_SALES_NATIVE_IM;
    process.env.WHATSAPP_SALES_PHONE_NUMBER_ID =
      prev.WHATSAPP_SALES_PHONE_NUMBER_ID;
    process.env.WHATSAPP_PHONE_NUMBER_ID = prev.WHATSAPP_PHONE_NUMBER_ID;
    process.env.WHATSAPP_NATIVE_DESK_IM_PHONE_NUMBER_IDS =
      prev.WHATSAPP_NATIVE_DESK_IM_PHONE_NUMBER_IDS;
    process.env.ZOHO_DESK_DEPARTMENT_ID = prev.ZOHO_DESK_DEPARTMENT_ID;
    process.env.ZOHO_DESK_SALES_DEPARTMENT_ID =
      prev.ZOHO_DESK_SALES_DEPARTMENT_ID;
  });

  it('skips sales phone when WHATSAPP_SALES_NATIVE_IM is true', () => {
    process.env.WHATSAPP_SALES_NATIVE_IM = 'true';
    process.env.WHATSAPP_SALES_PHONE_NUMBER_ID = '1198404656682736';
    expect(shouldSkipDeskBridgeForPhone('1198404656682736')).toBe(true);
    expect(shouldSkipDeskBridgeForPhone('1158601880661029')).toBe(false);
    expect(getNativeDeskImPhoneNumberIds().has('1198404656682736')).toBe(true);
  });

  it('does not skip when native IM flag is off', () => {
    process.env.WHATSAPP_SALES_NATIVE_IM = 'false';
    process.env.WHATSAPP_SALES_PHONE_NUMBER_ID = '1198404656682736';
    expect(shouldSkipDeskBridgeForPhone('1198404656682736')).toBe(false);
  });

  it('honours explicit WHATSAPP_NATIVE_DESK_IM_PHONE_NUMBER_IDS', () => {
    process.env.WHATSAPP_SALES_NATIVE_IM = 'false';
    process.env.WHATSAPP_NATIVE_DESK_IM_PHONE_NUMBER_IDS =
      '111, 222 ,1198404656682736';
    expect(shouldSkipDeskBridgeForPhone('222')).toBe(true);
    expect(shouldSkipDeskBridgeForPhone('1198404656682736')).toBe(true);
  });

  it('routes sales phone to Sales department and sales subject', () => {
    process.env.WHATSAPP_SALES_PHONE_NUMBER_ID = '1198404656682736';
    process.env.ZOHO_DESK_DEPARTMENT_ID = 'support-dept';
    process.env.ZOHO_DESK_SALES_DEPARTMENT_ID = 'sales-dept';
    expect(isSalesPhoneNumberId('1198404656682736')).toBe(true);
    expect(resolveBridgeDepartmentId('1198404656682736')).toBe('sales-dept');
    expect(resolveBridgeSubjectPrefix('1198404656682736')).toBe(
      'WhatsApp sales from'
    );
    expect(resolveBridgeDepartmentId('other')).toBe('support-dept');
    expect(resolveBridgeSubjectPrefix('other')).toBe('WhatsApp support from');
  });
});

describe('extractAgentReplyBody', () => {
  it('keeps the agent reply and strips Desk quoted history', () => {
    const raw = [
      'Hi Jeffrey, we can help with your line.',
      '',
      '--- on Tue, 04 Aug 2026 Jeffrey NewGen wrote ---',
      '[WA-IN] From: Jeffrey NewGen I need help',
    ].join('\n');
    expect(extractAgentReplyBody(raw)).toBe(
      'Hi Jeffrey, we can help with your line.'
    );
  });

  it('strips same-line Zoho 4-dash quote trailer (prod #898)', () => {
    const raw =
      'hi ---- on Mon, 10 Aug 2026 22:33:22 +0200 Jeffrey NewGen wrote ----';
    expect(extractAgentReplyBody(raw)).toBe('hi');
  });

  it('strips em-dash quote trailer shown in WhatsApp', () => {
    const raw =
      'hi\n— on Mon, 10 Aug 2026 22:33:22 +0200 Jeffrey NewGen wrote —';
    expect(extractAgentReplyBody(raw)).toBe('hi');
  });

  it('strips HTML email replies down to agent text', () => {
    const raw =
      '<div>Thanks, we will call shortly.</div><br/>---- on Mon, 10 Aug 2026 Jeffrey wrote ----<p>[WA-IN] Hi</p>';
    expect(extractAgentReplyBody(raw)).toBe('Thanks, we will call shortly.');
  });

  it('strips CSAT chrome', () => {
    const raw =
      'Thanks for contacting us.\n\nHow would you rate our customer service?\nGood\nBad';
    expect(extractAgentReplyBody(raw)).toBe('Thanks for contacting us.');
  });

  it('keeps Test message and strips leaked AGENT REPLY instructions', () => {
    const raw = `Test message\n\n${AGENT_INSTRUCTIONS}\n\nChannel: WhatsApp Cloud API bridge\nWA ID: 27821234567`;
    expect(extractAgentReplyBody(raw)).toBe('Test message');
  });

  it('returns empty for instruction-only AGENT REPLY bodies', () => {
    const raw = `${AGENT_INSTRUCTIONS}\n\nChannel: WhatsApp Cloud API bridge\nWA ID: 27821234567`;
    expect(extractAgentReplyBody(raw)).toBe('');
  });

  it('strips [WA-INTERNAL] instruction blocks after the agent reply', () => {
    const raw = `Thanks, we will call shortly.\n\n${WA_INTERNAL_MARKER} AGENT REPLY (WhatsApp bridge)\n1. Best: Public Comment`;
    expect(extractAgentReplyBody(raw)).toBe('Thanks, we will call shortly.');
  });
});
