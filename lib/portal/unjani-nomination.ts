/**
 * Helpers for Unjani Connect clinic nomination (coverage → onboard).
 */

/** First name for "Hello Sr {Name}," — contact may be full name. */
export function nurseFirstName(contactName: string): string {
  const parts = contactName.trim().split(/\s+/).filter(Boolean);
  return parts[0] || '';
}

/** Merge nomination flags into a coverage-check results JSON blob. */
export function withNominationFlags(
  results: Record<string, unknown> | null | undefined,
  meta: { nominatedAt: string; nominatedBy?: string }
): Record<string, unknown> {
  return {
    ...(results ?? {}),
    nominated: true,
    nominated_at: meta.nominatedAt,
    ...(meta.nominatedBy ? { nominated_by: meta.nominatedBy } : {}),
  };
}

/** Sales Desk department for nomination tickets (falls back to default Desk dept). */
export function unjaniNominationDeskDepartmentId(): string | undefined {
  return (
    process.env.ZOHO_DESK_SALES_DEPARTMENT_ID?.trim() ||
    process.env.ZOHO_DESK_DEPARTMENT_ID?.trim() ||
    undefined
  );
}
