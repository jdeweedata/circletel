# Unjani Clinic Site Inventory

Generated: 2026-03-07

## Summary

| Metric | Count |
|--------|-------|
| Total Sites | 21 |
| **CircleTel BNG (Tarana FWB)** | 12 |
| **MTN Breakout (LTE/5G)** | 9 |
| Provisioned in Interstellio | 14 |
| Job Cards Extracted | 7 |

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TARANA FWB SITES (12 sites)                                                │
│  ───────────────────────────                                                │
│  Site Router → PPPoE → CircleTel ECHO SP BNG → Interstellio RADIUS → Internet│
│  Management: Via L2TP tunnel to 34.35.85.28 (10.125.x.x)                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  MTN LTE/5G SITES (9 sites)                                                 │
│  ──────────────────────────                                                 │
│  Tozed 4G Router → MTN Network → Internet                                   │
│  Management: Via MTN Static IP (41.119.x.x) - NO Interstellio needed        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Site Table

| # | Site Name | Province | Technology | PPPoE Username | Network Path | Hardware |
|---|-----------|----------|------------|----------------|--------------|----------|
| 1 | Chloorkop | Gauteng | Tarana FWB | CT-UNJ-006@circletel.co.za | CircleTel BNG | RN: S150F2224001002, Router: HHEOAENHM6W, AP: G1U52HL002532 |
| 2 | Alexandra | Gauteng | Tarana FWB | CT-UNJ-002@circletel.co.za | CircleTel BNG | RN: S150F2224000967, Router: CB540B25C112/951 |
| 3 | Cosmo City | Gauteng | Tarana FWB | CT-UNJ-007@circletel.co.za | CircleTel BNG | RN: S150F2224000981, MikroTik: HJX0AHJVY9V |
| 4 | Fleurhof | Gauteng | Tarana FWB | CT-UNJ-008@circletel.co.za | CircleTel BNG | RN: S150F2224000953, AP: G1U20W5024986 |
| 5 | Sky City | Gauteng | Tarana FWB | CT-UNJ-009@circletel.co.za | CircleTel BNG | RN: S150F2224000963 |
| 6 | Sicelo | Gauteng | 5G/LTE/FWA | CT-UNJ-011@circletel.co.za | CircleTel BNG | MTN LTE X100PRO, IMEI: 862378060205728, MAC: 98A942D75353, IP: 41.119.3.102 |
| 7 | Heidelberg | Gauteng | Tarana FWB | CT-UNJ-012@circletel.co.za | CircleTel BNG | RN: S150F2224001003, MikroTik: HJX0AYM90ES |
| 8 | Tokoza | Gauteng | Tarana FWB | CT-UNJ-010@circletel.co.za | CircleTel BNG | RN: S150F2224000983, MikroTik: HJX0AV8GD3S, AP: G1U52HL044467 |
| 9 | Soshanguve (Block P) | Gauteng | Tarana FWB | CT-UNJ-025@circletel.co.za | CircleTel BNG | RN: S150F2224000982 |
| 10 | Barcelona | Gauteng | LTE/5G | CT-UNJ-013@circletel.co.za | CircleTel BNG | On-site devices |
| 11 | Lens ext 10 | Gauteng | Tarana FWB | CT-UNJ-016@circletel.co.za | CircleTel BNG | RN: S150F2224000947 |
| 12 | Oukasie | North West | Tarana FWB | CT-UNJ-014@circletel.co.za | CircleTel BNG | Connection issues |
| 13 | Nokaneng | Limpopo | LTE Uncapped | CT-UNJ-017@circletel.co.za | CircleTel BNG | - |
| 14 | Phoenix | KwaZulu-Natal | Tarana FWB | CT-UNJ-021@circletel.co.za | CircleTel BNG | Connection issues (MTN resolution) |
| 15 | Sweetwaters | KwaZulu-Natal | LTE/5G | CT-UNJ-020@circletel.co.za | MTN Breakout | - |
| 16 | New Hanover | KwaZulu-Natal | LTE/5G | CT-UNJ-023@circletel.co.za | MTN Breakout | - |
| 17 | Jabulani | Gauteng | 5G/LTE/FWA | CT-UNJ-015@circletel.co.za | MTN Breakout | Ruijie AP: G1UQ9C8000921 (RAP62-OD) |
| 18 | Durban | KwaZulu-Natal | LTE | CT-UNJ-022@circletel.co.za | MTN Breakout | - |
| 19 | Zamdela | Free State | 5G/LTE/FWA | CT-UNJ-019@circletel.co.za | MTN Breakout | - |
| 20 | Kayamandi | Western Cape | 5G/LTE | CT-UNJ-018@circletel.co.za | MTN Breakout | - |
| 21 | Umsinga | KwaZulu-Natal | LTE/5G | CT-UNJ-024@circletel.co.za | MTN Breakout | - |

---

## MTN Static IP Pool (For LTE/5G Sites)

