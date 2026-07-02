import {
  requiredDocsFor,
  documentMatchesRequirement,
  computeVettingStatus,
} from "@/lib/onboarding/document-requirements";

const companyCtx = { vatRegistered: false, entityType: "Private Company" };
const directorReq = requiredDocsFor("unjani", companyCtx).find(
  (r) => r.label === "Director / owner ID",
)!;

describe("documentMatchesRequirement (owner/director ID alias)", () => {
  it("matches the canonical director_id type", () => {
    expect(documentMatchesRequirement("director_id", directorReq)).toBe(true);
  });

  it("matches the id_document alias (what the upload picker writes)", () => {
    expect(documentMatchesRequirement("id_document", directorReq)).toBe(true);
  });

  it("does not match an unrelated type", () => {
    expect(documentMatchesRequirement("bank_statement", directorReq)).toBe(false);
  });

  it("has no aliases on a non-ID requirement", () => {
    const bank = requiredDocsFor("unjani", companyCtx).find(
      (r) => r.type === "bank_statement",
    )!;
    expect(documentMatchesRequirement("id_document", bank)).toBe(false);
    expect(documentMatchesRequirement("bank_statement", bank)).toBe(true);
  });
});

describe("computeVettingStatus (alias-aware approval rollup)", () => {
  const reqs = requiredDocsFor("unjani", companyCtx).filter((r) => r.required);
  // company_registration, director_id(+id_document), bank_statement, proof_of_address

  const approvedExceptDirector = [
    { document_type: "company_registration", verification_status: "approved" },
    { document_type: "bank_statement", verification_status: "approved" },
    { document_type: "proof_of_address", verification_status: "approved" },
  ];

  it("approves when the director slot is filled by an approved id_document", () => {
    expect(
      computeVettingStatus(reqs, [
        ...approvedExceptDirector,
        { document_type: "id_document", verification_status: "approved" },
      ]),
    ).toBe("approved");
  });

  it("approves when the director slot is filled by an approved director_id", () => {
    expect(
      computeVettingStatus(reqs, [
        ...approvedExceptDirector,
        { document_type: "director_id", verification_status: "approved" },
      ]),
    ).toBe("approved");
  });

  it("is under_review when the director doc is missing", () => {
    expect(computeVettingStatus(reqs, approvedExceptDirector)).toBe(
      "under_review",
    );
  });

  it("is rejected when the id_document (director slot) is rejected", () => {
    expect(
      computeVettingStatus(reqs, [
        ...approvedExceptDirector,
        { document_type: "id_document", verification_status: "rejected" },
      ]),
    ).toBe("rejected");
  });

  it("is documents_pending when nothing is uploaded", () => {
    expect(computeVettingStatus(reqs, [])).toBe("documents_pending");
  });
});
