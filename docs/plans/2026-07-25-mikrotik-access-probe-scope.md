# Scope: MikroTik Access Probe — Unjani/TDX Clinic Routers

**Date:** 2026-07-25
**Status:** SCOPE ONLY — no probe executed. Approval + authorization required before any live action.
**Author:** Claude Code (session 499dbc2d)
**Related:** `mikrotik-access-state` memory, `.docs/Mikrotik Router Config Script-v2026.02 [CircleTel _ Unjani] - v2026.03.csv`, `docs/clients/unjani-clinics/TDX_CIRCLE_TEL_MSA_*`

---

## 1. Objective

Determine whether CircleTel can gain administrative access to its own MikroTik
routers (currently managed/locked-down by TDX) **without TDX cooperation**, using
the credentials and topology exposed in the TDX config script — and if so, enrol
one router into the existing `mikrotik_routers` management system to prove the path
end-to-end.

Success = we can authenticate to one router's management plane, read its config,
and (bench only) push a change — with a documented, repeatable method and a clear
statement of what is and isn't reachable in production.

---

## 2. What we already have (assets)

From `.docs/Mikrotik Router Config Script-v2026.02` (per-site, populated for CT-UNJ-015):

| Asset | Value location | Note |
|-------|----------------|------|
| `thinkadmin` full-group admin credential | script line ~19 | `admin` user is disabled; thinkadmin is the only login |
| L2TP-client password → `34.35.85.28` | script | Same host as our `MIKROTIK_PROXY_URL` = TDX concentrator |
| Hotspot RADIUS shared secret (`34.79.51.25`) | script | TDX's RADIUS, not ours |
| SNMPv3 auth+priv passwords | script | Traps go to `help@tdx.media` — **TDX sees SNMP events** |
| Per-site PPPoE password (`CT-UNJ-NNN`) | script | On our Interstellio RADIUS |
| Working proxy client + registry + sync | `lib/mikrotik/*`, `mikrotik_routers` | Built, 0 rows, inert |

**Security debt (fix regardless of this probe):** the script is tracked in git on
`origin/main` (commit `f370944d`); `.docs/` was gitignored only afterwards, so all
of the above secrets are in history. Rotate on any router where CircleTel gains
control; treat as exposed.

---

## 3. The blocker the recon exposed (why the naive probe fails)

The original idea — "we terminate the PPPoE, so we have an IP route to the router
WAN + a full admin credential → winbox straight in" — **does not hold for the
current fleet.** Evidence (`ruijie_device_cache`, 2026-07-25, 21 Unjani APs):

- **12 APs egress via unique MTN mobile-broadband pool IPs** (`41.12x/41.11x`).
  These clinics break out through an **MTN X100 LTE router behind CGNAT**. The
  offline deep-dive confirms these WANs are "not pingable/TCP-open from VPS —
  expected for LTE." **No inbound IP path exists to these routers, firewall or not.**
- **9 APs share `41.198.151.0/24`** — a single common gateway (TDX L2TP
  concentrator NAT, or a CircleTel BNG). Reachability here depends on who owns
  that /24 and whether we route into it (unverified — `whois` + BNG traceroute needed).
- The router's own management plane is further locked: `telnet/ftp/www/ssh/api`
  all `disabled`, `api` re-enabled bound to source **`10.125.0.0/24` only** (TDX's
  L2TP mgmt subnet). **winbox (8291) is NOT disabled and there are ZERO firewall
  filter rules** — but that only helps if you can reach the box.

**Conclusion:** the only inbound management paths that exist today are (a) TDX's
L2TP overlay to `34.35.85.28`, which TDX controls, and (b) the router's own LAN
(`192.168.10.0/24` clinic / `192.168.250.0/30` AP-mgmt). There is no CircleTel-
controlled WAN path to the production routers.

---

## 4. The `twurl` remote-control mechanism (must understand before touching anything)

The script installs a scheduler `twurl` running **daily at 02:00** with full policy
(`ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon`). It:

1. pings `storage.googleapis.com`; if reachable,
2. **removes all non-dynamic address-list + walled-garden entries**,
3. fetches `https://storage.googleapis.com/twurl/twurl.rsc` and `/import`s it.

Implications:
- TDX can push arbitrary RouterOS config to every router nightly.
- **Any static change we make is wiped at 02:00** unless we also neutralise `twurl`.
- `twurl.rsc` content is unknown — it could rotate `thinkadmin`, add filter rules,
  or close winbox at any time. Our credential may already be stale on some sites.

---

## 5. Access paths (ranked)

