# Whitelabel Phase 0 — Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the whitelabel foundations from the baseline design (spec: `docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md`, §11 Phase 0): tenant config layer, feature registry with generated admin nav, brand-literal CI ratchet, docs-in-DoD PR template, portable scheduler, and closure of the open RLS security holes.

**Architecture:** Everything is additive and low-blast-radius. `lib/tenant/` becomes the single source of brand/contact identity, initially consumed only via the existing `lib/constants/contact.ts` (23 consumer files keep working unchanged). The admin nav data moves out of `Sidebar.tsx` into a feature registry module that adds `maturity` + role filtering; the Sidebar renders whatever the registry returns. CI gains a ratchet that fails any PR increasing the count of hard-coded brand literals. The VPS crontab becomes generated-from-`vercel.json` and tracked in-repo. One SQL migration closes the two known RLS holes.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Jest (`__tests__/` mirror structure), Supabase (Postgres RLS), bash scripts, GitHub Actions (`pr-checks.yml`).

## Global Constraints

- Work in an isolated worktree branch off `origin/main` (create via superpowers:using-git-worktrees), e.g. `feat/whitelabel-phase0-guardrails`. Push the branch after the first commit.
- `npm run type-check:memory` must pass for all files this plan touches (repo has ~295 pre-existing errors in OTHER files — the pre-push hook only blocks on errors in files you touched).
- Tests: Jest, files under `__tests__/lib/...` mirroring `lib/` paths. Run a single file with `npx jest __tests__/path/file.test.ts`.
- No new npm dependencies anywhere in this plan.
- DB migrations are applied MANUALLY to the shared Supabase project `agyjovdugmtopasyvlng` (staging and prod share this one DB — treat every migration as production). Never assume a CI step applies them.
- Commit messages end with the standard `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer.
- Do not fix or touch pre-existing type errors, dead files, or adjacent code outside the listed files.

---

### Task 1: Tenant config module (`lib/tenant/`)

**Files:**
- Create: `lib/tenant/types.ts`
- Create: `lib/tenant/defaults.ts`
- Create: `lib/tenant/config.ts`
- Create: `lib/tenant/index.ts`
- Create: `docs/architecture/TENANT_CONFIG.md`
- Test: `__tests__/lib/tenant/config.test.ts`

**Interfaces:**
- Consumes: nothing (foundation module — must NOT import from `lib/constants/` to avoid a cycle; Task 2 inverts that dependency).
- Produces: `getTenantConfig(): TenantConfig`, `resetTenantConfigForTests(): void`, types `TenantConfig`, `TenantBranding`, `TenantContacts`, `TenantAddress` — all re-exported from `lib/tenant/index.ts`. Task 2 and all future seams import from `@/lib/tenant`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/tenant/config.test.ts`:

```typescript
import { getTenantConfig, resetTenantConfigForTests } from '@/lib/tenant';

describe('getTenantConfig', () => {
  afterEach(() => {
    resetTenantConfigForTests();
    delete process.env.NEXT_PUBLIC_TENANT_COMPANY_NAME;
    delete process.env.NEXT_PUBLIC_TENANT_PRIMARY_COLOR;
  });

  it('returns CircleTel defaults when no env overrides are set', () => {
    const config = getTenantConfig();
    expect(config.branding.companyName).toBe('CircleTel');
    expect(config.branding.legalName).toBe('Circle Tel SA (Pty) Ltd');
    expect(config.branding.colors.primary).toBe('#F5841E');
    expect(config.contacts.EMAIL_PRIMARY).toBe('contactus@circletel.co.za');
    expect(config.contacts.PHYSICAL_ADDRESS.city).toBe('Sandton');
  });

  it('applies env overrides for company name and primary color', () => {
    process.env.NEXT_PUBLIC_TENANT_COMPANY_NAME = 'AcmeNet';
    process.env.NEXT_PUBLIC_TENANT_PRIMARY_COLOR = '#0055FF';
    const config = getTenantConfig();
    expect(config.branding.companyName).toBe('AcmeNet');
    expect(config.branding.colors.primary).toBe('#0055FF');
    // non-overridden values keep defaults
    expect(config.branding.legalName).toBe('Circle Tel SA (Pty) Ltd');
  });

  it('caches the config between calls', () => {
    const a = getTenantConfig();
    process.env.NEXT_PUBLIC_TENANT_COMPANY_NAME = 'ShouldNotApply';
    const b = getTenantConfig();
    expect(b).toBe(a);
    expect(b.branding.companyName).toBe('CircleTel');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/tenant/config.test.ts`
Expected: FAIL — `Cannot find module '@/lib/tenant'`

- [ ] **Step 3: Write the types**

Create `lib/tenant/types.ts`:

```typescript
/**
 * Tenant Config Layer — the ONLY legal source of platform identity.
 *
 * Whitelabel baseline design §2:
 * docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md
 *
 * Rule: no component or API route hard-codes brand strings or reads
 * process.env for identity/branding. Everything goes through
 * getTenantConfig(). Instance-per-tenant: each deployment injects its
 * own values via NEXT_PUBLIC_TENANT_* env vars.
 */

export interface TenantAddress {
  name?: string;
  attention?: string;
  building: string;
  street: string;
  suburb: string;
  city: string;
  province?: string;
  postalCode: string;
  country?: string;
}

/** Shape mirrors the legacy CONTACT constant exactly (lib/constants/contact.ts). */
export interface TenantContacts {
  WHATSAPP_NUMBER: string;
  WHATSAPP_LINK: string;
  WHATSAPP_INTERNATIONAL: string;
  PHONE_SALES_OUTBOUND: string;
  EMAIL_PRIMARY: string;
  EMAIL_SUPPORT: string;
  EMAIL_SALES: string;
  EMAIL_BILLING: string;
  EMAIL_LEGAL: string;
  EMAIL_NOTIFICATIONS: string;
  BUSINESS_HOURS: string;
  SUPPORT_HOURS: string;
  PHYSICAL_ADDRESS: TenantAddress;
  POSTAL_ADDRESS: TenantAddress;
  PHONE_FORMAL: string;
  WEBSITE: string;
  WEBSITE_SHORT: string;
}

export interface TenantBrandColors {
  primary: string;
  navy: string;
  gray: string;
}

export interface TenantBranding {
  companyName: string;
  legalName: string;
  websiteUrl: string;
  websiteShort: string;
  colors: TenantBrandColors;
}

export interface TenantConfig {
  branding: TenantBranding;
  contacts: TenantContacts;
}
```

