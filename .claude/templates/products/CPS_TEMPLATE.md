# {{PRODUCT_NAME}} — Commercial Product Specification

## {{TAGLINE}}

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-CPS-{{PRODUCT_CODE}}-{{YEAR}}-001 |
| **Version** | 1.0 |
| **Effective Date** | {{EFFECTIVE_DATE}} |
| **Classification** | CONFIDENTIAL — Internal & Partner Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | Product Strategy |
| **Approved By** | Pending |
| **Supersedes** | N/A |

---

## Version Control & Change Log

| Version | Date | Author | Change Description | Status |
|---------|------|--------|--------------------|--------|
| 1.0 | {{EFFECTIVE_DATE}} | Product Strategy | Initial release | **CURRENT** |

---

## 1. Executive Summary

{{EXECUTIVE_SUMMARY_PARAGRAPH_1}}

{{EXECUTIVE_SUMMARY_PARAGRAPH_2}}

### 1.1 Strategic Metrics Summary

| Metric | Value | Notes |
|--------|-------|-------|
| Strategic Priority | {{PRIORITY_STARS}} | {{PRIORITY_NOTE}} |
| Target Market | {{TARGET_MARKET}} | {{TARGET_VERTICALS_BRIEF}} |
| Base Margin | {{BASE_MARGIN_RANGE}} | Before commissions |
| Technology | {{TECHNOLOGY_BRIEF}} | {{TECHNOLOGY_DETAIL}} |
| Coverage | {{COVERAGE_DESCRIPTION}} | {{COVERAGE_SOURCE}} |
| Pricing Model | {{PRICING_MODEL}} | {{PRICING_MODEL_DETAIL}} |

---

## 2. Product Architecture

{{ARCHITECTURE_INTRODUCTION}}

### 2.1 {{COMPONENT_SECTION_TITLE}}

<!-- For bundles: "Bundle Components". For standalone: "Service Components". -->

