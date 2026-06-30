# Manual B2B Onboarding — v1.0 Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 4 remaining gaps between the in-progress `/admin/b2b/manual-intake` wizard and the approved v1.0 design — inline field validation + per-step error summary, a required-items % progress bar, a step chip / sub-header, and a discard-confirm modal + per-section review tags.

**Architecture:** Single-file, client-only enhancement of the existing React wizard. A self-contained validation layer (pure functions + `visited`/`attempted` state) becomes the single source of truth for both inline field errors and the existing per-step "ready" booleans, so the stepper, status rail, and submit gate never disagree. No API, schema, DB, or payload changes.

**Tech Stack:** Next.js 15 (client component), React `useState`/`useRef`/`useMemo`, shadcn/ui (`Input`, `Select`, `Textarea`, `Checkbox`, `Dialog`), Tailwind (`circleTel-*` tokens), phosphor icons (`react-icons/pi`), `sonner` toasts.

**Worktree:** `/home/circletel/.worktrees/manual-intake-prefill-upload` (branch `codex/manual-onboarding-stepper`). All paths below are relative to that worktree root.

**The single file changed:** `app/admin/b2b/manual-intake/page.tsx`

---

## Verification approach (read first)

This admin page has **no component/unit test harness** (consistent with the rest of `app/admin/**`). Per the project's "Real tests or no tests" rule, this plan does **not** fabricate component tests that would only mock React. Verification is:

1. `npm run type-check:memory` — must introduce **zero new** errors in this file (the repo carries ~295 pre-existing errors elsewhere; only *this file* must stay clean).
2. Dev-server visual check (`npm run dev:memory`, open `/admin/b2b/manual-intake`) against the acceptance checks listed in Task 9.

Commit after each task so the work is bisectable.

---

## Design reference — validation maps to the REAL fields

