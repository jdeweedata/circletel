# Vetting Workbench Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `/admin/b2b/vetting/[submissionId]` so the document renders live in the center column (no drawer round-trip), the entity-name mismatch becomes a blocking acknowledge/override gate, and the inspector is trimmed to real, data-backed features.

**Architecture:** Single client page (`page.tsx`) + a pure helper module (`workbench-utils.ts`) + its Vitest tests. Extract one shared `DocumentViewer` used inline (center) and in the existing fullscreen `Sheet`. Add a pure `buildAutomatedChecks()` helper. No API/DB/backend changes.

**Tech Stack:** Next.js 15 (client component), React, Tailwind, `react-icons/pi`, `@/components/backend` (StatusBadge/EmptyState/LoadingState/ErrorState), `@/components/ui/{button,card,sheet}`, Vitest.

## Global Constraints

- Brand token for accent: `circleTel-orange` (Tailwind class), never raw hex.
- `StatusBadge` prop is `status` (string), NOT `label`/`text`/`children`. Variants: `success | warning | error | info | neutral`.
- No API, database, or backend route changes. Reuse `/api/admin/kyc/verify`, `/api/admin/kyc/document-url`, `/api/admin/b2b/mandate-confirm`, `/api/admin/b2b/vetting/[id]` exactly as today.
- No fabricated signals (no fake OCR %). Automated checks derive only from real fields.
- Type check command: `npm run type-check:memory` (MANDATORY before claiming done).
- Tests run with Vitest. Existing test file: `app/admin/b2b/vetting/[submissionId]/__tests__/workbench-metadata.test.ts`.

---

### Task 1: `buildAutomatedChecks()` helper (TDD)

**Files:**
- Modify: `app/admin/b2b/vetting/[submissionId]/workbench-utils.ts`
- Test: `app/admin/b2b/vetting/[submissionId]/__tests__/workbench-metadata.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces:
  ```ts
  export interface AutomatedCheckInput {
    nameMatch: boolean;
    mismatchAcknowledged: boolean;
    regNumber: string | undefined;
    hasSelectedDocument: boolean;
    submittedAt: string | null;
    slaDays?: number;
    now?: number;
  }
  export interface AutomatedCheck { key: string; label: string; pass: boolean; note: string; }
  export function buildAutomatedChecks(input: AutomatedCheckInput): AutomatedCheck[];
  ```

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/workbench-metadata.test.ts` (keep existing `buildVettingSummaryItems`/`buildDocumentDrawerSummary` tests; the `buildDocumentMetadataDraft` tests are removed in Task 3):

```ts
import { describe, it, expect } from 'vitest';
import { buildAutomatedChecks } from '../workbench-utils';

describe('buildAutomatedChecks', () => {
  const base = {
    nameMatch: true,
    mismatchAcknowledged: false,
    regNumber: '2023/547010/10',
    hasSelectedDocument: true,
    submittedAt: '2026-06-18T10:00:00.000Z',
    slaDays: 2,
    now: Date.parse('2026-06-18T12:00:00.000Z'),
  };

  it('passes holder check when names match', () => {
    const holder = buildAutomatedChecks(base).find((c) => c.key === 'holderMatch')!;
    expect(holder.pass).toBe(true);
    expect(holder.note).toBe('Match');
  });

  it('fails holder check on mismatch, passes once acknowledged', () => {
    const mismatch = buildAutomatedChecks({ ...base, nameMatch: false });
    const h1 = mismatch.find((c) => c.key === 'holderMatch')!;
    expect(h1.pass).toBe(false);
    expect(h1.note).toBe('Names differ');

    const ack = buildAutomatedChecks({ ...base, nameMatch: false, mismatchAcknowledged: true });
    const h2 = ack.find((c) => c.key === 'holderMatch')!;
    expect(h2.pass).toBe(true);
    expect(h2.note).toBe('Overridden by reviewer');
  });

  it('fails registration check when reg number missing', () => {
    const checks = buildAutomatedChecks({ ...base, regNumber: '' });
    expect(checks.find((c) => c.key === 'regNumber')!.pass).toBe(false);
  });

  it('fails document-ready check when no document selected', () => {
    const checks = buildAutomatedChecks({ ...base, hasSelectedDocument: false });
    expect(checks.find((c) => c.key === 'documentReady')!.pass).toBe(false);
  });

  it('passes SLA check within window and fails when overdue', () => {
    const withinSla = buildAutomatedChecks(base).find((c) => c.key === 'withinSla')!;
    expect(withinSla.pass).toBe(true);
    expect(withinSla.note).toBe('0 days overdue');

    const overdue = buildAutomatedChecks({
      ...base,
      submittedAt: '2026-06-10T10:00:00.000Z', // 8 days before `now`
    }).find((c) => c.key === 'withinSla')!;
    expect(overdue.pass).toBe(false);
    expect(overdue.note).toBe('6 days overdue');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/admin/b2b/vetting/'[submissionId]'/__tests__/workbench-metadata.test.ts`
