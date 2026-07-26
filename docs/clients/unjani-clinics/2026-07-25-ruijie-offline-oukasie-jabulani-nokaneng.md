# Ruijie offline deep-dive: Oukasie, Jabulani, Nokaneng

**Date:** 2026-07-25  
**Source:** Live Ruijie Cloud EU API + Supabase `ruijie_device_cache` / `device_health_snapshots` / `corporate_sites`  
**Checked at:** ~17:50–19:50 UTC (19:50–21:50 SAST)  
**Query window:** last 5–7 days of health snapshots (~30 min cadence)

---

## Summary

| | **Oukasie** | **Jabulani** | **Nokaneng** |
|--|-------------|--------------|--------------|
| **Account** | CT-UNJ-014 | CT-UNJ-015 | CT-UNJ-017 |
| **AP** | RAP2200(F) indoor | RAP62-OD outdoor | RAP62-OD outdoor |
| **SN** | G1U52HL002739 | G1UQ9C8000921 | G1UQ9C800083B |
| **Last seen (SAST)** | 25 Jul 16:44 | 25 Jul 17:39 | 24 Jul 17:11 |
| **Down for (at check)** | ~3–4 h | ~2–3 h | **~27 h** |
| **7-day uptime** | ~49% | ~89% | ~41% |
| **7-day status flips** | 13 (daily cycle) | 3 | 11 (daily cycle, then stuck) |
| **Config** | UP_TO_DATE | UP_TO_DATE | **NOT_SYNC** |
| **Firmware** | ReyeeOS **2.380** (older) | 2.385 | 2.385 |
| **Last WAN (MTN)** | 41.123.209.149 | 41.122.149.211 | 41.123.9.141 |
| **MTN router IMEI** | X100PRO862378060803159 | X100PRO862378060760458 | X100PRO862378060745004 |
| **SIM** | 11349666019 | 11349666027 | 11349665979 |
| **Severity** | Expected evening pattern | Mild / recent | **Priority incident** |

### Common findings (all three)

- Ruijie `onlineStatus`: **OFF**
- Ruijie `offlineReason`: **INFORM** — cloud stopped receiving device heartbeats (site power, LTE/router uplink, or AP path down; not cloud-side disable)
- Management IP: **192.168.250.2** (standard Unjani LAN)
- Network path: **MTN breakout** (`network_path: mtn_breakout`, `technology: lte_5g`)
- Last WAN IPs: MTN SA mobile broadband pools (not pingable/TCP-open from VPS — expected for LTE)
- Live metrics (`current_performance`) return **404** while offline
- Not a fleet-wide Ruijie/platform outage — most other Unjani APs remained online

---

## 1. Oukasie (Brits, North West) — power schedule

### Site / contacts

| Field | Value |
|-------|-------|
| Site name | Unjani Clinic - Oukasie |
| Account | CT-UNJ-014 |
| corporate_sites.id | `7e2a79dd-1926-475a-a905-eeaab281922b` |
| Contact | Maggie Tlhoaele |
| Phone | 060 356 4365 |
| Email | oukasie@unjani.org |
| Address | Joseph Catholic Church, R/E of Portion 628 of Roodekopjes of Zwaartkopjes, Oukasie, Brits |
| Province | North West |
| Installed | 2026-02-27 |
| Monthly fee | R450 |
| PPPoE | CT-UNJ-014@circletel.co.za |

### Device

| Field | Value |
|-------|-------|
| Name | UNJANICLINICOUKASIE |
| Model | RAP2200(F) |
| SN | G1U52HL002739 |
| MAC | 9cce.8822.9b55 |
| Group | Unjani (parent: CircleTel) |
| Firmware | ReyeeOS 2.380.0.2426;AP_3.0(1)B11P380,Release(12242609) |
| Hardware | 3.41 |
| Config | UP_TO_DATE |
| Mode | AP,1,0,none |
| Last WAN | 41.123.209.149 (MTN — Mobile Broadband Internet, Berea/Durban pool netname) |
| MTN router IMEI | X100PRO862378060803159 |
| MTN SIM | 11349666019 |

### 7-day timeline (health snapshots)

Clear **weekday night-time offline cycle**:

| Evening go-down (SAST) | Morning come-up (SAST) |
|------------------------|------------------------|
| 19 Jul ~19:30 | 20 Jul ~08:30 |
| 20 Jul ~19:00 | 21 Jul ~08:30 |
| 21 Jul ~17:30 | 22 Jul ~08:00 |
| 22 Jul ~17:30 | 23 Jul ~07:30 |
| 23 Jul ~18:00 | 24 Jul ~08:00 |
| 24 Jul ~17:30 | 25 Jul ~08:00 |
| **25 Jul ~17:00** | *(still offline at investigation)* |

