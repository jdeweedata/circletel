import {
  ALLOWED_DOC_TYPES,
  buildDocumentUploadQueue,
  validateDocumentUpload,
  MAX_DOC_BYTES,
} from "@/lib/onboarding/document-upload";

describe("validateDocumentUpload", () => {
  const ok = {
    documentType: "company_registration",
    fileType: "application/pdf",
    fileSize: 1000,
  };

  it("accepts a valid pdf of an allowed type", () => {
    expect(validateDocumentUpload(ok)).toEqual({ valid: true });
  });
  it("rejects an unknown document type", () => {
    expect(validateDocumentUpload({ ...ok, documentType: "nope" }).valid).toBe(
      false,
    );
  });
  it("rejects a disallowed file type", () => {
    expect(validateDocumentUpload({ ...ok, fileType: "text/csv" }).valid).toBe(
      false,
    );
  });
  it("rejects a file over the size limit", () => {
    expect(
      validateDocumentUpload({ ...ok, fileSize: MAX_DOC_BYTES + 1 }).valid,
    ).toBe(false);
  });
  it("exposes the allowed types list", () => {
    expect(ALLOWED_DOC_TYPES).toContain("vat_certificate");
    expect(ALLOWED_DOC_TYPES).toContain("proof_of_address");
  });
});

describe("buildDocumentUploadQueue", () => {
  it("builds a multi-file queue with per-file validation state", () => {
    const validPdf = new File(["ok"], "cipc.pdf", { type: "application/pdf" });
    const invalidText = new File(["nope"], "notes.txt", { type: "text/plain" });

    const queue = buildDocumentUploadQueue([validPdf, invalidText]);

    expect(queue).toEqual([
      expect.objectContaining({
        name: "cipc.pdf",
        size: validPdf.size,
        sizeLabel: "2 B",
        valid: true,
        error: null,
      }),
      expect.objectContaining({
        name: "notes.txt",
        size: invalidText.size,
        sizeLabel: "4 B",
        valid: false,
        error: "File must be a JPG, PNG, or PDF",
      }),
    ]);
  });
});
