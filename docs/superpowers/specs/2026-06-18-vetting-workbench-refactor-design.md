# B2B Vetting Workbench Refactor — Design

**Date:** 2026-06-18
**Route:** `/admin/b2b/vetting/[submissionId]`
**File:** `app/admin/b2b/vetting/[submissionId]/page.tsx`
**Status:** Approved (design)

## Problem

The vetting detail page already uses a 3-column layout (Documents checklist | center | inspector),
but the **center column shows placeholder cards** ("Document opens in a focused drawer", "Review
focus", "Current notes") and the **actual document only renders inside a right-side slide-over
`Sheet`** that the reviewer must open with a click. The result wastes the widest part of the page
and forces a drawer round-trip for the core task — reading the document and deciding on it.

The inspector also carries four tabs (Metadata, Notes, Versions, Access) that are explicitly
browser-only drafts and never persist to the backend, adding clutter around the one real action
(approve / request changes / under review).

## Goals

1. Put a **live document viewer in the center column** — document and decision controls visible
   together, no drawer round-trip.
2. Make the **entity-name mismatch a blocking gate** with an explicit acknowledge/override, instead
   of a soft warning that can be approved through.
3. **Trim the inspector** to the features backed by real data: decision, derived automated checks,
   and comparison context.
4. No API, database, or backend changes. All existing real actions stay byte-for-byte.

## Non-Goals

- No multi-page paging / page thumbnails (we render a single real file, as today).
- No persisted metadata, comments, version history, or access control (those were placeholders).
- No invented signals (e.g. fake "OCR confidence 96%"). Checks are derived from real fields only.
- No changes to `/api/admin/kyc/verify`, `/api/admin/kyc/document-url`,
  `/api/admin/b2b/mandate-confirm`, or the submission fetch.

## Layout

Keep the header (business name · account · segment · submitted, status badge, Back button) and the
existing 4-stat progress band. Keep the workspace grid
`xl:grid-cols-[260px_minmax(0,1fr)_360px]`.

```
Header: business name · account · segment · submitted        [status] [Back]
Progress band: Approved x/y · Needs decision · Missing · Last reviewed
┌─ DOCS (260) ─┬─ LIVE VIEWER (flex) ──────┬─ INSPECTOR (360) ─┐
│ checklist     │ toolbar: zoom −/＋ · fit · │ ⚠ Mismatch gate   │
│ rows with     │   rotate(img) · reload ·  │ Decision buttons  │
│ number, label,│   open original · ⤢ full  │ Automated checks  │
│ status badge  │ ┌───────────────────────┐ │ Comparison context│
│               │ │  PDF iframe / <img>   │ │                   │
│               │ │  scaled by zoom/rot   │ │                   │
│               │ └───────────────────────┘ │                   │
└───────────────┴───────────────────────────┴───────────────────┘
```

- **Left (Documents, 260):** unchanged behaviour — required-document checklist rows with index,
  label, status badge, file-type chip, and rejection-reason preview. Clicking a row selects it.
  The per-row "View document" button now just selects (center shows it); the explicit fullscreen
  open stays available via the row action and the viewer's expand button.
- **Center (Live viewer, flex):** the new inline `DocumentViewer` (see below). Replaces the three
  placeholder cards.
- **Right (Inspector, 360):** trimmed, no tabs — three stacked sections (Mismatch gate when
  applicable, Decision, Automated checks, Comparison context).

## Components

### `DocumentViewer` (new, in `page.tsx`)

A single viewer used in **both** the center column and the existing fullscreen `Sheet`. It owns:

- **Toolbar:** zoom out / zoom in (clamped, e.g. 70–140%), fit/reset (100%, rotation 0),
  **rotate** (images only, CSS `transform: rotate`), reload (re-fetches signed URL via the existing
  `docRefreshKey` mechanism), open-original (existing `window.open(docUrl)`), and an **expand**
  button that opens the fullscreen `Sheet`. In the fullscreen `Sheet` the expand button becomes a
  close/minimize.
- **Canvas states:** the existing `DocumentPreviewCanvas` logic — empty / loading / error / PDF
  iframe / image / non-PDF-non-image fallback — promoted into this shared component. Zoom and (for
  images) rotation applied via `transform`.

This removes the duplicated drawer toolbar markup and the standalone `DocumentPreviewCanvas`, and
deletes the three center placeholder cards.

**Inputs:** `selectedDocument`, `docUrl`, `docLoading`, `docError`, `selectedIsPdf`,
`selectedIsImage`, `zoom`, `rotation`, setters, `onReload`, `onOpenOriginal`, `onExpand`/`onClose`,
`title`, `variant: 'inline' | 'fullscreen'`.

### Inspector (right column, no tabs)

Replace the 5-tab inspector with three stacked sections (reuse `InspectorSection`, `InfoRow`,
`StatusBadge`):

1. **Mismatch gate** — rendered only when `!submission.nameMatch`. Shows Registered entity vs
   Account holder on file and an **"Acknowledge & override"** button. After acknowledgement, flips
   to "Mismatch acknowledged — override recorded against your reviewer ID."
2. **Decision** — Approve / Request changes (inline reason textarea, existing validation + API) /
   Mark under review. Same `handleDocumentAction` calls. Reset-decision link preserved.
3. **Automated checks** — rows derived from real data via `buildAutomatedChecks()` (see below). Each
   row shows pass/fail and a short note. The holder-vs-entity row reflects acknowledgement.
4. **Comparison context** — Business / Reg no. (mono) / Bank / Holder via existing `InfoRow`s, plus
   the existing amber "holder should match registered entity" hint.

**Removed:** Metadata, Notes, Versions, Access tabs; the `InspectorTabButton`, `MetadataField`,
`CommentBubble`, `VersionRow`, `PermissionRow`, `DraftNotice` components; and the
`metadataDraft` / `metadataSavedAt` / `comments` / `commentText` / `inspectorTab` state and the
`Save` draft button.

## Mismatch gate (state + behaviour)

- New state: `const [mismatchAck, setMismatchAck] = useState(false)` — submission-scoped, reset when
  `submissionId` changes.
- Gate predicate: `const approveBlocked = !submission.nameMatch && !mismatchAck`.
- `decisionDisabled` (existing) gains `|| (status === 'approved' && approveBlocked)` semantics:
  concretely, the **Approve** button is disabled when `approveBlocked`, shows a lock icon and a
  "Resolve the flag first" hint; Request-changes and Under-review are never gated.
- This is **UI-level only** — no new column, no schema change. The override is a session
  acknowledgement that unlocks the existing approve API call.

## `buildAutomatedChecks()` (new helper in `workbench-utils.ts`)

Pure function, fully unit-testable. Signature:

```ts
export interface AutomatedCheckInput {
  nameMatch: boolean;
  mismatchAcknowledged: boolean;
  regNumber: string | undefined;
  hasSelectedDocument: boolean;
  submittedAt: string | null;
  slaDays?: number; // default 2 (matches the existing vetting SLA)
  now?: number;     // injectable clock (ms epoch) for deterministic tests; defaults to Date.now()
}

export interface AutomatedCheck {
  key: string;
  label: string;
  pass: boolean;
  note: string;
}

export function buildAutomatedChecks(input: AutomatedCheckInput): AutomatedCheck[];
```

Checks (all from real fields, no fabricated confidence numbers):

| key            | label                        | pass when…                                  | note examples                         |
|----------------|------------------------------|---------------------------------------------|---------------------------------------|
| `holderMatch`  | Holder = registered entity   | `nameMatch` OR `mismatchAcknowledged`        | "Match" / "Overridden by reviewer" / "Names differ" |
| `regNumber`    | Registration number present  | `regNumber` is non-empty                     | "Captured" / "Missing"                |
| `documentReady`| Document uploaded            | `hasSelectedDocument`                         | "File available" / "No file"          |
| `withinSla`    | Submitted within SLA         | `submittedAt` within `slaDays` of now        | "0 days overdue" / "N days overdue"   |

## Data flow

Unchanged: `fetchSubmission` → `submission`; `requiredDocItems` (memo) drives the checklist and
counts; selecting a row sets `selectedDoc`; the signed-URL effect populates `docUrl`. The center
viewer reads the same `docUrl`/`docLoading`/`docError`. Decisions call the same endpoints and
`fetchSubmission({ showLoading: false })` to refresh.

## Error handling

- Document load errors render the existing `ErrorState` with retry (reload) inside the viewer.
- `actionError` banner unchanged.
- Change-request requires a non-empty reason (existing validation preserved).

## Testing

- `__tests__/workbench-metadata.test.ts` → update: remove `buildDocumentMetadataDraft` tests; add
  `buildAutomatedChecks` tests covering: match vs mismatch vs acknowledged-override, missing reg
  number, no document, within-SLA vs overdue (using a fixed "now" injected via a date arg or a
  `submittedAt` far in the past).
- Manual: `npm run type-check:memory`; browser-verify with a real admin session against a submission
  that has a name mismatch (gate blocks approve → ack → approve unlocks) and one without.

## Blast radius

- `app/admin/b2b/vetting/[submissionId]/page.tsx` — layout, `DocumentViewer`, mismatch gate, trimmed
  inspector.
- `app/admin/b2b/vetting/[submissionId]/workbench-utils.ts` — add `buildAutomatedChecks`; drop
  unused draft helpers; keep formatting + summary + drawer-summary + pdf/image helpers.
- `app/admin/b2b/vetting/[submissionId]/__tests__/workbench-metadata.test.ts` — updated tests.
- No API / DB / backend changes.