- **~49% uptime** over 7 days — almost entirely overnight offline
- Ruijie `lastOnline`: **2026-07-25T14:44:53.000Z** (16:44 SAST)
- Last online health snapshot: **2026-07-25T16:30:15+02:00**

### Assessment

- **Not a new hardware fault** — same behaviour every night (clinic close / load shedding / non-UPS circuit).
- Expected to return online **next morning ~07:30–08:30** if pattern holds.
- Firmware one step behind outdoor fleet (2.380 vs 2.385) — secondary, not offline cause.
- Metadata note: `installation_address.technology` says “Tarana FWB” while `technology` = `lte_5g` — data inconsistency only.

### Recommended action

1. **Watch only** until morning recovery.
2. If not back by ~09:00 on a clinic day, treat like Nokaneng (call site + check X100/SIM).
3. Optional: confirm with clinic whether mains/inverter is off after hours (document as expected power-off).

---

## 2. Jabulani (Soweto) — generally healthy, short outage

### Site / contacts

| Field | Value |
|-------|-------|
| Site name | Unjani Clinic - Jabulani |
| Account | CT-UNJ-015 |
| corporate_sites.id | `44c8a5de-8a6f-4399-8d74-ed5c86709ed0` |
| Contact | Minah Mabunda |
| Phone | 076 294 3398 |
| Email | jabulani@unjani.org |
| Address | 2188 Koma Road, Jabulani, Soweto, Gauteng |
| Province | Gauteng |
| Installed | 2026-03-06 |
| Monthly fee | R450 |
| PPPoE | CT-UNJ-015@circletel.co.za |

### Device

| Field | Value |
|-------|-------|
| Name | UNJANICLINICJABULANI |
| Model | RAP62-OD |
| SN | G1UQ9C8000921 |
| MAC | 9cce.88d1.60d6 |
| Group | Unjani (parent: CircleTel) |
| Firmware | ReyeeOS 2.385.0.1720;AP_3.0(1)B11P385,Release(13172014) |
| Hardware | 1.03 |
| Config | UP_TO_DATE |
| Mode | AP,1,0,**wiredBridge** |
| Last WAN | 41.122.149.211 (MTN — Randburg pool netname) |
| MTN router IMEI | X100PRO862378060760458 |
| MTN SIM | 11349666027 |

### 7-day timeline

| Period | Status |
|--------|--------|
| 18–23 Jul | Solid online (~100%) |
| 24 Jul ~17:00 → 25 Jul ~09:30 | One overnight outage (~16.5 h) |
| 25 Jul ~18:00 → investigation | Offline again (~2–3 h) |

- **~89% 7-day uptime** — best of the three
- Ruijie `lastOnline`: **2026-07-25T15:39:32.000Z** (17:39 SAST)
- Last online health snapshot: **2026-07-25T17:30:20+02:00**
- Transitions: offline@24 Jul 17:00 → online@25 Jul 09:30 → offline@25 Jul 18:00

### Assessment

- Best reliability of the three.
- Current drop may be evening power (like Oukasie) or a short LTE blip — too early to call permanent failure.
- Config up to date; firmware current — no config-drift signal.

### Recommended action

1. Re-poll Ruijie next morning.
2. Call Minah only if still offline after clinic open hours (~09:00).
3. SIM to check if needed: **11349666027**.

---

## 3. Nokaneng (Limpopo) — priority incident

### Site / contacts

| Field | Value |
|-------|-------|
| Site name | Unjani Clinic - Nokaneng |
| Account | CT-UNJ-017 |
| corporate_sites.id | `d2fe17ed-6d83-4d42-a7b9-daafd8b9cfd5` |
| **Register contact (prefer)** | Phindiwe Motebu · **076 936 7649** · **nokaneng@unjani.org** |
| **DB contact (likely wrong)** | Zandile Sibisi · 064 468 0688 · **lenasiasouth@unjani.org** |
| Address | Stand 502, R579 Main Road, Kalkfontein, Nokaneng, Limpopo |
| Province | Limpopo (DB area: Greater Tubatse) |
| Installed | 2026-03-02 |
| Monthly fee | R450 |
| PPPoE | CT-UNJ-017@circletel.co.za |

> **Data quality:** CRM contact email/phone look copy-pasted from Lenasia South — fix when updating the site record.

