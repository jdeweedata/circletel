export function isWhatsAppSupportTicket(
  channel?: string | null,
  subject?: string | null
): boolean {
  const ch = (channel || '').toLowerCase();
  const sub = (subject || '').toLowerCase();
  return (
    ch.includes('whatsapp') ||
    ch.includes('instant') ||
    sub.includes('whatsapp')
  );
}

export function deskCollection<T>(result: {
  success: boolean;
  status?: number;
  data?: { data?: T[] };
}): T[] {
  if (result.status === 204) return [];
  if (!result.success) return [];
  return result.data?.data || [];
}

/**
 * Classify GET /im/sessions. 204 is an empty but authorized list.
 * SCOPE_MISMATCH 401/403 means the refresh token lacks InstantMessages.READ.
 */
export function classifySupportImReadProbe(
  status?: number,
  errorBody?: string
): { canRead: boolean; reason?: string } {
  const body = (errorBody || '').toUpperCase();
  if (status === 204 || status === 200) {
    return { canRead: true };
  }
  if (!status) {
    return {
      canRead: false,
      reason:
        'Desk Instant Messaging could not be verified. Support replies stay in Zoho Desk.',
    };
  }
  if (
    status === 401 ||
    status === 403 ||
    body.includes('SCOPE_MISMATCH') ||
    body.includes('OAUTH_SCOPE')
  ) {
    return {
      canRead: false,
      reason:
        'Desk token is missing Instant Messaging READ scope (Desk.InstantMessages.READ). Live Support chats stay in Zoho Desk until ZOHO_DESK_REFRESH_TOKEN includes that scope.',
    };
  }
  return {
    canRead: false,
    reason: `Desk IM sessions API unavailable (${status}). Support replies stay in Zoho Desk.`,
  };
}

export function shouldAutoShowClosedSupport(
  openCount: number,
  closedCount: number,
  currentFilter: string
): boolean {
  return currentFilter === 'open' && openCount === 0 && closedCount > 0;
}

export function supportInboxEmptyCopy(opts: {
  listFilter: 'open' | 'closed' | 'window';
  openCount: number;
  closedCount: number;
}): string {
  if (opts.listFilter === 'window') {
    return 'No threads are inside the last four hours of the estimated 24-hour window.';
  }
  if (opts.listFilter === 'open' && opts.closedCount > 0) {
    return `No open Support chats. ${opts.closedCount} closed WhatsApp tickets are under Closed.`;
  }
  if (opts.listFilter === 'closed') {
    return 'No closed Support WhatsApp tickets in this Desk department.';
  }
  return 'Inbound Support Instant Messaging will appear here. Live chats need Desk.InstantMessages.READ on the Desk token.';
}
