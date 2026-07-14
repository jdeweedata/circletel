# Session Notes

## 2026-07-14 — CloudWiFi product page replacement

- Rebuilt `/products/cloudwifi` on branch `codex/cloudwifi-product-page` in `/home/circletel/.worktrees/cloudwifi-product-page`.
- Added a deterministic tier estimator, shared survey draft/provider, responsive CTA flow, accessible four-step survey wizard, local optimized venue imagery, pricing/process/content sections, and canonical social metadata.
- Added `POST /api/leads/cloudwifi` with strict validation, bounded streaming input/response handling, mapping to `coverage_leads`, and post-response sales alert handling.
- Focused CloudWiFi tests pass 199/199; latest implementation commit is `e885a3a7`.
- Browser QA passed at desktop and mobile sizes. An intercepted endpoint produced `0 -> 1 -> 2` POSTs across idle, failed submission, and successful retry; no database lead was created. Screenshots: `/tmp/cloudwifi-desktop.png`, `/tmp/cloudwifi-mobile.png`.
- Shared residuals outside the feature: repo-wide TypeScript baseline errors; existing Zoho `zcb` hydration mismatch; `react-test-renderer` deprecation warning; and unrelated full-test baseline failures involving Jest collecting Playwright specs, missing Vitest, stale analyzer keys, NetCash expectation drift, and credential-dependent tests.