Expected: FAIL — `buildAutomatedChecks is not a function` / not exported.

- [ ] **Step 3: Implement the helper**

Append to `workbench-utils.ts`:

```ts
export interface AutomatedCheckInput {
  nameMatch: boolean;
  mismatchAcknowledged: boolean;
  regNumber: string | undefined;
  hasSelectedDocument: boolean;
  submittedAt: string | null;
  slaDays?: number;
  now?: number;
}

export interface AutomatedCheck {
  key: string;
  label: string;
  pass: boolean;
  note: string;
}

export function buildAutomatedChecks({
  nameMatch,
  mismatchAcknowledged,
  regNumber,
  hasSelectedDocument,
  submittedAt,
  slaDays = 2,
  now = Date.now(),
}: AutomatedCheckInput): AutomatedCheck[] {
  const holderPass = nameMatch || mismatchAcknowledged;
  const holderNote = nameMatch
    ? 'Match'
    : mismatchAcknowledged
      ? 'Overridden by reviewer'
      : 'Names differ';

  const submittedMs = submittedAt ? Date.parse(submittedAt) : NaN;
  const daysElapsed = Number.isNaN(submittedMs)
    ? null
    : Math.floor((now - submittedMs) / (1000 * 60 * 60 * 24));
  const overdueDays = daysElapsed === null ? null : Math.max(0, daysElapsed - slaDays);
  const withinSla = overdueDays !== null && overdueDays === 0;

  return [
    { key: 'holderMatch', label: 'Holder = registered entity', pass: holderPass, note: holderNote },
    {
      key: 'regNumber',
      label: 'Registration number present',
      pass: Boolean(regNumber && regNumber.trim()),
      note: regNumber && regNumber.trim() ? 'Captured' : 'Missing',
    },
    {
      key: 'documentReady',
      label: 'Document uploaded',
      pass: hasSelectedDocument,
      note: hasSelectedDocument ? 'File available' : 'No file',
    },
    {
      key: 'withinSla',
      label: 'Submitted within SLA',
      pass: withinSla,
      note:
        overdueDays === null
          ? 'No submission date'
          : `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
    },
  ];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/admin/b2b/vetting/'[submissionId]'/__tests__/workbench-metadata.test.ts`
Expected: PASS (all `buildAutomatedChecks` tests + retained existing tests).

- [ ] **Step 5: Commit**

```bash
git add "app/admin/b2b/vetting/[submissionId]/workbench-utils.ts" "app/admin/b2b/vetting/[submissionId]/__tests__/workbench-metadata.test.ts"
git commit -m "feat(vetting): add buildAutomatedChecks helper for derived review checks"
```

---

### Task 2: Extract shared `DocumentViewer` and render live preview in the center column

**Files:**
- Modify: `app/admin/b2b/vetting/[submissionId]/page.tsx`

**Interfaces:**
- Consumes: existing state `selectedDocument`, `docUrl`, `docLoading`, `docError`, `selectedIsPdf`, `selectedIsImage`, `zoom`/`setZoom`, `docRefreshKey`/`setDocRefreshKey`, `documentDrawerOpen`/`setDocumentDrawerOpen`.
- Produces: a `DocumentViewer` component (in `page.tsx`) and a new `rotation`/`setRotation` state:
  ```tsx
  function DocumentViewer(props: {
    title: string;
    selectedDocument: SubmissionDetail['documents'][number] | null;
    docUrl: string | null;
    docLoading: boolean;
    docError: string | null;
    selectedIsPdf: boolean;
    selectedIsImage: boolean;
    zoom: number;
    rotation: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onRotate: () => void;
    onReload: () => void;
    onOpenOriginal: () => void;
    onExpand?: () => void;   // inline variant only
    onClose?: () => void;    // fullscreen variant only
    variant: 'inline' | 'fullscreen';
  }): JSX.Element;
  ```

- [ ] **Step 1: Add rotation state**

In the component state block (near `const [zoom, setZoom] = useState(100);`), add:

```tsx
const [rotation, setRotation] = useState(0);
```

In the existing effect that resets `zoom` on document change (the `useEffect` that calls `setZoom(100)` when `selectedDocument` changes), also reset rotation: add `setRotation(0);` next to each `setZoom(100)`.

- [ ] **Step 2: Add the `DocumentViewer` component**

Add this component near the other helper components at the bottom of `page.tsx` (after `DocumentPreviewCanvas`, which it supersedes — `DocumentPreviewCanvas` is deleted in Step 5):

```tsx
function DocumentViewer({
  title,
  selectedDocument,
  docUrl,
  docLoading,
  docError,
  selectedIsPdf,
  selectedIsImage,
  zoom,
  rotation,
  onZoomIn,
  onZoomOut,
  onReset,
  onRotate,
  onReload,
  onOpenOriginal,
  onExpand,
  onClose,
  variant,
}: {
  title: string;
  selectedDocument: SubmissionDetail['documents'][number] | null;
  docUrl: string | null;
  docLoading: boolean;
  docError: string | null;
  selectedIsPdf: boolean;
  selectedIsImage: boolean;
  zoom: number;
  rotation: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onRotate: () => void;
  onReload: () => void;
  onOpenOriginal: () => void;
  onExpand?: () => void;
  onClose?: () => void;
  variant: 'inline' | 'fullscreen';
}) {
  const transform = `scale(${zoom / 100}) rotate(${rotation}deg)`;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-gray-200 px-3 py-2">
        <Button size="sm" variant="outline" onClick={onZoomOut} disabled={!selectedDocument || zoom <= 70} aria-label="Zoom out" className="h-8 w-8 px-0">
          <PiMinusBold className="h-4 w-4" />
        </Button>
        <span className="min-w-14 text-center text-sm font-semibold tabular-nums text-gray-700">{zoom}%</span>
        <Button size="sm" variant="outline" onClick={onZoomIn} disabled={!selectedDocument || zoom >= 140} aria-label="Zoom in" className="h-8 w-8 px-0">
          <PiPlusBold className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onReset} disabled={!selectedDocument} className="h-8 px-2 text-xs font-semibold text-gray-700">
          Fit
        </Button>
        {selectedIsImage && (
          <Button size="sm" variant="ghost" onClick={onRotate} disabled={!selectedDocument} aria-label="Rotate" className="h-8 w-8 px-0 text-gray-700">
            <PiArrowsClockwiseBold className="h-4 w-4" />
          </Button>
        )}
        <div className="mx-1 h-6 w-px bg-gray-200" />
        <Button size="sm" variant="ghost" onClick={onReload} disabled={!selectedDocument || docLoading} aria-label="Reload" className="h-8 gap-1.5 px-2 text-xs text-gray-700">
          <PiArrowsClockwiseBold className="h-4 w-4" />
          <span className="hidden sm:inline">Reload</span>
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={onOpenOriginal} disabled={!docUrl} className="h-8 gap-1.5 px-2 text-xs">
          <PiArrowSquareOutBold className="h-4 w-4" />
          <span className="hidden sm:inline">Open original</span>
        </Button>
        {variant === 'inline' && onExpand && (
          <Button size="sm" variant="ghost" onClick={onExpand} disabled={!selectedDocument} aria-label="Expand" className="h-8 w-8 px-0 text-gray-700">
            <PiArrowSquareOutBold className="h-4 w-4" />
          </Button>
        )}
        {variant === 'fullscreen' && onClose && (
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close" className="h-8 w-8 px-0 text-gray-700">
            <PiXBold className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* canvas */}
      <div className="min-h-0 flex-1 overflow-auto bg-[#f4f5f7] p-4">
        <div className="mx-auto flex min-h-full max-w-5xl items-start justify-center">
          {!selectedDocument && (
            <EmptyState icon={<PiFileTextBold />} title="No document selected" description="Choose a required document to inspect it." className="min-h-[420px]" />
          )}
          {selectedDocument && docLoading && <LoadingState message="Loading document…" className="min-h-[420px]" />}
          {selectedDocument && !docLoading && docError && (
            <ErrorState title="Document preview unavailable" message={docError} onRetry={onReload} className="min-h-[420px]" />
          )}
          {selectedDocument && !docLoading && !docError && docUrl && selectedIsPdf && (
            <iframe
              src={docUrl}
              className="h-[calc(100vh-300px)] min-h-[560px] w-full max-w-5xl rounded-md bg-white shadow-lg"
              style={{ transform, transformOrigin: 'top center' }}
              title={`${title} preview`}
            />
          )}
          {selectedDocument && !docLoading && !docError && docUrl && selectedIsImage && (
            <img
              src={docUrl}
              alt={`${title} preview`}
              className="max-w-full rounded object-contain shadow-lg"
              style={{ transform, transformOrigin: 'top center' }}
            />
          )}
          {selectedDocument && !docLoading && !docError && docUrl && !selectedIsPdf && !selectedIsImage && (
            <div className="flex w-full flex-col items-center justify-center rounded-md bg-white p-6 text-center">
              <PiFileTextBold className="mb-3 h-12 w-12 text-gray-300" />
              <p className="text-sm font-semibold text-gray-900">Preview opened in document frame</p>
              <p className="mt-1 max-w-md text-sm text-gray-500">Some formats depend on the browser. Use Open original if the frame does not render.</p>
              <iframe src={docUrl} className="mt-5 h-[calc(100vh-360px)] min-h-[420px] w-full max-w-4xl rounded-md border bg-white" title={`${title} preview`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace the center column body with the live viewer**

In the center `<section className="flex min-h-0 min-w-0 flex-col bg-[#f4f5f7]">` block, replace its header + the placeholder-card body (the `<div className="min-h-0 flex-1 overflow-y-auto p-4">` containing the "Selected document" header, the "Document opens in a focused drawer" card, "Review focus", and "Current notes" cards) with:

```tsx
<section className="flex min-h-0 min-w-0 flex-col bg-[#f4f5f7]">
  <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
    <div className="flex min-w-0 items-center gap-2">
      <PiFileTextBold className="h-5 w-5 shrink-0 text-circleTel-orange" />
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-gray-900">
          {drawerSummary?.title ?? 'Selected document'}
        </h2>
        <p className="truncate text-xs text-gray-500">
          {drawerSummary?.subtitle ?? 'Select a document to preview and review.'}
        </p>
      </div>
    </div>
  </div>
  <DocumentViewer
    title={drawerSummary?.title ?? selectedRequirement?.label ?? 'Selected document'}
    selectedDocument={selectedDocument}
    docUrl={docUrl}
    docLoading={docLoading}
    docError={docError}
    selectedIsPdf={selectedIsPdf}
    selectedIsImage={selectedIsImage}
    zoom={zoom}
    rotation={rotation}
    onZoomIn={() => setZoom((z) => Math.min(140, z + 10))}
    onZoomOut={() => setZoom((z) => Math.max(70, z - 10))}
    onReset={() => { setZoom(100); setRotation(0); }}
    onRotate={() => setRotation((r) => (r + 90) % 360)}
    onReload={() => setDocRefreshKey((key) => key + 1)}
    onOpenOriginal={() => docUrl && window.open(docUrl, '_blank', 'noopener,noreferrer')}
    onExpand={() => selectedDocument && setDocumentDrawerOpen(true)}
    variant="inline"
  />
</section>
```

- [ ] **Step 4: Point the fullscreen Sheet at the same viewer**

In the `<Sheet open={documentDrawerOpen} …>` block, replace the custom drawer toolbar `<div className="shrink-0 overflow-x-auto border-b …">…</div>` AND the `<DocumentPreviewCanvas … />` usage with a single `DocumentViewer` in fullscreen variant (keep the `SheetHeader` as-is):

```tsx
<DocumentViewer
  title={drawerSummary?.title ?? selectedRequirement?.label ?? 'Selected document'}
  selectedDocument={selectedDocument}
  docUrl={docUrl}
  docLoading={docLoading}
  docError={docError}
  selectedIsPdf={selectedIsPdf}
  selectedIsImage={selectedIsImage}
  zoom={zoom}
  rotation={rotation}
  onZoomIn={() => setZoom((z) => Math.min(140, z + 10))}
  onZoomOut={() => setZoom((z) => Math.max(70, z - 10))}
  onReset={() => { setZoom(100); setRotation(0); }}
  onRotate={() => setRotation((r) => (r + 90) % 360)}
  onReload={() => setDocRefreshKey((key) => key + 1)}
  onOpenOriginal={() => docUrl && window.open(docUrl, '_blank', 'noopener,noreferrer')}
  onClose={() => setDocumentDrawerOpen(false)}
  variant="fullscreen"
/>
```

- [ ] **Step 5: Delete the superseded `DocumentPreviewCanvas` and `WorkbenchToolButton`**

Remove the `DocumentPreviewCanvas` function and the `WorkbenchToolButton` function (both now unused). Remove now-unused icon imports only if they are referenced nowhere else (verify each with a grep before removing): `PiMagnifyingGlassBold`, `PiPencilSimpleBold`, `PiSignatureBold`. Keep `PiArrowsClockwiseBold`, `PiMinusBold`, `PiPlusBold`, `PiArrowSquareOutBold`, `PiXBold` (used by the viewer).

- [ ] **Step 6: Type-check**

Run: `npm run type-check:memory`
Expected: no new errors in `app/admin/b2b/vetting/[submissionId]/page.tsx`.

- [ ] **Step 7: Commit**

```bash
git add "app/admin/b2b/vetting/[submissionId]/page.tsx"
git commit -m "feat(vetting): render document live in center column via shared DocumentViewer"
```

---

### Task 3: Mismatch gate + trimmed inspector

**Files:**
- Modify: `app/admin/b2b/vetting/[submissionId]/page.tsx`
- Modify: `app/admin/b2b/vetting/[submissionId]/workbench-utils.ts` (remove unused draft helpers)
- Modify: `app/admin/b2b/vetting/[submissionId]/__tests__/workbench-metadata.test.ts` (drop draft tests)

**Interfaces:**
- Consumes: `buildAutomatedChecks` (Task 1), `submission.nameMatch`, `step2`, `primaryBanking`, `handleDocumentAction`, `selectedDocument`.
- Produces: `mismatchAck`/`setMismatchAck` state; `approveBlocked` boolean; an `AutomatedCheckRow` render helper.

- [ ] **Step 1: Add mismatch-ack state, reset per submission**

Add near the other state declarations:

```tsx
const [mismatchAck, setMismatchAck] = useState(false);
```

Add an effect to reset it when the submission changes:

```tsx
useEffect(() => {
  setMismatchAck(false);
}, [submissionId]);
```

- [ ] **Step 2: Compute the gate and disable Approve**

Below the existing `decisionDisabled` declaration, add:

```tsx
const approveBlocked = Boolean(submission && !submission.nameMatch && !mismatchAck);
```

In the inspector Approve button, change `disabled={decisionDisabled}` to `disabled={decisionDisabled || approveBlocked}`, and when `approveBlocked` show a lock + hint. Replace the Approve button block with:

```tsx
{!selectedIsApproved && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => handleDocumentAction(selectedDocument.id, 'approved')}
    disabled={decisionDisabled || approveBlocked}
    className="justify-start gap-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 disabled:opacity-60"
  >
    {approveBlocked ? <PiLockBold className="h-4 w-4" /> : <PiCheckBold className="h-4 w-4" />}
    {approveBlocked
      ? 'Resolve the flag first'
      : actionInFlight === `${selectedDocument.id}-approved`
        ? 'Approving…'
        : 'Approve Document'}
  </Button>
)}
```

- [ ] **Step 3: Replace the 5-tab inspector with stacked sections**

Replace the entire inspector right column body — from the tab bar (`<div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">…`) and the `{selectedDocument && inspectorTab === …}` branches — with a single scroll body containing: (1) the mismatch gate card (only when `!submission.nameMatch`), (2) Decision section, (3) Automated checks, (4) Comparison context. Also remove the inspector header's "Save" draft button and the tab bar entirely.

The new inspector header + body:

```tsx
<div className="shrink-0 border-b border-gray-200 p-4">
  <h2 className="text-sm font-semibold text-gray-900">Document inspector</h2>
  <p className="mt-1 text-xs text-gray-500">Decision tools and review context</p>
</div>

<div className="min-h-0 flex-1 overflow-y-auto p-4">
  {!selectedDocument && (
    <EmptyState
      icon={<PiFileTextBold />}
      title="Select a document"
      description="Inspector controls appear after a document is selected."
    />
  )}

  {selectedDocument && (
    <div className="space-y-4">
      {!submission.nameMatch && (
        <section
          className={cn(
            'rounded-lg border p-4',
            mismatchAck ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50'
          )}
        >
          <div className="flex items-center gap-2">
            {mismatchAck ? (
              <PiCheckCircleBold className="h-4 w-4 text-amber-600" />
            ) : (
              <PiWarningCircleBold className="h-4 w-4 text-red-600" />
            )}
            <span className={cn('text-sm font-semibold', mismatchAck ? 'text-amber-700' : 'text-red-700')}>
              {mismatchAck ? 'Mismatch acknowledged' : 'Entity name mismatch'}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Registered entity</p>
              <p className="mt-0.5 font-mono text-sm text-gray-900">{step2?.entityName || '-'}</p>
            </div>
            <div className={cn('rounded-md border bg-white px-3 py-2', mismatchAck ? 'border-gray-200' : 'border-red-200')}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Account holder on file</p>
              <p className={cn('mt-0.5 font-mono text-sm', mismatchAck ? 'text-gray-700' : 'text-red-700')}>
                {primaryBanking.account_holder_name || '-'}
              </p>
            </div>
          </div>
          {mismatchAck ? (
            <p className="mt-3 text-xs text-gray-500">Override recorded against your reviewer ID. Approval is now permitted.</p>
          ) : (
            <Button
              size="sm"
              onClick={() => setMismatchAck(true)}
              className="mt-3 w-full bg-red-600 text-white hover:bg-red-700"
            >
              Acknowledge &amp; override
            </Button>
          )}
        </section>
      )}

      <InspectorSection title="Decision">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-600">Document status</span>
          {selectedStatus && (
            <StatusBadge status={selectedStatus.label} variant={selectedStatus.variant} icon={selectedStatus.icon} />
          )}
        </div>
        <div className="mt-3 grid gap-2">
          {/* Approve button from Step 2 goes here */}
          {!selectedIsRejected && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setChangeRequestOpen(true);
                setReviewReasonText(selectedDocument.rejection_reason ?? '');
                setReviewReasonError(null);
              }}
              disabled={decisionDisabled}
              className="justify-start gap-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <PiXBold className="h-4 w-4" />
              Request Changes
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDocumentAction(selectedDocument.id, 'under_review')}
            disabled={decisionDisabled}
            className="justify-start gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            <PiClipboardTextBold className="h-4 w-4" />
            {actionInFlight === `${selectedDocument.id}-under_review` ? 'Updating…' : 'Mark Under Review'}
          </Button>
        </div>
        {/* keep the existing changeRequestOpen textarea block unchanged, moved inside this section */}
      </InspectorSection>

      <InspectorSection title="Automated checks">
        <div className="space-y-0">
          {buildAutomatedChecks({
            nameMatch: submission.nameMatch,
            mismatchAcknowledged: mismatchAck,
            regNumber: step2?.regNumber,
            hasSelectedDocument: Boolean(selectedDocument),
            submittedAt: submission.submitted_at,
          }).map((check, index, all) => (
            <AutomatedCheckRow key={check.key} check={check} last={index === all.length - 1} />
          ))}
        </div>
      </InspectorSection>

      <InspectorSection title="Comparison context">
        <div className="space-y-3 text-sm">
          <InfoRow label="Business" value={step2?.entityName || '-'} />
          <InfoRow label="Reg no." value={<span className="font-mono">{step2?.regNumber || '-'}</span>} />
          <InfoRow label="Bank" value={primaryBanking.bank_name || '-'} />
          <InfoRow label="Holder" value={primaryBanking.account_holder_name || '-'} />
          {!submission.nameMatch && (
            <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-xs font-medium text-amber-800">
              <PiWarningCircleBold className="mt-0.5 h-4 w-4 shrink-0" />
              Account holder should match the registered entity name.
            </div>
          )}
        </div>
      </InspectorSection>
    </div>
  )}
</div>
```

> Note: move the existing `changeRequestOpen` textarea block (the `{changeRequestOpen && (…)}` JSX with the reason textarea and Cancel/Send buttons) inside the Decision `InspectorSection`, unchanged.

- [ ] **Step 4: Add the `AutomatedCheckRow` render helper**

Add near the other small components in `page.tsx`:

```tsx
function AutomatedCheckRow({ check, last }: { check: import('./workbench-utils').AutomatedCheck; last: boolean }) {
  return (
    <div className={cn('flex gap-2.5 py-2', !last && 'border-b border-gray-100')}>
      <div
        className={cn(
          'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full',
          check.pass ? 'bg-green-100' : 'bg-red-100'
        )}
      >
        {check.pass ? (
          <PiCheckBold className="h-3 w-3 text-green-700" />
        ) : (
          <PiXBold className="h-3 w-3 text-red-700" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{check.label}</p>
        <p className={cn('mt-0.5 text-xs', check.pass ? 'text-gray-500' : 'text-red-600')}>{check.note}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Remove dead inspector state, helpers, and imports**

Remove from `page.tsx`:
- State: `inspectorTab`/`setInspectorTab`, `metadataDraft`/`setMetadataDraft`, `metadataSavedAt`/`setMetadataSavedAt`, `commentText`/`setCommentText`, `comments`/`setComments`.
- The effect body lines that set `metadataDraft`/`metadataSavedAt`/`commentText` (keep the `setZoom(100)`/`setRotation(0)`/`setDocumentDrawerOpen(false)` resets); delete the `buildDocumentMetadataDraft(...)` call.
- Derived: `activeComments`, `updateMetadataDraft`, and the `WorkbenchComment` interface, `InspectorTab` type.
- Components: `InspectorTabButton`, `MetadataField`, `CommentBubble`, `VersionRow`, `PermissionRow`, `DraftNotice`.
- Imports: from `react-icons/pi` drop `PiFloppyDiskBold`, `PiTagBold`, `PiInfoBold`, `PiPencilSimpleBold`, `PiSignatureBold`, `PiMagnifyingGlassBold`, `PiCheckBold` only if unused (it IS used by AutomatedCheckRow/Approve — keep it), `PiClockCounterClockwiseBold` (verify each with grep before removing). From `./workbench-utils` drop `buildDocumentMetadataDraft`, `DocumentMetadataDraft`.

From `workbench-utils.ts` remove: `DocumentMetadataDraft` interface, `DocumentMetadataSource` interface, and `buildDocumentMetadataDraft` function (now unused).

From `__tests__/workbench-metadata.test.ts` remove any `buildDocumentMetadataDraft` import and its `describe`/`it` blocks.

- [ ] **Step 6: Type-check + tests**

Run: `npm run type-check:memory`
Expected: no new errors in the three files.

Run: `npx vitest run app/admin/b2b/vetting/'[submissionId]'/__tests__/workbench-metadata.test.ts`
Expected: PASS (automated-checks + retained summary/drawer tests; no metadata-draft tests).

- [ ] **Step 7: Commit**

```bash
git add "app/admin/b2b/vetting/[submissionId]/page.tsx" "app/admin/b2b/vetting/[submissionId]/workbench-utils.ts" "app/admin/b2b/vetting/[submissionId]/__tests__/workbench-metadata.test.ts"
git commit -m "feat(vetting): blocking mismatch gate + trimmed data-backed inspector"
```

---

### Task 4: Verify end-to-end

**Files:** none (verification only)

- [ ] **Step 1: Full type-check**

Run: `npm run type-check:memory`
Expected: no NEW errors introduced by these three files (repo carries ~295 pre-existing errors; confirm none are in the vetting files).

- [ ] **Step 2: Run the test file**

Run: `npx vitest run app/admin/b2b/vetting/'[submissionId]'/__tests__/workbench-metadata.test.ts`
Expected: PASS.

- [ ] **Step 3: Browser verification (real admin session)**

Using a minted admin session (see memory: admin-session-cookie-minting), open
`/admin/b2b/vetting/72c421e0-946b-44cb-b297-7761ced75d8a`. Confirm:
- Document renders inline in the center column (no drawer needed); zoom/fit work; image rotate appears for image docs; Reload re-fetches.
- Expand opens the fullscreen Sheet with the same viewer; close returns.
- For a submission with `nameMatch === false`: Approve shows lock + "Resolve the flag first" and is disabled; clicking "Acknowledge & override" flips the card and unlocks Approve; the holderMatch check row flips to "Overridden by reviewer".
- Request Changes (with reason) and Mark Under Review still call through and refresh.

- [ ] **Step 4: Invoke verification-before-completion skill**

Before claiming done, run `superpowers:verification-before-completion`.

## Self-Review Notes

- Spec coverage: center live viewer (Task 2) ✓; mismatch blocking gate (Task 3 Steps 1-3) ✓; trimmed inspector / dropped tabs (Task 3 Step 5) ✓; `buildAutomatedChecks` from real data (Task 1) ✓; no API/DB change (constraints) ✓; fullscreen drawer reuses viewer (Task 2 Step 4) ✓.
- Type consistency: `DocumentViewer` prop names identical in inline + fullscreen call sites; `AutomatedCheck` shape used by helper, tests, and `AutomatedCheckRow`; `approveBlocked` defined once and consumed in the Approve button.
- Placeholder scan: no TBD/TODO; all new code shown in full.
