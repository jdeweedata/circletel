# Prototype: Site Network Usage Report PDF (#667)

Throwaway layout exploration for Wayfinder map [#661](https://github.com/jdeweedata/circletel/issues/661).

## Question

What should a branded Unjani monthly Site Network Usage Report PDF look like (logo, stamps, core traffic, Staff + Patient dual-source)?

## How to view

```bash
npm run dev:memory
# → http://localhost:3000/admin/network/usage-reports/prototype?variant=A
```

Variants (← → or switcher bar):

| Key | Name | Hierarchy |
|-----|------|-----------|
| A | Classic document | Invoice-like: header → KPIs → chart → device → Staff/Patient |
| B | Executive dashboard sheet | Dark KPI tiles + chart first; Unjani strip at bottom |
| C | Dual-source narrative | Patient → Staff → Core BNG as numbered story |

## Sample PDF

```bash
npm run prototype:site-usage-pdf
# → docs/prototypes/2026-07-31-site-usage-report-unjani-alexandra.pdf
```

Mirrors Variant A with mock Unjani Alexandra · June 2026 data.

## Not production

Mock numbers only. Do not merge this route into main without folding a chosen layout into a real implementation plan.