| SIM | MSISDN | Static IP | IMEI | Assigned To |
|-----|--------|-----------|------|-------------|
| 11349665961 | 27837031410 | 41.119.15.199 | 862378061527104 | Unassigned |
| 11349665979 | 27837034777 | 41.119.16.31 | 862378060745004 | Unassigned |
| 11349665987 | 27837008121 | 41.119.15.149 | 862378061530355 | Unassigned |
| 11349665995 | 27837025476 | 41.119.15.191 | 862378061530132 | Unassigned |
| 11349666001 | 27837028432 | 41.119.15.193 | 862378060839856 | Unassigned |
| 11349666019 | 27837009251 | 41.119.15.151 | 862378061518947 | Unassigned |
| 11349666027 | 27837011465 | 41.119.15.153 | 862378060760458 | Unassigned |
| 11349666035 | 27837018380 | 41.119.15.167 | 862378060817050 | Unassigned |
| 11349666043 | 27837015495 | 41.119.15.166 | 862378060803159 | Unassigned |
| 11349666050 | 27837030586 | 41.119.15.194 | 862378061405509 | Unassigned |

**Note**: Sicelo site has a different static IP (41.119.3.102) assigned via job card - not in this pool.

---

## LTE/5G Sites (MTN Breakout - No Interstellio Required)

These 9 sites use MTN LTE/5G for internet and do NOT require Interstellio PPPoE:

| Site | PPPoE (Placeholder) | MTN Static IP | Status |
|------|---------------------|---------------|--------|
| Sicelo | CT-UNJ-011 | 41.119.3.102 | Deployed |
| Barcelona | CT-UNJ-013 | TBD | CircleTel BNG |
| Jabulani | CT-UNJ-015 | TBD | Pending |
| Nokaneng | CT-UNJ-017 | TBD | CircleTel BNG |
| Kayamandi | CT-UNJ-018 | TBD | Pending |
| Zamdela | CT-UNJ-019 | TBD | Pending |
| Sweetwaters | CT-UNJ-020 | TBD | CircleTel BNG |
| Durban | CT-UNJ-022 | TBD | Pending |
| New Hanover | CT-UNJ-023 | TBD | CircleTel BNG |
| Umsinga | CT-UNJ-024 | TBD | Pending |

**Action Required**: Assign MTN static IPs from pool to remaining sites for remote management

---

## Hardware Serial Numbers (From Job Cards)

### Tarana Remote Nodes (FWB)

| Site | Serial Number |
|------|---------------|
| Chloorkop | S150F2224001002 |
| Alexandra | S150F2224000967 |
| Cosmo City | S150F2224000981 |
| Fleurhof | S150F2224000953 |
| Sky City | S150F2224000963 |
| Heidelberg | S150F2224001003 |
| Tokoza | S150F2224000983 |
| Soshanguve | S150F2224000982 |
| Lens ext 10 | S150F2224000947 |

### MikroTik Routers

| Site | Serial Number |
|------|---------------|
| Chloorkop | HHEOAENHM6W |
| Alexandra | CB540B25C112/951 |
| Cosmo City | HJX0AHJVY9V |
| Heidelberg | HJX0AYM90ES |
| Tokoza | HJX0AV8GD3S |

### Ruijie WiFi Access Points

| Site | Serial Number | Model |
|------|---------------|-------|
| Chloorkop | G1U52HL002532 | - |
| Fleurhof | G1U20W5024986 | - |
| Tokoza | G1U52HL044467 | - |
| Jabulani | G1UQ9C8000921 | RAP62-OD |

### MTN LTE Routers (Tozed X100PRO)

| Site | IMEI | MAC Address | Static IP |
|------|------|-------------|-----------|
| Sicelo | 862378060205728 | 98A942D75353 | 41.119.3.102 |

---

## Jabulani Site Details (CT-UNJ-015)

**Status**: MTN LTE/5G site - Pending MTN static IP assignment

### Network Path
```
Tozed 4G Router → MTN Network → Internet (bypasses CircleTel BNG)
```

### Known Hardware
- **Ruijie AP**: G1UQ9C8000921 (RAP62-OD)
- **AP Management IP**: 192.168.250.2 (local)
- **Current Egress IP**: 41.122.147.142 (dynamic or different MTN assignment)

### Action Required
1. ~~Create subscriber in Interstellio~~ (Not needed - MTN breakout)
2. Assign MTN static IP from pool for remote router management
3. Verify Tozed router is accessible on assigned static IP
4. Configure MikroTik/router for L2TP tunnel (if required for central management)

---

## Network Connectivity & Management

### Tarana FWB Sites (12 sites)
- **Internet**: CircleTel ECHO SP BNG via PPPoE
- **Router Management**: L2TP tunnel to 34.35.85.28 (10.125.x.x network)
- **Requires**: Edge Proxy deployment on 34.35.85.28

### MTN LTE/5G Sites (9 sites)
- **Internet**: MTN network breakout (no CircleTel BNG)
- **Router Management**: Direct via MTN static IP (41.119.x.x)
- **Current Status**: All tested IPs unreachable (firewalled by default)
- **Requires**: Tozed router port forwarding or VPN configuration

### WiFi Management (All Sites)
- **Platform**: Ruijie Cloud (cloud.ruijienetworks.com)
- **Access**: Independent of router management path

---

## Data Sources

| Source | Location | Contains |
|--------|----------|----------|
| Schedule CSV | .docs/Copy of Unjani clinic Schedule Progress report (002).csv | Site names, PPPoE credentials, status |
| Interstellio Export | .docs/export.csv | Subscriber data, session history |
| MTN IPs Excel | .docs/Circle Tel Sa ip.xlsx | Static IP assignments |
| Job Cards | .docs/JOB*.pdf (7 files) | Hardware serial numbers |
