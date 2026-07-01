# Manual Intake — Document Received/Outstanding Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the `/admin/b2b/manual-intake` Documents (and Review) step, show each expected document as Received or Outstanding — accurate across sessions — and gate "Documents complete" on all required documents being present.

**Architecture:** A new pure module `lib/onboarding/document-checklist.ts` owns the required-set config + received/outstanding computation (unit-tested). The manual-intake GET prefill returns already-uploaded document types; the upload modal reports uploaded types via a new optional callback; the wizard page tracks a `receivedTypes` array (seeded from prefill, merged from uploads) and renders the checklist. No changes to upload storage or the POST intake payload.

**Tech Stack:** Next.js 15 (client page + route handler), React `useState`, Supabase service-role read (`svc()`), shadcn/ui, phosphor icons, Jest.

**Worktree/branch:** `/home/circletel/.worktrees/manual-intake-clean` on `feat/manual-intake-doc-checklist` (off `main` @ `0c649067`). Paths below are relative to that worktree.

**Spec:** `docs/superpowers/specs/2026-07-01-manual-intake-doc-checklist-design.md`

---

## Verification approach

- Unit tests: `computeDocChecklist` (new suite) + extended route GET test — run with `npx jest <paths>`.
- `npm run type-check:memory` must introduce **zero** new errors in touched files.
- A `next build` is NOT run locally (slow/OOM-prone); staging deploy validates the build. UI verified visually on staging.

Commit after each task.

---

## File Structure

- **New:** `lib/onboarding/document-checklist.ts` — pure config + `computeDocChecklist`.
- **New:** `lib/onboarding/__tests__/document-checklist.test.ts` — unit tests.
- **Modify:** `app/api/admin/b2b/manual-intake/route.ts` — GET prefill returns `documents: string[]`.
- **Modify:** `app/api/admin/b2b/manual-intake/__tests__/route.test.ts` — mock `kyc_documents` + assert `documents`.
- **Modify:** `components/admin/onboarding/UploadDocumentModal.tsx` — optional `onUploadedTypes`.
- **Modify:** `app/admin/b2b/manual-intake/page.tsx` — `receivedTypes` state, prefill seed, checklist logic + UI.

---

## Task 1: Pure document-checklist module (TDD)

**Files:**
- Create: `lib/onboarding/document-checklist.ts`
- Test: `lib/onboarding/__tests__/document-checklist.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/onboarding/__tests__/document-checklist.test.ts`:

```ts
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

  it("requires the VAT certificate only when vatRegistered is true", () => {
    const base = ["company_registration", "id_document", "proof_of_address", "bank_statement"];
    expect(computeDocChecklist(base, true).allRequiredReceived).toBe(false);
    expect(computeDocChecklist(base, true).requiredCount).toBe(5);
    expect(computeDocChecklist([...base, "vat_certificate"], true).allRequiredReceived).toBe(true);
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest lib/onboarding/__tests__/document-checklist.test.ts`
Expected: FAIL — cannot find module `@/lib/onboarding/document-checklist`.

- [ ] **Step 3: Implement the module**

Create `lib/onboarding/document-checklist.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest lib/onboarding/__tests__/document-checklist.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/document-checklist.ts lib/onboarding/__tests__/document-checklist.test.ts
git commit -m "feat(manual-intake): document checklist module (required set + received/outstanding)"
```

---

## Task 2: GET prefill returns uploaded document types

**Files:**
- Modify: `app/api/admin/b2b/manual-intake/route.ts`
- Test: `app/api/admin/b2b/manual-intake/__tests__/route.test.ts`

- [ ] **Step 1: Extend the route test mock + add assertion (write first)**

In `app/api/admin/b2b/manual-intake/__tests__/route.test.ts`, find the `createManualIntakeSupabaseMock()` helper's `from`/table switch (the object returned per table around lines 80–160). Add a `kyc_documents` branch so its `.select("document_type").eq("customer_id", ...)` resolves to rows. Locate the `return { ... }` builder object inside the mock's `from = (table: string) => ({ ... })` and add, at the top of the builder function body, a short-circuit for `kyc_documents`:

