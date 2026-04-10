# Marketing Skills Repo Evaluation

**Date**: 2026-04-10
**Source**: [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)
**License**: MIT
**Decision**: Selective adoption (5 skills adapted for CircleTel SA market)

---

## Summary

Evaluated the `coreyhaines31/marketingskills` open-source repository (20k+ stars, 40+ AI agent marketing skills) for potential use in CircleTel. The repo provides markdown-based skill definitions compatible with Claude Code across 7 marketing domains.

**Verdict**: Wholesale import rejected due to skill conflicts, generic content, and context bloat. Instead, 5 skills were cherry-picked and adapted for the SA ISP market with CircleTel-specific context.

---

## What Was Adopted

| Skill | Gap Filled | Location |
|-------|-----------|----------|
| **seo-audit** | No SEO audit methodology existed; only basic Sanity SEO schema | `.claude/skills/seo-audit/` |
| **ab-test-setup** | No experimentation framework for conversion optimization | `.claude/skills/ab-test-setup/` |
| **email-sequence** | Email preferences + Resend existed but no sequence design skill | `.claude/skills/email-sequence/` |
| **churn-prevention** | No formalized churn prevention, cancel flow, or dunning strategy | `.claude/skills/churn-prevention/` |
| **referral-program** | Ambassador tables existed but no strategic referral/ambassador skill | `.claude/skills/referral-program/` |

## What Was Skipped (and Why)

| Skill Category | Reason Skipped |
|---------------|---------------|
| **Campaign creation / copywriting** | Already covered by `promotional-campaigns` skill |
| **Pricing strategy** | Already covered by `margin-guardrails.md` and `product-economics.md` |
| **Paid advertising** | Not relevant to CircleTel's current growth stage |
| **Social content** | Not a current priority; would add unnecessary skill bloat |
| **Competitor alternatives** | Already covered by `promotional-campaigns/references/competitor-playbook.md` |
| **Product marketing context** | CircleTel already has its own at `.claude/product-marketing-context.md` |
| **Content strategy** | Premature for current stage |
| **Sales enablement** | Already handled by B2B sales engine (`lib/sales-engine/`) |

---

## Adaptations Made

Each adopted skill was adapted, not copied directly:

1. **SA market context**: Added load-shedding, Rand pricing, WhatsApp as primary channel, Hellopeter reviews, local competitor references
2. **CircleTel infrastructure integration**: Referenced existing files (`promotion-service.ts`, `marketing-triggers.ts`, Supabase migrations, Resend config)
3. **Margin guardrails**: All discount/offer recommendations validated against CircleTel's 25% minimum margin requirement
4. **Brand voice alignment**: All copy examples follow `.claude/product-marketing-context.md` tone
5. **ISP-specific content**: Replaced generic SaaS examples with ISP-relevant scenarios (coverage checks, installation, service quality, speed tests)
6. **Existing infrastructure links**: Each skill references relevant existing code and database tables

---

## Risks Mitigated

| Risk | Mitigation |
|------|-----------|
| Skill conflict with existing skills | Each adapted skill has distinct, non-overlapping trigger keywords |
| Generic content | All examples rewritten for SA ISP market |
| Foundation clash | Adapted skills reference CircleTel's existing `product-marketing-context.md` |
| Context bloat | Only 5 skills adopted (not 40+); each is focused and concise |
| Maintenance burden | Skills are standalone files, no external dependency on source repo |

---

## Integration with Existing Skills

| New Skill | Integrates With |
|-----------|----------------|
| seo-audit | product-page-builder, brand-design |
| ab-test-setup | promotional-campaigns, seo-audit |
| email-sequence | churn-prevention, referral-program, promotional-campaigns |
| churn-prevention | email-sequence, promotional-campaigns (margin validation) |
| referral-program | email-sequence, promotional-campaigns, churn-prevention |