- [ ] **Step 4: Write the defaults**

Create `lib/tenant/defaults.ts`. Copy the value data from the current `CONTACT` const in `lib/constants/contact.ts` lines 8–58 verbatim (this file becomes the data's new home; Task 2 deletes it from the old location):

```typescript
import type { TenantConfig } from './types';

/**
 * CircleTel — tenant #1 default identity.
 * This file is the ONE place brand literals are allowed
 * (excluded from the brand-literal CI ratchet).
 */
export const CIRCLETEL_DEFAULTS: TenantConfig = {
  branding: {
    companyName: 'CircleTel',
    legalName: 'Circle Tel SA (Pty) Ltd',
    websiteUrl: 'https://www.circletel.co.za',
    websiteShort: 'circletel.co.za',
    colors: {
      primary: '#F5841E', // Circle Tel Orange (lib/design-system.ts BRAND_COLORS.orange)
      navy: '#13274A',
      gray: '#747474',
    },
  },
  contacts: {
    WHATSAPP_NUMBER: '082 487 3900',
    WHATSAPP_LINK: 'https://wa.me/27824873900',
    WHATSAPP_INTERNATIONAL: '+27 82 487 3900',
    PHONE_SALES_OUTBOUND: '010 880 3663',
    EMAIL_PRIMARY: 'contactus@circletel.co.za',
    EMAIL_SUPPORT: 'contactus@circletel.co.za',
    EMAIL_SALES: 'sales@circletel.co.za',
    EMAIL_BILLING: 'billing@circletel.co.za',
    EMAIL_LEGAL: 'legal@circletelsa.co.za',
    EMAIL_NOTIFICATIONS: 'no-reply@notify.circletel.co.za',
    BUSINESS_HOURS: 'Monday - Friday: 08:00 - 17:00 SAST',
    SUPPORT_HOURS: 'Mon-Fri, 8am-5pm',
    PHYSICAL_ADDRESS: {
      name: 'Circle Tel SA (Pty) Ltd',
      attention: 'Contracts and Commercial Manager',
      building: 'Imagine House',
      street: '2 Mellis Road',
      suburb: 'Rivonia',
      city: 'Sandton',
      province: 'Gauteng',
      postalCode: '2191',
      country: 'South Africa',
    },
    POSTAL_ADDRESS: {
      street: '2 Mellis Road',
      building: 'Imagine House',
      suburb: 'Rivonia',
      city: 'Sandton',
      postalCode: '2191',
    },
    PHONE_FORMAL: '+27 87 087 6307',
    WEBSITE: 'https://www.circletel.co.za',
    WEBSITE_SHORT: 'circletel.co.za',
  },
};
```

IMPORTANT: before committing, diff the values you copied against the current `lib/constants/contact.ts` on your branch — if that file changed since this plan was written, the CURRENT file wins. Same for the color values vs `lib/design-system.ts` `BRAND_COLORS`.

- [ ] **Step 5: Write the accessor**

Create `lib/tenant/config.ts`:

```typescript
import { CIRCLETEL_DEFAULTS } from './defaults';
import type { TenantConfig } from './types';

let cached: TenantConfig | null = null;

/**
 * Resolve the tenant's config: CircleTel defaults overridden by
 * NEXT_PUBLIC_TENANT_* env vars (set per deployment in the
 * instance-per-tenant model). NEXT_PUBLIC_ so the same accessor works
 * in server and client bundles (values are baked at build time on the
 * client, which is correct: one build per tenant).
 */
export function getTenantConfig(): TenantConfig {
  if (cached) return cached;
  const d = CIRCLETEL_DEFAULTS;
  cached = {
    branding: {
      ...d.branding,
      companyName:
        process.env.NEXT_PUBLIC_TENANT_COMPANY_NAME || d.branding.companyName,
      legalName:
        process.env.NEXT_PUBLIC_TENANT_LEGAL_NAME || d.branding.legalName,
      websiteUrl:
        process.env.NEXT_PUBLIC_TENANT_WEBSITE_URL || d.branding.websiteUrl,
      websiteShort:
        process.env.NEXT_PUBLIC_TENANT_WEBSITE_SHORT || d.branding.websiteShort,
      colors: {
        ...d.branding.colors,
        primary:
          process.env.NEXT_PUBLIC_TENANT_PRIMARY_COLOR ||
          d.branding.colors.primary,
      },
    },
    contacts: { ...d.contacts },
  };
  return cached;
}

/** Test-only: clear the cache so env overrides can be re-evaluated. */
export function resetTenantConfigForTests(): void {
  cached = null;
}
```

Create `lib/tenant/index.ts`:

```typescript
export { getTenantConfig, resetTenantConfigForTests } from './config';
export type {
  TenantConfig,
  TenantBranding,
  TenantBrandColors,
  TenantContacts,
  TenantAddress,
} from './types';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest __tests__/lib/tenant/config.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 7: Write the dev doc (docs-in-DoD applies to this plan too)**

Create `docs/architecture/TENANT_CONFIG.md`:

```markdown
# Tenant Config Layer

**Module**: `lib/tenant/` | **Since**: Phase 0 (2026-07)
**Spec**: `docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md` §2

## What

Single source of platform identity (brand, contacts, colors) for the
instance-per-tenant whitelabel model. CircleTel is tenant #1; its values
live in `lib/tenant/defaults.ts` — the ONE file allowed to contain brand
literals (excluded from the CI brand ratchet).

## Usage

​```typescript
import { getTenantConfig } from '@/lib/tenant';

const { branding, contacts } = getTenantConfig();
branding.companyName; // 'CircleTel' (or the tenant's name)
contacts.EMAIL_SUPPORT;
​```

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
```

(Remove the zero-width escapes around the code fences when creating the file — shown escaped here only so this plan renders.)

- [ ] **Step 8: Type-check and commit**

Run: `npm run type-check:memory` — expect no errors in `lib/tenant/**` or the test file.

```bash
git add lib/tenant __tests__/lib/tenant docs/architecture/TENANT_CONFIG.md
git commit -m "feat(tenant): tenant config layer skeleton — whitelabel Phase 0"
git push -u origin feat/whitelabel-phase0-guardrails
```

---

### Task 2: Re-route `lib/constants/contact.ts` through the tenant layer

**Files:**
- Modify: `lib/constants/contact.ts` (replace the `CONTACT` const data block, lines ~8–58; keep every formatter function below it unchanged)
- Test: `__tests__/lib/constants/contact.test.ts` (create)

**Interfaces:**
- Consumes: `getTenantConfig()` from Task 1.
- Produces: `CONTACT` keeps its exact current shape and values — the 23 files importing from `@/lib/constants/contact` or `@/lib/constants` must not change. Formatter exports (`formatPhoneInternational`, `formatAddressOneLine`, `formatAddressPipe`, `formatPostalAddress`, `formatAddressFooter`, and any others in the file) keep identical signatures.

- [ ] **Step 1: Write the failing test (locks in backward compatibility)**

Create `__tests__/lib/constants/contact.test.ts`:

```typescript
import { CONTACT, formatAddressOneLine } from '@/lib/constants/contact';

describe('CONTACT backward compatibility (tenant-config derived)', () => {
  it('exposes the same values as before the tenant re-route', () => {
    expect(CONTACT.WHATSAPP_NUMBER).toBe('082 487 3900');
    expect(CONTACT.EMAIL_PRIMARY).toBe('contactus@circletel.co.za');
    expect(CONTACT.EMAIL_NOTIFICATIONS).toBe('no-reply@notify.circletel.co.za');
    expect(CONTACT.PHYSICAL_ADDRESS.building).toBe('Imagine House');
    expect(CONTACT.WEBSITE).toBe('https://www.circletel.co.za');
  });

  it('formatters still work against the derived CONTACT', () => {
    expect(formatAddressOneLine()).toBe(
      'Imagine House, 2 Mellis Road, Rivonia, Sandton, 2191'
    );
  });
});
```

- [ ] **Step 2: Run test to verify current state**

Run: `npx jest __tests__/lib/constants/contact.test.ts`
Expected: PASS already (it tests current values). That is fine — this test is the regression net for Step 3. Commit nothing yet.

- [ ] **Step 3: Replace the data block**

In `lib/constants/contact.ts`, replace the entire `export const CONTACT = { ... } as const` block (header comment through the closing `} as const`) with:

```typescript
/**
 * Contact Information Constants (legacy path)
 *
 * Now DERIVED from the tenant config layer — see lib/tenant/ and
 * docs/architecture/TENANT_CONFIG.md. Do not add values here; add them
 * to lib/tenant/ instead. Kept so 23 existing consumers work unchanged.
 */
import { getTenantConfig } from '@/lib/tenant';

export const CONTACT = getTenantConfig().contacts;
```

Leave every function below the const untouched — they read `CONTACT.PHYSICAL_ADDRESS` etc. and keep working. If any formatter references a key you did NOT carry into `TenantContacts`, STOP and add that key to the type + defaults (Task 1 files) rather than leaving a dangling reference.

- [ ] **Step 4: Run the test + full type-check**

Run: `npx jest __tests__/lib/constants/contact.test.ts` — Expected: PASS
Run: `npm run type-check:memory` — Expected: no NEW errors. Watch specifically for consumers that relied on `as const` literal types (error like `Type 'string' is not assignable to type '"082 487 3900"'`). If one appears, fix by widening the consumer's type annotation to `string` — do not revert the re-route.

- [ ] **Step 5: Commit**

```bash
git add lib/constants/contact.ts __tests__/lib/constants/contact.test.ts
git commit -m "refactor(tenant): derive legacy CONTACT constants from tenant config"
git push
```

---

### Task 3: Brand-literal ratchet script

**Files:**
- Create: `scripts/check-brand-literals.sh`
- Create: `.brand-literal-baseline`

**Interfaces:**
- Consumes: nothing.
- Produces: exit code 0/1 contract used by the CI job in Task 4. Baseline file contains a single integer.

- [ ] **Step 1: Write the script**

Create `scripts/check-brand-literals.sh`:

```bash
#!/usr/bin/env bash
# Brand-literal ratchet — whitelabel Phase 0 (spec §2).
# Counts hard-coded "circletel" occurrences in product code and fails
# if the count INCREASED vs the checked-in baseline. The count must only
# ever go down (target: 0 by Phase 4).
#
# Allowed home for brand literals: lib/tenant/ (the tenant's identity file).
set -euo pipefail
cd "$(dirname "$0")/.."

BASELINE_FILE=".brand-literal-baseline"

count=$(grep -ri "circletel" app components lib \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="tenant" \
  | wc -l | tr -d ' ')

if [[ ! -f "$BASELINE_FILE" ]]; then
  echo "ERROR: $BASELINE_FILE missing. Create it with: echo $count > $BASELINE_FILE"
  exit 1
fi
baseline=$(tr -d ' \n' < "$BASELINE_FILE")

echo "Brand literals: $count (baseline: $baseline)"

if (( count > baseline )); then
  echo "FAIL: brand-literal count increased ($baseline -> $count)."
  echo "New code must read identity from lib/tenant (getTenantConfig())."
  echo "See docs/architecture/TENANT_CONFIG.md"
  exit 1
fi

if (( count < baseline )); then
  echo "NOTE: count dropped below baseline — ratchet it down:"
  echo "  echo $count > $BASELINE_FILE   (and commit it)"
fi

echo "OK"
```

Run: `chmod +x scripts/check-brand-literals.sh`

- [ ] **Step 2: Seed the baseline and verify failure/pass behavior**

```bash
# Seed with the real current count:
scripts/check-brand-literals.sh 2>/dev/null || true   # prints ERROR + the count
grep -ri "circletel" app components lib --include="*.ts" --include="*.tsx" --exclude-dir="tenant" | wc -l | tr -d ' ' > .brand-literal-baseline
scripts/check-brand-literals.sh
```
Expected: `OK` with the counted number (~1,300–1,400 at plan-writing time; use whatever it actually is).

Now prove the ratchet bites:
```bash
echo 0 > .brand-literal-baseline
scripts/check-brand-literals.sh; echo "exit=$?"
```
Expected: `FAIL: brand-literal count increased (0 -> …)` and `exit=1`.

Restore the real baseline:
```bash
grep -ri "circletel" app components lib --include="*.ts" --include="*.tsx" --exclude-dir="tenant" | wc -l | tr -d ' ' > .brand-literal-baseline
scripts/check-brand-literals.sh
```
Expected: `OK`, exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-brand-literals.sh .brand-literal-baseline
git commit -m "feat(ci): brand-literal ratchet script + baseline — whitelabel Phase 0"
git push
```

---

### Task 4: Brand ratchet CI job

**Files:**
- Modify: `.github/workflows/pr-checks.yml` (add one job; do not touch existing jobs)

**Interfaces:**
- Consumes: `scripts/check-brand-literals.sh` exit-code contract from Task 3.
- Produces: a required-on-PR check named `brand-literal-ratchet`.

- [ ] **Step 1: Read the existing workflow**

Run: `sed -n '1,40p' .github/workflows/pr-checks.yml` and note the `on:` triggers and indentation style of existing jobs (e.g. the `validate-dockerfile` job). Match them exactly.

- [ ] **Step 2: Add the job**

Append under `jobs:` (align indentation with siblings):

```yaml
  brand-literal-ratchet:
    name: Brand-literal ratchet (whitelabel)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check brand-literal count vs baseline
        run: bash scripts/check-brand-literals.sh
```

NOTE: unlike type-check/lint in this workflow, do NOT add `continue-on-error: true` — this check is cheap, deterministic, and meant to block.

- [ ] **Step 3: Validate and commit**

Run: `npx yaml-lint .github/workflows/pr-checks.yml 2>/dev/null || python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/pr-checks.yml')); print('yaml OK')"`
Expected: `yaml OK`

```bash
git add .github/workflows/pr-checks.yml
git commit -m "ci: add brand-literal ratchet job to pr-checks"
git push
```
Then after the PR is opened (end of plan), confirm the job runs green on the PR: `gh pr checks --watch` shows `brand-literal-ratchet` pass.

---

### Task 5: Feature registry module (`lib/admin/feature-registry.ts`)

**Files:**
- Create: `lib/admin/feature-registry.ts`
- Create: `docs/architecture/FEATURE_REGISTRY.md`
- Test: `__tests__/lib/admin/feature-registry.test.ts`

**Interfaces:**
- Consumes: the nav data currently hard-coded in `components/admin/layout/Sidebar.tsx` (the `navigationSections` const at lines 65–379 and the second bottom-section const ending ~line 405 — verify exact line numbers on your branch before cutting).
- Produces (Task 6 depends on these exact names):
  - Types: `Maturity`, `NavChild`, `NavItemWithHref`, `NavItemWithChildren`, `NavItem`, `NavSection` (the last five MOVED verbatim from Sidebar.tsx, with `maturity?: Maturity` added to both NavItem variants and to `NavSection`)
  - `hasChildren(item: NavItem): item is NavItemWithChildren` (moved verbatim)
  - `featureSections: NavSection[]` and `bottomSections: NavSection[]` (the moved data)
  - `getVisibleSections(sections: NavSection[], opts: { isAdmin: boolean }): NavSection[]`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/admin/feature-registry.test.ts`:

```typescript
import {
  featureSections,
  bottomSections,
  getVisibleSections,
  hasChildren,
  type NavSection,
} from '@/lib/admin/feature-registry';

describe('feature registry data', () => {
  it('contains the known top-level entries', () => {
    const names = featureSections.flatMap((s) => s.items.map((i) => i.name));
    expect(names).toContain('Dashboard');
    expect(names).toContain('Products');
    expect(names).toContain('Quotes');
  });

  it('every item has a name and an icon; every leaf has an /admin href', () => {
    for (const section of [...featureSections, ...bottomSections]) {
      for (const item of section.items) {
        expect(item.name).toBeTruthy();
        expect(item.icon).toBeDefined();
        const leaves = hasChildren(item) ? item.children : [item];
        for (const leaf of leaves) {
          if ('href' in leaf && leaf.href) {
            expect(leaf.href.startsWith('/admin')).toBe(true);
          }
        }
      }
    }
  });
});

describe('getVisibleSections', () => {
  const sections: NavSection[] = [
    {
      label: 'Test',
      items: [
        { name: 'Visible', href: '/admin/a', icon: (() => null) as never },
        {
          name: 'Hidden',
          href: '/admin/b',
          icon: (() => null) as never,
          maturity: 'hidden',
        },
        {
          name: 'Internal',
          href: '/admin/c',
          icon: (() => null) as never,
          maturity: 'internal',
        },
        {
          name: 'AdminOnly',
          href: '/admin/d',
          icon: (() => null) as never,
          adminOnly: true,
        },
      ],
    },
  ];

  it('filters hidden and internal items for everyone', () => {
    const out = getVisibleSections(sections, { isAdmin: true });
    const names = out.flatMap((s) => s.items.map((i) => i.name));
    expect(names).not.toContain('Hidden');
    expect(names).not.toContain('Internal');
  });

  it('filters adminOnly items for non-admins and keeps them for admins', () => {
    const admin = getVisibleSections(sections, { isAdmin: true })
      .flatMap((s) => s.items.map((i) => i.name));
    const nonAdmin = getVisibleSections(sections, { isAdmin: false })
      .flatMap((s) => s.items.map((i) => i.name));
    expect(admin).toContain('AdminOnly');
    expect(nonAdmin).not.toContain('AdminOnly');
  });

  it('drops sections whose items are all filtered out', () => {
    const onlyHidden: NavSection[] = [
      {
        label: 'Ghost',
        items: [
          {
            name: 'H',
            href: '/admin/h',
            icon: (() => null) as never,
            maturity: 'hidden',
          },
        ],
      },
    ];
    expect(getVisibleSections(onlyHidden, { isAdmin: true })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/admin/feature-registry.test.ts`
Expected: FAIL — `Cannot find module '@/lib/admin/feature-registry'`

- [ ] **Step 3: Create the registry module**

Create `lib/admin/feature-registry.ts` with this skeleton, then MOVE (cut, don't copy) the nav data from `Sidebar.tsx`:

```typescript
/**
 * Admin Feature Registry — whitelabel baseline design §6.
 * Every admin section is registered here with role + maturity metadata;
 * the Sidebar renders whatever this module returns. Phase 4 will extend
 * this into the five role workspaces; Phase 0 only centralizes the data.
 *
 * Maturity: 'stable' (default) | 'beta' | 'internal' | 'hidden'.
 * 'internal' and 'hidden' items never render in the nav.
 */
import type React from 'react';
// Move the ENTIRE react-icons import block from Sidebar.tsx here
// (all the Pi* icons the nav data references).

export type Maturity = 'stable' | 'beta' | 'internal' | 'hidden';

export interface NavChild {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavItemWithHref {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  description?: string;
  adminOnly?: boolean;
  maturity?: Maturity;
}

export interface NavItemWithChildren {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavChild[];
  description?: string;
  adminOnly?: boolean;
  maturity?: Maturity;
}

export type NavItem = NavItemWithHref | NavItemWithChildren;

export interface NavSection {
  label: string | null;
  maturity?: Maturity;
  items: NavItem[];
}

export function hasChildren(item: NavItem): item is NavItemWithChildren {
  return 'children' in item && Array.isArray(item.children);
}

// ── Registry data ─────────────────────────────────────────────
// MOVED VERBATIM from components/admin/layout/Sidebar.tsx.
// `navigationSections` (Sidebar lines 65–379 at plan time) becomes
// `featureSections`; the bottom const (ending ~line 405) becomes
// `bottomSections`. Do not rename items, reorder, or change hrefs.
export const featureSections: NavSection[] = [
  // ← paste the full navigationSections array contents here
];

export const bottomSections: NavSection[] = [
  // ← paste the full bottom-nav array contents here
];

// ── Visibility ────────────────────────────────────────────────
export function getVisibleSections(
  sections: NavSection[],
  opts: { isAdmin: boolean }
): NavSection[] {
  const itemVisible = (item: NavItem): boolean => {
    const m = item.maturity ?? 'stable';
    if (m === 'hidden' || m === 'internal') return false;
    if (item.adminOnly && !opts.isAdmin) return false;
    return true;
  };
  return sections
    .filter((s) => (s.maturity ?? 'stable') !== 'hidden' && (s.maturity ?? 'stable') !== 'internal')
    .map((s) => ({ ...s, items: s.items.filter(itemVisible) }))
    .filter((s) => s.items.length > 0);
}
```

Notes for the move:
- Cut the icon imports the data needs from Sidebar.tsx into this file. Sidebar keeps only icons its own JSX still uses (chevrons, logout etc.) — the compiler will tell you which (unused-import lint / cannot-find-name errors are your worklist).
- This module has no `'use client'` directive and no JSX — it exports data + pure functions and is importable from the client Sidebar.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/admin/feature-registry.test.ts`
Expected: PASS (5 tests). The Sidebar is now broken (missing const) — that is Task 6; do NOT commit yet. Proceed immediately to Task 6 Step 1 and commit both together (the two tasks form one atomic change; a reviewer gates them as one commit).

---

### Task 6: Sidebar consumes the registry

**Files:**
- Modify: `components/admin/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: `featureSections`, `bottomSections`, `getVisibleSections`, `hasChildren`, and the moved types from `@/lib/admin/feature-registry` (Task 5).
- Produces: identical rendered nav for current users (no visual change is the acceptance test).

- [ ] **Step 1: Rewire the Sidebar**

In `components/admin/layout/Sidebar.tsx`:

1. Delete the moved type definitions, `hasChildren`, and both nav-data consts (already cut in Task 5).
2. Add the import:

```typescript
import {
  featureSections,
  bottomSections,
  getVisibleSections,
  hasChildren,
  type NavItem,
  type NavSection,
} from '@/lib/admin/feature-registry';
```

3. Find the existing role check (line ~409 at plan time):

```typescript
const isAdmin = user?.role === 'super_admin' || user?.role === 'product_manager';
```

Keep it, and derive the rendered lists from the registry where the component previously used the local consts:

```typescript
const visibleSections = getVisibleSections(featureSections, { isAdmin });
const visibleBottomSections = getVisibleSections(bottomSections, { isAdmin });
```

4. Replace references to the old const names in the JSX with `visibleSections` / `visibleBottomSections`. If the JSX previously did its own inline `adminOnly` filtering (e.g. `.filter(item => !item.adminOnly || isAdmin)`), DELETE that inline filtering — visibility decisions now live only in `getVisibleSections` (one pattern, not a blend).

- [ ] **Step 2: Type-check**

Run: `npm run type-check:memory`
Expected: no errors in `components/admin/layout/Sidebar.tsx` or `lib/admin/feature-registry.ts`. Clean up any now-unused icon imports in Sidebar.tsx that the checker/linter flags.

- [ ] **Step 3: Verify the rendered nav is unchanged**

Run the dev server and eyeball the admin sidebar:

```bash
npm run dev:memory
```

Log in at `http://localhost:3000/admin/login` and confirm: all sections render with the same names/groups/order as production, expand/collapse still works, and an admin user sees the adminOnly entries. Then stop the server.

- [ ] **Step 4: Commit (Tasks 5+6 together)**

```bash
git add lib/admin/feature-registry.ts __tests__/lib/admin/feature-registry.test.ts components/admin/layout/Sidebar.tsx docs/architecture/FEATURE_REGISTRY.md
git commit -m "feat(admin): feature registry drives sidebar nav — whitelabel Phase 0"
git push
```

(Write `docs/architecture/FEATURE_REGISTRY.md` before committing — Step 5.)

- [ ] **Step 5: Write the dev doc**

Create `docs/architecture/FEATURE_REGISTRY.md`:

```markdown
# Admin Feature Registry

**Module**: `lib/admin/feature-registry.ts` | **Since**: Phase 0 (2026-07)
**Spec**: `docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md` §6

Admin navigation is GENERATED from the registry — never edit nav JSX in
`components/admin/layout/Sidebar.tsx` to add/remove a section.

## Adding an admin section

1. Build the page under `app/admin/<section>/`.
2. Register it in `featureSections` (or `bottomSections`) with an icon.
3. Set `maturity`:
   - `stable` (default) — visible to allowed roles
   - `beta` — visible (Phase 4 will add a badge)
   - `internal` — hidden from nav (dev/testing only, reachable by URL)
   - `hidden` — hidden from nav (parked/incomplete work)
4. Set `adminOnly: true` if only super_admin / product_manager may see it.

## Hiding a half-finished section

Set `maturity: 'hidden'` on the item. Do not delete the entry.

## Phase 4 (planned, not yet built)

Role workspaces (finance / sales / ops / support / executive) will extend
these entries with `roles: [...]` and workspace grouping.
```

If Step 4 already committed, amend or add a follow-up commit:
```bash
git add docs/architecture/FEATURE_REGISTRY.md
git commit -m "docs(admin): feature registry usage guide"
git push
```

---

### Task 7: Docs-in-DoD PR template

**Files:**
- Modify: `.github/pull_request_template.md` (replace the existing `### Documentation` block only)

**Interfaces:** none (process artifact).

- [ ] **Step 1: Replace the Documentation checklist**

In `.github/pull_request_template.md`, find the existing block:

```markdown
### Documentation
- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] Inline code documentation added
- [ ] CLAUDE.md updated (if changing conventions)
```

Replace it with:

```markdown
### Documentation — Definition of Done (whitelabel spec §8)
<!-- Docs ship WITH the feature, not after. Tick one line in each pair. -->

**User-facing behavior changed?**
- [ ] Matching user guide added/updated in `docs/help/<area>/` (interim home until the /help center ships in Phase 4)
- [ ] N/A — no user-facing change

**API / architecture / integration changed?**
- [ ] Dev doc added/updated in `docs/` (architecture, integration guide, or API reference)
- [ ] N/A — no API/architecture change

**Conventions changed?**
- [ ] CLAUDE.md / `.claude/rules/` updated
- [ ] N/A
```

- [ ] **Step 2: Create the interim user-docs home**

```bash
mkdir -p docs/help
cat > docs/help/README.md <<'EOF'
# User Guides (interim home)

Task-oriented guides for platform operators (finance, sales/marketing,
ops, support, executives). One markdown file per task, e.g.
`billing/run-a-debit-batch.md`.

These migrate into the in-product /help center in Phase 4 of the
whitelabel plan (spec §8). Until then, every PR that changes user-facing
behavior adds or updates its guide here — enforced by the PR template.
EOF
```

- [ ] **Step 3: Commit**

```bash
git add .github/pull_request_template.md docs/help/README.md
git commit -m "docs: PR template enforces docs-in-Definition-of-Done"
git push
```

---

### Task 8: Portable scheduler (tracked, generated from vercel.json)

**Files:**
- Create: `ops/scheduler/generate-crontab.sh`
- Create: `ops/scheduler/check-drift.sh`
- Create: `docs/deployment/SCHEDULER.md`

**Interfaces:**
- Consumes: `vercel.json` `.crons[]` (path + schedule) — the single source of truth for schedules.
- Produces: a generated crontab installable on any host (VPS today, tenant-bundle container later); a drift checker comparing the live crontab to `vercel.json`.

Background (verified 2026-07-09): production crons fire from the VPS root crontab — lines of the form
`. /root/.cron-env && curl -sfH "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/<name> >> /var/log/circletel-cron.log 2>&1`.
`vercel.json` lists 23 crons; the live crontab had 22 — there is real drift to fix.

- [ ] **Step 1: Write the generator**

Create `ops/scheduler/generate-crontab.sh`:

```bash
#!/usr/bin/env bash
# Generate the host crontab from vercel.json (single source of truth).
# Portable-scheduler requirement: whitelabel spec §12 — cron must not
# depend on any specific host; this file + /root/.cron-env (CRON_SECRET,
# APP_URL) is everything a host or tenant-bundle container needs.
#
# Usage: ops/scheduler/generate-crontab.sh > /tmp/crontab.new
#        crontab /tmp/crontab.new
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "# CircleTel platform cron jobs — GENERATED from vercel.json"
echo "# Regenerate: ops/scheduler/generate-crontab.sh | crontab -"
echo "# Requires /root/.cron-env exporting CRON_SECRET and APP_URL"
echo "# All times UTC. Logs: /var/log/circletel-cron.log"

jq -r '.crons[] | "\(.schedule)\t. /root/.cron-env && curl -sfH \"Authorization: Bearer $CRON_SECRET\" $APP_URL\(.path) >> /var/log/circletel-cron.log 2>&1"' vercel.json
```

- [ ] **Step 2: Write the drift checker**

Create `ops/scheduler/check-drift.sh`:

```bash
#!/usr/bin/env bash
# Compare the LIVE crontab's /api/cron entries against vercel.json.
# Exit 1 on drift. Run after any change to vercel.json crons.
set -euo pipefail
cd "$(dirname "$0")/../.."

expected=$(jq -r '.crons[] | "\(.schedule) \(.path)"' vercel.json | sort)
actual=$(crontab -l 2>/dev/null \
  | grep -o '^[^.]*\. /root/.cron-env.*api/cron/[a-z0-9-]*' \
  | sed -E 's|^([^ ]+ [^ ]+ [^ ]+ [^ ]+ [^ ]+)[[:space:]]+.*(/api/cron/[a-z0-9-]+).*|\1 \2|' \
  | sort)

if [[ "$expected" == "$actual" ]]; then
  echo "OK: live crontab matches vercel.json ($(echo "$expected" | wc -l | tr -d ' ') crons)"
  exit 0
fi

echo "DRIFT between vercel.json and live crontab:"
diff <(echo "$expected") <(echo "$actual") || true
echo "Fix: ops/scheduler/generate-crontab.sh | crontab -"
exit 1
```

```bash
chmod +x ops/scheduler/generate-crontab.sh ops/scheduler/check-drift.sh
```

- [ ] **Step 3: Test generator output, then fix the live drift**

```bash
ops/scheduler/generate-crontab.sh | head -8
```
Expected: header comments + one line per vercel.json cron (23 lines of jobs), each shaped like the existing live entries.

```bash
ops/scheduler/check-drift.sh || true   # expect DRIFT (22 live vs 23 expected)
crontab -l > /root/crontab.backup.$(date +%Y%m%d)   # backup first
ops/scheduler/generate-crontab.sh | crontab -
ops/scheduler/check-drift.sh
```
Expected final output: `OK: live crontab matches vercel.json (23 crons)`

CAUTION: `crontab -` REPLACES the whole crontab. The backup step is mandatory. Before installing, run `crontab -l | grep -v "api/cron"` — if that prints any non-CircleTel jobs, append them to the generated file before installing instead of losing them.

- [ ] **Step 4: Write the doc**

Create `docs/deployment/SCHEDULER.md`:

```markdown
# Platform Scheduler (portable crons)

**Since**: Phase 0 (2026-07) | **Spec**: whitelabel design §12

## How scheduled jobs run

`vercel.json` `.crons[]` is the single source of truth (path + schedule,
UTC). Jobs are HTTP routes under `app/api/cron/*` authenticated by
`Authorization: Bearer $CRON_SECRET`. The host fires them via curl from
its crontab. Inngest crons are DORMANT in this deployment — never add a
scheduled job as an Inngest cron (see .claude rules / project memory).

## Adding a cron

1. Create `app/api/cron/<name>/route.ts` with the CRON_SECRET check
   (copy the pattern from `app/api/cron/generate-invoices/route.ts`).
2. Add `{ "path": "/api/cron/<name>", "schedule": "<cron expr>" }` to
   `vercel.json` `.crons[]`.
3. On the host: `ops/scheduler/generate-crontab.sh | crontab -`
   (backup first: `crontab -l > /root/crontab.backup.$(date +%Y%m%d)`).
4. Verify: `ops/scheduler/check-drift.sh` → OK.

## Host requirements (VPS today, tenant bundle later)

- `/root/.cron-env` exporting `CRON_SECRET` and `APP_URL`
- `curl`, `jq`, and a cron daemon
- In the tenant-bundle container (spec §12), the same generated file
  feeds the container's crond — no host-specific scheduler dependency.

## Drift check

`ops/scheduler/check-drift.sh` compares the live crontab to vercel.json
and exits 1 on mismatch. Run it after every deploy that touched crons.
```

- [ ] **Step 5: Commit**

```bash
git add ops/scheduler docs/deployment/SCHEDULER.md
git commit -m "feat(ops): portable scheduler — crontab generated from vercel.json + drift check"
git push
```

---

### Task 9: RLS security migration (hardware catalogue + quote acceptance links)

**Files:**
- Create: `supabase/migrations/20260709150000_tighten_rls_hardware_and_quote_links.sql`

**Interfaces:**
- Consumes: existing policies created in `supabase/migrations/20260523000002_create_hardware_catalogue.sql` (lines 192–214) and the baseline squash (`quote_acceptance_links` policies).
- Produces: closed advisor findings "anon-writable hardware catalogue" and "quote_acceptance_links anon-read-all".

Background (verified 2026-07-09): the four `"Admin full access …"` policies on the hardware tables are `FOR ALL USING (true)` with **no role restriction** — the anon key can INSERT/UPDATE/DELETE catalogue rows. `"Public can view quote acceptance links by token" … TO authenticated, anon USING (true)` lets anyone SELECT every acceptance link + token. No app code reads `quote_acceptance_links` with a client-side (anon/session) client — grep found zero references under `app/` and `lib/` — so server routes (service role, RLS-bypassing) are unaffected by dropping the policy.

- [ ] **Step 1: Re-verify the safety preconditions on your branch**

```bash
grep -rn "quote_acceptance_links" app lib components --include="*.ts" --include="*.tsx" | grep -v "app/api" || echo "no client-side readers"
grep -rn "from('circletel_hardware_products')\|from(\"circletel_hardware_products\")" app components lib --include="*.ts" --include="*.tsx" | grep -v "app/api" | grep -iE "insert|update|delete|upsert" || echo "no client-side writers"
```
Expected: `no client-side readers` and `no client-side writers`. If either grep DOES return hits, STOP — do not apply the migration; surface the file list for a design decision instead.

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/20260709150000_tighten_rls_hardware_and_quote_links.sql`:

```sql
-- Whitelabel Phase 0 security burn-down (spec §7).
-- 1) Hardware catalogue: the "Admin full access" policies were
--    FOR ALL USING (true) with no role restriction -> the public anon
--    key could INSERT/UPDATE/DELETE catalogue rows. Admin traffic goes
--    through service-role API routes (RLS-bypassing), so full access is
--    scoped to service_role. Public read policies are unchanged.

DROP POLICY IF EXISTS "Admin full access hardware products" ON circletel_hardware_products;
CREATE POLICY "Service role full access hardware products" ON circletel_hardware_products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access hardware supplier links" ON hardware_product_suppliers;
CREATE POLICY "Service role full access hardware supplier links" ON hardware_product_suppliers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access hardware terms" ON hardware_product_terms;
CREATE POLICY "Service role full access hardware terms" ON hardware_product_terms
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access hardware service links" ON hardware_service_links;
CREATE POLICY "Service role full access hardware service links" ON hardware_service_links
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2) quote_acceptance_links: "Public can view ... by token" was
--    USING (true) for anon+authenticated -> anyone could enumerate all
--    acceptance links and tokens. Token resolution happens in
--    service-role API routes; no client-side reader exists
--    (verified 2026-07-09). Anon SELECT is removed entirely.

DROP POLICY IF EXISTS "Public can view quote acceptance links by token" ON public.quote_acceptance_links;
```

- [ ] **Step 3: Apply manually to the shared DB**

Apply via the Supabase MCP `apply_migration` tool (project `agyjovdugmtopasyvlng`) with the file's SQL, or via `psql` with the service connection string. Remember: staging and prod share this database — this applies to production.

- [ ] **Step 4: Verify with SQL**

Run via Supabase MCP `execute_sql`:

```sql
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN (
  'circletel_hardware_products','hardware_product_suppliers',
  'hardware_product_terms','hardware_service_links','quote_acceptance_links'
)
ORDER BY tablename, policyname;
```

Expected: each hardware table shows its public SELECT policy plus exactly one `Service role full access …` policy with `roles = {service_role}`; `quote_acceptance_links` no longer lists `Public can view quote acceptance links by token`.

- [ ] **Step 5: Smoke-test the affected flows**

- Storefront still lists hardware: open a page that renders published hardware products (or `curl` its API route) — expect products returned (public SELECT untouched).
- Admin hardware editing still works: from the admin UI, edit any hardware product field and save — expect success (service-role route).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260709150000_tighten_rls_hardware_and_quote_links.sql
git commit -m "fix(security): scope hardware-catalogue write policies to service_role; drop anon read of quote_acceptance_links"
git push
```

---

### Task 10: Security burn-down register (ops items that code cannot fix)

**Files:**
- Create: `docs/audits/2026-07-09-security-burndown.md`

**Interfaces:** none (tracking artifact required by spec §7/§10 — the maturity gate needs this list at zero).

- [ ] **Step 1: Write the register**

Create `docs/audits/2026-07-09-security-burndown.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/audits/2026-07-09-security-burndown.md
git commit -m "docs(security): burn-down register for whitelabel maturity gate"
git push
```

---

### Task 11: Final verification and PR

**Files:** none new.

- [ ] **Step 1: Run the full local gate**

```bash
npx jest __tests__/lib/tenant __tests__/lib/constants/contact.test.ts __tests__/lib/admin/feature-registry.test.ts
scripts/check-brand-literals.sh
ops/scheduler/check-drift.sh
npm run type-check:memory
```
Expected: all Jest suites PASS; ratchet `OK`; drift `OK`; no type errors in touched files.

- [ ] **Step 2: Verify the app still builds**

```bash
npm run build:low 2>&1 | tail -20
```
Expected: build completes (this is the 4GB-heap variant; if it OOMs on this box, use `npm run build:memory`).

- [ ] **Step 3: Open the PR**

```bash
gh pr create --base main \
  --title "feat: whitelabel Phase 0 guardrails — tenant config, feature registry, brand ratchet, scheduler, RLS fixes" \
  --body "$(cat <<'EOF'
Implements Phase 0 of the whitelabel baseline design
(docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md §11).

- lib/tenant/ config layer; legacy CONTACT derived from it (23 consumers untouched)
- lib/admin/feature-registry.ts drives the admin sidebar (maturity + role filtering)
- Brand-literal CI ratchet (scripts/check-brand-literals.sh + pr-checks job)
- PR template: docs-in-Definition-of-Done
- Portable scheduler: crontab generated from vercel.json + drift check (fixed 1 missing live cron)
- RLS migration 20260709150000: hardware catalogue write scoped to service_role; quote_acceptance_links anon-read dropped (applied + verified)
- docs/audits/2026-07-09-security-burndown.md register

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Then follow the repo's staging-first rule: push the branch to staging (`git push origin HEAD:staging`) for admin verification before merging to main, per CLAUDE.md deployment strategy.

- [ ] **Step 4: Confirm CI green**

Run: `gh pr checks --watch`
Expected: `brand-literal-ratchet` and existing checks pass (type-check/lint report-only as before).

---

## Self-Review Notes (done at plan-writing time)

- **Spec coverage**: Phase 0 scope from spec §11 → Task 1–2 (tenant layer), 5–6 (registry + nav), 3–4 (ratchet), 7 (docs DoD), 8 (portable scheduler, spec §12 item 1), 9–10 (security quick wins, spec §7). Out of Phase-0 scope by design: workspaces UX, /help center, offer manager, billing engine (Phases 1–4).
- **Deliberate deviations**: bucket privatization (register item 4) deferred — needs a signed-URL refactor with unknown consumer surface; `supplier_products` world-readable added as register item 5 (found during planning, needs a reader check before scoping).
- **Type consistency**: `getTenantConfig`/`resetTenantConfigForTests` names match across Tasks 1–2; `NavSection`/`getVisibleSections`/`featureSections`/`bottomSections` match across Tasks 5–6.
- **Line numbers** (Sidebar 65–379/405, contact.ts 8–58) were verified 2026-07-09 on `codex/reconcile-staging-with-main`; re-verify on the execution branch before cutting.
