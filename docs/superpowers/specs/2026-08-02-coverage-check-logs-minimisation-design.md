# coverage_check_logs — Derive-and-Drop Minimisation

**Date**: 2026-08-02
**Status**: Draft — awaiting approval
**Phase**: Standalone (follows the coverage→integrations observability split)
**Related**: `docs/superpowers/specs/2026-08-01-coverage-integrations-observability-split-design.md`

## Overview

`coverage_check_logs` has been collecting since 2025-10-25 with no retention policy,
no documented purpose, and no reader in the codebase for its two most sensitive
columns. It holds **719 rows**, and **every row** carries `ip_address`, `address`,
`lead_id` and `user_agent`.

The first instinct — drop the two unread columns — was wrong. "Nothing reads it"
is not the same as "it has no value": nobody had built the analysis yet. Both
columns carry real signal, verified against the live data:

**`user_agent` — development signal**

| Platform | Checks | Share | Avg response |
|---|---|---|---|
| Windows | 536 | 74.5% | 5205ms |
| **Android** | 124 | **17.2%** | **5848ms** |
| bot/script | 31 | 4.3% | 7254ms |
| iOS | 12 | 1.7% | 4030ms |
| Linux | 11 | 1.5% | 8097ms |
| macOS | 5 | 0.7% | 3801ms |

19% of coverage checks are mobile, and mobile is the slowest real platform.

**`ip_address` — party-identity signal**

Of 105 public IPv4 addresses: **44 checked more than one address**, **14 checked
five or more**, and one checked **44 distinct addresses across 69 checks**. That
is not a household comparing options — it is an agent, developer, broker or
competitor. Address and coordinates say *where* someone asked; only the IP says
*the same party asked repeatedly*.

So the goal is not deletion. It is **derive the signal into non-identifying
columns, then drop the raw identifiers** — keeping every question currently
answerable while ceasing to hold the identifier.

## Principle

> Retain the analytical dimension. Discard the identifier it was derived from.

## New columns

```sql
ALTER TABLE coverage_check_logs
  ADD COLUMN device_platform  text,   -- 'Windows' | 'Android' | 'iOS' | 'macOS' | 'Linux' | 'other'
  ADD COLUMN client_type      text,   -- 'browser' | 'bot'
  ADD COLUMN visitor_hash     text,   -- salted hash of the IP — see caveat below
  ADD COLUMN network_operator text;   -- ISP/ASN name, e.g. 'Vodacom', 'Telkom SA'
```

| Column | Derived from | Preserves |
|---|---|---|
| `device_platform` | `user_agent` | The full platform-mix and per-platform performance analysis, permanently |
| `client_type` | `user_agent` | Bot filtering (4.3% of rows) so they stop skewing averages |
| `visitor_hash` | `ip_address` | Repeat-party detection — "these 44 checks were one party" |
| `network_operator` | `ip_address` | Which ISP a prospect is currently on — directly useful when the pitch is switching them |

### Derivation rules

`device_platform` — ordered match, first hit wins (iOS before macOS: iPads report
both):

| Match on `user_agent` (case-insensitive) | Value |
|---|---|
| `iphone` or `ipad` | `iOS` |
| `android` | `Android` |
| `windows` | `Windows` |
| `macintosh` or `mac os` | `macOS` |
| `linux` | `Linux` |
| else | `other` |

`client_type` — `bot` when `user_agent` matches `bot`, `crawl`, `spider`, `curl`,
`wget`, `python`, `node`; otherwise `browser`. Order matters: evaluate **before**
`device_platform`, since bots often spoof a platform string.

## ⚠️ Two problems this spec must not gloss over

### 1. A salted hash of an IPv4 address is pseudonymisation, not anonymisation

The IPv4 space is 2³². With a **known** salt, every possible IP can be hashed and
matched in seconds — reversal is trivial. This means:

- The salt **must** live in an environment variable (`VISITOR_HASH_SALT`), never
  in the database. A salt stored beside the hash it protects is not a control.
- Compromise of the salt plus the table reverses every hash.
- Under POPIA, pseudonymised data **remains personal data**. This reduces
  exposure; it does not take the table out of scope.
- Rotating the salt breaks continuity — old and new hashes will not match, so
  repeat-party analysis resets. Choose the salt once and treat it as long-lived.

Recorded plainly so nobody later mistakes `visitor_hash` for anonymised data.

### 2. ASN lookup may itself be a disclosure — OPEN DECISION

Deriving `network_operator` requires mapping IP → ISP. **Sending 105 customer IP
addresses to a third-party geolocation API is itself a cross-border transfer of
personal data**, which is the kind of thing this exercise exists to avoid.

| Option | Trade-off |
|---|---|
| **A. Offline ASN dataset (recommended)** — MaxMind GeoLite2 ASN or equivalent, run locally | No disclosure, no external dependency at runtime. Cost: a dataset to obtain and refresh |
| B. Third-party API | Trivial to implement. Cost: discloses every customer IP to a third party — likely worse than the status quo |
| C. Skip `network_operator` | Simplest and safest. Cost: loses the "which ISP are they on" signal, which is the most commercially interesting derivation |

**Recommendation: A.** With only 105 distinct IPs this is a one-time offline batch;
there is no runtime dependency. **If A is not practical, prefer C over B** —
introducing a new disclosure to close an old one is a bad trade.

This decision is required before Stage 2 runs.

## Migration stages

Each stage is separately verifiable. **Nothing is dropped until the derived data
is confirmed present and correct.**

### Stage 1 — add columns (non-destructive)

Add the four columns. No data change. Fully reversible.

### Stage 2 — backfill (non-destructive)

Populate all four for the existing 719 rows from the raw values still present.

