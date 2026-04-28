# CircleTel Business Context

> Long-term memory: Business context that shapes every technical decision.

---

## What CircleTel Is
B2B/B2C ISP and Managed IT Services platform for South Africa.

## Market
- Country: South Africa
- Regulation: POPIA compliance required
- Currency: ZAR
- VAT: 15% (excl-VAT multiply method)
- Payment methods: 20+ via NetCash Pay Now

## Business Model
- B2C: Consumer fibre and connectivity packages
- B2B: Business connectivity, managed IT, KYC workflows (7-stage)
- Revenue target: R32,000 MRR with 25 customers
- Pricing: Unit economics driven — see `.claude/rules/product-economics.md`
- Margins: Guardrails enforced — see `.claude/rules/margin-guardrails.md`

## Products
- 17 active products
- Lifecycle: IDEA → DRAFT → ACTIVE → ARCHIVED
- Suppliers: Scoop, MiRO, Nology (hardware)
- Wholesale: MTN, Echo SP, DFA, Arlan (services)

## Key URLs
- Production: https://www.circletel.co.za
- Staging: https://circletel-staging.vercel.app
- Supabase: agyjovdugmtopasyvlng

## Integrations
- Supabase (DB, auth, RLS, edge functions)
- Vercel (hosting)
- MTN WMS API (coverage)
- Google Maps (coverage UI)
- NetCash (payments)
- Resend (emails: billing@notify.circletel.co.za)
- Zoho (CRM, Billing, Calendar via MCP)
- Strapi + Sanity Studio (CMS)

---

> **Rule**: Update this when business context changes.
