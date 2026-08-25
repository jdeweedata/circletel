/**
 * Evidence writers for Unjani operator stage advances.
 * These patches are the same signals deriveStage() already reads.
 */

export const UNJANI_CONNECT_PACKAGE_ID = 'f6828ecf-4a8d-42c0-9fd7-d7cac5c1537e';
export const UNJANI_CONNECT_MONTHLY_FEE = 450;

export function confirmDetailsPatch(): {
  status: 'approved';
  rejection_reason: null;
} {
  return { status: 'approved', rejection_reason: null };
}

export function requestChangesPatch(reason: string): {
  status: 'submitted';
  rejection_reason: string;
} {
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new Error('A reason is required when requesting changes');
  }
  return { status: 'submitted', rejection_reason: trimmed };
}

export function bookVisitNotes(visitDate: string, extra?: string): string {
  const date = visitDate.trim();
  const note = extra?.trim();
  return note ? `Visit booked: ${date}. ${note}` : `Visit booked: ${date}`;
}

export function goLiveActivatePayload(input: {
  technology?: string;
  installedAt?: string;
  installedBy?: string;
  wholesaleOrderRef?: string;
  notes?: string;
}): {
  technology: string;
  package_id: string;
  monthly_fee: number;
  wholesale_order_ref?: string;
  installed_at?: string;
  installed_by?: string;
  notes?: string;
} {
  return {
    technology: input.technology || 'lte_5g',
    package_id: UNJANI_CONNECT_PACKAGE_ID,
    monthly_fee: UNJANI_CONNECT_MONTHLY_FEE,
    wholesale_order_ref: input.wholesaleOrderRef || undefined,
    installed_at: input.installedAt || undefined,
    installed_by: input.installedBy || undefined,
    notes: input.notes || undefined,
  };
}
