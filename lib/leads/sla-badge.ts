/**
 * Client-side first-response SLA badge for coverage_leads admin UI.
 */

export type LeadSlaVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export function getLeadSlaBadge(lead: {
  first_responded_at: string | null;
  first_response_due_at: string | null;
}): { status: string; variant: LeadSlaVariant } {
  if (lead.first_responded_at) {
    return { status: 'Responded', variant: 'success' };
  }
  if (!lead.first_response_due_at) {
    return { status: 'No SLA', variant: 'neutral' };
  }
  const due = new Date(lead.first_response_due_at).getTime();
  const now = Date.now();
  if (Number.isNaN(due)) {
    return { status: 'No SLA', variant: 'neutral' };
  }
  if (due < now) {
    return { status: 'Overdue', variant: 'error' };
  }
  if (due < now + 30 * 60 * 1000) {
    return { status: 'Due soon', variant: 'warning' };
  }
  return { status: 'On track', variant: 'success' };
}
