---
name: zoho-desk-campaign-pipeline
description: Zoho Desk v1 REST API constraints discovered building the WhatsApp Campaign daily report pipeline — tags read-only, response format divergence, credential separation, dotenv script pattern
type: session
---

# Zoho Desk WhatsApp Campaign Pipeline — Session Learnings

**Date**: 2026-04-15
**Duration**: ~3 sessions (Tasks 1-10 across 3 context windows)
**Feature**: WhatsApp Lead Campaign daily report — Inngest cron, admin dashboard, backfill script

---

## Pattern 1: Zoho Desk Tags Are Completely Read-Only via REST API

**Discovery**: `addCampaignTag()` was POSTing to `/tickets/{id}/tags`, which returned 405. Switched to PATCH on `/tickets/{id}` with `tags` param — returned 422.

| Attempted method | Result | Error |
|-----------------|--------|-------|
| `POST /tickets/{id}/tags` | 405 | `Allow: GET, OPTIONS` |
| `PATCH /tickets/{id}` with `{ tags: ['whatsapp lead'] }` | 422 | `"An extra parameter 'tags' is found"` |
| `PATCH /tickets/{id}` with `{ tagIds: [...] }` | 422 | Same |
| `GET /tickets?tags=whatsapp+lead` | 422 | `tags` is not a valid filter param |

**Workaround**: PATCH the ticket's custom field to record campaign origin:
```typescript
await this.makeRequest(`/tickets/${ticketId}`, 'PATCH', {
  cf: { cf_ticket_type: 'WhatsApp Campaign' }
});
```

**For identification/filtering**: Use keyword search — `GET /tickets/search?subject={encoded}&limit=100` — not tag filtering.

**Takeaway**: Zoho Desk v1 REST API cannot write tags to tickets. Build identification strategy around keyword search, not tags.

---

## Pattern 2: `GET /tickets/{id}/tags` Response Format Diverges from Other Endpoints

Every other Zoho Desk v1 endpoint wraps its array in `{ data: [...] }`. The tags endpoint is the exception:

```typescript
// ❌ WRONG — all other endpoints use `data`
interface TagsResponse { data: Array<{ name: string }> }
result.data?.data  // always undefined

// ✅ CORRECT — tags endpoint uses `tags` key
interface TagsResponse { tags: Array<{ name: string }> }
result.data?.tags  // returns the tags array

// Real response shape:
// { "tags": [{ "name": "whatsapp lead", "tagType": "MANUAL", "id": "..." }] }
```

**Impact**: `fetchTicketTags()` returned empty arrays for ALL tickets (including ones confirmed tagged in the UI), causing the backfill dry-run to show "Already tagged: 0, Needs tagging: 26" — completely wrong.

**Rule**: When integrating a new Zoho Desk endpoint, always make a test call and log the raw response before assuming it follows the `{ data: [...] }` pattern.

---

## Pattern 3: Search Response Omits Tag Data — Always Fetch Tags Separately

`GET /tickets/search?subject=...` returns ticket objects with `tags: []` (always empty), even when the ticket has real tags in the UI.

**Pattern for backfill/report scripts:**
```typescript
// Step 1: Search for candidates
const tickets = await service.searchTicketsBySubject(term);

// Step 2: For EACH ticket, separately check real tag status
for (const ticket of tickets) {
  const tags = await service.fetchTicketTags(ticket.id);  // separate call
  const isTagged = tags.some(t => t.toLowerCase() === 'whatsapp lead');
  // ...
  await new Promise(r => setTimeout(r, 100)); // rate limit buffer
}
```

**Never** trust `ticket.tags` from a search/list response for tag status checks.

---

## Pattern 4: Two Separate Zoho OAuth Tokens (CRM vs Desk)

CircleTel has two Zoho products (CRM + Desk) with separate OAuth flows and separate refresh tokens:

| Env Var | Service | Used by |
|---------|---------|---------|
| `ZOHO_REFRESH_TOKEN` | Zoho CRM | `lib/zoho-api-client.ts` |
| `ZOHO_DESK_REFRESH_TOKEN` | Zoho Desk | `lib/integrations/zoho/auth-service.ts` |
| `ZOHO_DESK_ORG_ID` | Zoho Desk | Required header for Desk API |