### Path A — Bench unit (RECOMMENDED FIRST; zero production risk)
Enrol a CircleTel-owned spare MikroTik we fully control (own L2TP-client config +
admin pw). Prove: create-router API → registry insert → proxy/winbox reach → status
sync → config read → change push. Validates the whole `lib/mikrotik` stack and the
enrolment mechanics **without touching a live clinic or TDX infrastructure.**
- Needs: one spare RouterOS device, a reachable management path we define, `MIKROTIK_ENCRYPTION_KEY` (set).
- Risk: none (our hardware).
- Answers: "does our software work?" — NOT "can we reach production?"

### Path B — On-LAN reverse probe at ONE cooperative clinic (proves production reach)
Place a small agent on the clinic LAN (a device on VLAN10 `192.168.10.x`, or the
Reyee AP mgmt segment `192.168.250.x`) that dials OUT to us and lets us reach the
MikroTik's LAN-side winbox/API with the `thinkadmin` credential.
- Needs: physical/remote presence on one clinic LAN (clinic staff plug-in, or an
  existing device we can script), the site's current thinkadmin pw (verify not rotated).
- Risk: LOW-MODERATE — read-only is safe; SNMP traps to TDX may reveal login; the
  MTN data cost of a tunnel is on the clinic SIM.
- Answers: "can we authenticate to a real production router?" Yes/no, per site.

### Path C — Via the shared `41.198.151.0/24` gateway (investigate, don't assume)
For the 9 clinics on the shared egress, determine ownership and whether CircleTel
routes into that /24. If it's our BNG, a route to those routers' framed IPs may
exist. If it's TDX's concentrator, it does not.
- Needs: `whois 41.198.151.153`, BNG/Interstellio framed-IP lookup per subscriber,
  traceroute from a host inside our network (NOT this VPS sandbox).
- Risk: LOW (investigation only).
- Answers: whether a no-touch WAN path exists for the shared-gateway subset.

### Path D — Ask TDX for proxy/L2TP access (out of scope of "without TDX")
The `MIKROTIK_PROXY_*` creds we hold may already authorise against `34.35.85.28`.
Test only with TDX's knowledge — hitting their concentrator uninvited is both a
detection and a relationship risk. Not part of this probe.

---

## 6. Recommended plan

1. **Path A (bench)** — prove the software + enrolment path. Safe, immediate, no auth needed.
2. **Path C (investigate shared /24)** — cheap desk research, run in parallel with A.
3. **Path B (one clinic, read-only)** — only after A works and with **explicit
   authorization** (see §7). Pick an **online, non-critical, easy-access** clinic —
   e.g. a Gauteng shared-gateway site — NOT Nokaneng (P1 incident) or the offline three.
4. Report per-path yes/no + a rotation plan for any router we touch.

Do **not**: modify production clinic config, disable/alter `twurl`, or push to a
live router in this probe. Read-only until a separate change is approved.

---

## 7. Authorization gate (non-technical, blocking)

The hardware is CircleTel-owned but **TDX manages it under an active MSA**
(`docs/clients/unjani-clinics/TDX_CIRCLE_TEL_MSA_Final.pdf`). Accessing or changing
routers TDX operates — even our own hardware — may breach that agreement and will
be visible to TDX via SNMP traps. Before Path B or any production touch:

- [ ] Business owner confirms the MSA permits CircleTel administrative access, OR
      accepts the relationship/contract risk of proceeding without TDX.
- [ ] Scope of the touch (read-only vs change) is signed off.
- [ ] Rotation of the exposed script secrets is planned for any controlled router.

Path A (bench) and Path C (whois/route research) need no such gate.

---

## 8. Open unknowns to close

| Unknown | How to resolve |
|---------|----------------|
| Is `thinkadmin` pw still valid per-site (twurl rotation)? | Path A proves format; Path B proves live |
| Who owns `41.198.151.0/24`? | `whois` + BNG route check (Path C) |
| Does our BNG route to any clinic framed IP? | Interstellio framed-IP + traceroute from in-network host |
| What does `twurl.rsc` actually do? | Fetch it (public GCS URL) and read — low risk, do early |
| Is `MIKROTIK_PROXY_URL` (34.35.85.28) alive from prod app? | curl from Coolify app server, not sandbox |

---

## 9. Explicitly NOT in scope

- Any write/config change to a production clinic router.
- Disabling or altering the `twurl` scheduler on production.
- Unsolicited connection to TDX's L2TP concentrator or RADIUS.
- Enrolling production routers into `mikrotik_routers` before Path A + authorization.
