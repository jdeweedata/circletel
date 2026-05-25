# CircleTel GNNI — Technical Specification

## Summary
CircleTel's GNNI (Gigabit Network-to-Network Interface) is the physical interconnect between CircleTel (via Echo SP) and wholesale providers at Teraco data centres. Two distinct ports exist: DFA Business Broadband and MTN Wholesale FWB.

## Physical Location
- **Teraco JB1** — Isando, Johannesburg
- **Teraco CT1** — Cape Town

## DFA Business Broadband GNNI

| Parameter | Value |
|---|---|
| Port Speed (initial) | 1 Gbps |
| Port Speed (upgrade) | 10 Gbps |
| NRC (1G) | R6,050 |
| MRC (1G) | R898/month |
| NRC (10G) | R12,000 |
| MRC (10G) | R4,500/month |
| Provider | DFA |
| Design | Single NNI carrying AAA VLAN + IP Transit (WWW) traffic |

## MTN Wholesale FWB (Tarana) NNI

| Parameter | Value |
|---|---|
| Port Speed | 1G NNI (2 ports ordered) |
| NRC (1G) | R7,000 per port |
| MRC (1G) | R2,500 per port (includes 100 Mbps backhaul) |
| NRC (10G) | R6,500 |
| MRC (10G) | R12,500 |
| Location | Teraco JB1 & CT1 |
| RFS Date | 18 August 2025 |
| Quote Ref | SS Q27988 |

## Cross-Connect — JB1 (Johannesburg)

| Parameter | Value |
|---|---|
| Service Order | SO161913 |
| Source | Echo SP SA — Cabinet J_CH1_CAR065 |
| Destination | MTN Managed Network Services — Cabinet J_CH5_D16 |
| Cable | OS2 Singlemode Fibre, LC/LC connectors |
| Fibre Length | 131.3 m (OTDR measured) |
| Total Loss | 0.92 dB @ 1310 nm / 0.87 dB @ 1550 nm |
| ORL | 40.66 dB @ 1310 nm / 41.85 dB @ 1550 nm |
| Cross-Connect Hops | 9 hops through Teraco MMR |
| Install Date | 14 August 2025 |
| Status | PASS |

## Cross-Connect — CT1 (Cape Town)

| Parameter | Value |
|---|---|
| Service Order | SO161914 |
| Source | Echo SP SA — Cabinet C_DC3_D02 |
| Destination | MTN — Teraco CT1 |
| Install Date | 15 August 2025 |
| Status | PASS |

## NNI Service VLANs

| VLAN | Traffic Type |
|---|---|
| AAA VLAN | RADIUS authentication & accounting traffic |
| WWW / IP Transit VLAN | Internet-bound subscriber traffic |

## Equipment

| Location | Owner | Equipment | Function |
|---|---|---|---|
| JHB | MTN | Huawei NE8000M14 | BNG — PPPoE/L2TP termination, BGP |
| CPT | MTN | Huawei S9312 | BNG — PPPoE/L2TP termination, BGP |
| JHB & CPT | Echo SP | Arista switches | Layer 2 only — cannot terminate PPPoE |

## BGP & IP Configuration

| Parameter | Value |
|---|---|
| AS Number | AS 327693 (CircleTel / Echo SP) |
| BGP sessions | Terminate on MTN BNG |
| JHB IP pool | 100.66.160.0/20 (4,094 usable) |
| CPT IP pool | 100.66.176.0/20 (4,094 usable) |

## RADIUS / AAA

| Parameter | Value |
|---|---|
| RADIUS Server 1 | 102.220.62.161 |
| RADIUS Server 2 | 102.220.62.162 |
| RADIUS Server 3 | 102.220.62.163 |
| Auth Port | 1812 (UDP) |
| Accounting Port | 1813 (UDP) |
| POD Port | 3799 (UDP) |
| Realm | circletel.co.za |
| Shared Secret | uu0fzFR9SbQrZ3 |
| Proxy 1 | radius1.sys.echosp.link (13.247.40.35) |
| Proxy 2 | radius2.sys.echosp.link (13.244.49.198) |

## Scalability Thresholds

| Customers | GNNI Required | IPT Required |
|---|---|---|
| 1–100 | 1G | 1G |
| 101–200 | 10G | 1G |
| 201–500 | 10G | 10G |

## Service Design Notes
- Echo SP provides Layer 2 only (Arista switches) — cannot terminate PPPoE
- MTN provides BNG termination (Huawei NE8000M14 in JHB, S9312 in CPT)
- AAA VLAN carries RADIUS traffic to 3 RADIUS servers via echosp.link proxies
- WWW VLAN carries subscriber internet traffic via BGP AS 327693
