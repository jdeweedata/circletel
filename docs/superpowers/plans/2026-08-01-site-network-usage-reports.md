# Site Network Usage Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship admin Site Network Usage Reports at `/admin/network/usage-reports` — CircleTel-branded per-site PDFs (optional CSV), sync ≤5 / async ZIP >5, with Unjani Staff + Patient sections per the locked spec.

**Architecture:** Pure domain assemblers under `lib/usage-reports/` build a typed `SiteUsageReportModel` from Supabase (Ruijie rollups, SSID Staff rollups, corporate sites) + Interstellio usage + optional TDX CSV. A jsPDF Layout A renderer turns the model into bytes. Admin APIs orchestrate sync downloads and an Inngest job for bulk ZIP; audit rows + Supabase Storage hold artifacts for 14 days.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (service role in API/Inngest), jsPDF, Inngest, `authenticateAdmin`, Interstellio client (`getSubscriberUsage`), date-fns-tz / Temporal-style SAST math via `Africa/Johannesburg`.

**Spec:** `docs/features/2026-08-01_site-network-usage-reports/SPEC_OUTLINE.md`  
**Visual ref (do not merge prototype route as-is):** branch `prototype/site-usage-report-pdf` → Variant A

---

## File Map

| Path | Responsibility |
|------|----------------|
| `lib/usage-reports/types.ts` | Report model, period presets, source labels, job/audit types |
| `lib/usage-reports/periods.ts` | SAST period bound calculator |
| `lib/usage-reports/inclusion.ts` | Active-service site listing (#665) |
| `lib/usage-reports/core-traffic.ts` | Period-gated Ruijie / Interstellio assembler (#669) |
| `lib/usage-reports/staff-wifi.ts` | Staff section from `ruijie_ssid_traffic_rollups` (#682) |
| `lib/usage-reports/patient-wifi.ts` | TDX CSV parse + Patient section (#671) |
| `lib/usage-reports/assemble-report.ts` | Orchestrates one site → `SiteUsageReportModel` or skip reason |
| `lib/usage-reports/pdf-generator.ts` | Layout A jsPDF (+ skip-slip PDF) |
| `lib/usage-reports/csv.ts` | Optional CSV of same numbers |
| `lib/usage-reports/zip.ts` | Pack PDFs + skip slips |
| `lib/usage-reports/storage.ts` | Upload / signed URL / purge helpers |
| `supabase/migrations/YYYYMMDDHHMMSS_site_usage_report_jobs.sql` | Jobs + audit + storage bucket policy notes |
| `app/api/admin/network/usage-reports/sites/route.ts` | List eligible sites |
| `app/api/admin/network/usage-reports/generate/route.ts` | Sync generate (1–5) |
| `app/api/admin/network/usage-reports/jobs/route.ts` | Start async job (>5) |
| `app/api/admin/network/usage-reports/jobs/[id]/route.ts` | Job status + download URL |
| `app/api/admin/network/usage-reports/patient-csv/route.ts` | Upload/parse TDX CSV for a generate session |
| `lib/inngest/functions/site-usage-report-zip.ts` | Async bulk generator |
| `lib/inngest/functions/site-usage-report-purge.ts` | Daily purge of expired blobs |
| `lib/inngest/index.ts` | Register new functions |
| `app/admin/network/usage-reports/page.tsx` | Picker UI |
| `components/admin/network/usage-reports/*` | Period picker, site multi-select, job progress, CSV upload |
| `lib/admin/feature-registry.ts` | Nav: Usage Reports under Network Management |
| `app/admin/corporate/[id]/sites/[siteId]/page.tsx` | Shortcut “Generate usage report” |
| `__tests__/lib/usage-reports/*.test.ts` | Unit tests for periods, inclusion, core, staff, patient, assemble |

---

### Task 1: Period bounds (SAST)

**Files:**
- Create: `lib/usage-reports/types.ts`
- Create: `lib/usage-reports/periods.ts`
- Test: `__tests__/lib/usage-reports/periods.test.ts`

- [ ] **Step 1: Write failing tests for period presets**

```typescript
import {
  resolveReportPeriod,
  type ReportPeriodPreset,
} from '@/lib/usage-reports/periods';

describe('resolveReportPeriod', () => {
  // Freeze "now" as Wednesday 2026-08-05 15:00 SAST
  const now = new Date('2026-08-05T13:00:00.000Z'); // 15:00 SAST

  it('weekly = last complete Mon–Sun week', () => {
    const p = resolveReportPeriod('weekly', now);
    expect(p.startIso).toBe('2026-07-27T00:00:00.000+02:00'); // Mon
    expect(p.endIso).toBe('2026-08-02T23:59:59.999+02:00'); // Sun
    expect(p.label).toMatch(/week/i);
  });

  it('monthly = last complete calendar month', () => {
    const p = resolveReportPeriod('monthly', now);
    expect(p.startIso).toBe('2026-07-01T00:00:00.000+02:00');
    expect(p.endIso).toBe('2026-07-31T23:59:59.999+02:00');
  });

  it('sixty_day ends yesterday', () => {
    const p = resolveReportPeriod('sixty_day', now);
    expect(p.endIso).toBe('2026-08-04T23:59:59.999+02:00');
    // 60 inclusive days ending yesterday
    expect(p.startIso).toBe('2026-06-06T00:00:00.000+02:00');
  });

  it('custom rejects >90 days', () => {
    expect(() =>
      resolveReportPeriod('custom', now, {
        startDate: '2026-01-01',
        endDate: '2026-05-01',
      })
    ).toThrow(/90/);
  });

  it('periodDayCount drives #669 short vs long', () => {
    const week = resolveReportPeriod('weekly', now);
    expect(week.inclusiveDayCount).toBe(7);
    expect(week.isShortPeriod).toBe(true);
    const month = resolveReportPeriod('monthly', now);
    expect(month.isShortPeriod).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (module missing)**

```bash
npx jest __tests__/lib/usage-reports/periods.test.ts --no-cache 2>&1 | tail -20
```

Expected: cannot find module `@/lib/usage-reports/periods`

- [ ] **Step 3: Implement types + periods**

```typescript
// lib/usage-reports/types.ts
export type ReportPeriodPreset = 'weekly' | 'monthly' | 'sixty_day' | 'custom';

export type CoreTrafficSource =
  | 'ruijie_hourly'
  | 'interstellio_daily'
  | 'unavailable';

export interface ReportPeriod {
  preset: ReportPeriodPreset;
  timezone: 'Africa/Johannesburg';
  startIso: string; // offset-aware SAST
  endIso: string;
  startUtc: Date;
  endUtc: Date;
  label: string;
  rangeLabel: string;
  inclusiveDayCount: number;
  /** true when inclusiveDayCount <= 7 — Ruijie-eligible primary */
  isShortPeriod: boolean;
}

export type StaffWifiState =
  | { kind: 'available'; totalBytes: number; rxBytes: number; txBytes: number }
  | { kind: 'no_samples' }
  | { kind: 'ap_unlinked' };

export type PatientWifiState =
  | {
      kind: 'available';
      uniqueUsers: number;
      loginSessions: number;
      downloadGb: number;
    }
  | { kind: 'awaiting_export' };

export interface SiteUsageReportModel {
  generatedAtIso: string;
  site: {
    id: string;
    name: string;
    accountNumber: string;
    corporateCode: string;
    accountName: string;
  };
  period: ReportPeriod;
  core: {
    source: CoreTrafficSource;
    sourceLabel: string;
    downloadBytes: number;
    uploadBytes: number;
    avgDownKbps: number | null;
    peakBucketBytes: number | null;
    dailyDownloadBytes: number[]; // length = inclusiveDayCount
    note: string;
    secondaryInterstellio?: {
      downloadBytes: number;
      uploadBytes: number;
    };
  };
  device: {
    name: string;
    model: string;
    serial: string;
    group: string;
    status: string;
  } | null;
  unjani: boolean;
  staff: StaffWifiState;
  patient: PatientWifiState;
}

export type AssembleSkipReason =
  | 'core_unavailable'
  | 'site_not_eligible';
```

```typescript
// lib/usage-reports/periods.ts
import { DateTime } from 'luxon';
import type { ReportPeriod, ReportPeriodPreset } from './types';

const TZ = 'Africa/Johannesburg';

export function resolveReportPeriod(
  preset: ReportPeriodPreset,
  now: Date = new Date(),
  custom?: { startDate: string; endDate: string }
): ReportPeriod {
  const zonedNow = DateTime.fromJSDate(now, { zone: TZ });

  let start: DateTime;
  let end: DateTime;
  let label: string;

  if (preset === 'weekly') {
    // Last complete Mon–Sun: if today is Wed, week ended last Sunday
    const thisMonday = zonedNow.startOf('week'); // luxon: Monday when locale weekStartsOn Monday — set explicitly
    // Luxon default week starts Monday in ISO
    end = thisMonday.minus({ days: 1 }).endOf('day');
    start = end.minus({ days: 6 }).startOf('day');
    label = 'Weekly';
  } else if (preset === 'monthly') {
    const lastMonth = zonedNow.minus({ months: 1 });
    start = lastMonth.startOf('month');
    end = lastMonth.endOf('month');
    label = 'Monthly';
  } else if (preset === 'sixty_day') {
    end = zonedNow.minus({ days: 1 }).endOf('day');
    start = end.minus({ days: 59 }).startOf('day');
    label = '60-day';
  } else {
    if (!custom?.startDate || !custom?.endDate) {
      throw new Error('custom period requires startDate and endDate (YYYY-MM-DD)');
    }
    start = DateTime.fromISO(custom.startDate, { zone: TZ }).startOf('day');
    end = DateTime.fromISO(custom.endDate, { zone: TZ }).endOf('day');
    if (!start.isValid || !end.isValid || end < start) {
      throw new Error('invalid custom date range');
    }
    const days = Math.floor(end.diff(start, 'days').days) + 1;
    if (days > 90) throw new Error('custom period max 90 days');
    label = 'Custom';
  }

  const inclusiveDayCount = Math.floor(end.diff(start, 'days').days) + 1;

  return {
    preset,
    timezone: TZ,
    startIso: start.toISO()!,
    endIso: end.toISO()!,
    startUtc: start.toUTC().toJSDate(),
    endUtc: end.toUTC().toJSDate(),
    label,
    rangeLabel: `${start.toFormat('d LLL yyyy')} – ${end.toFormat('d LLL yyyy')}`,
    inclusiveDayCount,
    isShortPeriod: inclusiveDayCount <= 7,
  };
}
```

Confirm `luxon` is already a dependency (`npm ls luxon`). If missing, use the project’s existing date helper — search `Africa/Johannesburg` in `lib/` and match that pattern instead of adding luxon.

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest __tests__/lib/usage-reports/periods.test.ts --no-cache
```

- [ ] **Step 5: Commit**

```bash
git add lib/usage-reports/types.ts lib/usage-reports/periods.ts __tests__/lib/usage-reports/periods.test.ts
git commit -m "feat(usage-reports): add SAST period bound resolver"
```

---

### Task 2: Site inclusion filter (#665)

**Files:**
- Create: `lib/usage-reports/inclusion.ts`
- Test: `__tests__/lib/usage-reports/inclusion.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { filterEligibleSites, type InclusionSiteRow } from '@/lib/usage-reports/inclusion';

const base: InclusionSiteRow = {
  id: 's1',
  name: 'Alexandra',
  account_number: 'CT-UNJ-002',
  status: 'active',
  service_id: null,
  service_status: null,
  corporate_code: 'UNJ',
  account_name: 'Unjani Clinics NPC',
};

describe('filterEligibleSites', () => {
  it('includes active with null service_id', () => {
    expect(filterEligibleSites([base], { includeProvisioned: false }).map((s) => s.id)).toEqual([
      's1',
    ]);
  });

  it('excludes active when linked service is not active', () => {
    const row = { ...base, service_id: 'svc', service_status: 'suspended' };
    expect(filterEligibleSites([row], { includeProvisioned: false })).toHaveLength(0);
  });

  it('includeProvisioned adds provisioned sites', () => {
    const row = { ...base, id: 's2', status: 'provisioned' as const };
    expect(filterEligibleSites([base, row], { includeProvisioned: false })).toHaveLength(1);
    expect(filterEligibleSites([base, row], { includeProvisioned: true })).toHaveLength(2);
  });

  it('unjaniOnly filters corporate_code UNJ', () => {
    const other = { ...base, id: 's3', corporate_code: 'ACME' };
    expect(
      filterEligibleSites([base, other], { includeProvisioned: false, unjaniOnly: true })
    ).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```typescript
// lib/usage-reports/inclusion.ts
export interface InclusionSiteRow {
  id: string;
  name: string;
  account_number: string;
  status: string;
  service_id: string | null;
  service_status: string | null;
  corporate_code: string;
  account_name: string;
}

export function filterEligibleSites(
  rows: InclusionSiteRow[],
  opts: { includeProvisioned: boolean; unjaniOnly?: boolean }
): InclusionSiteRow[] {
  const allowedStatus = new Set(
    opts.includeProvisioned ? ['active', 'provisioned'] : ['active']
  );
  return rows.filter((r) => {
    if (!allowedStatus.has(r.status)) return false;
    if (r.service_id && r.service_status !== 'active') return false;
    if (opts.unjaniOnly && r.corporate_code !== 'UNJ') return false;
    return true;
  });
}
```

Query helper used by API (same file or `inclusion-query.ts`):

```typescript
export async function fetchInclusionSiteRows(
  supabase: SupabaseClient,
  corporateAccountId?: string
): Promise<InclusionSiteRow[]> {
  let q = supabase
    .from('corporate_sites')
    .select(
      `
      id, name, account_number, status, service_id,
      customer_services:service_id ( status ),
      corporate_accounts:account_id ( corporate_code, company_name )
    `
    );
  if (corporateAccountId) q = q.eq('account_id', corporateAccountId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    account_number: row.account_number,
    status: row.status,
    service_id: row.service_id,
    service_status: row.customer_services?.status ?? null,
    corporate_code: row.corporate_accounts?.corporate_code ?? '',
    account_name: row.corporate_accounts?.company_name ?? '',
  }));
}
```

Verify join column names against `CorporateSiteService` / actual schema before coding (`account_id` vs `corporate_account_id`). Prefer matching `lib/corporate/site-service.ts` select shape.

- [ ] **Step 4: Tests PASS + commit**

```bash
npx jest __tests__/lib/usage-reports/inclusion.test.ts
git add lib/usage-reports/inclusion.ts __tests__/lib/usage-reports/inclusion.test.ts
git commit -m "feat(usage-reports): active-service site inclusion filter"
```

---

### Task 3: Core traffic assembler (#669)

**Files:**
- Create: `lib/usage-reports/core-traffic.ts`
- Test: `__tests__/lib/usage-reports/core-traffic.test.ts`

- [ ] **Step 1: Write failing tests for source selection**

```typescript
import { selectCorePrimarySource, aggregateRuijieHourly } from '@/lib/usage-reports/core-traffic';

describe('selectCorePrimarySource', () => {
  it('short period prefers Ruijie when linked+covered', () => {
    expect(
      selectCorePrimarySource({
        isShortPeriod: true,
        ruijieLinked: true,
        ruijieCoversWindow: true,
        interstellioMapped: true,
      })
    ).toBe('ruijie_hourly');
  });

  it('short period falls back to Interstellio', () => {
    expect(
      selectCorePrimarySource({
        isShortPeriod: true,
        ruijieLinked: false,
        ruijieCoversWindow: false,
        interstellioMapped: true,
      })
    ).toBe('interstellio_daily');
  });

  it('long period is Interstellio only', () => {
    expect(
      selectCorePrimarySource({
        isShortPeriod: false,
        ruijieLinked: true,
        ruijieCoversWindow: true,
        interstellioMapped: true,
      })
    ).toBe('interstellio_daily');
  });

  it('neither → unavailable', () => {
    expect(
      selectCorePrimarySource({
        isShortPeriod: false,
        ruijieLinked: true,
        ruijieCoversWindow: true,
        interstellioMapped: false,
      })
    ).toBe('unavailable');
  });
});

describe('aggregateRuijieHourly', () => {
  it('sums rx/tx and buckets by SAST day', () => {
    const rows = [
      {
        captured_at: '2026-07-01T10:00:00+02:00',
        total_rx_bytes: 1_000_000_000,
        total_tx_bytes: 100_000_000,
        avg_rx_bps: 8_000_000,
        peak_rx_bps: 20_000_000,
      },
      {
        captured_at: '2026-07-01T11:00:00+02:00',
        total_rx_bytes: 500_000_000,
        total_tx_bytes: 50_000_000,
        avg_rx_bps: 4_000_000,
        peak_rx_bps: 10_000_000,
      },
    ];
    const agg = aggregateRuijieHourly(rows, /* dayCount */ 1, new Date('2026-07-01T00:00:00+02:00'));
    expect(agg.downloadBytes).toBe(1_500_000_000);
    expect(agg.uploadBytes).toBe(150_000_000);
    expect(agg.dailyDownloadBytes).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Implement selection + aggregators + async loaders**

```typescript
// lib/usage-reports/core-traffic.ts (sketch — expand in implementation)
export function selectCorePrimarySource(input: {
  isShortPeriod: boolean;
  ruijieLinked: boolean;
  ruijieCoversWindow: boolean;
  interstellioMapped: boolean;
}): CoreTrafficSource {
  if (input.isShortPeriod) {
    if (input.ruijieLinked && input.ruijieCoversWindow) return 'ruijie_hourly';
    if (input.interstellioMapped) return 'interstellio_daily';
    return 'unavailable';
  }
  if (input.interstellioMapped) return 'interstellio_daily';
  return 'unavailable';
}

export const CORE_SOURCE_LABEL: Record<CoreTrafficSource, string> = {
  ruijie_hourly: 'Ruijie traffic rollups (hourly)',
  interstellio_daily: 'Interstellio subscriber usage (daily)',
  unavailable: 'Not available',
};
```

**Ruijie path:** resolve site → `network_devices.corporate_site_id` → `group_id` → query `ruijie_traffic_rollups` where `group_id` + `captured_at` in `[startUtc, endUtc]` and `hours_window = 1`. “Covers window” = at least one row in range (document undercount risk in note; do not invent zeros for missing hours in totals — sum only present rows; daily series fills 0 for empty days).

**Interstellio path:** `corporate_sites.interstellio_subscriber_id` → `getInterstellioClient().getSubscriberUsage(id, 'daily', { start, end })`. Map entries to download/upload bytes per project types in `lib/interstellio/types.ts` (`DataUsageEntry`).

**Secondary panel:** only when `isShortPeriod && primary === ruijie_hourly && interstellioMapped` — attach `secondaryInterstellio`, never sum into primary.

If primary is `unavailable`, assembler returns skip (Task 5) — not a PDF with zero core KPIs.

- [ ] **Step 3: Tests PASS + commit**

```bash
npx jest __tests__/lib/usage-reports/core-traffic.test.ts
git add lib/usage-reports/core-traffic.ts __tests__/lib/usage-reports/core-traffic.test.ts
git commit -m "feat(usage-reports): period-gated core traffic assembler"
```

---

### Task 4: Staff + Patient assemblers (#682 / #671)

**Files:**
- Create: `lib/usage-reports/staff-wifi.ts`
- Create: `lib/usage-reports/patient-wifi.ts`
- Test: `__tests__/lib/usage-reports/staff-wifi.test.ts`
- Test: `__tests__/lib/usage-reports/patient-wifi.test.ts`

- [ ] **Step 1: Staff failing tests**

```typescript
import { resolveStaffWifi } from '@/lib/usage-reports/staff-wifi';

describe('resolveStaffWifi', () => {
  it('ap_unlinked when no device linked to site', () => {
    expect(resolveStaffWifi({ apLinkedToSite: false, hourRows: [] }).kind).toBe('ap_unlinked');
  });

  it('no_samples when linked but empty rows', () => {
    expect(resolveStaffWifi({ apLinkedToSite: true, hourRows: [] }).kind).toBe('no_samples');
  });

  it('sums rx+tx for available', () => {
    const s = resolveStaffWifi({
      apLinkedToSite: true,
      hourRows: [
        { rx_bytes: 100, tx_bytes: 40 },
        { rx_bytes: 50, tx_bytes: 10 },
      ],
    });
    expect(s).toEqual({
      kind: 'available',
      rxBytes: 150,
      txBytes: 50,
      totalBytes: 200,
    });
  });
});
```

- [ ] **Step 2: Implement staff**

```typescript
// lib/usage-reports/staff-wifi.ts
import { RUIJIE_SSID_ROLLUP_ALLOWLIST } from '@/lib/ruijie/types';
import type { StaffWifiState } from './types';

export const STAFF_SSID = 'Unjani Clinic Staff'; // must stay in allowlist

export function resolveStaffWifi(input: {
  apLinkedToSite: boolean;
  hourRows: Array<{ rx_bytes: number; tx_bytes: number }>;
}): StaffWifiState {
  if (!input.apLinkedToSite) return { kind: 'ap_unlinked' };
  if (input.hourRows.length === 0) return { kind: 'no_samples' };
  const rxBytes = input.hourRows.reduce((a, r) => a + Number(r.rx_bytes || 0), 0);
  const txBytes = input.hourRows.reduce((a, r) => a + Number(r.tx_bytes || 0), 0);
  return { kind: 'available', rxBytes, txBytes, totalBytes: rxBytes + txBytes };
}

export async function loadStaffHourRows(
  supabase: SupabaseClient,
  siteId: string,
  startUtc: Date,
  endUtc: Date
) {
  if (!RUIJIE_SSID_ROLLUP_ALLOWLIST.includes(STAFF_SSID)) {
    throw new Error('Staff SSID not allow-listed');
  }
  const { data, error } = await supabase
    .from('ruijie_ssid_traffic_rollups')
    .select('rx_bytes, tx_bytes, hour_bucket')
    .eq('corporate_site_id', siteId)
    .eq('ssid', STAFF_SSID)
    .gte('hour_bucket', startUtc.toISOString())
    .lte('hour_bucket', endUtc.toISOString());
  if (error) throw error;
  return data ?? [];
}

export async function siteHasLinkedAp(supabase: SupabaseClient, siteId: string) {
  const { count } = await supabase
    .from('network_devices')
    .select('id', { count: 'exact', head: true })
    .eq('corporate_site_id', siteId);
  return (count ?? 0) > 0;
}
```

Staff is **independent** of #669 — always run for `corporate_code === 'UNJ'`.

- [ ] **Step 3: Patient CSV tests + parser**

```typescript
import { parseTdxPatientCsv, resolvePatientWifi } from '@/lib/usage-reports/patient-wifi';

describe('parseTdxPatientCsv', () => {
  it('maps Looker columns case-insensitively', () => {
    const csv = `Site Code,Unique Users,Sessions,Download GB\nCT-UNJ-002,120,400,12.5\n`;
    const rows = parseTdxPatientCsv(csv);
    expect(rows[0]).toMatchObject({
      siteCode: 'CT-UNJ-002',
      uniqueUsers: 120,
      loginSessions: 400,
      downloadGb: 12.5,
    });
  });
});

describe('resolvePatientWifi', () => {
  it('awaiting_export when no row for site', () => {
    expect(resolvePatientWifi(null).kind).toBe('awaiting_export');
  });
});
```

Use a tiny CSV parse (split lines) — no new heavy dependency. Column aliases: `Unique Users`, `Users`, `Sessions` / `Login Sessions`, `Download GB` / `Download (GB)`, site key `Site Code` / `account_number` / `CT-UNJ-*`.

- [ ] **Step 4: Tests PASS + commit**

```bash
npx jest __tests__/lib/usage-reports/staff-wifi.test.ts __tests__/lib/usage-reports/patient-wifi.test.ts
git add lib/usage-reports/staff-wifi.ts lib/usage-reports/patient-wifi.ts __tests__/lib/usage-reports/
git commit -m "feat(usage-reports): Staff SSID and Patient TDX assemblers"
```

---

### Task 5: Assemble one-site report model

**Files:**
- Create: `lib/usage-reports/assemble-report.ts`
- Test: `__tests__/lib/usage-reports/assemble-report.test.ts`

- [ ] **Step 1: Test orchestration with mocks**

```typescript
import { assembleSiteUsageReport } from '@/lib/usage-reports/assemble-report';

it('returns skip when core unavailable', async () => {
  const result = await assembleSiteUsageReport({
    // inject fakes via deps argument
    siteId: 's1',
    period: /* weekly stub */,
    patientRow: null,
    deps: {
      loadSite: async () => ({ /* unjani site */ }),
      loadCore: async () => ({ source: 'unavailable' as const }),
      loadStaff: async () => ({ kind: 'no_samples' as const }),
      loadDevice: async () => null,
    },
  });
  expect(result).toEqual({ ok: false, reason: 'core_unavailable' });
});

it('builds model when core available; patient awaiting ok', async () => {
  const result = await assembleSiteUsageReport({ /* ... */ });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.model.patient.kind).toBe('awaiting_export');
    expect(result.model.core.source).not.toBe('unavailable');
  }
});
```

Use a `deps` injection bag so unit tests never hit network/DB.

- [ ] **Step 2: Implement `assembleSiteUsageReport`**

Return type:

```typescript
export type AssembleResult =
  | { ok: true; model: SiteUsageReportModel }
  | { ok: false; reason: AssembleSkipReason; siteId: string; siteLabel: string };
```

Set `generatedAtIso` with `DateTime.now().setZone('Africa/Johannesburg').toISO()`.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(usage-reports): assemble SiteUsageReportModel per site"
```

---

### Task 6: PDF Layout A + skip slip + CSV

**Files:**
- Create: `lib/usage-reports/pdf-generator.ts`
- Create: `lib/usage-reports/csv.ts`
- Create: `lib/usage-reports/bytes.ts` (GB formatters)
- Test: `__tests__/lib/usage-reports/pdf-generator.test.ts` (smoke: buffer magic `%PDF`)

- [ ] **Step 1: Smoke test**

```typescript
import { generateSiteUsageReportPdf, generateSkipSlipPdf } from '@/lib/usage-reports/pdf-generator';
import { reportModelToCsv } from '@/lib/usage-reports/csv';

it('pdf starts with %PDF', () => {
  const buf = generateSiteUsageReportPdf(minimalModel);
  expect(Buffer.from(buf).subarray(0, 4).toString()).toBe('%PDF');
});

it('skip slip pdf starts with %PDF', () => {
  const buf = generateSkipSlipPdf({
    siteLabel: 'Alexandra',
    periodLabel: 'Monthly · Jul 2026',
    reason: 'No usable Ruijie or Interstellio source for this period',
    generatedAtIso: '2026-08-01T12:00:00+02:00',
  });
  expect(Buffer.from(buf).subarray(0, 4).toString()).toBe('%PDF');
});
```

- [ ] **Step 2: Implement jsPDF Layout A**

Follow invoice branding patterns in `lib/invoices/invoice-pdf-generator.ts` (logo path `/public/images/circletel-enclosed-logo.png`, orange rule `#F5831F`).

Section order (locked):
1. Logo + title + generated-at  
2. Site / period  
3. KPI strip (DL / UL / Avg DL / Peak)  
4. Core chart — simple bar drawing from `dailyDownloadBytes`; x labels day-of-month; week bands Week 1…N  
5. Device identity  
6. If `model.unjani`: Staff block (3 states) + Patient block  
7. Footer do-not-sum

Staff footnote when `kind === 'available'`:  
`Sampled STA session telemetry (not accounting-grade); forward-only from sampler go-live; may undercount short sessions / gaps.`

N/A copy exactly from spec (#682 / #671).

CSV columns: site, period, core source, download/upload GB, staff total/dl/ul or N/A reason, patient users/sessions/dl or awaiting.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(usage-reports): Layout A PDF, skip slip, and CSV"
```

---

### Task 7: Audit table + storage + purge

**Files:**
- Create: `supabase/migrations/20260801180000_site_usage_report_jobs.sql`
- Create: `lib/usage-reports/storage.ts`
- Create: `lib/inngest/functions/site-usage-report-purge.ts`
- Modify: `lib/inngest/index.ts`

- [ ] **Step 1: Migration**

```sql
-- site usage report generation jobs + long-lived audit metadata
CREATE TABLE IF NOT EXISTS public.site_usage_report_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('queued','running','succeeded','failed')),
  period_preset text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  site_ids uuid[] NOT NULL,
  include_provisioned boolean NOT NULL DEFAULT false,
  unjani_only boolean NOT NULL DEFAULT false,
  include_csv boolean NOT NULL DEFAULT false,
  patient_csv_path text,
  primary_sources jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome jsonb,
  error_message text,
  storage_path text,
  content_type text,
  byte_size bigint,
  expires_at timestamptz,
  inngest_run_id text
);

CREATE INDEX IF NOT EXISTS idx_site_usage_report_jobs_created
  ON public.site_usage_report_jobs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_usage_report_jobs_expires
  ON public.site_usage_report_jobs (expires_at)
  WHERE expires_at IS NOT NULL AND storage_path IS NOT NULL;

ALTER TABLE public.site_usage_report_jobs ENABLE ROW LEVEL SECURITY;
-- service-role only from API (no authenticated policies) — match other admin job tables
```

Create private bucket `site-usage-reports` via migration or document one-time dashboard create (prefer migration `storage.buckets` insert if project already does that elsewhere — grep `storage.buckets` in `supabase/migrations`).

Retention: `expires_at = created_at + interval '14 days'`.

- [ ] **Step 2: storage helpers**

```typescript
// lib/usage-reports/storage.ts
const BUCKET = 'site-usage-reports';

export async function uploadReportArtifact(
  supabase: SupabaseClient,
  path: string,
  bytes: Buffer,
  contentType: string
) { /* upload via service role */ }

export async function signedReportUrl(supabase: SupabaseClient, path: string, expiresSec = 3600) {
  // reuse pattern from lib/storage/supabase-upload.ts getSignedUrl
}
```

- [ ] **Step 3: Inngest daily purge**

Cron `15 3 * * *` — select jobs where `expires_at < now()` and `storage_path` set; delete storage object; null out `storage_path` (keep audit row forever).

Register in `lib/inngest/index.ts`.

- [ ] **Step 4: Apply migration locally / Supabase; commit**

```bash
git commit -m "feat(usage-reports): jobs table, storage helpers, 14d purge"
```

---

### Task 8: Generate APIs (sync ≤5, async >5)

**Files:**
- Create: `app/api/admin/network/usage-reports/sites/route.ts`
- Create: `app/api/admin/network/usage-reports/patient-csv/route.ts`
- Create: `app/api/admin/network/usage-reports/generate/route.ts`
- Create: `app/api/admin/network/usage-reports/jobs/route.ts`
- Create: `app/api/admin/network/usage-reports/jobs/[id]/route.ts`
- Create: `lib/inngest/functions/site-usage-report-zip.ts`
- Modify: `lib/inngest/index.ts`

- [ ] **Step 1: Sites list API**

`GET /api/admin/network/usage-reports/sites?includeProvisioned=1&unjaniOnly=1`  
Auth: `authenticateAdmin`. Use service/`createClient` server pattern from analytics route.

- [ ] **Step 2: Patient CSV upload**

`POST /api/admin/network/usage-reports/patient-csv` multipart → parse → store JSON map `{ [siteCode]: metrics }` in storage or return parse id. Simplest v1: parse in request, return `{ rows }` to client; client posts rows back on generate (size-bounded). Cap upload 2MB.

- [ ] **Step 3: Sync generate**

`POST /api/admin/network/usage-reports/generate`

Body:

```typescript
{
  siteIds: string[]; // 1..5
  period: ReportPeriodPreset;
  custom?: { startDate: string; endDate: string };
  includeCsv?: boolean;
  patientRows?: TdxPatientRow[];
}
```

Logic:
1. Auth admin  
2. Reject `siteIds.length === 0 || siteIds.length > 5` (tell client to use jobs)  
3. Resolve period  
4. For each site assemble; collect PDFs + skip slips  
5. If one site and ok → return `application/pdf`  
6. If multi or any skip → ZIP (`application/zip`)  
7. Insert audit job row `status=succeeded`, upload artifact, `expires_at=+14d`  
8. Optional: also return `Content-Disposition` filename `CircleTel_Usage_<site>_<period>.pdf`

Use `jszip` if already in package.json; else `archiver` / Node zlib manual — check `npm ls jszip`.

- [ ] **Step 4: Async job API + Inngest**

`POST /api/admin/network/usage-reports/jobs` — requires `siteIds.length > 5`. Insert `queued` row, `inngest.send({ name: 'usage-reports/zip.requested', data: { jobId } })`, return `{ jobId }`.

Function `site-usage-report-zip.ts`:

```typescript
export const siteUsageReportZipFunction = inngest.createFunction(
  { id: 'site-usage-report-zip', concurrency: { limit: 2 } },
  { event: 'usage-reports/zip.requested' },
  async ({ event, step }) => {
    const jobId = event.data.jobId as string;
    await step.run('mark-running', async () => { /* update status */ });
    const artifact = await step.run('build-zip', async () => {
      // assemble all sites, zip, upload, set expires_at
    });
    await step.run('mark-succeeded', async () => { /* storage_path */ });
    return artifact;
  }
);
```

`GET /api/admin/network/usage-reports/jobs/[id]` → `{ status, progress?, downloadUrl?, error? }` with signed URL when succeeded.

- [ ] **Step 5: Manual smoke (staging/local)**

```bash
# with admin session cookie
curl -s 'http://localhost:3000/api/admin/network/usage-reports/sites?unjaniOnly=1' | head
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(usage-reports): sync generate and async ZIP APIs"
```

---

### Task 9: Admin UI + nav + site shortcut

**Files:**
- Create: `app/admin/network/usage-reports/page.tsx`
- Create: `components/admin/network/usage-reports/UsageReportBuilder.tsx`
- Create: `components/admin/network/usage-reports/PeriodPicker.tsx`
- Create: `components/admin/network/usage-reports/SiteMultiSelect.tsx`
- Create: `components/admin/network/usage-reports/JobProgress.tsx`
- Modify: `lib/admin/feature-registry.ts` (add Usage Reports child)
- Modify: `app/admin/corporate/[id]/sites/[siteId]/page.tsx` (shortcut link)

- [ ] **Step 1: Nav entry**

In `feature-registry.ts` Network Management children, after Analytics:

```typescript
{ name: 'Usage Reports', href: '/admin/network/usage-reports', icon: PiFileTextBold },
```

Import `PiFileTextBold` if not already in file imports.

- [ ] **Step 2: Builder page**

Client component:
- Period preset radios + custom date inputs  
- Toggle include `provisioned`  
- Toggle Unjani preset (`unjaniOnly`)  
- Multi-select sites from `/sites`  
- Optional TDX CSV file input (Unjani)  
- Checkbox “Include CSV companion”  
- Generate button:
  - `siteIds.length <= 5` → POST generate → blob download  
  - `>5` → POST jobs → poll JobProgress every 2s → download button  

Match existing admin UI (shadcn Button/Card/Checkbox). Keep page simple — one job, one composition (not a dashboard of widgets).

- [ ] **Step 3: Site detail shortcut**

On corporate site page, add link:

`/admin/network/usage-reports?siteId=<id>&unjani=1`  

Builder reads query and pre-selects that site.

- [ ] **Step 4: Type-check**

```bash
npm run type-check:memory
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(usage-reports): admin picker UI, nav, site shortcut"
```

---

### Task 10: Verification & hand-off

- [ ] **Step 1: Unit suite**

```bash
npx jest __tests__/lib/usage-reports --no-cache
```

Expected: all PASS

- [ ] **Step 2: Type-check + lint targeted**

```bash
npm run type-check:memory
npx eslint lib/usage-reports app/api/admin/network/usage-reports app/admin/network/usage-reports --max-warnings 0
```

- [ ] **Step 3: Manual Unjani happy path**

1. Open `/admin/network/usage-reports`  
2. Unjani preset + monthly  
3. Select 1 linked site with Interstellio id  
4. Download PDF — Layout A, Staff numbers or N/A, Patient awaiting without CSV  
5. Re-run with TDX CSV — Patient filled  
6. Select 6+ sites — async job completes, ZIP has skip slips where needed  

- [ ] **Step 4: Update SPEC_OUTLINE status line**

In `docs/features/2026-08-01_site-network-usage-reports/SPEC_OUTLINE.md` set status to `Implementing` / link this plan path.

- [ ] **Step 5: Final commit + PR**

```bash
git commit -m "docs(usage-reports): link implementation plan from spec outline"
# open PR → staging first per CircleTel branch strategy
```

---

## Spec coverage checklist

| Spec section | Task |
|--------------|------|
| Periods SAST | Task 1 |
| Inclusion #665 | Task 2 |
| Core #669 | Task 3 |
| Staff #682 | Task 4 |
| Patient #671 | Task 4 |
| Assemble + skip | Task 5 |
| Layout A PDF + CSV #667 | Task 6 |
| Retention/audit #668 | Task 7 |
| Sync/async #666 | Task 8 |
| Nav + site shortcut | Task 9 |
| End-to-end verify | Task 10 |

## Out of scope (do not build in this plan)

- Customer portal reports  
- Email delivery  
- Non-Unjani SSID splits  
- Shipping `/usage-reports/prototype`  
- Apps / ad revenue  
- Sampler allow-list admin UI  

## Self-review notes

- Types (`SiteUsageReportModel`, `StaffWifiState`, `CoreTrafficSource`) are defined in Task 1 and reused later — keep names stable.  
- Core unavailable ⇒ skip slip, never fake zero core KPIs.  
- Staff independent of core gate; Patient never from Free radio.  
- Confirm luxon vs existing TZ helper before Task 1 implementation.  
- Confirm `corporate_sites` FK column names against `site-service.ts` in Task 2.  
- Confirm `jszip` availability in Task 8.
