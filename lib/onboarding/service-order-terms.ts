/**
 * Service Order Terms - Shared Source of Truth
 *
 * Centralized terms used in both Step5ServiceOrder.tsx (UI) and service-order-pdf.ts (PDF generation).
 * Single source of truth ensures consistency between web and PDF versions.
 */

export const SERVICE_ORDER_TERMS_TITLE = 'CircleTel Service Order — Terms & Conditions';

export const SERVICE_ORDER_TERMS = [
  '<b>Commencement:</b> The Service Order terms commence on the Effective Date and continue for one calendar month thereafter, automatically renewing for successive one-month periods unless either party terminates with 30 days written notice.',
  '<b>Payment:</b> The monthly fee is due and payable in advance on the selected payment date. The first invoice is pro-rated from the Effective Date to the end of that calendar month.',
  '<b>DebiCheck Authorisation:</b> By accepting this Service Order, you authorise CircleTel to collect the monthly fee via DebiCheck debit order on your nominated payment date, in accordance with the DebiCheck rules.',
  '<b>Service Suspension:</b> If payment is not received by the due date, CircleTel may suspend service access without further notice.',
  '<b>Intellectual Property:</b> All CircleTel materials, technology, and know-how remain the property of CircleTel and may not be copied or reproduced without consent.',
  '<b>Limitation of Liability:</b> CircleTel\'s total liability under this Service Order is limited to the fees paid in the three months preceding the claim.',
  '<b>Termination:</b> Either party may terminate this Service Order with 30 days written notice. Upon termination, all outstanding fees remain due.',
  '<b>Governing Law:</b> This Service Order is governed by the laws of the Republic of South Africa.',
];

/**
 * Convert HTML-formatted terms to plain text (removes <b> tags)
 */
export function stripHtmlFromTerms(terms: string[]): string[] {
  return terms.map((term) => term.replace(/<\/?b>/g, ''));
}

/**
 * Convert HTML-formatted terms to plain text with manual bold markers
 */
export function convertTermsToPlainText(terms: string[]): string[] {
  return terms.map((term) => {
    // Replace <b>text</b> with **text**
    return term.replace(/<b>(.*?)<\/b>/g, '**$1**');
  });
}

/**
 * MSA reference text (shown on Service Order PDF)
 */
export const SERVICE_ORDER_MSA_REFERENCE =
  'This Service Order is issued back-to-back with, and incorporates by reference, the Unjani Master Service Agreement between CircleTel and the Unjani Clinic Network.';

/**
 * MSA reference text (shown in UI)
 */
export const SERVICE_ORDER_MSA_REFERENCE_UI =
  'These terms are back-to-back with the Master Service Agreement between CircleTel and Unjani Clinics NPC (the "MSA"). In the event of any conflict, the MSA prevails.';