```ts
      if (table === "kyc_documents") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  { document_type: "company_registration" },
                  { document_type: "company_registration" },
                  { document_type: "proof_of_address" },
                ],
                error: null,
              }),
          }),
        } as any;
      }
```

Then, in the existing test `"returns existing customer details mapped to manual-intake form fields"` (around line 305), after the existing `expect(body.prefill).toEqual(...)` assertion, add a distinct assertion for the new `documents` field (de-duped):

```ts
    expect(body.prefill.documents).toEqual(
      expect.arrayContaining(["company_registration", "proof_of_address"]),
    );
    expect(body.prefill.documents).toHaveLength(2);
```

> If `body.prefill` is matched with `expect.objectContaining` and `toEqual` on a full literal that would now fail because of the added `documents` key, change that assertion to `expect.objectContaining({...})` or add `documents: expect.any(Array)` to the expected object. Check the existing assertion shape and keep it passing.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest app/api/admin/b2b/manual-intake/__tests__/route.test.ts -t "returns existing customer details"`
Expected: FAIL — `body.prefill.documents` is `undefined`.

- [ ] **Step 3: Add the kyc_documents query + pass documents to mapCustomerPrefill**

In `app/api/admin/b2b/manual-intake/route.ts`, inside the `if (customerId) { ... }` block, **after** the `customer_payment_methods` query (the `paymentError` check, ~line 236) and **before** the `return NextResponse.json({ ... prefill: mapCustomerPrefill(...) })`, add:

```ts
      const { data: docRows, error: docsError } = await supabase
        .from("kyc_documents")
        .select("document_type")
        .eq("customer_id", customerId);
      if (docsError) {
        apiLogger.error("[manual-intake] documents read failed", {
          error: docsError.message,
        });
      }
      const documents = Array.from(
        new Set(
          (docRows ?? [])
            .map((row) => stringValue(asRecord(row).document_type))
            .filter((t) => t.length > 0),
        ),
      );
```

Then change the `mapCustomerPrefill({ ... })` call to pass `documents`:

```ts
        prefill: mapCustomerPrefill({
          customer: asRecord(customer),
          submission: submission ? asRecord(submission) : null,
          service: service ? asRecord(service) : null,
          paymentMethod: paymentMethod ? asRecord(paymentMethod) : null,
          documents,
        }),
