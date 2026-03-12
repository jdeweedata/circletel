# Product Documentation Templates

Reference for CircleTel product documentation structure. Based on SkyFibre SMB documentation suite.

---

## Document Suite Overview

Every CircleTel product line requires three core documents:

| Document | Code | Purpose | Audience |
|----------|------|---------|----------|
| **Commercial Product Spec** | CPS | Complete commercial definition | Sales, Partners, Leadership |
| **Business Rules Document** | BRD | Eligibility, workflows, policies | Operations, Support, Compliance |
| **Functional Specification** | FSD | System behaviour, data logic | Development, Integration |

---

## Document Reference Numbering

```
CT-[TYPE]-[PRODUCT]-[YEAR]-[SEQ]

Examples:
CT-CPS-SKYFIBRE-SMB-2026-002    Commercial Product Spec
CT-BRD-SKYFIBRE-SMB-2026-001    Business Rules Document
CT-FSD-SKYFIBRE-SMB-2026-001    Functional Specification
```

---

## 1. Commercial Product Spec (CPS)

### Header Block

```markdown
# [Product Name] — Commercial Product Specification

## [Subtitle/Description]

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-CPS-[PRODUCT]-[YEAR]-[SEQ] |
| **Version** | X.Y |
| **Effective Date** | DD Month YYYY |
| **Classification** | CONFIDENTIAL — Internal & Partner Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | [Name], [Title] |
| **Approved By** | [Pending/Name] |
| **Supersedes** | [Previous ref or N/A] |
```

### Version Control Table

```markdown
## Version Control & Change Log

| Version | Date | Author | Change Description | Status |
|---------|------|--------|--------------------|--------|
| 1.0 | [Date] | [Author] | Initial release | Superseded |
| 2.0 | [Date] | [Author] | [Change summary] | **CURRENT** |
```

### Standard Sections

1. Executive Summary
2. Product Architecture
3. Pricing Schedule
4. Wholesale Cost Structure & Margin Analysis (CONFIDENTIAL)
5. Hardware & CPE Specifications
6. Network & Technical Specifications
7. Service Level Agreements
8. Fair Usage & Acceptable Usage Policy
9. Installation & Provisioning
10. Support Framework
11. Partner & Reseller Commission Structure (CONFIDENTIAL)
12. Target Market & Verticals
13. Competitive Positioning & Sales Strategy
14. Risk Register
15. Implementation Roadmap
16. Financial Projections & KPIs
17. Approval

### Key Tables to Include

**Strategic Metrics Summary**
```markdown
| Metric | Value | Notes |
|--------|-------|-------|
| Strategic Priority | ★★★ / ★★ / ★ | Highest priority product line |
| Target Market | [Segment description] | [Details] |
| Base Margin | XX% | Before add-ons |
| Technology | [Tech stack] | [Notes] |
| Coverage | [Coverage metric] | [Details] |
```

**Per-Subscriber Unit Economics**
```markdown
| Package | Retail | Wholesale | All-in Cost | Margin (R) | Margin (%) |
|---------|--------|-----------|-------------|------------|------------|
| [Tier 1] | R[X] | R[X] | R[X] | R[X] | XX% |
```

**Customer Lifetime Value**
```markdown
| Metric | Value | Notes |
|--------|-------|-------|
| ARPU | R[X] | Monthly |
| CAC | R[X] | Acquisition cost |
| Avg Lifetime | XX months | Target |
| LTV | R[X] | Lifetime value |
| Payback | X months | Time to recover CAC |
| Churn Target | < X% | Monthly |
```

---

## 2. Business Rules Document (BRD)

### Header Block

```markdown
# [Product Name] — Business Rules Document (BRD)

## Eligibility Logic, Workflow Rules & Conditional Policies

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-BRD-[PRODUCT]-[YEAR]-[SEQ] |
| **Version** | X.Y |
| **Effective Date** | DD Month YYYY |
| **Classification** | Confidential — Internal Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | [Team/Department] |
| **Source Documents** | [List companion CPS, FSD, etc.] |
| **Supersedes** | [Previous ref or N/A] |
```

### Standard Sections

1. Purpose & Scope
2. Definitions & Abbreviations
3. Customer Eligibility Rules
4. Coverage & Technical Eligibility
5. Product Selection Rules
6. Module/Add-on Eligibility & Dependency Logic
7. Pricing & Discount Rules
8. Billing & Payment Rules
9. Contract & Commitment Rules
10. Credit Vetting & Onboarding Workflow
11. Provisioning & Installation Workflow
12. SLA Entitlement Rules
13. Fair Usage & Traffic Management Policies
14. Upgrade, Downgrade & Migration Rules
15. Cancellation & Churn Policies
16. Partner & Reseller Rules
17. Regulatory & Compliance Policies
18. Exception Handling & Escalation
19. Appendix: Decision Trees