**`ZOHO_DESK_ORG_ID`**: Leave as **empty string**. The CRM org ID (882151519) does NOT work for Desk API — it returns org mismatch errors. An empty string makes the auth service skip the `orgId` header, which works.

**Token values** (from `.env.local`):
- `ZOHO_DESK_REFRESH_TOKEN` = `1000.9f1c516eef84cc7923de2aad80da53ed.8f6e38b491cffc50868a1a32c1ac5015`
- `ZOHO_DESK_CLIENT_ID` / `ZOHO_DESK_CLIENT_SECRET` — separate from CRM credentials

---

## Pattern 5: Zoho OAuth Rate Limiting Under Script Load

When running scripts that make many API calls (backfill, dry-run), Zoho's OAuth server rate-limits token refresh attempts:

```
error_description: 'You have made too many requests continuously. Please try again after some time.'
error: 'Access Denied'
```

**Root cause**: The auth service refreshes the token on every request when the DB-cached token is expired. Under script load, this fires rapidly and hits Zoho's rate limit.

**Mitigation already in place**: `lib/integrations/zoho/auth-service.ts` has:
1. Token caching in Supabase `zoho_tokens` table (avoids refresh when cached token is valid)
2. 5-minute cooldown after rate limit hit

**Script practice**: Add 100-200ms delays between requests, especially during tag-check loops.

---

## Pattern 6: `.env.local` Is NOT Loaded by `import 'dotenv/config'`

Scripts using `import 'dotenv/config'` (the standard dotenv approach) **only** load `.env`, not `.env.local`.

CircleTel stores credentials in `.env.local` (gitignored). Scripts therefore fail with "credentials not configured" even when `.env.local` exists.

```bash
# ❌ WRONG — credentials won't load from .env.local
npx tsx scripts/backfill-whatsapp-campaign-tags.ts

# ✅ CORRECT — source .env.local first
set -a && source .env.local && set +a && npx tsx scripts/backfill-whatsapp-campaign-tags.ts
```

Alternatively, add to the script's `dotenv` config:
```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // falls back to .env
```

---

## What Worked

- Using three keyword search terms (`fb.me/`, `lnk.ms/`, `Hello! Can I get more info on this?`) to find campaign tickets without tag filtering — found 26 unique tickets
- `fetchTicketTags()` as a separate per-ticket call after search — correctly identified 24 already-tagged, 2 genuinely untagged
- Two-pass approach: (1) search + dedup → (2) tag-check each candidate — robust and accurate
- Inngest cron + Supabase snapshot pattern — daily report state is durable and queryable

## What Failed

- Tag filtering via `GET /tickets?tags=...` → 422 (tag not a valid query param)
- `POST /tickets/{id}/tags` → 405 (read-only endpoint)
- `PATCH /tickets/{id}` with `{ tags: [...] }` → 422 (extra param rejected)
- Assuming `/tickets/{id}/tags` uses `{ data: [...] }` format → always returned empty (wrong key)
- Running script with `npx tsx` directly → Zoho creds not loaded from `.env.local`

## Related Files

- `lib/integrations/zoho/desk-campaign-service.ts` — All Zoho Desk API patterns
- `lib/integrations/zoho/auth-service.ts` — Token caching, rate limit cooldown
- `scripts/backfill-whatsapp-campaign-tags.ts` — Backfill script with real tag checks
- `lib/inngest/functions/whatsapp-campaign-report.ts` — Daily cron function
- `app/api/admin/whatsapp-campaign/report/route.ts` — Admin API route
- `app/admin/integrations/whatsapp-campaign/page.tsx` — Dashboard page

## Time Savings

- Zoho tag API limitations: ~2h (avoid re-discovering what works and what 405/422s)
- Tags response format: ~1h (avoid debugging empty tag arrays)
- `.env.local` script pattern: ~30min (avoid "credentials not configured" rabbit hole)
- Token separation (CRM vs Desk): ~45min (avoid auth failures from wrong token)
