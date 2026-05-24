<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# with our current relationship with ECHO that provides the BNG and Interstellio providing the Radius how can we configure this?

This is a really well-defined architecture question. Based on what I know about MikroTik's multi-RADIUS capability and the search results already gathered, I can answer this directly without additional searching.

The key insight is that **ECHO and Interstellio serve the nurse VLAN, while Powerlynx serves the patient VLAN** — they operate in completely separate lanes on the same MikroTik and never conflict.

## How Your Full Stack Maps Together

```
Tarana Backhaul (50Mbps)
        │
   ECHO BNG ──── PPPoE/IPoE session (single uplink)
        │
   MikroTik Router
   ├── Interstellio RADIUS ──── VLAN 10 (Nurse SSID)
   │       WPA2 Auth                Staff access, policy enforced
   │
   └── Powerlynx RADIUS ──── VLAN 20 (Patient SSID)
           WireGuard Tunnel          Captive portal, ads, session limits
```


## The Critical Architecture Point

MikroTik supports **multiple RADIUS servers bound to different interfaces** [^1]. This is the core of the solution — RADIUS is not a global setting on MikroTik; it's configured per hotspot server or per service (PPPoE vs. hotspot). So:

- **Interstellio** remains your RADIUS for PPPoE/IPoE on VLAN 10 — **nothing changes** for the nurse SSID
- **Powerlynx** becomes the RADIUS **only** for the hotspot server running on VLAN 20 — it never touches VLAN 10

These coexist confirmed — Powerlynx's forum has a live thread of users running Powerlynx alongside Splynx (another RADIUS) on the same MikroTik NAS with zero conflicts [^2].

## Configuration Steps

**Step 1 — ECHO BNG (No Changes)**
Your ECHO PPPoE session brings in the 50Mbps as a single WAN interface. ECHO doesn't care about downstream VLANs — the VLAN splitting happens inside the MikroTik after the uplink. No changes needed here.

**Step 2 — VLAN 10 (Nurse — Interstellio, No Changes)**
Your existing Interstellio RADIUS setup for staff authentication remains untouched. This VLAN gets its bandwidth guaranteed via a MikroTik Queue Tree entry (e.g., 20Mbps guaranteed, high priority).

**Step 3 — VLAN 20 (Patient — Add Powerlynx)**
On the MikroTik, configure:


| Setting | Value |
| :-- | :-- |
| Hotspot server interface | VLAN 20 bridge port only |
| RADIUS address | `172.16.0.1` (Powerlynx WireGuard endpoint) [^1] |
| RADIUS secret | Match what you set in Powerlynx dashboard |
| Timeout | 3000ms+ |
| Require Message Auth | No [^1] |
| WireGuard peer | Powerlynx cloud IP |

**Step 4 — Bandwidth Isolation**
Add a Queue Tree on MikroTik:

- Parent queue on the ECHO WAN interface (50Mbps total)
- Child queue for VLAN 10: 20Mbps guaranteed, priority 1
- Child queue for VLAN 20: 30Mbps max, burstable, priority 8
- Per-device limiter on VLAN 20: 3–5Mbps so no single patient dominates


## What to Watch Out For

- **DNS walled garden** — On VLAN 20's hotspot, Powerlynx needs its splash page domain whitelisted in MikroTik's walled garden (`/ip hotspot walled-garden`) so unauthenticated patients can reach the splash page before they've paid/accepted terms [^3]
- **POPIA at the portal** — since you're at a clinic, patients are in a health context. Keep data collection minimal (phone number only, not full ID/name) and make the T\&Cs clear about advertising
- **Queue direction** — apply the Queue Tree on the **WAN interface in the download direction**, not on the VLAN bridges, or you'll get double-NAT queue conflicts

This is a clean, production-grade setup that fully preserves your existing ECHO + Interstellio relationship while layering Powerlynx only where it's needed on the patient VLAN.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://docs.powerlynx.app/networking/mikrotik.html

[^2]: https://forum.powerlynx.app/t/powerlynx-and-splynx-on-the-same-mikrotik-nas/129

[^3]: https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot+-+Captive+portal

[^4]: https://www.youtube.com/watch?v=L3ggxtGOnbA

[^5]: https://docs.powerlynx.app/faq.html

[^6]: https://mum.mikrotik.com/presentations/MX19/presentation_6868_1555013487.pdf

[^7]: https://www.youtube.com/watch?v=NQ_KpqXvMQY

[^8]: https://www.youtube.com/watch?v=u0Ffp-zRIYQ

[^9]: https://www.itweb.co.za/article/new-possibility-to-monetise-wifi-hotspots-with-powerlynxs-direct-integration-with-1voucher/Pero37Z3RReMQb6m

[^10]: https://wiki.splynx.com/network-management/authentication_of_customers/mikrotik_pppoe_radius

[^11]: https://forum.mikrotik.com/t/hotspot-external-captive-portal-with-radius-authentication-flow-and-authentication-confusion/116190

[^12]: https://splynx.com/blog/hotspot/powerlynx-wifi-vouchers-paid-access-efficient-hotspot-management/

[^13]: https://wiki.splynx.com/network-management/authentication_of_customers/mikrotik_hotspot_radius

[^14]: https://www.spotipo.com/integration/mikrotik-captive-portal

[^15]: https://powerlynx.app

[^16]: https://splynx.com/blog/network-management/splynx-radius-configuration-and-troubleshooting/

