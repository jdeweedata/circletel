<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# can i build the entire platform without using powerlynx with Claude Code and superpowers or [https://github.com/github/spec-kit?](https://github.com/github/spec-kit?)

Yes — you can build the entire platform without Powerlynx using Claude Code, and **Spec Kit is a very good fit** for doing it in a disciplined way rather than “vibe coding” a complex adtech/networking product. Spec Kit is explicitly designed for spec-driven development with phases like `/specify`, `/plan`, `/tasks`, and `/implement`, and it works with coding agents such as Claude Code for greenfield builds from detailed requirements.[^1][^2][^3][^4]

## Feasibility

You can realistically build the full stack in-house if you split it into layers: hotspot/network control, captive portal/session engine, ad operations, reporting/revenue, and then later programmatic demand. The biggest point is that **managed sales + self-serve** is very achievable with Claude Code plus a strong spec, while a true programmatic exchange/SSP layer is much harder because OpenRTB integrations, bid requests, impression tracking, and millisecond auction handling add real adtech complexity.[^5][^6][^7]

## What you must build

If you remove Powerlynx, your platform must replace all of these functions:

- Hotspot orchestration for MikroTik and future hardware, including venue onboarding, VLAN/SSID policy templates, and captive-portal enablement.
- Captive portal/session control, including login flow, T\&Cs, vouchers/free sessions, session limits, and RADIUS-driven authorization.
- Ad serving logic for direct campaigns, self-serve campaigns, impression logging, click tracking, pacing, and frequency controls.
- Reporting and revenue engine for advertiser, venue, and CircleTel dashboards.
- Hardware profile and deployment management, since you already need to support the initial MikroTik + Reyee bundle and later certify more hardware.[^8][^9][^10]

That means you are not just building “a dashboard”; you are building a WiFi operations platform plus an ad operations platform.[^8]

## Difficulty by layer

| Layer | Build difficulty | Notes |
| :-- | --: | :-- |
| Hardware profiles \& deployment workflows | 4/10 | Straightforward CRUD + templates. |
| Reporting \& revenue-share engine | 5/10 | Very buildable with Next.js/Supabase. |
| Direct ad sales + self-serve booking | 6/10 | Mostly product workflow and billing logic. |
| Captive portal UX + session app | 7/10 | Very doable, but needs solid networking integration. |
| MikroTik/RADIUS/hotspot orchestration | 8/10 | Doable, but operationally sensitive. |
| Programmatic/OpenRTB layer | 9/10 | Best deferred until inventory scale is larger. |

OpenRTB exists specifically to standardize bid requests and responses across DSPs and SSPs, but that standard only helps once you are ready to manage the complexity of auctions, floors, tracking URLs, and exchange-grade integrations.[^6][^7][^5]

## Best build path

The strongest route is:

1. Use **Spec Kit + Claude Code** to build the platform in phases, because Spec Kit gives you structured specification, planning, and task decomposition before implementation.[^11][^4][^1]
2. Build your own platform **without programmatic first**: hardware inventory, venue onboarding, captive portal management workflow, direct ad booking, self-serve portal, revenue engine, and reporting.
3. Add a modular ad-decision abstraction so you can later plug in either:
    - your own direct/self-serve serving only, or
    - a future OpenRTB connector.[^12][^7]

That keeps the architecture clean while avoiding the hardest part too early.

## Recommendation

For your use case, the answer is **yes, but phase it**. Build the entire CircleTel-owned platform with Claude Code and Spec Kit, but scope v1 as:

- MikroTik-first deployment support,
- captive portal/session control,
- direct and self-serve ad management,
- reporting/revenue dashboards,
- hardware profile management.[^2][^1][^8]

Then treat programmatic as v2 or v3, because that is where complexity jumps sharply from “advanced SaaS/network product” into real adtech infrastructure.[^5][^6]

Would you like me to turn the current spec into a **full Spec Kit project structure** next — including `/constitution`, `/specify`, `/plan`, and the first feature specs for Claude Code?
<span style="display:none">[^13][^14][^15][^16][^17]</span>

<div align="center">⁂</div>

[^1]: https://github.com/github/spec-kit/blob/main/spec-driven.md

[^2]: https://github.github.com/spec-kit/

[^3]: https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/

[^4]: https://github.com/github/spec-kit/blob/main/README.md

[^5]: https://www.linkedin.com/pulse/decoding-digital-ad-auction-your-essential-guide-openrtb-khan-zxopc

[^6]: https://developers.google.com/authorized-buyers/rtb/openrtb-guide

[^7]: https://www.indexexchange.com/en-gb/index-explains/key-components-of-a-bid-request-uk/

[^8]: Quotation-QU523205.PDF

[^9]: https://mikrotik.com/product/hap_ax_s

[^10]: https://scoop.co.za/reyee-dual-band-wifi-6-3000mbps-gigabit-outdoor-ap-rg-rap62-od.html

[^11]: https://dev.to/petersaktor/github-spec-kit-from-vibe-coding-to-spec-driven-development-1pgd

[^12]: https://www.iabuk.com/member-content/10-most-exciting-openrtb-26-features

[^13]: https://developer.microsoft.com/blog/spec-driven-development-spec-kit

[^14]: https://github.com/topics/spec-driven

[^15]: https://iabtechlab.com/dooh-integrated-into-openrtb/

[^16]: https://www.youtube.com/watch?v=a9eR1xsfvHg

[^17]: https://deepwiki.com/github/spec-kit/4-spec-driven-development-workflow