### Rule Table Format

```markdown
| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| CE-001 | [Rule name] | [Condition] | [Action] |
```

**Rule ID Prefixes:**
- `CE-XXX` — Customer Eligibility
- `TC-XXX` — Technical/Coverage
- `PS-XXX` — Product Selection
- `MD-XXX` — Module Dependency
- `PR-XXX` — Pricing
- `BL-XXX` — Billing
- `CT-XXX` — Contract
- `IN-XXX` — Installation
- `SL-XXX` — SLA
- `FU-XXX` — Fair Usage
- `UG-XXX` — Upgrade
- `DG-XXX` — Downgrade
- `CN-XXX` — Cancellation
- `PA-XXX` — Partner

### Decision Tree Format

```markdown
### Decision Tree: [Name]

START: [Entry point]
  │
  ├─ [Question/Check]?
  │   ├─ YES → [Action/Next step]
  │   └─ NO → [Action/Next step]
  │
  └─ [Outcome]
```

---

## 3. Functional Specification Document (FSD)

### Header Block

```markdown
# [Product Name] — Functional Specification Document (FSD)

## System Behaviour, Data Logic & Integration Rules

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-FSD-[PRODUCT]-[YEAR]-[SEQ] |
| **Version** | X.Y |
| **Effective Date** | DD Month YYYY |
| **Classification** | Confidential — Internal & Development Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | [Team] |
| **Companion Documents** | CPS vX.Y, BRD vX.Y |
| **Supersedes** | [Previous ref or N/A] |
```

### Standard Sections

1. Purpose & Scope
2. System Landscape & Integration Map
3. Data Model
4. Product Catalogue Data Logic
5. Order Lifecycle State Machine
6. Service Instance Lifecycle
7. Billing Engine Logic
8. Margin & Cost Calculation Engine
9. Provisioning Integration
10. Network Integration
11. CPE Management Integration
12. CRM & Sales Pipeline Logic
13. Support & Fault Management Logic
14. SLA Monitoring & Service Credit Engine
15. Notification & Event Engine
16. Reporting & Analytics Data Logic
17. API Contract Specifications
18. Validation Rule Register
19. Error Handling & Recovery
20. Non-Functional Requirements

### State Machine Format

```markdown
### [Entity] Lifecycle States

DRAFT → SUBMITTED → APPROVED → ACTIVE → SUSPENDED → TERMINATED
  │         │          │         │          │           │
  ▼         ▼          ▼         ▼          ▼           ▼
[desc]   [desc]     [desc]    [desc]     [desc]      [desc]
```

### API Endpoint Format

```markdown
### Endpoint: [Name]

| Field | Value |
|-------|-------|
| Path | `[HTTP_METHOD] /api/[path]` |
| Auth | [Required/Optional] [Auth type] |
| Rate Limit | [X] requests/[period] |

**Request Body**
```json
{
  "field": "type — description"
}
```

**Response (Success 200)**
```json
{
  "data": { ... }
}
```

**Error Codes**
| Code | Message | Resolution |
|------|---------|------------|
| [XXX] | [Message] | [Resolution] |
```

---

## Document Footer

All documents end with:

```markdown
---

**END OF DOCUMENT**

*CircleTel (Pty) Ltd — A member of the New Generation Group*

*"Connecting Today, Creating Tomorrow"*
```

---

## File Naming Convention

```
[ProductName]_[DocType]_v[Major]_[Minor].md

Examples:
SkyFibre_SMB_Commercial_Product_Spec_v2_0.md
SkyFibre_SMB_Business_Rules_Document_v1_0.md
SkyFibre_SMB_Functional_Specification_v1_0.md
CloudWiFi_WaaS_Commercial_Product_Spec_v1_0.md
```

---

## Document Location

| Category | Path |
|----------|------|
| Connectivity (FWB, FTTH) | `products/connectivity/fixed-wireless/` or `products/connectivity/fibre/` |
| Managed Services | `products/managed-services/` |
| WiFi/WaaS | `products/wifi/` |
| IoT | `products/iot/` |
| Research | `products/research/` |
| Wholesale | `products/wholesale/` |

---

## Template Files

Full templates available at:
- `.claude/skills/product-management/templates/commercial-spec.md`
- `.claude/skills/product-management/templates/business-rules.md`
- `.claude/skills/product-management/templates/functional-spec.md`
- `.claude/skills/product-management/templates/pricing-matrix.md`