The WIP keeps single address textareas (not v1.0's split address), so postal/city/street validators do **not** apply. Confirmed decisions:

- **A1** — `registrationNumber` is **required-only** (no `2023/123456/07` CIPC regex); the field doubles as "owner ID" for Sole Proprietor / Partnership / Trust.
- **A2** — No postal-code/split-address validation (single textareas).
- **A3** — The currently-dead mandate checkbox is wired to new client state `mandateAuthorised` and required when a debit order is captured.
- **A4** — `siteAddress` is treated as **required** (matches the existing `contactReady` logic in the WIP).

---

## Task 1: Validation core (pure helpers + field-error map)

**Files:**
- Modify: `app/admin/b2b/manual-intake/page.tsx` (add module-level helpers after the existing `trimOrUndefined` function, ~L189-192)

- [ ] **Step 1: Add validators and the field-error function**

Insert immediately **after** the existing `trimOrUndefined` function (currently ends ~L192), before `function authHeaders()`:

```tsx
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const phoneOk = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.length === 10 || (d.length === 11 && d.startsWith("27"));
};
const vatOk = (v: string) => /^\d{10}$/.test(v.trim());
const acctOk = (v: string) => /^\d{6,13}$/.test(v.replace(/\s/g, ""));
const branchOk = (v: string) => /^\d{6}$/.test(v.trim());

// Returns "" when valid, otherwise a human message. Pure — depends only on args.
function fieldError(
  key: string,
  form: FormState,
  mandateAuthorised: boolean,
): string {
  switch (key) {
    case "businessName":
      return form.businessName.trim() ? "" : "Enter the registered business name.";
    case "registrationNumber":
      return form.registrationNumber.trim()
        ? ""
        : "Enter the registration or owner ID.";
    case "vatNumber":
      if (!form.vatRegistered) return "";
      if (!form.vatNumber.trim()) return "Enter the 10-digit VAT number.";
      return vatOk(form.vatNumber) ? "" : "VAT number must be 10 digits.";
    case "registeredAddress":
      return form.registeredAddress.trim() ? "" : "Enter the registered address.";
    case "contactName":
      return form.contactName.trim() ? "" : "Enter the contact person's name.";
    case "email":
      if (!form.email.trim()) return "Enter an email address.";
      return emailOk(form.email) ? "" : "Enter a valid email address.";
    case "phone":
      if (!form.phone.trim()) return "Enter a contact number.";
      return phoneOk(form.phone) ? "" : "Enter a valid 10-digit number.";
    case "siteAddress":
      return form.siteAddress.trim() ? "" : "Enter the service address.";
    case "packageName":
      return form.packageName.trim() ? "" : "Enter the package name.";
    case "serviceType":
      return form.serviceType.trim() ? "" : "Enter the service type.";
    case "monthlyPrice":
      return Number(form.monthlyPrice) > 0
        ? ""
        : "Enter a monthly price greater than zero.";
    case "accountHolderName":
      return form.accountHolderName.trim() ? "" : "Enter the account holder name.";
    case "bankName":
      return form.bankName.trim() ? "" : "Enter the bank name.";
    case "accountNumber":
      if (!form.accountNumber.trim()) return "Enter the account number.";
      return acctOk(form.accountNumber) ? "" : "Account number must be 6-13 digits.";
    case "branchCode":
      if (!form.branchCode.trim()) return "Enter the branch code.";
      return branchOk(form.branchCode) ? "" : "Branch code must be 6 digits.";
    case "mandate":
      return mandateAuthorised ? "" : "Authorise the debit order mandate to continue.";
    default:
      return "";
  }
}
```

- [ ] **Step 2: Add the step→field-keys map**

Add immediately after the `intakeSteps` array (currently ends ~L180):

```tsx
function stepFieldKeys(stepId: IntakeStepId, includeDebitOrder: boolean): string[] {
  switch (stepId) {
    case "customer":
      return ["businessName", "registrationNumber", "vatNumber", "registeredAddress"];
    case "contact":
      return ["contactName", "email", "phone", "siteAddress"];
    case "service":
      return ["packageName", "serviceType", "monthlyPrice"];
    case "debit":
      return includeDebitOrder
        ? ["accountHolderName", "bankName", "accountNumber", "branchCode", "mandate"]
        : [];
    case "documents":
    case "review":
    default:
      return [];
  }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake" || echo "CLEAN"`
Expected: `CLEAN` (no errors referencing this file).

- [ ] **Step 4: Commit**

```bash
git add app/admin/b2b/manual-intake/page.tsx
git commit -m "feat(manual-intake): add validation helpers and step field map"
```

---

## Task 2: Wire validation state and make readiness derive from it

**Files:**
- Modify: `app/admin/b2b/manual-intake/page.tsx` (component body — new state, `stepErrors`, readiness refactor, `errFor`)

- [ ] **Step 1: Add new state + refs**

In `ManualB2BIntakePage`, alongside the existing `useState` calls (after `const [activeStep, setActiveStep] = useState<IntakeStepId>("customer");`, ~L319), add:

```tsx
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState<Partial<Record<IntakeStepId, boolean>>>({});
  const [mandateAuthorised, setMandateAuthorised] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 2: Import `useRef`**

Modify the React import (currently `import { FormEvent, useMemo, useState } from "react";`, L4) to:

```tsx
import { FormEvent, useMemo, useRef, useState } from "react";
```

- [ ] **Step 3: Add `stepErrors` + `blur` + `errFor`; replace the readiness block**

**Replace** the existing readiness block (the contiguous lines currently defining `customerReady`, `contactReady`, `serviceReady`, `documentsReady`, `debitReady`, `stepReadiness`, `allRequiredReady`, `missingItems` — roughly L342-387) with:

```tsx
  const stepErrors = (stepId: IntakeStepId): { key: string; msg: string }[] => {
    if (stepId === "documents") {
      return uploadedCount > 0
        ? []
        : [{ key: "documents", msg: "Upload at least one document for this onboarding pack." }];
    }
    return stepFieldKeys(stepId, form.includeDebitOrder)
      .map((key) => ({ key, msg: fieldError(key, form, mandateAuthorised) }))
      .filter((entry) => entry.msg.length > 0);
  };

  const customerReady = stepErrors("customer").length === 0;
  const contactReady = stepErrors("contact").length === 0;
  const serviceReady = stepErrors("service").length === 0;
  const documentsReady = uploadedCount > 0;
  const debitReady = stepErrors("debit").length === 0;
  const stepReadiness: Record<IntakeStepId, boolean> = {
    customer: customerReady,
    contact: contactReady,
    service: serviceReady,
    documents: documentsReady,
    debit: debitReady,
    review:
      customerReady && contactReady && serviceReady && documentsReady && debitReady,
  };
  const allRequiredReady = stepReadiness.review;
  const completion = Math.round(
    ([customerReady, contactReady, serviceReady, documentsReady, debitReady].filter(
      Boolean,
    ).length /
      5) *
      100,
  );
  const missingItems = [
    !customerReady ? "Customer record" : null,
    !contactReady ? "Contact & site details" : null,
    !serviceReady ? "Billable service" : null,
    !documentsReady ? "Documents" : null,
    !debitReady ? "Debit order" : null,
  ].filter((item): item is string => item !== null);
  const visibleStepErrors = attempted[activeStep] ? stepErrors(activeStep) : [];
```

> Note: `debitReady` is now `true` when "Capture debit order" is off (its field key list is empty), preserving the WIP's prior behaviour.

- [ ] **Step 4: Add `blur` + `errFor` helpers**

Add next to the existing `update` function (~L422):

```tsx
  function blur(key: string) {
    setVisited((current) => ({ ...current, [key]: true }));
  }

  function errFor(key: string) {
    return visited[key] || attempted[activeStep]
      ? fieldError(key, form, mandateAuthorised)
      : "";
  }

  function errClass(key: string) {
    return errFor(key)
      ? "border-red-400 focus-visible:ring-red-400/40"
      : "";
  }
```

- [ ] **Step 5: Reset new state in `clearSelectedCustomer`**

In `clearSelectedCustomer` (~L508-515), after `setUploadedCount(0);` add:

```tsx
    setVisited({});
    setAttempted({});
    setMandateAuthorised(false);
```

- [ ] **Step 6: Verify compile**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake" || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 7: Commit**

```bash
git add app/admin/b2b/manual-intake/page.tsx
git commit -m "feat(manual-intake): derive step readiness from field validation"
```

---

## Task 3: Inline error display on every validated field

**Files:**
- Modify: `app/admin/b2b/manual-intake/page.tsx` (`Field` component + each validated field's JSX)

- [ ] **Step 1: Extend the `Field` component to render an error**

**Replace** the `Field` function (~L211-233) with:

```tsx
function Field({
  id,
  label,
  children,
  className,
  error,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-gray-500"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-xs font-medium text-red-600"
          role="alert"
        >
          <PiWarningCircleBold className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Apply the error wiring to each validated field**

For **each** field key below, in its existing `<Field>`/control JSX:
1. Add `error={errFor("KEY")}` to the `<Field>`.
2. Add `onBlur={() => blur("KEY")}` and `className={errClass("KEY")}` and `aria-invalid={Boolean(errFor("KEY"))}` to its `Input`/`Textarea`, **or** `className={errClass("KEY")}` on the `SelectTrigger`.

**Template — text Input** (example for `businessName`, ~L899-908):

```tsx
<Field id="businessName" label="Registered business name" error={errFor("businessName")}>
  <Input
    id="businessName"
    value={form.businessName}
    onChange={(event) => update("businessName", event.target.value)}
    onBlur={() => blur("businessName")}
    aria-invalid={Boolean(errFor("businessName"))}
    className={errClass("businessName")}
    required
  />
</Field>
```

**Template — Textarea** (example for `registeredAddress`, ~L974-988):

```tsx
<Field
  id="registeredAddress"
  label="Registered address"
  className="md:col-span-2"
  error={errFor("registeredAddress")}
>
  <Textarea
    id="registeredAddress"
    value={form.registeredAddress}
    onChange={(event) => update("registeredAddress", event.target.value)}
    onBlur={() => blur("registeredAddress")}
    aria-invalid={Boolean(errFor("registeredAddress"))}
    className={`min-h-28 ${errClass("registeredAddress")}`}
    required
  />
</Field>
```

**Template — VAT combined field** (~L947-973). The VAT checkbox + number share one `Field`; keep the checkbox box, add error wiring to the number Input and the `Field`:

```tsx
<Field id="vatNumber" label="VAT number" error={errFor("vatNumber")}>
  <div className="flex gap-3">
    <div className="flex h-10 items-center gap-2 rounded-md border border-gray-200 px-3">
      <Checkbox
        id="vatRegistered"
        checked={form.vatRegistered}
        onCheckedChange={(checked) => {
          update("vatRegistered", checked === true);
          blur("vatNumber");
        }}
      />
      <Label htmlFor="vatRegistered" className="text-sm text-gray-700">VAT</Label>
    </div>
    <Input
      id="vatNumber"
      value={form.vatNumber}
      onChange={(event) => update("vatNumber", event.target.value)}
      onBlur={() => blur("vatNumber")}
      aria-invalid={Boolean(errFor("vatNumber"))}
      className={errClass("vatNumber")}
      disabled={!form.vatRegistered}
    />
  </div>
</Field>
```

**Apply the Input/Textarea template to these keys** (control type in parens):
- `businessName` (Input), `registrationNumber` (Input), `registeredAddress` (Textarea) — Customer step
- `contactName` (Input), `email` (Input), `phone` (Input), `siteAddress` (Textarea) — Contact step
- `packageName` (Input), `serviceType` (Input), `monthlyPrice` (Input) — Service step
- `accountHolderName` (Input), `bankName` (Input), `accountNumber` (Input), `branchCode` (Input) — Debit step
- `vatNumber` — via the VAT combined template above

> Do **not** add error wiring to optional fields (`clinicName`, `province`, `activationDate`) or to Selects with a default (`segment`, `entityType`, `billingDay`, `accountType`) — they always hold a valid value and have no `fieldError` case.

- [ ] **Step 3: Verify compile**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake" || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 4: Commit**

```bash
git add app/admin/b2b/manual-intake/page.tsx
git commit -m "feat(manual-intake): inline validation errors on form fields"
```

---

## Task 4: Wire the mandate checkbox + gate Next/Submit with the error summary

**Files:**
- Modify: `app/admin/b2b/manual-intake/page.tsx` (mandate checkbox, `goToNextStep`, `handleSubmit`, error-summary box JSX)

- [ ] **Step 1: Bind the dead mandate checkbox**

**Replace** the debit mandate block (~L1334-1342) with:

```tsx
                <div
                  className={`rounded-md border p-4 ${
                    errFor("mandate") ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                >
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <Checkbox
                      checked={mandateAuthorised}
                      disabled={!form.includeDebitOrder}
                      onCheckedChange={(checked) => {
                        setMandateAuthorised(checked === true);
                        blur("mandate");
                      }}
                    />
                    <span>
                      I/we authorise CircleTel to debit the customer account
                      according to the selected billable service.
                    </span>
                  </label>
                  {errFor("mandate") ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
                      <PiWarningCircleBold className="h-3.5 w-3.5 shrink-0" />
                      {errFor("mandate")}
                    </p>
                  ) : null}
                </div>
```

- [ ] **Step 2: Gate `goToNextStep` on the current step's errors**

**Replace** `goToNextStep` (~L431-433) with:

```tsx
  function goToNextStep() {
    const errs = stepErrors(activeStep);
    if (errs.length > 0) {
      setAttempted((current) => ({ ...current, [activeStep]: true }));
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    goToStep(Math.min(activeStepIndex + 1, intakeSteps.length - 1));
  }
```

- [ ] **Step 3: Mark the offending step `attempted` in `handleSubmit`**

In `handleSubmit`, in the **save-intent guard** (~L529-535) add `setAttempted` before the toast:

```tsx
    if (!customerReady || !contactReady) {
      const target: IntakeStepId = !customerReady ? "customer" : "contact";
      setActiveStep(target);
      setAttempted((current) => ({ ...current, [target]: true }));
      toast.error(
        "Complete customer, contact, and site details before saving onboarding.",
      );
      return;
    }
```

And in the **vetting-intent guard** (~L537-546), set `attempted` on the first missing step:

```tsx
    if (submitIntent === "vetting" && !allRequiredReady) {
      const firstMissingStep = intakeSteps
        .slice(0, 5)
        .find((step) => !stepReadiness[step.id]);
      if (firstMissingStep) {
        setActiveStep(firstMissingStep.id);
        setAttempted((current) => ({ ...current, [firstMissingStep.id]: true }));
      }
      toast.error(
        "Complete all required onboarding items before submitting for vetting.",
      );
      return;
    }
```

- [ ] **Step 4: Render the per-step error summary box**

Inside the step `SectionCard`, immediately **after** the description paragraph (`<p className="-mt-2 mb-6 ...">{activeStepMeta.description}</p>`, ~L770-772) and **before** the `{activeStep === "customer" && ...}` block, insert:

```tsx
            {visibleStepErrors.length > 0 ? (
              <div
                ref={summaryRef}
                tabIndex={-1}
                role="alert"
                className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 outline-none"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <PiWarningCircleBold className="h-4 w-4" />
                  Please fix {visibleStepErrors.length}{" "}
                  {visibleStepErrors.length === 1 ? "item" : "items"} on this step:
                </p>
                <ul className="mt-2 list-disc pl-6 text-sm text-red-700">
                  {visibleStepErrors.map((entry) => (
                    <li key={entry.key}>{entry.msg}</li>
                  ))}
                </ul>
              </div>
            ) : null}
```

- [ ] **Step 5: Verify compile**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake" || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 6: Commit**

```bash
git add app/admin/b2b/manual-intake/page.tsx
git commit -m "feat(manual-intake): mandate gate + per-step error summary"
```

---

## Task 5: Required-items % progress bar in the status rail

**Files:**
- Modify: `app/admin/b2b/manual-intake/page.tsx` (status rail "Required items" section)

- [ ] **Step 1: Add the progress bar above the required-items list**

In the status-rail `SectionCard`, **replace** the "Required items" header line (`<p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Required items</p>`, ~L1644-1646) with:

```tsx
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Required items
                  </p>
                  <span className="text-xs font-semibold text-gray-700">
                    {completion}%
                  </span>
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-circleTel-orange transition-all"
                    style={{ width: `${completion}%` }}
                    role="progressbar"
                    aria-valuenow={completion}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Required items complete"
                  />
                </div>
```

- [ ] **Step 2: Verify compile + commit**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake" || echo "CLEAN"`
Expected: `CLEAN`

```bash
git add app/admin/b2b/manual-intake/page.tsx
git commit -m "feat(manual-intake): required-items progress bar in status rail"
```

---

## Task 6: Step chip / sub-header

**Files:**
- Modify: `app/admin/b2b/manual-intake/page.tsx` (page heading block)

- [ ] **Step 1: Add the step chip beneath the subtitle**

**Replace** the heading `<div>` (the block containing `<h1>Manual B2B Onboarding</h1>` and its `<p>`, ~L651-658) with:

```tsx
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
            Manual B2B Onboarding
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Admin-assisted capture for emailed client onboarding packs
          </p>
          <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-circleTel-orange-dark">
            Step {activeStepIndex + 1} of {intakeSteps.length}
            <span className="text-gray-400">·</span>
            {activeStepMeta.label}
          </span>
        </div>
```

- [ ] **Step 2: Verify compile + commit**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake" || echo "CLEAN"`
Expected: `CLEAN`

```bash
git add app/admin/b2b/manual-intake/page.tsx
git commit -m "feat(manual-intake): step chip sub-header"
```

---

## Task 7: Discard-confirm modal

**Files:**
- Modify: `app/admin/b2b/manual-intake/page.tsx` (Dialog import, Discard button handler, modal JSX)

- [ ] **Step 1: Import the Dialog primitives**

Add after the Checkbox import (~L23):

```tsx
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
```

- [ ] **Step 2: Point the Discard button at the confirm state**

**Replace** the existing "Discard Onboarding" button (~L1738-1745) with:

```tsx
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setConfirmDiscard(true)}
                >
                  Discard Onboarding
                </Button>
```

- [ ] **Step 3: Render the confirm dialog**

Add immediately **before** the closing `</main>` (after the `UploadDocumentModal` block, ~L1806):

```tsx
      <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard this onboarding?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            All captured details will be cleared. This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDiscard(false)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                clearSelectedCustomer();
                setConfirmDiscard(false);
                toast.success("Onboarding discarded.");
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
```

- [ ] **Step 4: Verify compile + commit**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake" || echo "CLEAN"`
Expected: `CLEAN`

```bash
git add app/admin/b2b/manual-intake/page.tsx
git commit -m "feat(manual-intake): confirm before discarding onboarding"
```

---

## Task 8: Per-section Complete/Incomplete tags on review cards

**Files:**
- Modify: `app/admin/b2b/manual-intake/page.tsx` (review step — add a reusable tag + place it in each card header)

- [ ] **Step 1: Add a `ReviewTag` helper component**

Add next to the existing `ReviewRow` function (~L293-304):

```tsx
function ReviewTag({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
      <PiCheckCircleBold className="h-3.5 w-3.5" />
      Complete
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-circleTel-orange-dark">
      <PiWarningCircleBold className="h-3.5 w-3.5" />
      Incomplete
    </span>
  );
}
```

- [ ] **Step 2: Add the tag to each review card header**

In the review step, each of the 5 review cards has a header `<div className="mb-4 flex items-center justify-between">` containing an `<h3>` and an Edit `<Button>`. For each, wrap the `<h3>` and tag in a flex group so the header reads `[title] [tag] ........ [Edit]`. **Replace** each card's `<h3>…</h3>` line with the title + tag pair below (the matching `stepReadiness` key per card):

- Customer Record card (~L1379-1381):
```tsx
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-950">Customer Record</h3>
                        <ReviewTag ready={stepReadiness.customer} />
                      </div>
```
- Contact & Site card (~L1422-1424):
```tsx
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-950">Contact &amp; Site</h3>
                        <ReviewTag ready={stepReadiness.contact} />
                      </div>
```
- Billable Service card (~L1455-1457):
```tsx
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-950">Billable Service</h3>
                        <ReviewTag ready={stepReadiness.service} />
                      </div>
```
- Documents card (~L1487-1489):
```tsx
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-950">Documents</h3>
                        <ReviewTag ready={stepReadiness.documents} />
                      </div>
```
- Debit Order card (~L1511-1513):
```tsx
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-950">Debit Order</h3>
                        <ReviewTag ready={stepReadiness.debit} />
                      </div>
```

> Each replacement swaps a single `<h3>` for the `<div>` group; the sibling Edit `<Button>` and the wrapping `mb-4 flex items-center justify-between` header are unchanged, so the tag sits left, Edit stays right.

- [ ] **Step 3: Verify compile + commit**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake" || echo "CLEAN"`
Expected: `CLEAN`

```bash
git add app/admin/b2b/manual-intake/page.tsx
git commit -m "feat(manual-intake): complete/incomplete tags on review cards"
```

---

## Task 9: Full verification + final commit

**Files:** none (verification only)

- [ ] **Step 1: Full type-check, this file must be clean**

Run: `npm run type-check:memory 2>&1 | grep "app/admin/b2b/manual-intake/page.tsx" || echo "FILE CLEAN"`
Expected: `FILE CLEAN`

- [ ] **Step 2: Dev-server visual acceptance**

Run: `npm run dev:memory`, open `http://localhost:3000/admin/b2b/manual-intake`, and confirm:

- [ ] Heading shows the **"Step X of 6 · {label}"** chip; it updates as you change steps.
- [ ] On **Customer** step, clear "Registered business name", blur → inline red message appears; the input border turns red.
- [ ] Click **Next** with a required field empty → step does not advance, the red **"Please fix N items on this step"** summary appears and receives focus; the list matches the empty/invalid fields.
- [ ] Enter an invalid **email** (`foo@bar`) and **phone** (`123`) → both show format messages; fixing them clears the messages.
- [ ] Turn **VAT registered** on, leave VAT number blank or `123` → "VAT number must be 10 digits."; a valid 10-digit value clears it.
- [ ] On **Debit Order** with "Capture" on: invalid account number / branch code show messages; the **mandate** checkbox now toggles and is required — leaving it unchecked blocks submit and shows the red mandate message.
- [ ] Status rail shows the **"Required items — NN%"** bar; it rises from 0→100 as steps complete.
- [ ] **Discard Onboarding** opens a confirm dialog; "Keep editing" cancels, "Discard" clears the form + shows the "Onboarding discarded." toast.
- [ ] **Review** step: each section card shows a **Complete** (green) or **Incomplete** (orange) tag matching its state; Edit buttons still jump to the right step.
- [ ] With every required step complete + ≥1 document uploaded, **Submit for Vetting** enables and the existing submit flow still POSTs successfully (payload unchanged).

- [ ] **Step 3: Confirm no payload/contract drift**

Run: `git diff codex/manual-onboarding-stepper -- app/admin/b2b/manual-intake/page.tsx | grep -E "^\+.*(payload|fetch\(|/api/admin/b2b/manual-intake)" || echo "NO API CHANGES"`
Expected: only the unchanged `fetch`/`payload` lines (context), **no** added/removed API-shape lines beyond what already existed — confirming this is UI-only.

- [ ] **Step 4: Final state is already committed per-task.** If any uncommitted residue remains:

```bash
git status --short
git add app/admin/b2b/manual-intake/page.tsx
git commit -m "chore(manual-intake): v1.0 polish verification pass" || echo "nothing to commit"
```

---

## Self-Review (completed during authoring)

- **Spec coverage:** All 4 approved gaps map to tasks — validation+summary (T1–T4), % bar (T5), step chip (T6), discard confirm (T7) + review tags (T8). Mandate-wiring (A3) is in T4. ✓
- **Placeholder scan:** No TBD/TODO; every code step shows complete code. ✓
- **Type consistency:** `fieldError(key, form, mandateAuthorised)` signature is identical in T1 (definition), T2 (`stepErrors`, `errFor`), and T4. `stepFieldKeys(stepId, includeDebitOrder)` consistent T1↔T2. `errClass`/`errFor`/`blur` names consistent across T2–T4. `stepReadiness.{customer,contact,service,documents,debit}` keys consistent T2↔T8. ✓
- **Decisions honoured:** A1 (no CIPC regex — `registrationNumber` required-only), A2 (no postal/split-address validators), A3 (mandate wired + required), A4 (`siteAddress` required). ✓
