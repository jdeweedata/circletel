import { computeDocChecklist, DOC_CHECKLIST } from "@/lib/onboarding/document-checklist";

describe("computeDocChecklist", () => {
  it("marks the four always-required docs outstanding when nothing is received", () => {
    const r = computeDocChecklist([], false);
    expect(r.requiredCount).toBe(4);
    expect(r.receivedRequiredCount).toBe(0);
    expect(r.allRequiredReceived).toBe(false);
    const companyRow = r.rows.find((x) => x.key === "company_registration")!;
    expect(companyRow.required).toBe(true);
    expect(companyRow.received).toBe(false);
  });

  it("is complete when the four always-required docs are received (VAT off)", () => {
    const r = computeDocChecklist(
      ["company_registration", "id_document", "proof_of_address", "bank_statement"],
      false,
    );
    expect(r.allRequiredReceived).toBe(true);
    expect(r.receivedRequiredCount).toBe(4);
  });

  it("keeps the VAT certificate optional even when vatRegistered is true", () => {
    const base = ["company_registration", "id_document", "proof_of_address", "bank_statement"];
    expect(computeDocChecklist(base, true).allRequiredReceived).toBe(true);
    expect(computeDocChecklist(base, true).requiredCount).toBe(4);
    expect(computeDocChecklist([...base, "vat_certificate"], true).allRequiredReceived).toBe(true);
    expect(
      computeDocChecklist([...base, "vat_certificate"], true).rows.find(
        (row) => row.key === "vat_certificate",
      )!.required,
    ).toBe(false);
  });

  it("accepts director_id as satisfying the Owner/Director ID row", () => {
    const r = computeDocChecklist(
      ["company_registration", "director_id", "proof_of_address", "bank_statement"],
      false,
    );
    expect(r.rows.find((x) => x.key === "id_document")!.received).toBe(true);
    expect(r.allRequiredReceived).toBe(true);
  });

  it("does not let optional docs affect completion", () => {
    const r = computeDocChecklist(["tax_certificate", "other"], false);
    expect(r.allRequiredReceived).toBe(false);
    expect(r.rows.find((x) => x.key === "tax_certificate")!.required).toBe(false);
    expect(r.rows.find((x) => x.key === "other")!.received).toBe(true);
  });

  it("exposes rows in DOC_CHECKLIST order", () => {
    const r = computeDocChecklist([], false);
    expect(r.rows.map((x) => x.key)).toEqual(DOC_CHECKLIST.map((d) => d.key));
  });
});
