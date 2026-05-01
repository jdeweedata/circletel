# [Product Name] — Business Rules Document (BRD)

## Eligibility Logic, Workflow Rules & Conditional Policies

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-BRD-[PRODUCT-CODE]-[YEAR]-[SEQ] |
| **Version** | 1.0 |
| **Effective Date** | [DD Month YYYY] |
| **Classification** | Confidential — Internal Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | [Team/Department] |
| **Source Documents** | [CPS ref, FSD ref, etc.] |
| **Supersedes** | [N/A or Previous ref] |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---------|------|--------|---------|--------|
| 1.0 | [Date] | [Author] | Initial release | **CURRENT** |

---

## Table of Contents

1. Purpose & Scope
2. Definitions & Abbreviations
3. Customer Eligibility Rules
4. Coverage & Technical Eligibility
5. Product Selection Rules
6. Module Eligibility & Dependency Logic
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

---

## 1. Purpose & Scope

This Business Rules Document (BRD) codifies every eligibility check, workflow trigger, conditional policy, and decision rule that governs [Product Name] from lead qualification through to service termination.

**Scope:** [List all tiers, modules, and variants covered]

**Out of scope:** [List products/variants NOT covered]

---

## 2. Definitions & Abbreviations

| Term | Definition |
|------|-----------|
| [Term 1] | [Definition] |
| [Term 2] | [Definition] |
| MRC | Monthly Recurring Charge (excl. VAT unless stated) |
| NRC | Non-Recurring Charge (once-off) |
| BSS | Business Support System |
| CPE | Customer Premises Equipment |
| CPA | Consumer Protection Act 68 of 2008 |
| POPIA | Protection of Personal Information Act 4 of 2013 |

---

## 3. Customer Eligibility Rules

### 3.1 Entity Type Eligibility

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| CE-001 | [Rule name] | [Condition] | [Action] |
| CE-002 | [Rule name] | [Condition] | [Action] |
| CE-003 | [Rule name] | [Condition] | [Action] |

### 3.2 Required Documentation

| Rule ID | Document | Required? | Validation |
|---------|----------|-----------|------------|
| CE-010 | [Document 1] | Mandatory | [Validation criteria] |
| CE-011 | [Document 2] | Conditional | [When required] |
| CE-012 | [Document 3] | Optional | [Notes] |

### 3.3 Credit Eligibility

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| CE-020 | Credit check required | [Condition] | [Action] |
| CE-021 | Credit score PASS | Score ≥ [X] | Proceed to provisioning |
| CE-022 | Credit score MARGINAL | Score [X]-[Y] | [Conditional action] |
| CE-023 | Credit score FAIL | Score < [X] | [Rejection/alternative] |

---

## 4. Coverage & Technical Eligibility

### 4.1 Coverage Check

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| TC-001 | [Coverage requirement] | [Condition] | [Action] |
| TC-002 | Coverage CONFIRMED | [Condition] | Proceed to site survey |
| TC-003 | Coverage NEGATIVE | [Condition] | [Alternative/rejection] |

### 4.2 Site Technical Requirements

| Rule ID | Requirement | Condition | Action if NOT Met |
|---------|-------------|-----------|-------------------|
| TC-010 | [Requirement 1] | [Condition] | [Action] |
| TC-011 | [Requirement 2] | [Condition] | [Action] |
| TC-012 | [Requirement 3] | [Condition] | [Action] |

---

## 5. Product Selection Rules

### 5.1 Tier Selection

| Rule ID | Rule | Condition | Assigned Tier |
|---------|------|-----------|---------------|
| PS-001 | [Selection criterion] | [Condition] | [Tier 1] |
| PS-002 | [Selection criterion] | [Condition] | [Tier 2] |
| PS-003 | [Selection criterion] | [Condition] | [Tier 3] |

### 5.2 Mandatory Disclosures

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PS-010 | [Disclosure 1] | [How enforced] |
| PS-011 | [Disclosure 2] | [How enforced] |

---

## 6. Module Eligibility & Dependency Logic

### 6.1 Module Prerequisite Rules

> **⚠️ Every module requires an active base tier. No module may be sold standalone.**

| Rule ID | Module | Prerequisite | Dependency | Conflict |
|---------|--------|-------------|------------|----------|
| MD-001 | [Module 1] | Active base tier | [Dependencies] | [Conflicts] |
| MD-002 | [Module 2] | Active base tier | [Dependencies] | [Conflicts] |
| MD-003 | [Module 3] | Active base tier | [Dependencies] | [Conflicts] |

### 6.2 Module Combination Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| MD-020 | [Combination rule] | `IF [condition] THEN [action]` |
| MD-021 | [Combination rule] | `IF [condition] THEN [action]` |

---

## 7. Pricing & Discount Rules

### 7.1 Standard Pricing

| Rule ID | Rule | Detail |
|---------|------|--------|
| PR-001 | Base tier prices are fixed | [Price list] |
| PR-002 | All prices exclude VAT | VAT at 15% added at billing |

### 7.2 Discount Authority Matrix

| Rule ID | Discount Type | Maximum | Authority Required | Conditions |
|---------|--------------|---------|-------------------|------------|
| PR-010 | [Discount type] | [X]% | [Authority] | [Conditions] |
| PR-011 | [Discount type] | [X]% | [Authority] | [Conditions] |

### 7.3 Pricing Prohibitions

| Rule ID | Prohibition | Rationale |
|---------|------------|-----------|
| PR-020 | [Prohibition 1] | [Rationale] |
| PR-021 | [Prohibition 2] | [Rationale] |

---

## 8. Billing & Payment Rules

