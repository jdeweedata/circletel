/**
 * Required-document checklist for the manual B2B onboarding wizard.
 * Pure: computes Received/Outstanding status for each expected document type
 * from the set of kyc_documents.document_type values already on record.
 */

export type DocRequirement = "always" | "ifVat" | "optional";

export interface DocChecklistDef {
  key: string;
  label: string;
  /** kyc_documents.document_type values that satisfy this row. */
  match: string[];
  requirement: DocRequirement;
}

/** Display order. */
export const DOC_CHECKLIST: DocChecklistDef[] = [
  { key: "company_registration", label: "Company registration", match: ["company_registration"], requirement: "always" },
  { key: "id_document", label: "Owner / Director ID", match: ["id_document", "director_id"], requirement: "always" },
  { key: "proof_of_address", label: "Proof of address", match: ["proof_of_address"], requirement: "always" },
  { key: "bank_statement", label: "Bank confirmation", match: ["bank_statement"], requirement: "always" },
  { key: "vat_certificate", label: "VAT certificate", match: ["vat_certificate"], requirement: "ifVat" },
  { key: "tax_certificate", label: "Tax certificate", match: ["tax_certificate"], requirement: "optional" },
  { key: "other", label: "Other supporting docs", match: ["other", "shareholder_agreement"], requirement: "optional" },
];

export interface DocChecklistRow extends DocChecklistDef {
  required: boolean;
  received: boolean;
}

export interface DocChecklistResult {
  rows: DocChecklistRow[];
  requiredCount: number;
  receivedRequiredCount: number;
  allRequiredReceived: boolean;
}

export function computeDocChecklist(
  receivedTypes: string[],
  vatRegistered: boolean,
): DocChecklistResult {
  const received = new Set(receivedTypes);
  const rows: DocChecklistRow[] = DOC_CHECKLIST.map((def) => ({
    ...def,
    required:
      def.requirement === "always" || (def.requirement === "ifVat" && vatRegistered),
    received: def.match.some((t) => received.has(t)),
  }));
  const requiredRows = rows.filter((r) => r.required);
  const receivedRequiredCount = requiredRows.filter((r) => r.received).length;
  return {
    rows,
    requiredCount: requiredRows.length,
    receivedRequiredCount,
    allRequiredReceived: requiredRows.every((r) => r.received),
  };
}
