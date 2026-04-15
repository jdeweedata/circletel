# Zoho Desk v1 REST API Constraints

**Trigger**: Any work involving Zoho Desk API (tickets, tags, conversations, backfill scripts)
**Source**: 3 sessions (zoho-desk-campaign-pipeline 2026-04-15) — critical enough to capture early

---

## CRITICAL: Tags Are Completely Read-Only via REST API

All three approaches to writing tags fail:

| Attempted method | Result | Error |
|-----------------|--------|-------|
| `POST /tickets/{id}/tags` | 405 | `Allow: GET, OPTIONS` |
| `PATCH /tickets/{id}` with `{ tags: ['name'] }` | 422 | `"An extra parameter 'tags' is found"` |
| `PATCH /tickets/{id}` with `{ tagIds: [...] }` | 422 | Same |
| `GET /tickets?tags=name` | 422 | `tags` is not a valid filter param |

**Workaround for recording campaign origin**: PATCH the ticket's custom field instead:

```typescript
await this.makeRequest(`/tickets/${ticketId}`, 'PATCH', {
  cf: { cf_ticket_type: 'WhatsApp Campaign' }
});
```

**For filtering/identification**: Use keyword search — never tag filter:

```typescript
GET /tickets/search?subject=${encodeURIComponent(term)}&limit=100
```

---

## CRITICAL: Tags Endpoint Has Non-Standard Response Format

`GET /tickets/{id}/tags` is the ONLY endpoint that does NOT wrap its array in `{ data: [...] }`.

```typescript
// ❌ WRONG — all other endpoints use `data`, not this one
interface TagsResponse { data: Array<{ name: string }> }
result.data?.data  // always undefined

// ✅ CORRECT — tags endpoint uses `tags` key
interface TagsResponse { tags: Array<{ name: string }> }
result.data?.tags  // returns the tags array
```

**Real response shape**: `{ "tags": [{ "name": "whatsapp lead", "tagType": "MANUAL", "id": "..." }] }`

**Rule**: When integrating any new Zoho Desk endpoint, log the raw response before assuming `{ data: [...] }`.

---

## Search Response Omits Tag Data — Always Fetch Tags Separately

`GET /tickets/search?subject=...` returns `tags: []` (always empty) even when tickets have real tags.

```typescript
// Step 1: Search for candidates
const tickets = await service.searchTicketsBySubject(term);

// Step 2: Per-ticket real tag check (separate call required)
for (const ticket of tickets) {
  const tags = await service.fetchTicketTags(ticket.id);  // NOT ticket.tags
  const isTagged = tags.some(t => t.toLowerCase() === 'whatsapp lead');
  await new Promise(r => setTimeout(r, 100)); // rate limit buffer
}
```

Never trust `ticket.tags` from a search/list response for tag status checks.

---

## Two Separate Zoho OAuth Tokens

CircleTel uses Zoho CRM and Zoho Desk — they have SEPARATE OAuth flows and tokens.

| Env Var | Service | Used by |
|---------|---------|---------|
| `ZOHO_REFRESH_TOKEN` | Zoho CRM | `lib/zoho-api-client.ts` |
| `ZOHO_DESK_REFRESH_TOKEN` | Zoho Desk | `lib/integrations/zoho/auth-service.ts` |
| `ZOHO_DESK_ORG_ID` | Zoho Desk | Required header — see below |

**`ZOHO_DESK_ORG_ID` must be empty string**: The CRM org ID (882151519) causes org mismatch errors on Desk API. An empty string causes the auth service to omit the `orgId` header entirely, which works correctly.

---

## Zoho OAuth Rate Limiting in Scripts

Under script load (many API calls), Zoho rate-limits token refresh attempts:

```
error_description: 'You have made too many requests continuously. Please try again after some time.'
error: 'Access Denied'
```

**Root cause**: Auth service refreshes token on every request when the DB-cached token is expired. Under script load this fires rapidly and hits Zoho's rate limit.

**Mitigations already in place** in `lib/integrations/zoho/auth-service.ts`:
1. Token caching in Supabase `zoho_tokens` table (avoids refresh when cached token is valid)
2. 5-minute cooldown after a rate limit hit

**Script practice**: Add 100-200ms delays between API calls in any batch/backfill script.

---

## Common Mistakes

| Wrong | Correct | Why |
|-------|---------|-----|
| `POST /tickets/{id}/tags` | `PATCH /tickets/{id}` with `cf` field | Tags endpoint is read-only |
| `result.data?.data` on tags endpoint | `result.data?.tags` | Tags uses `{ tags: [] }` not `{ data: [] }` |
| `GET /tickets?tags=whatsapp+lead` | `GET /tickets/search?subject=...` | `tags` is not a valid filter param |
| Trust `ticket.tags` from search | Call `fetchTicketTags(ticket.id)` | Search response always returns `tags: []` |
| `ZOHO_DESK_ORG_ID=882151519` (CRM org) | `ZOHO_DESK_ORG_ID=` (empty string) | CRM org ID fails for Desk API |

---

## Key Files

- `lib/integrations/zoho/desk-campaign-service.ts` — All Zoho Desk API patterns
- `lib/integrations/zoho/auth-service.ts` — Token caching, rate limit cooldown
- `scripts/backfill-whatsapp-campaign-tags.ts` — Backfill script with correct tag-check pattern
- `lib/inngest/functions/whatsapp-campaign-report.ts` — Daily cron using these patterns