| Rule ID | Rule | Detail |
|---------|------|--------|
| BL-001 | Billing date | [Date/cycle] |
| BL-002 | Payment terms | [X] calendar days |
| BL-003 | Accepted payment methods | [Methods] |
| BL-004 | Debit order returns | [Handling] |
| BL-010 | Non-payment suspension | [Threshold and action] |

---

## 9. Contract & Commitment Rules

| Rule ID | Contract Type | Term | Early Termination |
|---------|--------------|------|-------------------|
| CT-001 | Month-to-month | Rolling monthly | 30 days' notice; no penalty |
| CT-002 | 12-month fixed | 12 months | CPA Section 14 applies |
| CT-003 | 24-month fixed | 24 months | CPA Section 14 applies |

**CPA cooling-off period:** 5 business days (direct marketing only).

---

## 10. Credit Vetting & Onboarding Workflow

### 10.1 End-to-End Onboarding Process

```
STEP 1: Lead Qualification
  └─ [Description]

STEP 2: Coverage Check
  └─ [Description]

STEP 3: Product & Module Selection
  └─ [Description]

STEP 4: Documentation Collection
  └─ [Description]

STEP 5: Credit Vetting
  └─ [Description]

STEP 6: Contract Signing
  └─ [Description]

STEP 7: Order Activation
  └─ [Description]

STEP 8: Installation & Handover
  └─ [Description]
```

---

## 11. Provisioning & Installation Workflow

### 11.1 Pre-Installation Rules

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| IN-001 | [Rule] | [Condition] | [Action] |
| IN-002 | [Rule] | [Condition] | [Action] |

### 11.2 Installation Process

| Step | Activity | Duration | Success Criteria |
|------|----------|----------|-----------------|
| 1 | [Activity] | [X] min | [Criteria] |
| 2 | [Activity] | [X] min | [Criteria] |

---

## 12. SLA Entitlement Rules

| Rule ID | Condition | SLA Level | Uptime | Response Time | Credits |
|---------|-----------|-----------|--------|---------------|---------|
| SL-001 | [Condition] | [Level] | [X]% | [Time] | [Credits] |
| SL-002 | [Condition] | [Level] | [X]% | [Time] | [Credits] |

---

## 13. Fair Usage & Traffic Management Policies

| Rule ID | Rule | Detail |
|---------|------|--------|
| FU-001 | [FUP rule] | [Detail] |
| FU-002 | [Traffic management rule] | [Detail] |

### 13.1 AUP Violations

| Rule ID | Violation | Severity | Action |
|---------|----------|----------|--------|
| FU-020 | [Violation] | [H/M/L] | [Action] |
| FU-021 | [Violation] | [H/M/L] | [Action] |

---

## 14. Upgrade, Downgrade & Migration Rules

### 14.1 Upgrade Rules

| Rule ID | Upgrade Type | Conditions | Processing Time | Billing Impact |
|---------|-------------|-----------|----------------|----------------|
| UG-001 | [Type] | [Conditions] | [Time] | [Impact] |
| UG-002 | [Type] | [Conditions] | [Time] | [Impact] |

### 14.2 Downgrade Rules

| Rule ID | Downgrade Type | Conditions | Processing Time | Billing Impact |
|---------|---------------|-----------|----------------|----------------|
| DG-001 | [Type] | [Conditions] | [Time] | [Impact] |
| DG-002 | [Type] | [Conditions] | [Time] | [Impact] |

---

## 15. Cancellation & Churn Policies

### 15.1 Cancellation Rules

| Rule ID | Scenario | Notice Period | Penalty | Process |
|---------|----------|--------------|---------|---------|
| CN-001 | [Scenario] | [Period] | [Penalty] | [Process] |
| CN-002 | [Scenario] | [Period] | [Penalty] | [Process] |

### 15.2 Churn Prevention Triggers

| Rule ID | Trigger | Detection Method | Automated Action |
|---------|---------|-----------------|------------------|
| CH-001 | [Trigger] | [Method] | [Action] |
| CH-002 | [Trigger] | [Method] | [Action] |

---

## 16. Partner & Reseller Rules

| Rule ID | Rule | Condition |
|---------|------|-----------|
| PA-001 | [Partner rule] | [Condition] |
| PA-002 | [Partner rule] | [Condition] |

---

## 17. Regulatory & Compliance Policies

| Rule ID | Regulation | Requirement | CircleTel Compliance |
|---------|-----------|-------------|---------------------|
| RC-001 | ICASA | [Requirement] | [Compliance method] |
| RC-002 | FICA | [Requirement] | [Compliance method] |
| RC-003 | POPIA | [Requirement] | [Compliance method] |
| RC-004 | CPA | [Requirement] | [Compliance method] |

---

## 18. Exception Handling & Escalation

### 18.1 Exception Authority Matrix

| Exception Type | First Level | Second Level | Final Authority |
|---------------|------------|-------------|-----------------|
| [Type 1] | [Role] | [Role] | [Role] |
| [Type 2] | [Role] | [Role] | [Role] |

### 18.2 Escalation Timelines

| Level | Response Time | Owner |
|-------|--------------|-------|
| Level 1 | [Time] | [Role] |
| Level 2 | [Time] | [Role] |
| Level 3 | [Time] | [Role] |

---

## 19. Appendix: Decision Trees

### 19.1 [Decision Tree Name]

```
START: [Entry point]
  │
  ├─ [Question/Check]?
  │   ├─ YES → [Action/Next step]
  │   └─ NO → [Action/Next step]
  │
  └─ [Outcome]
```

### 19.2 [Decision Tree Name]

[Additional decision trees as needed]

---

**END OF DOCUMENT**

*CircleTel (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*
