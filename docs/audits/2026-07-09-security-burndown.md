# Security Burn-Down Register

**Started**: 2026-07-09 (whitelabel Phase 0)
**Rule**: the whitelabel maturity gate (spec §10 item 5) requires every
row CLOSED. Update the Status column in place; never delete rows.

## Code/DB items

| # | Item | Source | Status |
|---|------|--------|--------|
| 1 | Hardware catalogue policies anon-writable (`FOR ALL USING(true)`) | Supabase advisor | CLOSED 2026-07 — migration `20260709150000` |
| 2 | `quote_acceptance_links` anon-read-all | Supabase advisor | CLOSED 2026-07 — migration `20260709150000` |
| 3 | Unauthenticated customer routes (IDOR), unsigned eMandate webhook, test endpoints | 2026-06-11 audit | CLOSED 2026-06-11 — PR #550 (merged) |
| 4 | Public storage buckets `installation-documents`, `site-photos` (need signed-URL refactor of upload/render flows) | Supabase advisor | OPEN — scheduled with Phase 3 integration gateway work |
| 5 | `supplier_products` SELECT policy `USING (true)` (world-readable supplier cost data) | 2026-07-09 review | OPEN — verify no storefront reader, then scope to service_role |

## Ops items (owner: Jeffrey — cannot be closed by code)

| # | Item | Source | Status |
|---|------|--------|--------|
| 6 | Rotate 7+ Google API keys committed in tracked files/git history (GCP console), then purge refs | 2026-06-11 audit | OPEN |
| 7 | Set `NETCASH_EMANDATE_WEBHOOK_KEY` in Coolify env + append `?key=` to NetCash eMandate Notify URL (enforcement is OFF until set) | PR #550 follow-up | OPEN |
| 8 | Rotate 3 Zoho OAuth tokens (was owed from the anon-executable `get_integration_oauth_token` leak window) | 2026-07-02 advisor triage | OPEN |

## Standing rule (enforced at review)

Every NEW API route declares its auth context explicitly in a comment at
the top of the file: `// auth: public | customer-session | admin-role | service`.