| Component | Provider | Role |
|-----------|----------|------|
{{#COMPONENTS}}
| {{COMPONENT_NAME}} | {{COMPONENT_PROVIDER}} | {{COMPONENT_ROLE}} |
{{/COMPONENTS}}

### 2.2 Tier Structure

| Tier | {{TIER_SPEC_HEADER}} | {{ADDITIONAL_SPEC_HEADER}} | Price |
|------|----------------------|---------------------------|-------|
{{#TIERS}}
| **{{TIER_NAME}}** | {{TIER_SPEC_1}} | {{TIER_SPEC_2}} | R{{TIER_RETAIL_PRICE}} |
{{/TIERS}}

---

## 3. Pricing Schedule

All prices in South African Rand (ZAR) exclusive of VAT at 15%.

### 3.1 Monthly Recurring Charges

| Package | Specification | MRC (excl. VAT) | MRC (incl. VAT) |
|---------|---------------|-----------------|-----------------|
{{#TIERS}}
| {{TIER_FULL_NAME}} | {{TIER_SPECIFICATION}} | R{{TIER_RETAIL_PRICE}} | R{{TIER_VAT_INCLUSIVE}} |
{{/TIERS}}

<!-- VAT-inclusive = retail × 1.15, rounded to nearest rand -->

### 3.2 {{PRICING_BREAKDOWN_TITLE}}

<!-- For bundles: show component breakdown per tier. For standalone: show modular add-ons pricing logic. -->

{{#TIERS}}
**{{TIER_NAME}} (R{{TIER_RETAIL_PRICE}}/mo)**

| Component | Base Price | Markup | Final Price |
|-----------|------------|--------|-------------|
{{#TIER_COMPONENTS}}
| {{COMPONENT_NAME}} | R{{COMPONENT_BASE_PRICE}} | {{COMPONENT_MARKUP}} | R{{COMPONENT_FINAL_PRICE}} |
{{/TIER_COMPONENTS}}
| **Total** | | | **R{{TIER_RETAIL_PRICE}}** |

{{/TIERS}}

### 3.3 Once-Off Charges

| Item | Standard Price | {{PROMO_COLUMN}} |
|------|---------------|------------------|
{{#NRC_ITEMS}}
| {{NRC_NAME}} | R{{NRC_STANDARD_PRICE}} | {{NRC_PROMO_VALUE}} |
{{/NRC_ITEMS}}

---

## 4. Add-on Modules

| Module | Description | Price | Cost | Margin |
|--------|-------------|-------|------|--------|
{{#ADDONS}}
| {{ADDON_NAME}} | {{ADDON_DESCRIPTION}} | R{{ADDON_PRICE}}/mo | R{{ADDON_COST}} | {{ADDON_MARGIN}}% |
{{/ADDONS}}

<!-- Addon margin = (price - cost) / price × 100, rounded to 1 decimal -->

---

## 5. Wholesale Cost Structure & Margin Analysis

> **CONFIDENTIAL — INTERNAL USE ONLY**

### 5.1 Per-Subscriber Unit Economics

| Package | Retail | Total Cost | Margin (R) | Margin (%) | {{COMMISSION_COLUMN_HEADER}} |
|---------|--------|------------|------------|------------|------------------------------|
{{#TIERS}}
| {{TIER_NAME}} | R{{TIER_RETAIL_PRICE}} | R{{TIER_TOTAL_COST}} | R{{TIER_MARGIN_R}} | {{TIER_MARGIN_PCT}}% | {{TIER_COMMISSION_UPLIFT}} |
{{/TIERS}}

<!-- Margin (R) = Retail - Total Cost. Margin (%) = Margin (R) / Retail × 100. -->
<!-- WARN if any tier margin < 25% — requires CFO approval per margin-guardrails.md -->

### 5.2 Cost Component Detail

| Cost Component | {{TIER_1_NAME}} | {{TIER_2_NAME}} | {{TIER_3_NAME}} |
|----------------|-----------------|-----------------|-----------------|
{{#COST_COMPONENTS}}
| {{COST_COMPONENT_NAME}} | R{{COST_TIER_1}} | R{{COST_TIER_2}} | R{{COST_TIER_3}} |
{{/COST_COMPONENTS}}
| **Total Direct Cost** | **R{{TOTAL_COST_TIER_1}}** | **R{{TOTAL_COST_TIER_2}}** | **R{{TOTAL_COST_TIER_3}}** |

<!-- Standard cost components to include: Wholesale/access cost, Echo SP BNG (R25.40/subscriber),
     CGNAT Share (R12.50), AgilityGIS BSS (R10.96), Support Allocation, Hardware Amortisation.
     Add product-specific costs (e.g. MTN SIM, Voice line, IoT SIM) as applicable. -->

### 5.3 {{COMMISSION_SECTION_TITLE}}

<!-- Include if product has a commission structure (e.g. Arlan reseller). Remove if not applicable. -->

| Tier | {{COMMISSION_BASIS}} | Commission Tier | CircleTel Share |
|------|----------------------|-----------------|-----------------|
{{#TIERS}}
| {{TIER_NAME}} | {{TIER_COMMISSION_BASIS_VALUE}} | {{COMMISSION_TIER_NAME}} | {{CIRCLETEL_COMMISSION_PCT}}% |
{{/TIERS}}

### 5.4 Customer Lifetime Value

| Metric | {{TIER_1_NAME}} | {{TIER_2_NAME}} | {{TIER_3_NAME}} |
|--------|-----------------|-----------------|-----------------|
| ARPU | R{{TIER_1_RETAIL_PRICE}} | R{{TIER_2_RETAIL_PRICE}} | R{{TIER_3_RETAIL_PRICE}} |
| Direct Margin | R{{TIER_1_MARGIN_R}} | R{{TIER_2_MARGIN_R}} | R{{TIER_3_MARGIN_R}} |
| Average Lifetime | {{TIER_1_LIFETIME}} months | {{TIER_2_LIFETIME}} months | {{TIER_3_LIFETIME}} months |
| LTV (Margin) | R{{TIER_1_LTV}} | R{{TIER_2_LTV}} | R{{TIER_3_LTV}} |
| CAC | R{{TIER_1_CAC}} | R{{TIER_2_CAC}} | R{{TIER_3_CAC}} |
| LTV:CAC | {{TIER_1_LTV_CAC}}:1 | {{TIER_2_LTV_CAC}}:1 | {{TIER_3_LTV_CAC}}:1 |
| Payback Period | {{TIER_1_PAYBACK}} months | {{TIER_2_PAYBACK}} months | {{TIER_3_PAYBACK}} months |

<!-- LTV = Margin (R) × Average Lifetime months. LTV:CAC = LTV / CAC. Payback = CAC / Margin (R). -->

---

## 6. Hardware & CPE Specifications

### 6.1 {{CPE_SECTION_1_TITLE}}

| Model | Type | Dealer Cost | Included |
|-------|------|-------------|----------|
{{#CPE_ITEMS_PRIMARY}}
| {{CPE_MODEL}} | {{CPE_TYPE}} | R{{CPE_DEALER_COST}} | {{CPE_INCLUDED}} |
{{/CPE_ITEMS_PRIMARY}}

{{#HAS_SECONDARY_CPE}}
### 6.2 {{CPE_SECTION_2_TITLE}}

| Model | Type | Dealer Cost | Included |
|-------|------|-------------|----------|
{{#CPE_ITEMS_SECONDARY}}
| {{CPE_MODEL}} | {{CPE_TYPE}} | R{{CPE_DEALER_COST}} | {{CPE_INCLUDED}} |
{{/CPE_ITEMS_SECONDARY}}
{{/HAS_SECONDARY_CPE}}

### {{CPE_COMMON_FEATURES_SECTION_NUM}}. Common Features

{{#CPE_COMMON_FEATURES}}
- {{FEATURE}}
{{/CPE_COMMON_FEATURES}}

---

## 7. Network & Technical Specifications

| Parameter | {{TECH_COLUMN_1}} | {{TECH_COLUMN_2}} |
|-----------|-------------------|-------------------|
| Technology | {{TECH_1_NAME}} | {{TECH_2_NAME}} |
| Speed Profile | {{TECH_1_SPEED_PROFILE}} | {{TECH_2_SPEED_PROFILE}} |
| Latency | {{TECH_1_LATENCY}} | {{TECH_2_LATENCY}} |
| Contention | {{TECH_1_CONTENTION}} | {{TECH_2_CONTENTION}} |
| Data Cap | {{TECH_1_DATA_CAP}} | {{TECH_2_DATA_CAP}} |
{{#HAS_FAILOVER}}
| Failover Time | — | {{FAILOVER_TIME}} |
{{/HAS_FAILOVER}}

### 7.1 Speed Profiles

| Tier | {{SPEED_COL_1}} | {{SPEED_COL_2}} | {{SPEED_COL_3}} |
|------|-----------------|-----------------|-----------------|
{{#TIERS}}
| {{TIER_NAME}} | {{TIER_SPEED_1}} | {{TIER_SPEED_2}} | {{TIER_SPEED_3}} |
{{/TIERS}}

<!-- For FWB products: note the 4:1 asymmetric profile (e.g. "100 Mbps down / 25 Mbps up").
     Per SkyFibre SMB CPS v2.0 speed correction, always disclose the corrected profile. -->

---

## 8. Service Level Agreements

| SLA Parameter | {{TIER_1_NAME}} | {{TIER_2_NAME}} | {{TIER_3_NAME}} |
|---------------|-----------------|-----------------|-----------------|
| Uptime Guarantee | {{TIER_1_UPTIME}} | {{TIER_2_UPTIME}} | {{TIER_3_UPTIME}} |
| Support Hours | {{TIER_1_SUPPORT_HOURS}} | {{TIER_2_SUPPORT_HOURS}} | {{TIER_3_SUPPORT_HOURS}} |
| Fault Response | {{TIER_1_FAULT_RESPONSE}} | {{TIER_2_FAULT_RESPONSE}} | {{TIER_3_FAULT_RESPONSE}} |
| Service Credits | {{TIER_1_CREDITS}} | {{TIER_2_CREDITS}} | {{TIER_3_CREDITS}} |
| Account Manager | {{TIER_1_AM}} | {{TIER_2_AM}} | {{TIER_3_AM}} |

---

## 9. Fair Usage & Acceptable Usage Policy

### 9.1 FUP Position

| Component | Policy |
|-----------|--------|
{{#FUP_COMPONENTS}}
| {{FUP_COMPONENT_NAME}} | {{FUP_POLICY}} |
{{/FUP_COMPONENTS}}

### 9.2 Acceptable Use

Standard CircleTel AUP applies. Prohibited activities include:
- Illegal content distribution
- Network abuse or attacks
- Commercial spam or bulk messaging
- Resale without authorisation

---

## 10. Installation & Provisioning

### 10.1 Site Requirements

{{#SITE_REQUIREMENTS}}
- {{REQUIREMENT}}
{{/SITE_REQUIREMENTS}}

### 10.2 Installation Process

| Step | Description | Duration |
|------|-------------|----------|
{{#INSTALL_STEPS}}
| {{STEP_NUM}} | {{STEP_DESCRIPTION}} | {{STEP_DURATION}} |
{{/INSTALL_STEPS}}
| **Total** | | **{{TOTAL_INSTALL_DURATION}}** |

---

## 11. Support Framework

| Channel | {{TIER_1_NAME}} | {{TIER_2_NAME}} | {{TIER_3_NAME}} |
|---------|-----------------|-----------------|-----------------|
| WhatsApp | {{TIER_1_WA}} | {{TIER_2_WA}} | {{TIER_3_WA}} |
| Phone | {{TIER_1_PHONE}} | {{TIER_2_PHONE}} | {{TIER_3_PHONE}} |
| Email Response | {{TIER_1_EMAIL}} | {{TIER_2_EMAIL}} | {{TIER_3_EMAIL}} |
| On-Site Response | {{TIER_1_ONSITE}} | {{TIER_2_ONSITE}} | {{TIER_3_ONSITE}} |
| Account Manager | {{TIER_1_AM}} | {{TIER_2_AM}} | {{TIER_3_AM}} |

---

## 12. Partner & Reseller Commission Structure

> **CONFIDENTIAL — PARTNER PROGRAMME ONLY**

### 12.1 Partner Tiers

| Tier | Upfront | Trailing (12 mo) | Requirement |
|------|---------|------------------|-------------|
| Authorised | 50% of Month 1 | 5% | 5+ sales/quarter |
| Gold | 75% of Month 1 | 7.5% | 15+ sales/quarter |
| Platinum | 100% of Month 1 | 10% | 30+ sales/quarter |

### 12.2 Example Commission ({{EXAMPLE_COMMISSION_TIER}} Tier)

| Partner Level | Upfront | Trailing (12 mo) | Total Year 1 |
|---------------|---------|------------------|--------------|
| Authorised | R{{COMMISSION_AUTH_UPFRONT}} | R{{COMMISSION_AUTH_TRAILING}} | R{{COMMISSION_AUTH_TOTAL}} |
| Gold | R{{COMMISSION_GOLD_UPFRONT}} | R{{COMMISSION_GOLD_TRAILING}} | R{{COMMISSION_GOLD_TOTAL}} |
| Platinum | R{{COMMISSION_PLAT_UPFRONT}} | R{{COMMISSION_PLAT_TRAILING}} | R{{COMMISSION_PLAT_TOTAL}} |

<!-- Upfront = partner tier % × monthly retail. Trailing = 5/7.5/10% × monthly retail × 12. -->

---

## 13. Target Market & Verticals

### 13.1 Primary Verticals

| Vertical | Typical Businesses | Recommended Tier |
|----------|--------------------|------------------|
{{#VERTICALS}}
| {{VERTICAL_NAME}} | {{VERTICAL_EXAMPLES}} | {{VERTICAL_RECOMMENDED_TIER}} |
{{/VERTICALS}}

### 13.2 Ideal Customer Profile

{{#ICP_ATTRIBUTES}}
- {{ATTRIBUTE}}
{{/ICP_ATTRIBUTES}}

---

## 14. Competitive Positioning

### 14.1 Head-to-Head Comparison

| Feature | {{COMPETITOR_1}} | {{COMPETITOR_2}} | CircleTel {{PRODUCT_NAME}} |
|---------|------------------|------------------|---------------------------|
{{#COMPARISON_ROWS}}
| {{FEATURE}} | {{COMP_1_VALUE}} | {{COMP_2_VALUE}} | {{CIRCLETEL_VALUE}} |
{{/COMPARISON_ROWS}}

### 14.2 Key Differentiators

{{#DIFFERENTIATORS}}
1. **{{DIFFERENTIATOR_TITLE}}**: {{DIFFERENTIATOR_DESCRIPTION}}
{{/DIFFERENTIATORS}}

### 14.3 Sales Objection Framework

| Objection | Response |
|-----------|----------|
{{#OBJECTIONS}}
| "{{OBJECTION}}" | "{{RESPONSE}}" |
{{/OBJECTIONS}}

---

## 15. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
{{#RISKS}}
| {{RISK_DESCRIPTION}} | {{RISK_LIKELIHOOD}} | {{RISK_IMPACT}} | {{RISK_MITIGATION}} |
{{/RISKS}}

---

## 16. Implementation Roadmap

### 16.1 Immediate Actions (Week 1)

{{#WEEK_1_ACTIONS}}
1. {{ACTION}}
{{/WEEK_1_ACTIONS}}

### 16.2 Short-Term (Month 1)

{{#MONTH_1_ACTIONS}}
1. {{ACTION}}
{{/MONTH_1_ACTIONS}}

### 16.3 Medium-Term (Months 2-3)

{{#MONTHS_2_3_ACTIONS}}
1. {{ACTION}}
{{/MONTHS_2_3_ACTIONS}}

---

## 17. Financial Projections & KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| Monthly New Customers | {{TARGET_NEW_CUSTOMERS_PM}} | CRM pipeline |
| Average Revenue Per User | R{{TARGET_ARPU}} | ARPU tracking |
| Churn Rate | < {{TARGET_CHURN_PCT}}% | Monthly cohort |
| NPS | > {{TARGET_NPS}} | Quarterly survey |
| Installation Lead Time | < {{TARGET_INSTALL_DAYS}} days | Order-to-live |
| First Call Resolution | > {{TARGET_FCR_PCT}}% | Support tickets |

### 17.1 Year 1 Revenue Projection

| Quarter | New Customers | Cumulative | MRR | Quarterly Revenue |
|---------|---------------|------------|-----|-------------------|
| Q1 | {{Q1_NEW}} | {{Q1_CUM}} | R{{Q1_MRR}} | R{{Q1_REV}} |
| Q2 | {{Q2_NEW}} | {{Q2_CUM}} | R{{Q2_MRR}} | R{{Q2_REV}} |
| Q3 | {{Q3_NEW}} | {{Q3_CUM}} | R{{Q3_MRR}} | R{{Q3_REV}} |
| Q4 | {{Q4_NEW}} | {{Q4_CUM}} | R{{Q4_MRR}} | R{{Q4_REV}} |
| **Total** | **{{TOTAL_NEW}}** | | | **R{{TOTAL_REV}}** |

---

## 18. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CEO / Managing Director | | _________________ | ________ |
| Chief Financial Officer | | _________________ | ________ |
| Sales Director | | _________________ | ________ |

---

**END OF DOCUMENT**

*CircleTel (Pty) Ltd — "Connecting Today, Creating Tomorrow"*
