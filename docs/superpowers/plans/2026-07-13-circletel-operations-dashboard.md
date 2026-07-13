# CircleTel Operations Dashboard Implementation Plan

> **Execution:** Follow the approved design spec and implement task-by-task with focused tests and browser QA.

**Goal:** Build an isolated, responsive CircleTel staff operations dashboard prototype at `/demo/dashboard` using the repository's installed shadcn components.

**Architecture:** Add a route-local Geist layout and one client page that composes the existing shadcn sidebar, cards, chart, table, menu, avatar, badge, tooltip, tabs, and button primitives. Keep typed fixture data and prototype-only interaction state inside the route, with a narrow unit test covering deterministic data selectors.

**Tech stack:** Next.js 15 App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Recharts, react-icons/Phosphor, Jest.

## Files

- `app/demo/dashboard/layout.tsx`: scope Geist to the prototype route.
- `app/demo/dashboard/page.tsx`: typed fixtures, navigation, shadcn composition, and prototype interactions.
- `app/demo/dashboard/__tests__/page.test.ts`: KPI, navigation, and reporting-series regression tests.
- `components/ui/sidebar.tsx`: accessible mobile sheet title and description.
- `design-qa.md`: source-to-implementation visual QA record.

## Task 1: Deterministic dashboard data tests

- [x] Write tests for the approved KPI labels.
- [x] Write tests for the staff navigation groups.
- [x] Write tests for 30-day, 6-month, and 12-month trend selection.
- [x] Run the test first and confirm it fails because the page does not exist.

## Task 2: Route-local Geist layout

- [x] Add `app/demo/dashboard/layout.tsx` with `Geist` from `next/font/google`.
- [x] Keep the font scoped to the standalone prototype route.

## Task 3: Shadcn operations dashboard

- [x] Define typed fixture models for KPIs, navigation, quick actions, trends, operations, and finance.
- [x] Compose a white icon sidebar with the real CircleTel logo and responsive mobile sheet.
- [x] Add the staff header, profile menu, notifications, and accessible icon controls.
- [x] Add the dashboard intro, four KPI cards, and six staff quick actions.
- [x] Add the dual-series growth and revenue chart with working range selection.
- [x] Add a tabbed operations and finance command center with shadcn tables.
- [x] Add visible prototype feedback for action controls.
- [x] Add accessible title and description text to the shared mobile sidebar sheet.

## Task 4: Verification and design QA

- [x] Run the focused Jest test and confirm all three tests pass.
- [x] Run a scoped TypeScript compile covering the route and imported dependencies.
- [x] Inspect the dashboard at a desktop viewport and capture evidence.
- [x] Exercise sidebar, range selector, profile menu, quick actions, and operations/finance tabs.
- [x] Inspect the mobile layout at 390 × 844 and confirm no horizontal page overflow.
- [x] Reproduce and fix the mobile sidebar accessibility console errors.
- [x] Compare the reference and implementation in one combined visual input.
- [x] Record the QA iterations and final result in `design-qa.md`.

## Task 5: Handoff

- [x] Commit the implementation on `codex/dashboard-prototype`.
- [x] Keep the local development server running and return the prototype URL first.