```

- [ ] **Step 4: Add `documents` to `mapCustomerPrefill`**

In the same file, update `function mapCustomerPrefill(...)` (~line 70): add `documents` to the destructured params + its type, and include it in the returned object.

Change the signature block:

```ts
function mapCustomerPrefill({
  customer,
  submission,
  service,
  paymentMethod,
  documents,
}: {
  customer: JsonRecord;
  submission: JsonRecord | null;
  service: JsonRecord | null;
  paymentMethod: JsonRecord | null;
  documents: string[];
}) {
```

And in its `return { customer: {...}, form: {...} }`, add a top-level `documents` key (sibling of `customer` and `form`):

```ts
  return {
    customer: { /* unchanged */ },
    form: { /* unchanged */ },
    documents,
  };
```

> Do not otherwise change `customer`/`form`. Leave the object bodies exactly as they are.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest app/api/admin/b2b/manual-intake/__tests__/route.test.ts`
Expected: PASS (all GET + POST tests, including the new documents assertion).

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/b2b/manual-intake/route.ts app/api/admin/b2b/manual-intake/__tests__/route.test.ts
git commit -m "feat(manual-intake): GET prefill returns uploaded document types"
```

---

## Task 3: Upload modal reports uploaded document types (additive)

**Files:**
- Modify: `components/admin/onboarding/UploadDocumentModal.tsx`

- [ ] **Step 1: Add the optional prop to the props interface**

In `UploadDocumentModalProps` (the interface with `onUploaded: (count: number) => void;`, ~line 44), add an optional sibling:

```ts
  onUploaded: (count: number) => void;
  onUploadedTypes?: (types: DocType[]) => void;
```

- [ ] **Step 2: Destructure the new prop**

In the component's destructured props (where `onUploaded,` appears, ~line 60), add `onUploadedTypes,` next to it:

```ts
  onUploaded,
  onUploadedTypes,
```

- [ ] **Step 3: Call it where `onUploaded(uploaded.length)` is called**

Find the success line `onUploaded(uploaded.length);` (~line 215) and add, immediately after it:

```ts
    onUploaded(uploaded.length);
    onUploadedTypes?.(uploaded.map((u) => u.type as DocType));
```

> `uploaded` is the `{ type, name }[]` state already tracked. `DocType` is already imported in this file (used by the `docType` state). If not imported, add `import { ... DocType } from "@/lib/onboarding/document-upload";` to the existing import from that module — verify before adding.

- [ ] **Step 4: Verify compile**

Run: `npm run type-check:memory 2>&1 | grep "components/admin/onboarding/UploadDocumentModal.tsx" || echo "FILE CLEAN"`
Expected: `FILE CLEAN`. (No behavior change for existing callers — the prop is optional.)

- [ ] **Step 5: Commit**

```bash
git add components/admin/onboarding/UploadDocumentModal.tsx
git commit -m "feat(upload-modal): optional onUploadedTypes callback"
```

---

## Task 4: Wire receivedTypes + checklist logic into the page

**Files:**
- Modify: `app/admin/b2b/manual-intake/page.tsx`

> Locate edits by the quoted anchor code, not line numbers. Re-read each region before editing.

- [ ] **Step 1: Import the checklist module**

Add near the other `@/lib/onboarding` / component imports at the top of the file:

```tsx
import { computeDocChecklist } from "@/lib/onboarding/document-checklist";
```

- [ ] **Step 2: Replace `uploadedCount` state with `receivedTypes`**

Find `const [uploadedCount, setUploadedCount] = useState(0);` and replace with:

```tsx
  const [receivedTypes, setReceivedTypes] = useState<string[]>([]);
```

- [ ] **Step 3: Add the derived checklist (near other derived values)**

Immediately after the `receivedTypes` state (or alongside the other `const ... = useMemo/derived` values before `stepErrors`), add:

```tsx
  const docChecklist = computeDocChecklist(receivedTypes, form.vatRegistered);
```

- [ ] **Step 4: Drive documents readiness off the checklist**

Find `const documentsReady = uploadedCount > 0;` and replace with:

```tsx
  const documentsReady = docChecklist.allRequiredReceived;
```

Then find the `stepErrors` documents branch (currently):

```tsx
    if (stepId === "documents") {
      return uploadedCount > 0
        ? []
        : [{ key: "documents", msg: "Upload at least one document for this onboarding pack." }];
    }
```

Replace it with:

```tsx
    if (stepId === "documents") {
      return docChecklist.allRequiredReceived
        ? []
        : [
            {
              key: "documents",
              msg: `Upload the required documents (${
                docChecklist.requiredCount - docChecklist.receivedRequiredCount
              } outstanding).`,
            },
          ];
    }
```

- [ ] **Step 5: Seed receivedTypes on customer prefill**

In `loadCustomerPrefill`, find `setSelectedCustomer(prefill.customer);` and add after it:

```tsx
      setReceivedTypes(
        Array.isArray((prefill as { documents?: string[] }).documents)
          ? ((prefill as { documents?: string[] }).documents as string[])
          : [],
      );
```

> The `prefill` object is typed via `ManualIntakePrefill`. Update that interface too: find `interface ManualIntakePrefill {` and add `documents?: string[];` as a member, so the cast above is unnecessary — prefer:
> ```tsx
> interface ManualIntakePrefill {
>   customer: SelectedCustomer;
>   form: Partial<FormState>;
>   documents?: string[];
> }
> ```
> then simply: `setReceivedTypes(prefill.documents ?? []);`

- [ ] **Step 6: Reset receivedTypes in `clearSelectedCustomer`**

Find `setUploadedCount(0);` inside `clearSelectedCustomer` and replace with:

```tsx
    setReceivedTypes([]);
```

- [ ] **Step 7: Merge uploaded types from the modal**

Find the `<UploadDocumentModal ... onUploaded={(count) => {...}} />` usage. Replace its `onUploaded` handler with a no-op-count keeper and add `onUploadedTypes`:

```tsx
          onUploaded={() => {}}
          onUploadedTypes={(types) =>
            setReceivedTypes((current) =>
              Array.from(new Set([...current, ...types])),
            )
          }
```

- [ ] **Step 8: Verify compile**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake/page.tsx" || echo "FILE CLEAN"`
Expected: `FILE CLEAN` — but note the UI still references removed `uploadedCount` in the Documents/Review JSX; those are fixed in Task 5. If type-check reports `uploadedCount` errors in this file, that is expected and resolved by Task 5. Proceed to Task 5 before committing.

- [ ] **Step 9: (no commit yet — Task 5 completes the page change)**

---

## Task 5: Render the checklist in Documents + Review steps

**Files:**
- Modify: `app/admin/b2b/manual-intake/page.tsx`

- [ ] **Step 1: Replace the Documents-step static grid + status pill**

In the `activeStep === "documents"` block, find the "Upload target" card. Replace its header `StatusPill` label and the static 6-chip grid.

Replace the `StatusPill` in that card header (the one with `label={documentsReady ? \`${uploadedCount} uploaded\` : ...}`) with:

```tsx
                    <StatusPill
                      ready={documentsReady}
                      warning={canUploadDocuments && !documentsReady}
                      label={`${docChecklist.receivedRequiredCount}/${docChecklist.requiredCount} required`}
                    />
```

Replace the static chip grid — the block that maps the hardcoded string array
`["Company registration", "VAT certificate", ...].map((item) => (<div ...>{item}</div>))` — with a checklist grid driven by `docChecklist.rows`:

```tsx
                  <ul className="divide-y divide-gray-100">
                    {docChecklist.rows.map((row) => (
                      <li
                        key={row.key}
                        className="flex items-center justify-between gap-3 px-4 py-2.5"
                      >
                        <span className="flex items-center gap-2 text-sm text-gray-800">
                          {row.received ? (
                            <PiCheckCircleBold className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <PiWarningCircleBold
                              className={
                                row.required
                                  ? "h-4 w-4 text-circleTel-orange"
                                  : "h-4 w-4 text-gray-300"
                              }
                            />
                          )}
                          {row.label}
                          <span
                            className={
                              row.required
                                ? "rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-circleTel-orange-dark"
                                : "rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
                            }
                          >
                            {row.required ? "Required" : "Optional"}
                          </span>
                        </span>
                        <span
                          className={
                            row.received
                              ? "text-xs font-semibold text-emerald-700"
                              : "text-xs font-semibold text-gray-500"
                          }
                        >
                          {row.received ? "Received" : "Outstanding"}
                        </span>
                      </li>
                    ))}
                  </ul>
```

> Keep the surrounding "Upload target" card container and the upload dropzone/button unchanged. Only the header pill label and the inner grid change.

- [ ] **Step 2: Replace the Review-step Documents card body**

In the `activeStep === "review"` block, find the Documents review card (the one whose header `<h3>` is `Documents` with a `ReviewTag ready={stepReadiness.documents}`). Replace its body — the single `ReviewRow` that reads
`uploadedCount > 0 ? \`${uploadedCount} uploaded in this session\` : ...` — with a per-row summary:

```tsx
                    <div className="grid gap-2">
                      {docChecklist.rows
                        .filter((row) => row.required || row.received)
                        .map((row) => (
                          <div
                            key={row.key}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-gray-700">
                              {row.label}
                              {!row.required && (
                                <span className="ml-1 text-xs text-gray-400">
                                  (optional)
                                </span>
                              )}
                            </span>
                            <span
                              className={
                                row.received
                                  ? "font-semibold text-emerald-700"
                                  : "font-semibold text-circleTel-orange-dark"
                              }
                            >
                              {row.received ? "Received" : "Outstanding"}
                            </span>
                          </div>
                        ))}
                    </div>
```

- [ ] **Step 3: Confirm no `uploadedCount` references remain**

Run: `grep -n "uploadedCount" app/admin/b2b/manual-intake/page.tsx || echo "NONE LEFT"`
Expected: `NONE LEFT`.

- [ ] **Step 4: Verify compile**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake/page.tsx" || echo "FILE CLEAN"`
Expected: `FILE CLEAN`.

- [ ] **Step 5: Commit**

```bash
git add app/admin/b2b/manual-intake/page.tsx
git commit -m "feat(manual-intake): received/outstanding document checklist in Documents + Review"
```

---

## Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the feature test suites**

Run:
```bash
npx jest lib/onboarding/__tests__/document-checklist.test.ts \
  app/api/admin/b2b/manual-intake/__tests__/route.test.ts
```
Expected: all pass (6 checklist + the GET/POST route tests incl. the new `documents` assertion).

- [ ] **Step 2: Type-check touched files clean**

Run:
```bash
npm run type-check:memory 2>&1 | grep -E "lib/onboarding/document-checklist|app/api/admin/b2b/manual-intake/route|components/admin/onboarding/UploadDocumentModal|app/admin/b2b/manual-intake/page" || echo "ALL TOUCHED FILES CLEAN"
```
Expected: `ALL TOUCHED FILES CLEAN`.

- [ ] **Step 3: Confirm no payload/upload-contract drift**

Run:
```bash
git diff origin/main -- app/admin/b2b/manual-intake/page.tsx | grep -E "^\+.*(payload =|/api/admin/b2b/manual-intake\"|body: JSON.stringify)" || echo "NO INTAKE PAYLOAD CHANGES"
```
Expected: `NO INTAKE PAYLOAD CHANGES`.

- [ ] **Step 4: Dev-server visual acceptance (`npm run dev:memory`, open `/admin/b2b/manual-intake`)**

- [ ] Documents step shows all 7 rows; the 4 always-required show a "Required" pill and "Outstanding", the two optional show "Optional".
- [ ] With VAT toggled on (step 1), the VAT certificate row becomes "Required"; toggled off, it becomes "Optional".
- [ ] After saving the onboarding and uploading a document classified as e.g. "Company registration", that row flips to a green ✓ **Received**, and the header pill increments (e.g. `1/4 required`).
- [ ] "Submit for Vetting" stays disabled until all required rows are Received (and the other steps are complete); the missing-items box / % bar reflect the documents gate.
- [ ] Reopening an existing customer via search prefill shows previously uploaded document types as Received (cross-session).
- [ ] Review step Documents card lists each required (and any received optional) doc as Received/Outstanding, and its Complete/Incomplete tag matches.

---

## Self-Review (completed during authoring)

- **Spec coverage:** required-set config + smart-VAT + id_document/director_id matching → Task 1; cross-session prefill `documents` → Task 2; additive modal callback → Task 3; `receivedTypes` state + gate + Documents/Review UI → Tasks 4–5; tests → Tasks 1,2,6. ✓
- **Placeholder scan:** every code step shows complete code; no TBD/TODO. ✓
- **Type consistency:** `computeDocChecklist(receivedTypes: string[], vatRegistered: boolean)` and its result fields (`rows`, `requiredCount`, `receivedRequiredCount`, `allRequiredReceived`) are used identically in Tasks 4–5; `onUploadedTypes?: (types: DocType[]) => void` consistent Task 3↔4; `prefill.documents?: string[]` consistent Task 2↔4. ✓
- **Scope:** single feature, 4 files + 2 test files; no payload/storage change. ✓
