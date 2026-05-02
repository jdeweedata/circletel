# Design: <feature-name>

| Field | Value |
|-------|-------|
| **Spec ID** | `YYYYMMDD-feature-name` |
| **Author** | <name> |
| **Created** | YYYY-MM-DD |
| **Status** | DRAFT |
| **Proposal** | `./PROPOSAL.md` |
| **Reviewers** | <names or roles> |

> **Purpose of this document**: lock down the *technical approach* before we commit to a detailed `SPEC.md` and `TASKS.md`. Surfaces architecture decisions, trade-offs, and risks for review. If approved, the SPEC + TASKS can be generated with confidence.

---

## 1. Context

One paragraph. Pulled from `PROPOSAL.md` Section 1-2. Skim-friendly — readers should understand the problem without leaving this doc.

## 2. Approach

High-level shape of the solution. Two or three paragraphs explaining **how** the pieces fit together. No code yet — diagrams + prose.

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│  User flow  │ ───▶ │  System X    │ ───▶ │  Persistence │
└─────────────┘      └──────────────┘      └──────────────┘
```

## 3. Architecture

### Components

| Component | Responsibility | New / Modified |
|-----------|----------------|----------------|
| `lib/foo/...` | ... | new |
| `app/api/foo/route.ts` | ... | new |
| `components/foo/Bar.tsx` | ... | modified |

### Data flow

Describe the request/response or event flow. Bullet points or sequence diagram.

1. User submits ...
2. API validates ...
3. Service writes to ...
4. Webhook fires ...

### Reusable assets

Per CircleTel's code-reuse policy, list existing code we will extend rather than duplicate:

- `lib/payments/netcash-service.ts` — extend for ...
- `lib/quotes/pdf-generator-v2.ts` — reuse for ...
- `lib/rbac/permissions.ts` — add new permission ...

## 4. Data model

### New tables

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `foo_bar` | ... | `id`, `customer_id`, `status` |

### Schema changes

```sql
-- High-level only; full migration generated during implementation
ALTER TABLE customers ADD COLUMN foo_status text;
```

### RLS policies

- `customers SELECT`: own rows only
- `admin_users ALL`: full access

## 5. API surface

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/foo` | Create | customer cookie + bearer |
| GET | `/api/foo/:id` | Read | admin only |
| POST | `/api/webhooks/foo` | External callback | HMAC-SHA256 |

## 6. External integrations

| Provider | Endpoint | Auth | Failure mode |
|----------|----------|------|--------------|
| e.g. Didit | `https://...` | OAuth | retry 3x, then fail event |
| e.g. NetCash | `https://...` | service key | webhook retry |

## 7. Trade-offs

| Decision | Alternatives | Why we chose this |
|----------|--------------|-------------------|
| Sync vs async | Inngest event vs inline | ... |
| Server vs client | RSC vs client component | ... |
| Build vs buy | ... | ... |

## 8. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Provider rate limits | M | H | Cache + backoff |
| RLS bypass | L | H | Explicit policy tests |
| Migration on hot table | M | H | Backfill in batches |

## 9. Rollout plan

- [ ] Migration applied to staging
- [ ] Feature flag wired (if applicable)
- [ ] Internal QA on staging
- [ ] Limited production rollout (e.g. 10% via flag)
- [ ] Full rollout
- [ ] Flag removed / cleanup

## 10. Observability

| Signal | Where | Why |
|--------|-------|-----|
| Logs | `apiLogger.info('[foo]', ...)` | Debug |
| Errors | Sentry | Triage |
| Metrics | Inngest dashboard / Supabase | SLA |

## 11. Decision

> Filled in by reviewers when status moves to APPROVED.

- **Decision**: APPROVED / REVISE / REJECTED
- **Date**: YYYY-MM-DD
- **Decided by**: <names>
- **Open items to resolve before SPEC.md**: ...

---

## References

- `PROPOSAL.md` (this folder)
- `docs/architecture/SYSTEM_OVERVIEW.md`
- Related specs: `agent-os/specs/<other-spec-id>/`
- External docs: ...
