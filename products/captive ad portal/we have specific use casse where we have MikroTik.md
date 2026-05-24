<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# we have specific use casse where we have MikroTik installed with a Tarana backhaul at a clinic site and where we have 50Mbps link and we split it with two VLANs on site on SSID connect to Nurse for work and the other SSID is open for patients to use free WiFi can this be done on these platforms?

Yes, this exact architecture is supported — and **Powerlynx + MikroTik is the right stack for it**. Your clinic setup is actually a textbook deployment case. Here's how it all maps out:

## Your Architecture in Plain Terms

```
Tarana Backhaul (50Mbps)
        │
   MikroTik Router  ←──── WireGuard VPN ────→  Powerlynx Cloud
        │                  (RADIUS client)
   ┌────┴────┐
VLAN 10     VLAN 20
   │              │
Nurse SSID   Patient SSID
(WPA2, private)  (Open, captive portal)
```

Powerlynx explicitly supports MikroTik with VLAN interfaces — the MikroTik creates a **bridge with two VLAN subinterfaces**, each mapped to a separate SSID [^1]. The patient SSID runs through Powerlynx's RADIUS server via a WireGuard tunnel, while the nurse SSID stays completely isolated [^2].

## What Each VLAN Does

**VLAN 10 — Nurse (Work) SSID**

- WPA2/WPA3 password protected — no captive portal
- Direct internet access, bypasses Powerlynx entirely
- You enforce bandwidth limits directly on MikroTik using **Simple Queues** (e.g., guarantee nurses 20Mbps)
- Clinic staff never see ads or splash pages

**VLAN 20 — Patient (Open) SSID**

- Open/no password — patients connect freely
- MikroTik redirects HTTP to Powerlynx's hosted captive portal [^3]
- Patients see a branded splash page, accept T\&Cs (POPIA compliant), and optionally watch an ad or enter a phone number to get access
- Powerlynx controls session time limits, bandwidth caps, and data caps on this SSID [^4]
- Remaining bandwidth (e.g., 30Mbps) is shared among patients with per-user speed limits


## Bandwidth Splitting on 50Mbps

MikroTik handles this natively with **Queue Trees** or **Simple Queues** — you don't need Powerlynx for this part:


| Queue | Interface | Max Bandwidth | Priority |
| :-- | :-- | :-- | :-- |
| Nurse | VLAN 10 | 20Mbps guaranteed | High |
| Patients | VLAN 20 | 30Mbps max (burst allowed) | Low |
| Per-patient cap | VLAN 20 clients | 2–5Mbps per user | — |

This ensures clinical operations are never impacted by patients streaming videos on the free WiFi.

## Setup Path on Powerlynx

1. **Create the hotspot** in Powerlynx dashboard → select "MikroTik" → use the **Advanced Setup** script generator
2. The script auto-configures: WireGuard VPN, RADIUS client, hotspot server on the VLAN 20 interface [^2]
3. Assign the hotspot only to the **patient VLAN bridge port** — the nurse VLAN never touches Powerlynx
4. Configure a branded splash page for the clinic (logo, T\&Cs, ad slot if monetising)
5. Set session rules: e.g., 60-minute free session, re-auth required, 3Mbps per device cap

## One Caveat to Watch

MikroTik's hotspot server runs **per-interface** — so ensure the hotspot server is bound specifically to the VLAN 20 interface, not the main bridge [^1]. The Powerlynx forum has a detailed thread covering exactly this VLAN-on-bridge configuration [^1]. If you use a **script-based setup**, double-check the interface assignment post-script, as the auto-script may bind to the bridge instead of the VLAN subinterface [^2].

Given your MikroTik experience at CircleTel, the advanced manual setup will give you cleaner control — the script approach is more suited to less technical deployments.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://forum.powerlynx.app/t/mikrotik-controller-with-ap-connected-via-vlan-interface/75

[^2]: https://docs.powerlynx.app/networking/mikrotik.html

[^3]: https://docs.powerlynx.app/faq.html

[^4]: https://powerlynx.app

[^5]: https://forum.powerlynx.app/c/networking/5

[^6]: https://forum.powerlynx.app/t/powerlynx-and-splynx-on-the-same-mikrotik-nas/129

[^7]: https://www.reddit.com/r/networking/comments/1l242f9/i_want_to_setup_a_paid_captive_portal_using/

[^8]: https://www.youtube.com/watch?v=UEtecNitMWM

[^9]: https://forum.mikrotik.com/t/vlans-via-power-line/182197

[^10]: https://forum.mikrotik.com/t/vlan-segmentation-in-hotspot/1857

[^11]: https://www.youtube.com/watch?v=L3ggxtGOnbA

[^12]: https://powerlynx.app/blog/how-to-launch-a-captive-wi-fi-network/

[^13]: https://forum.mikrotik.com/t/hotspot-with-vlan/42875

[^14]: https://forum.powerlynx.app/t/setup-vlan-not-per-ap/36

[^15]: https://docs.powerlynx.app/system/splash-pages.html

