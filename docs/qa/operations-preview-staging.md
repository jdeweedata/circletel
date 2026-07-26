# Operations Preview Staging QA

**Date:** 2026-07-13  
**Status:** Blocked pending a normal authenticated admin browser session  
**Branch:** `codex/staging-operations-preview`  
**Verified commit:** `f6c5d30f` (the QA document remains uncommitted until authenticated visual verification completes)

## Story under verification

An authenticated active admin opens the auth-guarded full-screen
`/admin/operations-preview` page. The page calls the analytics-permission-protected,
GET-only production aggregate boundary. The server reader performs deterministic,
paginated, minimal-column production reads and fails closed. Only a PII-free aggregate
reaches the read-only operations dashboard; no preview control may mutate data or escape
into a production admin workflow.

## Automated tests

Command:

```bash
npx jest lib/admin/operations-preview/__tests__ app/api/admin/operations-preview/__tests__ app/admin/__tests__/admin-route-policy.test.ts app/admin/operations-preview/__tests__ --runInBand --detectOpenHandles
```

Results:

- Initial integrated gate: PASS on attempt 1, 10 suites and 168 tests.
- The live HTTP check found that automatic Next.js 405 responses omitted `Cache-Control`
  and `Pragma`.
- Regression test RED: route suite failed 4 of 12 cases because POST, PUT, PATCH, and
  DELETE did not have explicit rejection handlers.
- Regression test GREEN: route suite passed 12 of 12 cases after adding empty 405
  handlers with `Allow: GET`, private no-store, pragma, and a UUID request ID.
- Final integrated gate after all corrections: PASS, 10 suites and 171 tests, 0
  snapshots, 7.41 seconds, exit 0, with open-handle detection enabled.
- Warnings were limited to the repository's React Test Renderer deprecation and inferred
  workspace-root/multiple-lockfile warnings.

## TypeScript

The worktree has no local `node_modules`, so `npm run type-check:memory` exits 1 because
`./node_modules/typescript/bin/tsc` does not exist. The repository-root compiler was run
against the worktree configuration instead:

```bash
node --max-old-space-size=4096 /home/circletel/node_modules/typescript/bin/tsc --noEmit -p /home/circletel/.worktrees/staging-operations-preview/tsconfig.json --pretty false
```

- Full output: `/tmp/operations-preview-typecheck.txt`
- Result: exit 2 with 243 existing repository diagnostics.
- A generated Next route diagnostic initially identified forbidden utility exports from
  the preview route module. The utilities and timeout constant were made module-private.
- Fresh rerun after that correction: the same 243 baseline diagnostics remain and zero
  diagnostics reference `operations-preview`, `AdminLayoutClient`,
  `admin-route-policy`, or `components/ui/sidebar.tsx`.
- This is not a repository-wide TypeScript pass.

## Production build path

- `npm run build:ci`: exit 1 because the worktree has no local Next.js binary.
- Parent Next.js build in the restricted sandbox reached compile but could not resolve
  `fonts.googleapis.com` (`EAI_AGAIN`). No code was changed to hide the environmental
  failure.
- A network-enabled, safe-dotenv parent build was retried under an explicit 600-second
  bound. It remained in `buildStage: compile`, produced active `.next/trace` evidence,
  emitted no code diagnostic, and exited 124 at the bound.
- The full production build is therefore inconclusive, not passed.
- The dev compiler subsequently compiled both `/admin/operations-preview` and
  `/api/admin/operations-preview` successfully.

## Local server and HTTP boundaries

The requested `0.0.0.0` bind was not approved because this route can expose production
aggregates. The safer localhost-only server is running with the flag enabled and a safe
dotenv loader:

- URL: `http://127.0.0.1:3011`
- Dev session: `28517`
- Startup: Next.js 15.5.18, ready in 21 seconds

Live HTTP matrix after the correction:

| Method | Status | Body | Boundary headers |
|---|---:|---:|---|
| GET | 401 | 91 bytes | UUID request ID, private no-store, pragma no-cache |
| POST | 405 | empty | `Allow: GET`, UUID request ID, private no-store, pragma no-cache |
| PUT | 405 | empty | `Allow: GET`, UUID request ID, private no-store, pragma no-cache |
| PATCH | 405 | empty | `Allow: GET`, UUID request ID, private no-store, pragma no-cache |
| DELETE | 405 | empty | `Allow: GET`, UUID request ID, private no-store, pragma no-cache |

No cookie, token, response body, credential, or production value was printed in the QA
record. The live server also reports existing warnings for duplicate middleware pages and
the deprecated `experimental.outputFileTracingExcludes` location.

## Browser evidence

The environment has no X server, so headed Chrome could not start. The approved
`agent-browser` CLI was then used headlessly; no Playwright/Cypress process, response
interception, fixture, cookie fabrication, or API bypass was used.

Unauthenticated boundary results:

- Normal redirect target:
  `http://127.0.0.1:3011/admin/login?redirect=/admin/operations-preview`
- Desktop viewport: 1440 x 1000; meaningful login content; no framework error overlay;
  `scrollWidth === clientWidth === 1440`.
- Mobile viewport: 390 x 844; meaningful login content; no framework error overlay;
  `scrollWidth === clientWidth === 390`.
- Desktop screenshot: `/tmp/operations-preview-unauth-desktop.png`
- Mobile screenshot: `/tmp/operations-preview-unauth-mobile.png`
- Stored browser form values were not submitted or used.

## Visual comparison status

Authenticated success rendering is not yet available. Therefore the required combined
desktop comparison against the supplied Splynx reference and the approved CircleTel
prototype evidence has not been performed, and the following success-state checks remain
open:

- CircleTel marks and route-local Geist
- white icon sidebar and all six production groups with nested children
- production/read-only badges and generated timestamp
- seven disabled workflow actions
- contained navigation and nested disclosure behavior
- 6m/12m range, tabs, and Refresh issuing GET only
- mobile sheet semantics and success-state overflow
- desktop/mobile screenshots of current production aggregates

## Remaining blocker and required user action

An existing active admin with `dashboard:view_analytics` must sign in through the normal
admin login in the user's browser, then open:

```text
http://127.0.0.1:3011/admin/operations-preview
```

After that confirmation, resume authenticated desktop/mobile visual QA and the combined
reference comparison. Do not use stored credentials, invent cookies, weaken RBAC, or add a
development data bypass. The Task 8 QA commit must remain pending until this evidence is
complete.
