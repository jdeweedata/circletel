---
paths:
  - "supabase/**"
  - "lib/types/database*.ts"
  - "lib/supabase/**"
  - "app/api/**"
  - "scripts/**"
---

Rule: data-model
Loaded by: CLAUDE.md
Scope: System of record, generated types, additive migrations, writer identity

---

## System of record

**Supabase Postgres is the authority** for customers, orders, `customer_invoices`, KYC, contracts, and coverage.

Zoho Books / CRM / Desk / Sign are **sync targets**, not the ledger. A new admin tool, Inngest job, or agent script gets its own working table or file. It does not get `SUPABASE_SERVICE_ROLE_KEY` onto billing tables.

| Working store (tool-owned) | System of record (do not bypass) |
|----------------------------|----------------------------------|
| `circletel_order_state` | `consumer_orders`, `customers` |
| `.code-review-graph/graph.db` | Application schema |
| `memory-os/` | Live customer data |
| Zoho CRM deal fields | Quotes, KYC, contracts in Supabase |

`products` and `service_packages` are a known split. **Do not add a third product table.** Until a sync exists, say which surface reads which table. Billing writes go through the allowlist in `.billing-writer-allowlist` (`scripts/check-billing-writers.sh`).

## Schema is the type

The live schema is the TypeScript contract. **Canonical file:** `lib/types/database.generated.ts`. Public re-export: `lib/types/database.types.ts`.

```bash
npm run types:generate   # regenerate from project agyjovdugmtopasyvlng
npm run types:check      # fail if the file is a placeholder or missing customer_invoices
```

After any migration, regenerate types. Do not hand-write a parallel `interface` and call it the schema. Do not query `invoices` — the table is `customer_invoices`.

```typescript
// WRONG — guessed table / column
.from('invoices').select('payment_method, consumer_orders(order_number)')

// CORRECT — names from generated types
import type { Database } from '@/lib/types/database.types'
type Invoice = Database['public']['Tables']['customer_invoices']['Row']
.from('customer_invoices').select('payment_collection_method')
```

See `verify-schema-first.md` before writing queries. `/sync-types` writes the same canonical file.

## Additive migrations only

Agents may propose `CREATE TABLE`, `ADD COLUMN`, new indexes, and new RLS policies.

**Human required:** rename, type change, `DROP COLUMN`, `DROP TABLE`, or a check constraint that rejects existing rows. A migration on this project is production. Review the SQL. Do not treat `staging.circletel.co.za` as a schema sandbox.

Do not infer rename vs drop+add. If an agent “fixes” `payment_method` by dropping it, live data is gone. Additive column + backfill, or an explicit human-owned rename.

## Audit fields on new tables

New operational tables get `id`, `created_at`, `updated_at`, and an actor (`updated_by` or `last_changed_by`). Jobs that are not a person use a named actor (`billing-invoice-cron`), not a fake user. Do not backfill historical `customer_invoices`.

## Identity-aware writes

If a route needs “who changed this,” use `createClientWithSession()` or the Authorization header. Service role is for cron, Inngest, and admin jobs that are not a person. `getUser()` on the service-role client is always null. See `auth-patterns.md`.

## One SoR, optional staging app

There is one Supabase project (`agyjovdugmtopasyvlng`). Production and `staging.circletel.co.za` share it. Staging is an optional **app** preview (UI/auth/layout), label-gated, and allowed to be behind. It is not a database copy.

- Schema changes apply to the live SoR. Additive-only plus human review is the safety net.
- Do not require a staging deploy for rules, types, or migrations.
- Do not clone this database or keep a second Supabase project in sync.
- Local `supabase db reset` is for SQL syntax only, not product QA.
- Staging must not run writer paths (billing crons, Zoho sync, Inngest schedulers) against the shared SoR.

## SQLite sidecars stay sidecars

Tool-local SQLite and files are fine (code-review-graph, scrapes, drafts). Money, identity, legal records, and PostGIS coverage stay in Supabase. The second live consumer of a sidecar is the signal to integrate through an API, not to share the file.
