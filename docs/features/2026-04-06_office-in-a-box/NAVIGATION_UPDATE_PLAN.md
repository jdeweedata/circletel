# Office-in-a-Box — Navigation & Page Update Plan

**Created:** 2026-04-06
**Gating condition:** All changes below are locked until Day 60 (30+ Arlan deals closed + 5 OiaB customers signed)

---

## Context

Office-in-a-Box is CircleTel's dominant bundled SME offer — connectivity + failover + mobile + email + backup + SLA in one monthly payment. Three tiers: Starter (R2,499), Professional (R4,299), Complete (R7,499).

---

## Day 1 — Already Done

| File | Change |
|---|---|
| `components/home/NewHero.tsx` | Fixed false "24/7" claim → "8am–5pm Mon–Fri Support" |
| `app/layout.tsx` | SEO title, description, OG, and Twitter all updated to "One Provider. One Bill. Your Office Runs." |

---

## Navigation Architecture

All desktop and mobile nav flows through **one file**:

```
components/navigation/NavigationData.ts     ← single source of truth
    ↓
components/navigation/NavigationMenu.tsx    ← desktop (auto-updated)
components/navigation/MobileMenu.tsx        ← mobile (auto-updated)

components/layout/Footer.tsx                ← independent, needs separate edit
```

Editing `NavigationData.ts` alone cascades to both desktop and mobile menus.

---

## Day 60 Implementation — Priority Order

> Do NOT start until gating condition is met.

| # | File | Change |
|---|---|---|
| 1 | `app/office-in-a-box/page.tsx` | **Create** — full landing page (see structure below) |
| 2 | `components/navigation/NavigationData.ts` | Add to `connectivityItems`: `{ label: 'Office-in-a-Box', href: '/office-in-a-box', description: 'Everything your office needs. One bill.' }` |
| 3 | `components/layout/Footer.tsx` | Add under Connectivity section: `Office-in-a-Box → /office-in-a-box` |
| 4 | `app/bundles/page.tsx` | Add OiaB as a 4th bundle card (alongside Essential / Professional / Enterprise) |
| 5 | `app/(marketing)/page.tsx` | Add `<OfficeInABoxBanner />` below `<PlanCards />` when `business` segment is active |
| 6 | `supabase/migrations/20260406000001_add_office_in_a_box_products.sql` | Seed 3 OiaB tiers into `admin_products` — verify schema first |

---

## Office-in-a-Box Page Structure (`app/office-in-a-box/page.tsx`)

```
1. Hero
   - Headline: "One Provider. One Bill. Your Office Runs."
   - Subheadline: "Everything a small business needs — connected, backed up, and supported — from R2,499/mo."
   - CTA: WhatsApp → getWhatsAppLink('Hi, I\'d like to know more about Office-in-a-Box')

2. Anchor pricing table ("vs. buying separately")
   - Show component costs separately vs. bundle price
   - Make alternatives feel like the expensive option

3. Tier comparison
   | | Starter | Professional | Complete |
   | Staff | 1-5 | 5-15 | 15-50 |
   | Connectivity | 50 Mbps FWB | 100 Mbps FWB | 200 Mbps FWB |
   | Failover | Arlan LTE | Arlan 5G 35Mbps | Arlan 5G 60Mbps |
   | Mobile lines | 1 | 3 | 5 |
   | Email | 5 mailboxes | 10 mailboxes | 20 mailboxes |
   | Cloud backup | 50 GB | 150 GB | 500 GB |
   | Static IP | ✓ | ✓ | ✓ |
   | Managed router | ✓ | ✓ | ✓ |
   | SLA | 8hr response | 4hr response | 2hr / 24/7 |
   | Security | DNS filtering | DNS + threat | Full suite |
   | Monthly | R2,499 | R4,299 | R7,499 |
   | vs. separate | R3,200+ | R5,800+ | R10,200+ |

4. How it works (3 steps)
   - Check coverage → Choose tier → We install everything

5. Social proof
   - Unjani pilot: 20 healthcare facilities live
   - Add OiaB customer testimonials as they come in

6. CTA
   - WhatsApp CTA (use CONTACT constants — never hardcode numbers)
```

---

## Pages That Do NOT Need Updating

| Page | Reason |
|---|---|
| `app/(marketing)/enterprise/page.tsx` | Different market — ParkConnect/CloudWiFi for large venues |
| `app/services/*` | Managed IT category — separate from OiaB |
| `app/cloud/*` | Cloud/hosting category — separate |
| `app/deals/page.tsx` | Arlan mobile-only deals — keep distinct |
| `app/(marketing)/soho/page.tsx` | WorkConnect SOHO — different tier/audience |

---

## OiaB Banner Component (`components/home/OfficeInABoxBanner.tsx`)

Thin component for homepage business segment. Links to `/office-in-a-box`.

```tsx
// Rendered conditionally in app/(marketing)/page.tsx:
{activeSegment === 'business' && <OfficeInABoxBanner />}
```

---

## DB Migration Notes

Follow pattern from:
`supabase/migrations/20260308000001_add_arlan_bundle_products.sql`

Before writing migration, verify schema:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin_products'
ORDER BY ordinal_position;
```

Set `product_type = 'office_in_a_box'` for all three tiers.