```sql
UPDATE coverage_check_logs SET
  client_type = CASE
    WHEN user_agent ~* '(bot|crawl|spider|curl|wget|python|node)' THEN 'bot'
    ELSE 'browser' END,
  device_platform = CASE
    WHEN user_agent ILIKE '%iphone%' OR user_agent ILIKE '%ipad%' THEN 'iOS'
    WHEN user_agent ILIKE '%android%'                             THEN 'Android'
    WHEN user_agent ILIKE '%windows%'                             THEN 'Windows'
    WHEN user_agent ILIKE '%macintosh%' OR user_agent ILIKE '%mac os%' THEN 'macOS'
    WHEN user_agent ILIKE '%linux%'                               THEN 'Linux'
    ELSE 'other' END
WHERE user_agent IS NOT NULL;
```

`visitor_hash` and `network_operator` are backfilled by a **script**, not SQL: the
salt lives in the environment and must not appear in a migration file committed to
the repo.

```
scripts/privacy/backfill-coverage-check-log-derivations.ts
  - reads VISITOR_HASH_SALT from env (fails loudly if unset)
  - visitor_hash = sha256(salt || ip_address_text), hex
  - network_operator = offline ASN lookup (per the open decision above)
  - idempotent: only writes rows where the derived column is null
```

### Stage 3 — verify (the gate)

Stage 4 must not run until all of these hold:

- `device_platform` non-null on every row where `user_agent` is non-null
- `client_type` non-null on every row where `user_agent` is non-null
- Platform distribution **matches the table in the Overview exactly** — 536 / 124 /
  31 / 12 / 11 / 5
- `visitor_hash` non-null on every row where `ip_address` is non-null
- `count(distinct visitor_hash) = 109` — matching the current distinct-IP count, so
  no collisions and no lost parties
- Repeat-party analysis reproduces: 44 hashes spanning >1 address, 14 spanning ≥5,
  max 44 distinct addresses
- **A dated export of the full table exists** (see Rollback)

### Stage 4 — clear the raw identifiers (destructive, irreversible)

```sql
UPDATE coverage_check_logs SET ip_address = NULL, user_agent = NULL;
```

Clear rather than `DROP COLUMN`, so the schema still documents that the fields
existed and were deliberately emptied. Drop the columns in a later migration once
the derived path has run in production for a full cycle.

### Stage 5 — forward path (must ship with Stage 4, not after)

`lib/analytics/coverage-logger.ts:46` currently inserts `ip_address` and
`user_agent` on every write. Without this stage, Stage 4 clears the history and the
next coverage check immediately repopulates it.

- Stop inserting `ip_address` and `user_agent`.
- Derive and insert `device_platform`, `client_type`, `visitor_hash` at write time.
- `network_operator`: leave null at write time and populate on a schedule, or skip
  per the open decision. Do **not** make a live lookup on the request path.
- Note the insert error is currently swallowed to `console.error`
  (`coverage-logger.ts:74`); that silence is why nobody noticed this table was
  accumulating. Consider logging via `apiLogger` instead.

### Stage 6 — retention (the thing this does not fix)

Set and document a retention window. **12 months** is suggested so the oldest rows
(Oct 2025) do not immediately fall out, but the number is a business decision.

## What this does NOT fix

After every stage, each row still says: *this person, at this exact building, asked
about connectivity on this date* — `address`, `latitude`/`longitude` at **8 decimal
places (sub-millimetre)**, and `lead_id` joining to name, phone and email.

Coordinates at that precision plus a street address identify a single premises far
more strongly than an IP ever did. **This migration removes the weaker identifiers
and leaves the stronger ones untouched.** It is a real improvement and an
incomplete one.

The open questions it deliberately does not answer:

- What is the stated purpose and lawful basis for retaining address + coordinates +
  lead linkage?
- Does the coordinate need 8 decimal places, or would 4 (~11m) serve every use?
- Is there a subject-access or deletion path if someone asks?

Those are product and compliance decisions, not schema changes.

## Rollback

Stages 1–3 are non-destructive and reversible by dropping the added columns.

**Stage 4 is irreversible.** Staging and production share one Supabase project, so
there is no branch to restore from. Before Stage 4:

1. Export the full table (`ip_address` and `user_agent` included) to a dated file.
2. Store it wherever the business keeps records requiring protection — **not** in
   the repo, and not in a bucket with public or anon access.
3. Give it the same retention window as Stage 6, and an owner.

An export is itself a copy of personal data. If the business would rather not hold
one, that is a legitimate choice — but then Stage 4 is genuinely final and must be
approved on that basis.

## Success Criteria

- [ ] Platform mix from `device_platform` reproduces 536/124/31/12/11/5 exactly
- [ ] Per-platform average response times reproduce (Android ~5848ms, Windows ~5205ms)
- [ ] `count(distinct visitor_hash)` = 109, no collisions
- [ ] Repeat-party analysis reproduces: 44 / 14 / max 44
- [ ] Bot rows (31) identifiable via `client_type` and excludable from averages
- [ ] `ip_address` and `user_agent` null on all 719 rows
- [ ] A new coverage check writes `device_platform`, `client_type`, `visitor_hash`
      and **no** `ip_address` or `user_agent`
- [ ] `VISITOR_HASH_SALT` is set in production env and absent from the repo
- [ ] Dated export exists and its location is recorded
- [ ] Retention window documented with an owner

## Open Decisions

| # | Decision | Recommendation |
|---|---|---|
| 1 | ASN source: offline dataset / third-party API / skip | **Offline**; prefer skip over API |
| 2 | Retention window | 12 months |
| 3 | Take an export before Stage 4? | Yes — but it is itself a copy of personal data |
| 4 | Reduce coordinate precision from 8 dp? | Out of scope here; worth its own decision |
