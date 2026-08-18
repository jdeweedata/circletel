import { exclToIncl, inclToExcl, priceBundle, type BundleTemplate } from '@/lib/products/bundle-pricing';
import { documentRef, type FlyerWizardFields } from '@/lib/products/bundle-doc-fields';

export interface GeneratedFlyerDocs {
  cpsMarkdown: string;
  brdMarkdown: string;
  onePagerMarkdown: string;
  cpsPath: string;
  brdPath: string;
  onePagerPath: string;
}

function fileSafeName(name: string): string {
  return name.replace(/[^\w]+/g, '').replace(/^$/, 'Flyer');
}

export function generateFlyerDocs(
  fields: FlyerWizardFields,
  template: BundleTemplate,
  today = '18 August 2026'
): GeneratedFlyerDocs {
  const code = fields.code;
  const name = fields.name;
  const cpsRef = documentRef('CPS', code);
  const brdRef = documentRef('BRD', code);
  const billedExcl = inclToExcl(fields.billedInclVat);
  const billedIncl = exclToIncl(billedExcl);
  const pricing = priceBundle({
    template: { ...template, billedInclVat: fields.billedInclVat },
    termMonths: fields.termMonths,
    billedInclVat: fields.billedInclVat,
    heliosIncludesCpe: fields.heliosIncludesCpe,
    cpeCostExcl: fields.cpeCostExcl,
    addCpeUpgrade: false,
    m365Seats: fields.m365Seats,
    connectivityCostExcl: fields.connectivityCostExcl,
  });

  const buyer =
    fields.buyerType === 'soho'
      ? 'SOHO / micro-business'
      : fields.buyerType === 'smb'
        ? 'SME'
        : 'SOHO or SME';

  const cpsMarkdown = `# ${name} — Commercial Product Specification

## ${fields.tagline || name}

---

| Field | Value |
|-------|-------|
| **Document Reference** | ${cpsRef} |
| **Version** | 1.0 |
| **Effective Date** | ${today} |
| **Classification** | CONFIDENTIAL — Internal & Partner Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | Product Strategy |
| **Approved By** | Pending |
| **Supersedes** | N/A |
| **Companion** | ${brdRef} |

---

## Version Control & Change Log

| Version | Date | Author | Change Description | Status |
|---------|------|--------|--------------------|--------|
| 1.0 | ${today} | Product Strategy | Initial flyer from builder | **CURRENT** |

---

## 1. Executive Summary

${fields.salesBlurb || `${name} is a CircleTel flyer combining connectivity, optional router, and optional Microsoft 365.`}

### 1.1 Strategic Metrics Summary

| Metric | Value | Notes |
|--------|-------|-------|
| Target Market | ${buyer} | ${fields.needsSiteCheck ? 'Site check required' : 'National SIM / no site check'} |
| Customer pays | R${fields.billedInclVat.toFixed(2)} incl VAT | R${billedExcl.toFixed(2)} excl VAT |
| Gross margin | ${pricing.marginPct}% | Floor 25% |
| Contract | ${fields.termMonths} months | Router spread over this term |
| Pricing Model | Flyer (incl VAT) | Hybrid SkyTel dealer |

---

## 2. Product Architecture

### 2.1 Bundle Components

| Component | Provider | Role |
|-----------|----------|------|
| ${fields.connectivityName || 'Connectivity'} | SkyTel / Helios | connectivity |
| ${fields.cpeName || 'Router'} | Rectron | cpe |
| Microsoft 365 Business Standard × ${fields.m365Seats} | Microsoft CSP | licence |

Helios already includes a router: **${fields.heliosIncludesCpe ? 'yes' : 'no'}**.

---

## 3. Pricing Schedule

All prices in South African Rand (ZAR). Customer-facing price is inclusive of VAT at 15%.

### 3.1 Monthly Recurring Charges

| Package | Specification | MRC (excl. VAT) | MRC (incl. VAT) |
|---------|---------------|-----------------|-----------------|
| ${name} | ${fields.termMonths} month flyer | R${billedExcl.toFixed(2)} | R${billedIncl.toFixed(2)} |

---

## 4. Wholesale Cost Structure & Margin Analysis

> **CONFIDENTIAL — INTERNAL USE ONLY**

| Item | Amount (excl VAT) |
|------|-------------------|
| What we pay SkyTel | R${pricing.connectivityCostExcl.toFixed(2)} |
| Router spread | R${pricing.cpeAmortisedMonthlyExcl.toFixed(2)} |
| Microsoft CSP | R${pricing.m365CspMonthlyExcl.toFixed(2)} |
| Our monthly cost | R${pricing.directCostExcl.toFixed(2)} |
| What we keep | R${pricing.contributionExcl.toFixed(2)} |
| Gross margin | ${pricing.marginPct}% |
| Month-1 cash | R${pricing.month1CashOutExcl.toFixed(2)} |

---

## 5. Eligibility summary

- Buyer: ${buyer}
- Site check: ${fields.needsSiteCheck ? 'required' : 'not required'}
- Support: ${fields.supportHours}
- Fair use: ${fields.fairUse || 'As stated on the flyer'}

---

## 6. Contract terms

${fields.termMonths} months. Router cost, if we fund it, is spread over this term.

---

## 7. Approval

| Role | Status |
|------|--------|
| Finance | Pending |

*CircleTel (Pty) Ltd — "Connecting Today, Creating Tomorrow"*
`;

  const brdMarkdown = `# ${name} — Business Rules Document (BRD)

## Eligibility Logic, Workflow Rules & Conditional Policies

---

| Field | Value |
|-------|-------|
| **Document Reference** | ${brdRef} |
| **Version** | 1.0 |
| **Effective Date** | ${today} |
| **Classification** | Confidential — Internal Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | CircleTel Product Strategy |
| **Companion Documents** | ${cpsRef} |
| **Supersedes** | N/A — First issue |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---------|------|--------|---------|--------|
| 1.0 | ${today} | CircleTel Product Strategy | Initial rules from flyer builder | **CURRENT** |

---

## 1. Purpose & Scope

This document records the few rules that decide who can buy **${name}** and how we price it.

---

## 2. Definitions

| Term | Definition |
|------|-----------|
| Flyer | Reusable priced bundle sales can quote after finance signs |
| Helios | SkyTel / MTN dealer portal deal |
| Floor | 25% gross margin on this flyer type |

---

## 3. Customer Eligibility Rules

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| CE-001 | Entity type | Buyer is ${buyer} | Proceed |
| CE-001 | Wrong entity | Buyer is not ${buyer} | Do not quote this flyer |

---

## 4. Coverage & Technical Eligibility

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| TC-001 | Coverage | ${fields.needsSiteCheck ? 'A site coverage check is required' : 'National SIM — no site check'} | ${fields.needsSiteCheck ? 'Run coverage before quoting' : 'Quote without a site pin'} |

---

## 5. Product Selection Rules

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| PS-001 | Helios router | Helios already sent a router | Do not bill a second router unless the customer upgrades |
| PS-001 | Upgrade | Sales ticks upgrade the router | Count Rectron cost in month-1 cash |

---

## 6. Pricing & Discount Rules

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| PR-001 | Floor | Gross margin ≥ 25% | Finance may sign Ready to sell |
| PR-001 | Below floor | Gross margin < 25% | Save allowed; Ready to sell needs finance sign-off and a note |

---

## 7. Contract & Commitment Rules

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| CC-001 | Term | Contract is ${fields.termMonths} months | Spread funded router cost over this term |

*CircleTel (Pty) Ltd — "Connecting Today, Creating Tomorrow"*
`;

  const onePagerMarkdown = `# ${name}

${fields.tagline}

**Customer pays R${fields.billedInclVat.toFixed(0)} incl. VAT / month** · ${fields.termMonths} months

${fields.salesBlurb}

Talk to sales on WhatsApp or get started online.

*CircleTel (Pty) Ltd — "Connecting Today, Creating Tomorrow"*
`;

  const base = fileSafeName(name);
  return {
    cpsMarkdown,
    brdMarkdown,
    onePagerMarkdown,
    cpsPath: `products/bundles/${base}_Commercial_Product_Spec_v1_0.md`,
    brdPath: `products/bundles/${base}_Business_Rules_Document_v1_0.md`,
    onePagerPath: `products/bundles/sales-collateral/${base}_OnePager.md`,
  };
}