### Device

| Field | Value |
|-------|-------|
| Name | UNJANICLINICNOKANENG |
| Model | RAP62-OD |
| SN | G1UQ9C800083B |
| MAC | 9cce.88d1.60b2 |
| Group | **UnjanihAPaxS** (parent: Unjani) |
| Firmware | ReyeeOS 2.385.0.1720;AP_3.0(1)B11P385,Release(13172014) |
| Hardware | 1.03 |
| Config | **NOT_SYNC** |
| Mode | AP,1,0,none |
| Last WAN | 41.123.9.141 (MTN — Pretoria pool netname) |
| MTN router IMEI | X100PRO862378060745004 |
| MTN SIM | 11349665979 |

### 7-day timeline

Same evening/morning cycle as Oukasie **until Friday 24 Jul**, then **failed recovery**:

| Offline evening | Online morning |
|-----------------|----------------|
| 19–23 Jul evenings ~17:30–19:30 | next mornings ~08:30–09:00 |
| **24 Jul ~17:30** | **never recovered** |

- **25 Jul:** 0 online snapshots all day
- Ruijie `lastOnline`: **2026-07-24T15:11:03.000Z** (17:11 SAST)
- Last online health snapshot: **2026-07-24T17:00:30+02:00**
- Continuous offline ~**27 hours** at investigation time
- **~41% 7-day uptime** (overnight pattern + failed recovery day)

### Assessment

This is **not** “normal evening power.” The overnight pattern broke; the site never came back.

Likely causes (in order):

1. Site still without power (weekend closure / prolonged outage / tripped breaker)
2. MTN X100 / SIM down (data depleted, SIM blocked, router fault)
3. AP or PoE path failed after a power event
4. Less likely: only Ruijie cloud path broken while LAN Wi‑Fi still works (still needs a site check)

### Recommended action (priority)

1. **Call clinic** — prefer register number **076 936 7649** / nokaneng@unjani.org.
2. Confirm mains + X100 power LEDs + SIM (IMEI `X100PRO862378060745004`, SIM `11349665979`).
3. If power OK and router up but AP still cloud-offline → on-site AP/PoE check.
4. Fix CRM contact data (remove Lenasia South email/phone from Nokaneng record).

---

## Cross-site pattern

```
Evening offline  →  Morning online   = power / clinic hours   (Oukasie; historically Nokaneng)
Evening offline  →  stays offline    = real outage            (Nokaneng now)
Isolated short drop                  = LTE/power blip         (Jabulani today)
```

Other recent offline fleet members (for context, not this ticket):

| Device | Last seen | Notes |
|--------|-----------|-------|
| UNJANICLINICPHOENIX | 2026-07-09 | Stale / long offline |
| UNJANICOSMOCITY | 2026-07-06 | Stale / long offline |
| Newgen switches / OPERATIONSAP | Feb–May 2026 | Unrelated / long offline |

---

## Ops priority order

| Priority | Site | Action |
|----------|------|--------|
| **P1** | **Nokaneng** | Call site + verify power/X100/SIM; escalate if dead past clinic open hours |
| **P2** | **Jabulani** | Re-poll Ruijie morning; call only if still offline after ~09:00 |
| **P3** | **Oukasie** | Expect auto-recovery morning; document as scheduled power-off if pattern holds |

---

## How this was verified

```bash
# Live Ruijie (from repo)
export RUIJIE_APP_ID=... RUIJIE_SECRET=... RUIJIE_BASE_URL=... RUIJIE_MOCK_MODE=false
npx tsx -e 'import { getAllDevices, getDevice } from "./lib/ruijie"; ...'

# Health + sites
node --env-file=.env.local -e '
  // device_health_snapshots last 7d per SN
  // corporate_sites ilike Oukasie|Jabulani|Nokaneng
  // ruijie_device_cache for three SNs
'

# WAN IP ownership
whois 41.123.209.149   # MTNSA mobile broadband
whois 41.122.149.211
whois 41.123.9.141
```

### Serial numbers (quick copy)

```
Oukasie   G1U52HL002739
Jabulani  G1UQ9C8000921
Nokaneng  G1UQ9C800083B
```

---

## Related docs

- Unjani register: `docs/clients/unjani-clinics/Unjani_Clinic_Network_Complete_Register_v3_1.json`
- Contacts: `lib/data/unjani-register-contacts.json`
- Ruijie client: `lib/ruijie/client.ts`
- Cache table: `ruijie_device_cache` (synced ~5 min via Inngest)
- Health table: `device_health_snapshots`
