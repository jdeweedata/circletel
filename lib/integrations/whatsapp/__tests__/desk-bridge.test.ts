/**
 * Unit tests for WhatsApp Desk bridge comment filtering / reply extraction.
 */

import { extractAgentReplyBody } from '../desk-bridge';

const WA_IN_PREFIX = '[WA-IN]';
const WA_OUT_MARKER = '[WA-OUT-SYNCED]';

function shouldSyncCommentToWhatsApp(comment: {
  content?: string;
  isPublic?: boolean;
}): boolean {
  if (comment.isPublic === false) return false;
  const text = (comment.content || '').trim();
  if (!text) return false;
  if (text.startsWith(WA_IN_PREFIX)) return false;
  if (text.includes(WA_OUT_MARKER)) return false;
  return true;
}

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

  it('strips CSAT chrome', () => {
    const raw =
      'Thanks for contacting us.\n\nHow would you rate our customer service?\nGood\nBad';
    expect(extractAgentReplyBody(raw)).toBe('Thanks for contacting us.');
  });
});
