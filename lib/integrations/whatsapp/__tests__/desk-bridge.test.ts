/**
 * Unit tests for WhatsApp Desk bridge comment filtering rules.
 * Pure logic mirrored from desk-bridge (keep in sync with WA_IN_PREFIX / WA_OUT_MARKER).
 */

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
