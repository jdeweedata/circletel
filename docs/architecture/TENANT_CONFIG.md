# Tenant Config Layer

**Module**: `lib/tenant/` | **Since**: Phase 0 (2026-07)
**Spec**: `docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md` §2

## What

Single source of platform identity (brand, contacts, colors) for the
instance-per-tenant whitelabel model. CircleTel is tenant #1; its values
live in `lib/tenant/defaults.ts` — the ONE file allowed to contain brand
literals (excluded from the CI brand ratchet).

## Usage

```typescript
import { getTenantConfig } from '@/lib/tenant';

const { branding, contacts } = getTenantConfig();
branding.companyName; // 'CircleTel' (or the tenant's name)
contacts.EMAIL_SUPPORT;
```

Legacy path: `import { CONTACT } from '@/lib/constants/contact'` still
works — it is now derived from `getTenantConfig().contacts`.

## Per-tenant overrides (env, set per deployment)

| Env var | Overrides |
|---|---|
| `NEXT_PUBLIC_TENANT_COMPANY_NAME` | `branding.companyName` |
| `NEXT_PUBLIC_TENANT_LEGAL_NAME` | `branding.legalName` |
| `NEXT_PUBLIC_TENANT_WEBSITE_URL` | `branding.websiteUrl` |
| `NEXT_PUBLIC_TENANT_WEBSITE_SHORT` | `branding.websiteShort` |
| `NEXT_PUBLIC_TENANT_PRIMARY_COLOR` | `branding.colors.primary` |

## Rules

1. New code MUST NOT hard-code brand strings — read `getTenantConfig()`.
2. `lib/tenant/` MUST NOT import from `lib/constants/` (dependency points
   the other way).
3. Contacts overrides and a `tenant_config` DB table come later (spec §2);
   do not add them speculatively.
