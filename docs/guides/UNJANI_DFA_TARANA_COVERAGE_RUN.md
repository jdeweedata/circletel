# Unjani DFA + Tarana Coverage Run

**Script**: `scripts/check-unjani-dfa-tarana-coverage.ts`
**Input**: `data/unjani/CircleTel_Unjani_DFA_Feasibility_Request_v1_0.csv` (253 clinic sites, all geocoded)
**Output**: `data/unjani/CircleTel_Unjani_DFA_Tarana_Coverage_Results.csv` + `..._SUMMARY.md`

---

## What it checks

| Leg | Source | Auth | Answers |
|---|---|---|---|
| DFA connected | ArcGIS `PublicCoverage/FeatureServer/2` | none | Is the site inside an active DFA fibre building? |
| DFA near-net | ArcGIS `.../1` | none | Nearest DFA building within `--near-net-radius` (default 200m) |
| DFA ductbank | ArcGIS `.../5`, `stage='Completed'` | none | Nearest completed fibre route within `--route-radius` (default 500m) |
| Tarana TCS | `find_nearest_tarana_base_station` RPC | Supabase service role | Nearest online BN, distance, active RN count, confidence |
| MTN CSP | `mtnsi.mtn.co.za/newcsp_api` | `MTN_CSP_USERNAME` / `MTN_CSP_PASSWORD` | Will MTN accept an FWB order here? **Final authority.** |

The ductbank leg only runs when neither DFA building layer matches, so an off-net site still
records how far it actually sits from fibre instead of a bare `none`.

CSP overrides the TCS read in both directions — our `tarana_base_stations` table only holds base
stations we have synced, so TCS silence is not proof of no coverage.

---

## Run it

Must run from a host whose egress policy allows `utility.arcgis.com`, `mtnsi.mtn.co.za` and
Supabase — the VPS works, a sandboxed session may not.

```bash
set -a && source .env.local && set +a && \
  npx tsx scripts/check-unjani-dfa-tarana-coverage.ts
```

Smoke test five sites first:

```bash
set -a && source .env.local && set +a && \
  npx tsx scripts/check-unjani-dfa-tarana-coverage.ts --limit=5
```

DFA-only, no credentials needed at all:

```bash
npx tsx scripts/check-unjani-dfa-tarana-coverage.ts --skip-tarana
```

Resume after an interruption (keeps rows whose `dfa_status` is not `error`):

```bash
set -a && source .env.local && set +a && \
  npx tsx scripts/check-unjani-dfa-tarana-coverage.ts --resume
```

Full option list is in the script header. Missing credentials never abort the run — the affected
leg is switched off, announced once, and its columns record `not_checked`.

---

## Reading the output

`dfa_status`

| Value | Meaning | Next step |
|---|---|---|
| `connected` | Active DFA fibre in the building | Order BizFibreConnect |
| `near-net` | DFA building within the radius; distance in `dfa_nearnet_distance_m` | Request build quote |
| `route-nearby` | No building match, completed route within `--route-radius` | Request build quote |
| `none` | Nothing within either radius | Fall through to Tarana |
| `error` | Check failed; reason in `dfa_error` | Re-run with `--resume` |

`tarana_status`

| Value | Meaning |
|---|---|
| `feasible` / `not-feasible` | MTN CSP verdict — authoritative |
| `tcs-covered` / `tcs-not-covered` | Our base-station evidence only, used when CSP was unreachable |
| `not_checked` | Leg was off (missing credentials or `--skip-tarana`) |

`recommended_access` applies the sheet's own policy — fibre first, Tarana FWB where there is no
fibre, 5G tertiary.

---

## Caveat that must travel with the results

245 of the 253 rows are `AUTO-GEOCODED` (Google Places, address level) and only 8 are
`FIELD-VERIFIED`. DFA connected/near-net verdicts are polygon-intersect tests, so an
address-level coordinate a few tens of metres off can flip `connected` to `near-net` or the
reverse. Treat the output as an indicative desktop study for prioritisation — capture exact GPS
on site before placing any order.
