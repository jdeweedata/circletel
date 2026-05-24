<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# is the hardware considered that will be used, this will be initial hardware we will have to test the deployment with other hardware as well

Yes — the hardware is now concretely considered, and this quote is actually a solid **initial lab and pilot kit**, but it should be treated as a first test profile, not the final universal hardware standard. The quote includes 10 Reyee RG-RAP62X outdoor Wi‑Fi 6 APs, 10 52V/30W PoE adapters, and 10 MikroTik hAP ax S routers, for a subtotal of R26,000 excl. VAT and R29,900 incl. VAT.[^1]

## Fit for initial testing

For the first deployment test, the hardware is suitable for validating the exact architecture you described earlier: MikroTik as the routing/VLAN/policy edge, and separate SSIDs for staff and patients. The hAP ax S gives you RouterOS 7, 5x Gigabit Ethernet, and a 2.5G SFP uplink option, which is more than enough for a 50 Mbps Tarana-fed clinic proof of concept. The RG-RAP62X is an IP65 outdoor Wi‑Fi 6 AP with 1x Gigabit Ethernet and up to 2974 Mbps rated wireless capacity, so it is fine for patient-access coverage and captive portal testing at clinic sites.[^2][^3][^4]

## What the quote does and does not cover

This hardware set covers the access and routing layer, but it does **not** prove the whole rollout model across all future site types yet. It proves one hardware profile: MikroTik router plus Reyee outdoor AP with external PoE power, which is enough to validate VLAN separation, Powerlynx captive portal flow, patient SSID monetization, and nurse SSID isolation.[^4][^1][^2]

What it does not yet cover is:

- Indoor-only clinic layouts with ceiling APs.
- Higher-density waiting areas.
- Non-Reyee AP interoperability.
- PoE switching designs instead of individual injectors.
- Sites needing central UPS/structured cabinet power design.


## Likely lab topology

Your quoted hardware is best used in a lab as:

- 1x hAP ax S as the main router/controller edge.
- 1–2x RG-RAP62X as patient/staff SSID broadcasters.
- PoE injectors to power the APs.
- Simulated WAN/uplink into the MikroTik WAN port.
This lets you test VLAN 10/20 separation, DHCP scopes, RADIUS pathing, captive portal redirection, throughput shaping, and ad display logic before field deployment.[^2][^4]


## Important hardware considerations for the spec

The spec for Claude Code should explicitly say that hardware abstraction is required. Your platform and deployment logic must support:

- MikroTik first, because that is the quoted pilot router and your current field standard.[^1][^2]
- AP-agnostic onboarding where possible, because you will test other AP vendors and models later.
- Venue hardware profiles, for example: `mikrotik_hap_ax_s + reyee_rg_rap62x`, `mikrotik_router + indoor_ap`, `mikrotik_router + multi_ap_high_density`.
- Per-site capability flags such as VLAN-capable, captive-portal-capable, external-RADIUS-capable, and ad-slot-supported.

That matters because Powerlynx and your own reporting platform should not assume one AP vendor forever; they should assume a site capability model.

## My recommendation for the build spec

Add a dedicated section called `Hardware Profiles and Field Compatibility`. It should state:

- Initial certified profile: MikroTik hAP ax S + Reyee RG-RAP62X + 52V/30W PoE injector.[^1]
- Pilot scope: validate captive portal ads, SSID/VLAN split, session reporting, and bandwidth shaping.
- Future scope: certify additional MikroTik routers, indoor APs, and other AP vendors.
- Software must store hardware inventory by venue and support mapping reports/issues to router model, AP model, and firmware version.
- Deployment workflows must not hardcode Reyee-specific assumptions unless tagged by hardware profile.


## Small caveat

One thing to verify in the lab is whether you want the SSIDs broadcast from the hAP ax S itself, from the Reyee APs, or both. Since the quoted Reyee units are the outdoor access layer and the hAP ax S also has Wi‑Fi 6 radios, you need to decide whether the MikroTik is only the router or also an active AP in some sites; that affects your VLAN, roaming, and management design.[^4][^2]

Yes — this hardware is enough for the **initial deployment test**, but the spec should clearly frame it as the first certified hardware profile, not the final hardware standard across all sites.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: Quotation-QU523205.PDF

[^2]: https://mikrotik.com/product/hap_ax_s

[^3]: https://www.comx.co.za/RG-RAP62X-Reyee-Dual-Band-WiFi-6-3000Mbps-Gigabit-Outdoor-Buy-p-307594.php

[^4]: https://scoop.co.za/reyee-dual-band-wifi-6-3000mbps-gigabit-outdoor-ap-rg-rap62-od.html

[^5]: https://mikrotik.com/product/hap_ax3

[^6]: https://mikrotik.com/product/hex_s_2025

[^7]: https://www.facebook.com/groups/731016344242699/posts/1900886923922296/

[^8]: https://fgtechstore.com/product/mikrotik-hap-ax-s/

[^9]: https://www.store.mikrotikcanada.ca/wireless-for-home-and-office/700-hap-ax-s-4752224003362.html

[^10]: https://www.inkvantage.co.zw/products/reyee-dual-band-wifi-6-3000mbps-gigabit-outdoor-ap-rg-rap62-od

[^11]: https://mindtechci.net/en/accueil-english/

[^12]: https://www.gowifi.co.nz/routers/e62iugs-2axd5axt.html

[^13]: https://completeoffice.co.za/products/reyee-dual-band-ax1800-1xge-outdoor-ap

[^14]: https://www.reddit.com/r/mikrotik/comments/1ok0fpb/coming_soon_hap_ax_s_realworld_900m_wifi_what_do/

[^15]: https://www.laptopdirect.co.za/Reyee-RG-RAP62X-p-307594.php

[^16]: https://interprojekt.pl/en/p/mikrotik-e62iugs-2axd5axt.html

