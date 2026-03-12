# CircleTel Managed IT Services Business Rules Document

## Version 1.0 — March 2026

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-MITS-BRD-2026-001 |
| **Version** | 1.0 |
| **Effective Date** | 12 March 2026 |
| **Product Family** | Managed IT Services |
| **Prepared By** | Product & Operations Team |
| **Classification** | INTERNAL — Operational Use |
| **Companion Documents** | CT-MITS-OV-2026-001 (Overview), CT-MITS-CPS-2026-002 (Commercial Spec v2.0), CT-MITS-FSD-2026-001 (Functional Spec v1.0) |

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Definitions & Abbreviations](#2-definitions--abbreviations)
3. [Customer Eligibility Rules](#3-customer-eligibility-rules)
4. [Coverage & Technical Eligibility](#4-coverage--technical-eligibility)
5. [Tier Selection Rules](#5-tier-selection-rules)
6. [Microsoft 365 Licensing Rules](#6-microsoft-365-licensing-rules)
7. [Module Eligibility & Dependencies](#7-module-eligibility--dependencies)
8. [Pricing & Discount Rules](#8-pricing--discount-rules)
9. [Billing & Payment Rules](#9-billing--payment-rules)
10. [Contract & Commitment Rules](#10-contract--commitment-rules)
11. [Credit Vetting & Onboarding Workflow](#11-credit-vetting--onboarding-workflow)
12. [Provisioning & Activation Workflow](#12-provisioning--activation-workflow)
13. [SLA Entitlement Rules](#13-sla-entitlement-rules)
14. [Support Tier Rules](#14-support-tier-rules)
15. [Backup & Security Rules](#15-backup--security-rules)
16. [Upgrade/Downgrade/Migration Rules](#16-upgradedowngrademigration-rules)
17. [Cancellation & Churn Policies](#17-cancellation--churn-policies)
18. [Partner & Reseller Rules](#18-partner--reseller-rules)
19. [Regulatory & Compliance Policies](#19-regulatory--compliance-policies)
20. [Exception Handling & Escalation](#20-exception-handling--escalation)
21. [Appendix A: Decision Trees](#appendix-a-decision-trees)
22. [Appendix B: Quick Reference Tables](#appendix-b-quick-reference-tables)

---

## 1. Purpose & Scope

### 1.1 Purpose

This Business Rules Document (BRD) defines the operational policies, eligibility criteria, workflows, and decision logic for CircleTel Managed IT Services. It ensures consistent application of business rules across sales, provisioning, billing, and support operations.

### 1.2 Scope

**In Scope:**
- All Managed IT Services tiers (Essential, Professional, Premium, Enterprise)
- Microsoft 365 licensing management
- Bundled SkyFibre connectivity
- IT support entitlements
- Partner/reseller channel

**Out of Scope:**
- Standalone connectivity products (see SkyFibre BRD)
- Consumer products
- Hardware-only sales

### 1.3 Document Authority

| Rule Category | Authority Level |
|---------------|-----------------|
| Pricing changes | Product Lead + CEO approval |
| Tier modifications | Product Lead approval |
| SLA exceptions | Operations Manager approval |
| Credit limit changes | Finance Director approval |
| Partner onboarding | Sales Director approval |

---

## 2. Definitions & Abbreviations

### 2.1 Abbreviations

| Term | Definition |
|------|------------|
| **BB** | Microsoft 365 Business Basic |
| **BS** | Microsoft 365 Business Standard |
| **BP** | Microsoft 365 Business Premium |
| **E3** | Microsoft 365 E3 Enterprise |
| **CSP** | Cloud Solution Provider (Microsoft licensing program) |
| **MRC** | Monthly Recurring Charge |
| **ARPU** | Average Revenue Per User |
| **SLA** | Service Level Agreement |
| **RTO** | Recovery Time Objective |
| **RPO** | Recovery Point Objective |
| **CPE** | Customer Premises Equipment |
| **FWB** | Fixed Wireless Broadband |
| **BNG** | Broadband Network Gateway |
| **POPIA** | Protection of Personal Information Act |
| **FICA** | Financial Intelligence Centre Act |
| **CIPC** | Companies and Intellectual Property Commission |
| **POA** | Price on Application |

### 2.2 Key Definitions

| Term | Definition |
|------|------------|
| **Managed IT Services** | Bundled offering of connectivity, IT support, Microsoft 365, security, and backup services |
| **Included Users** | Number of Microsoft 365 licences included in the tier at no additional cost |
| **Additional Users** | Microsoft 365 licences beyond the included allocation, charged per-seat |
| **Tier** | Service level (Essential, Professional, Premium, Enterprise) with defined entitlements |
| **On-site Visit** | Physical attendance by CircleTel technician at customer premises |
| **Remote Support** | IT assistance provided via phone, WhatsApp, email, or remote desktop |
| **Health Check** | Proactive system review covering security, performance, and compliance |

---

## 3. Customer Eligibility Rules

### 3.1 Entity Types

| Rule ID | Entity Type | Eligibility | Documentation Required |
|---------|-------------|-------------|------------------------|
| CUST-001 | Registered Company (Pty Ltd, Ltd, Inc) | Eligible | CIPC registration, tax clearance |
| CUST-002 | Close Corporation (CC) | Eligible | CK1/CK2, ID of members |
| CUST-003 | Sole Proprietor | Eligible | ID, proof of business, bank statement |
| CUST-004 | Partnership | Eligible | Partnership agreement, IDs |
| CUST-005 | Non-Profit Organisation | Eligible | NPO certificate, constitution |
| CUST-006 | Government Entity | Eligible (POA) | Letter of appointment, SCM approval |
| CUST-007 | Individual (personal use) | NOT Eligible | Redirect to WorkConnect |

### 3.2 Minimum Requirements

| Rule ID | Rule | Criteria |
|---------|------|----------|
| CUST-010 | Minimum user count | ≥1 employee/user requiring IT services |
| CUST-011 | Credit approval | Must pass credit vetting OR prepay 3 months |
| CUST-012 | Coverage eligibility | SkyFibre coverage at business address required |
| CUST-013 | Contact person | Must designate primary IT contact with authority |
| CUST-014 | Existing infrastructure | Inventory of current IT assets recommended |

### 3.3 Disqualifying Factors

| Rule ID | Disqualification | Action |
|---------|------------------|--------|
| CUST-020 | Credit score <400 | Offer prepaid option OR decline |
| CUST-021 | Fraudulent activity history | Decline with escalation |
| CUST-022 | Existing CircleTel debt >60 days | Settle debt first OR decline |
| CUST-023 | No SkyFibre coverage | Refer to WorkConnect SOHO (standalone IT support TBD) |
| CUST-024 | Sanctioned entity | Decline with compliance notification |

---

## 4. Coverage & Technical Eligibility

### 4.1 SkyFibre Coverage Check

| Rule ID | Rule | Logic |
|---------|------|-------|
| COV-001 | Coverage mandatory | Managed IT Services requires bundled SkyFibre connectivity |
| COV-002 | Coverage check flow | Must complete coverage check before quote generation |
| COV-003 | Feasibility required | Tarana/MTN feasibility must return "AVAILABLE" or "NEARBY" |
| COV-004 | No coverage fallback | Offer WorkConnect SOHO with LTE/5G OR waitlist for future coverage |

### 4.2 Technical Pre-requisites

| Rule ID | Requirement | Essential | Professional | Premium | Enterprise |
|---------|-------------|:---------:|:------------:|:-------:|:----------:|
| TECH-001 | Dedicated router space | ✓ | ✓ | ✓ | ✓ |
| TECH-002 | Power point near router | ✓ | ✓ | ✓ | ✓ |
| TECH-003 | Line of sight clearance | ✓ | ✓ | ✓ | ✓ |
| TECH-004 | Server room/IT cupboard | — | Recommended | ✓ | ✓ |
| TECH-005 | Ethernet cabling | — | ✓ | ✓ | ✓ |
| TECH-006 | UPS protection | — | — | Recommended | ✓ |

### 4.3 Site Assessment

| Rule ID | Rule | Criteria |
|---------|------|----------|
| TECH-010 | Free site assessment | Included for Premium/Enterprise tiers |
| TECH-011 | Paid site assessment | R950 for Essential/Professional (waived if sign-up) |
| TECH-012 | Multi-site assessment | Required for Enterprise with multiple locations |

---

## 5. Tier Selection Rules

### 5.1 Tier Assignment by User Count

| Rule ID | User Count | Recommended Tier | Rationale |
|---------|------------|------------------|-----------|
| TIER-001 | 1-5 users | Essential | 5 BB licences included, basic support |
| TIER-002 | 6-10 users | Essential + Add-ons | Buy additional BB licences at R179/user |
| TIER-003 | 10-15 users | Professional | 10 BS licences included, extended support |
| TIER-004 | 16-25 users | Professional + Add-ons | Buy additional BS licences at R329/user |
| TIER-005 | 25-35 users | Premium | 15 BP licences included, 24/7 support |
| TIER-006 | 36-50 users | Premium + Add-ons | Buy additional BP licences at R549/user |
| TIER-007 | 50-100 users | Enterprise | 20 E3 licences included, custom scoping |
| TIER-008 | 100+ users | Custom | POA — engage Product/Sales leadership |

### 5.2 Tier Upgrade Triggers

| Rule ID | Trigger | Action |
|---------|---------|--------|
| TIER-010 | User count exceeds tier maximum | Offer tier upgrade OR add-on licences |
| TIER-011 | Support demand exceeds allocation | Review usage, recommend tier upgrade |
| TIER-012 | Security incident requiring premium features | Recommend Premium+ tier |
| TIER-013 | Multiple sites added | Evaluate Enterprise tier |
| TIER-014 | Compliance requirements (ISO, POPIA audit) | Recommend Premium+ with compliance reporting |

### 5.3 Tier Downgrade Restrictions

| Rule ID | Rule | Logic |
|---------|------|-------|
| TIER-020 | Minimum commitment period | Cannot downgrade within first 3 months |
| TIER-021 | Active licence binding | Cannot downgrade if M365 users exceed target tier's included count |
| TIER-022 | SLA obligation | Cannot downgrade mid-incident until resolved |
| TIER-023 | Downgrade notice | 30 days written notice required |

---

## 6. Microsoft 365 Licensing Rules

### 6.1 Included Licence Allocations

| Rule ID | Tier | Included Licences | M365 Type | Add-on Rate |
|---------|------|-------------------|-----------|-------------|
| M365-001 | Essential | 5 | Business Basic | R179/user/mo |
| M365-002 | Professional | 10 | Business Standard | R329/user/mo |
| M365-003 | Premium | 15 | Business Premium | R549/user/mo |
| M365-004 | Enterprise | 20 | E3 | R799/user/mo |

### 6.2 Licence Type Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| M365-010 | Licence type fixed per tier | Essential ALWAYS gets BB, cannot swap to BS |
| M365-011 | Upgrade path within tier | Can purchase HIGHER tier licence as add-on (e.g., BS on Essential) |
| M365-012 | Mixed licensing | Additional users can be different tier if business justifies |
| M365-013 | Minimum licence term | Microsoft requires 12-month minimum for CSP annual subscriptions |
| M365-014 | Monthly billing option | Available at 20% premium (annual = R179, monthly = R215) |

### 6.3 Licence Management Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| M365-020 | Provisioning timeline | New licences provisioned within 4 business hours |
| M365-021 | Deprovisioning | 30-day grace period, then licence reclaimed |
| M365-022 | Data retention on offboard | 90 days in litigation hold, then purged |
| M365-023 | Admin access | CircleTel retains delegated admin access for support |
| M365-024 | Existing licences | Customer can migrate existing M365 to CircleTel CSP OR discount tier |

### 6.4 Existing M365 Handling

| Rule ID | Scenario | Action |
|---------|----------|--------|
| M365-030 | Customer has existing M365 (self-managed) | Migrate to CircleTel CSP at standard rates |
| M365-031 | Customer wants to keep existing M365 | Discount tier by M365 wholesale value (consult Product) |
| M365-032 | Customer has E5 licences | Not supported in tiers — custom pricing required |
| M365-033 | Multi-tenant requirement | Enterprise tier only, additional configuration fees |

---

## 7. Module Eligibility & Dependencies

### 7.1 Module Dependency Matrix

| Module | Essential | Professional | Premium | Enterprise | Dependency |
|--------|:---------:|:------------:|:-------:|:----------:|------------|
| **SkyFibre Connectivity** | ✓ | ✓ | ✓ | ✓ | Mandatory — bundled |
| **Microsoft 365 Licences** | ✓ | ✓ | ✓ | ✓ | Mandatory — bundled |
| **Helpdesk Support** | ✓ | ✓ | ✓ | ✓ | Mandatory — bundled |
| **Remote Support** | ✓ | ✓ | ✓ | ✓ | Mandatory — bundled |
| **On-site Support** | Add-on | Quarterly | Monthly | Weekly | Tier-gated |
| **Managed Firewall** | — | ✓ | ✓ | ✓ | Professional+ |
| **Cloud Backup** | — | 500GB | 1TB | Unlimited | Professional+ |
| **Security Suite** | Basic | Standard | Complete | Enterprise | Tier-gated |
| **Security Training** | — | — | Quarterly | Monthly | Premium+ |
| **Dedicated Account Manager** | — | — | Add-on | ✓ | Premium+ or R2,000/mo |
| **Compliance Reporting** | — | — | — | ✓ | Enterprise only |

### 7.2 Add-on Modules

| Rule ID | Add-on | Price | Available From |
|---------|--------|-------|----------------|
| MOD-001 | On-site visit (Essential/Professional) | R850/visit | Essential |
| MOD-002 | LTE failover (if not included) | R399/mo | Essential |
| MOD-003 | Additional static IP | R99/mo | All tiers |
| MOD-004 | Website maintenance | R999/mo | All tiers |
| MOD-005 | Dedicated account manager | R2,000/mo | Premium |
| MOD-006 | Custom development hours | R550/hour | All tiers |
| MOD-007 | Disaster recovery testing | R5,000/test | Premium+ |
| MOD-008 | Advanced security pack | R1,500/mo | Professional |
| MOD-009 | E-commerce platform | R15,000 once-off | All tiers |
| MOD-010 | Website development | From R5,000 once-off | All tiers |

### 7.3 Module Activation Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| MOD-020 | Connectivity first | Connectivity must be active before M365 provisioning |
| MOD-021 | M365 before backup | M365 must be provisioned before cloud backup enabled |
| MOD-022 | Firewall after connectivity | Managed firewall deployed after CPE installation |
| MOD-023 | Security training after onboard | Security awareness training starts month 2 |

---

## 8. Pricing & Discount Rules

### 8.1 Standard Pricing (Effective March 2026)

| Rule ID | Tier | Monthly Price | Included M365 | Connectivity |
|---------|------|---------------|---------------|--------------|
| PRICE-001 | Essential | R2,999 | 5 BB | 50Mbps SkyFibre |
| PRICE-002 | Professional | R5,999 | 10 BS | 100Mbps + failover option |
| PRICE-003 | Premium | R12,999 | 15 BP | 200Mbps + LTE backup |
| PRICE-004 | Enterprise | POA (min R35,000) | 20 E3 | 500Mbps+ dedicated |

### 8.2 Discount Authority Matrix

| Rule ID | Discount Level | Approval Required | Max Discount |
|---------|----------------|-------------------|--------------|
| DISC-001 | 0-5% | Sales rep | 5% |
| DISC-002 | 6-10% | Sales Manager | 10% |
| DISC-003 | 11-15% | Sales Director | 15% |
| DISC-004 | 16-20% | Product Lead | 20% |
| DISC-005 | >20% | CEO | Case-by-case |

### 8.3 Eligible Discount Scenarios

| Rule ID | Scenario | Max Discount | Conditions |
|---------|----------|--------------|------------|
| DISC-010 | Multi-year commitment (24mo) | 10% | Signed 24-month contract |
| DISC-011 | Multi-year commitment (36mo) | 15% | Signed 36-month contract |
| DISC-012 | Multi-site (2-4 sites) | 8% | Same entity, simultaneous activation |
| DISC-013 | Multi-site (5+ sites) | 12% | Same entity, phased OK |
| DISC-014 | Partner referral | 5% | Partner commission still applies |
| DISC-015 | Annual prepayment | 8% | Full 12-month upfront payment |
| DISC-016 | Competitive win-back | 15% | Documented competitor quote |
| DISC-017 | Staff/family discount | 25% | CircleTel employees only |

### 8.4 Discount Stacking Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| DISC-020 | Maximum stack | Only 2 discounts may stack |
| DISC-021 | Stack priority | Multi-year > Annual prepay > Multi-site > Competitive |
| DISC-022 | Partner exclusion | Partner referral discount does NOT stack |
| DISC-023 | Staff exclusive | Staff discount does NOT stack with any other |

---

## 9. Billing & Payment Rules

### 9.1 Billing Cycle

| Rule ID | Rule | Logic |
|---------|------|-------|
| BILL-001 | Billing date | 1st of each month, arrears for usage, advance for subscription |
| BILL-002 | Invoice generation | Auto-generated 5th of month, emailed to billing contact |
| BILL-003 | Payment due | 7 days from invoice date |
| BILL-004 | Pro-rata activation | First month pro-rated from activation date |
| BILL-005 | Pro-rata cancellation | Final month pro-rated to cancellation date |

### 9.2 Payment Methods

| Rule ID | Method | Eligibility | Processing Fee |
|---------|--------|-------------|----------------|
| PAY-001 | Debit order | All customers | None |
| PAY-002 | EFT | All customers | None |
| PAY-003 | Credit card | All customers | 2.5% surcharge |
| PAY-004 | Cash | NOT accepted | N/A |
| PAY-005 | Cheque | NOT accepted | N/A |

### 9.3 Late Payment Rules

| Rule ID | Days Overdue | Action |
|---------|--------------|--------|
| LATE-001 | 7 days | SMS + email reminder |
| LATE-002 | 14 days | Phone call + final notice email |
| LATE-003 | 21 days | Service throttled (connectivity reduced to 10Mbps) |
| LATE-004 | 30 days | Service suspended (connectivity blocked, support paused) |
| LATE-005 | 45 days | Account handed to collections, contract terminated |
| LATE-006 | >60 days | Legal action, credit listing |

### 9.4 Reconnection Fees

| Rule ID | Scenario | Fee |
|---------|----------|-----|
| RECON-001 | Throttle lift (after payment) | Free |
| RECON-002 | Suspension lift (after payment) | R500 |
| RECON-003 | Reactivation after termination | R1,500 + deposit |

---

## 10. Contract & Commitment Rules

### 10.1 Contract Types

| Rule ID | Contract Type | Term | Early Exit Penalty |
|---------|---------------|------|-------------------|
| CONT-001 | Month-to-month | 30 days | None |
| CONT-002 | Annual contract | 12 months | 50% of remaining months |
| CONT-003 | Multi-year contract | 24-36 months | 50% of remaining months |
| CONT-004 | Enterprise custom | Negotiated | Per contract terms |

### 10.2 Free Installation Eligibility

| Rule ID | Rule | Logic |
|---------|------|-------|
| CONT-010 | Free installation | Requires 12+ month commitment |
| CONT-011 | Month-to-month installation | R2,500 installation fee applies |
| CONT-012 | Multi-site discount | R1,500/site from 3rd site onwards |

### 10.3 Contract Documentation

| Rule ID | Document | Required For |
|---------|----------|--------------|
| DOC-001 | Service Agreement | All customers |
| DOC-002 | Acceptable Use Policy | All customers (acknowledgement) |
| DOC-003 | Privacy Notice (POPIA) | All customers (acknowledgement) |
| DOC-004 | Microsoft CSP Terms | All customers (pass-through) |
| DOC-005 | SLA Addendum | Premium/Enterprise tiers |
| DOC-006 | Master Services Agreement | Enterprise tier |

---

## 11. Credit Vetting & Onboarding Workflow

### 11.1 Credit Check Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| CRED-001 | Credit bureau check | Mandatory for all business customers |
| CRED-002 | Minimum score | 400 (TransUnion Commercial Score) |
| CRED-003 | Alternative to credit | 3-month prepayment + R5,000 deposit |
| CRED-004 | Director guarantee | Optional for borderline credit (400-500) |
| CRED-005 | Credit limit | Monthly MRC × 3 (e.g., R5,999 tier = R17,997 limit) |

### 11.2 Credit Tier Matrix

| Rule ID | Credit Score | Credit Limit | Deposit Required |
|---------|--------------|--------------|------------------|
| CRED-010 | 700+ | 6× MRC | None |
| CRED-011 | 600-699 | 3× MRC | None |
| CRED-012 | 500-599 | 2× MRC | 1× MRC |
| CRED-013 | 400-499 | 1× MRC | 2× MRC + director guarantee |
| CRED-014 | <400 | Prepay only | 3× MRC prepayment |

### 11.3 Onboarding Checklist

| Step | Task | Owner | SLA |
|------|------|-------|-----|
| 1 | Coverage check completed | Customer/Sales | Real-time |
| 2 | Quote accepted, contract signed | Customer | — |
| 3 | Credit check completed | Finance | 4 hours |
| 4 | Deposit collected (if applicable) | Finance | 24 hours |
| 5 | Site survey scheduled | Operations | 48 hours |
| 6 | CPE ordered/allocated | Operations | 24 hours |
| 7 | Installation scheduled | Operations | 48 hours |
| 8 | Installation completed | Technician | As scheduled |
| 9 | Connectivity activated | NOC | 4 hours post-install |
| 10 | M365 tenant provisioned | IT Team | 24 hours |
| 11 | User onboarding call | Account Manager | 48 hours |
| 12 | 7-day check-in | Support | Day 7 |
| 13 | 30-day satisfaction survey | Support | Day 30 |

---

## 12. Provisioning & Activation Workflow

### 12.1 Standard Activation Timeline

| Rule ID | Phase | Duration | Milestone |
|---------|-------|----------|-----------|
| PROV-001 | Day 0 | — | Contract signed, payment received |
| PROV-002 | Day 1 | 1 day | Site survey (if required) |
| PROV-003 | Day 2 | 1 day | CPE shipped/allocated |
| PROV-004 | Day 3 | 1 day | Installation completed, connectivity live |
| PROV-005 | Day 3-4 | 4 hours | M365 tenant created, domain verified |
| PROV-006 | Day 4-5 | 1 day | User licences provisioned, migration started |
| PROV-007 | Day 5-7 | 2 days | Security policies applied, backup enabled |

### 12.2 Dependencies & Prerequisites

| Rule ID | Dependency | Blocker If Missing |
|---------|------------|-------------------|
| PROV-010 | Payment/credit approved | Cannot proceed |
| PROV-011 | Site access confirmed | Installation delayed |
| PROV-012 | Domain ownership verified | M365 domain setup delayed |
| PROV-013 | Current provider credentials | Email migration delayed |
| PROV-014 | User list provided | Licence provisioning delayed |

### 12.3 Escalation Triggers

| Rule ID | Trigger | Escalation Path | SLA |
|---------|---------|-----------------|-----|
| ESC-001 | Installation delay >48 hours | Operations Manager | 4 hours |
| ESC-002 | M365 provisioning delay >24 hours | IT Lead | 2 hours |
| ESC-003 | Customer unreachable for 72 hours | Account Manager | 24 hours |
| ESC-004 | Technical blocker (no LOS, no power) | Sales Director | 4 hours |

---

## 13. SLA Entitlement Rules

### 13.1 SLA by Tier

| Rule ID | Metric | Essential | Professional | Premium | Enterprise |
|---------|--------|:---------:|:------------:|:-------:|:----------:|
| SLA-001 | Connectivity uptime | 99.0% | 99.5% | 99.5% | 99.9% |
| SLA-002 | Support response (P1) | 4 hours | 2 hours | 1 hour | 30 min |
| SLA-003 | Support response (P2) | 8 hours | 4 hours | 2 hours | 1 hour |
| SLA-004 | Support response (P3) | NBD | 8 hours | 4 hours | 2 hours |
| SLA-005 | On-site response (P1) | NBD | 8 hours | 4 hours | 2 hours |
| SLA-006 | Data restoration RTO | 8 hours | 4 hours | 4 hours | 2 hours |
| SLA-007 | Data restoration RPO | 24 hours | 12 hours | 6 hours | 1 hour |

### 13.2 Priority Definitions

| Priority | Definition | Example |
|----------|------------|---------|
| **P1** | Service down, all users impacted | Internet outage, email server down |
| **P2** | Major feature unavailable, business impact | Teams not working, VPN down |
| **P3** | Minor issue, workaround available | Single user issue, slow performance |
| **P4** | Request/enhancement | New user setup, feature request |

### 13.3 SLA Credits

| Rule ID | Downtime | Credit (% of MRC) | Cumulative Cap |
|---------|----------|-------------------|----------------|
| SLA-010 | 99.0-99.5% (Essential breach) | 10% | 50% |
| SLA-011 | 98.5-99.0% | 15% | 50% |
| SLA-012 | 98.0-98.5% | 25% | 50% |
| SLA-013 | <98.0% | 50% | 50% |

### 13.4 SLA Exclusions

| Rule ID | Exclusion | Rationale |
|---------|-----------|-----------|
| SLA-020 | Scheduled maintenance | Notified 48 hours in advance |
| SLA-021 | Customer-caused outage | CPE unplugged, account suspended |
| SLA-022 | Force majeure | Natural disaster, civil unrest |
| SLA-023 | Third-party provider outage | Microsoft global outage, upstream ISP |
| SLA-024 | Customer refused access | Technician denied site entry |

---

## 14. Support Tier Rules

### 14.1 Support Hours

| Rule ID | Tier | Support Hours | Channels |
|---------|------|---------------|----------|
| SUP-001 | Essential | Mon-Fri 8am-5pm | WhatsApp, Email |
| SUP-002 | Professional | Mon-Sat 7am-7pm | WhatsApp, Email, Phone |
| SUP-003 | Premium | 24/7 | WhatsApp, Email, Phone |
| SUP-004 | Enterprise | 24/7 Priority | WhatsApp, Email, Phone, Direct Line |

### 14.2 Support Scope

| Rule ID | Support Type | Essential | Professional | Premium | Enterprise |
|---------|-------------|:---------:|:------------:|:-------:|:----------:|
| SUP-010 | Connectivity troubleshooting | ✓ | ✓ | ✓ | ✓ |
| SUP-011 | M365 user management | ✓ | ✓ | ✓ | ✓ |
| SUP-012 | Email configuration | ✓ | ✓ | ✓ | ✓ |
| SUP-013 | Teams setup | — | ✓ | ✓ | ✓ |
| SUP-014 | SharePoint configuration | — | ✓ | ✓ | ✓ |
| SUP-015 | Security policy management | — | ✓ | ✓ | ✓ |
| SUP-016 | Azure AD management | — | — | ✓ | ✓ |
| SUP-017 | Custom application support | — | — | — | ✓ |
| SUP-018 | Hardware troubleshooting | Basic | ✓ | ✓ | ✓ |
| SUP-019 | Third-party vendor liaison | — | — | ✓ | ✓ |

### 14.3 Out-of-Scope Support

| Rule ID | Item | Resolution |
|---------|------|------------|
| SUP-020 | Non-Microsoft software | Billable at R550/hour |
| SUP-021 | Custom development | Quote separately |
| SUP-022 | Physical hardware repair | Refer to vendor/warranty |
| SUP-023 | Data recovery (customer fault) | Billable, restore from backup if available |
| SUP-024 | Training beyond onboarding | Quote separately (R1,500/session) |

---

## 15. Backup & Security Rules

### 15.1 Backup Allocation

| Rule ID | Tier | Backup Storage | Backup Scope | Retention |
|---------|------|----------------|--------------|-----------|
| BACK-001 | Essential | None (add-on) | — | — |
| BACK-002 | Professional | 500GB | M365, selected endpoints | 30 days |
| BACK-003 | Premium | 1TB | M365, all endpoints | 90 days |
| BACK-004 | Enterprise | Unlimited | M365, all endpoints, servers | 365 days |

### 15.2 Backup Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| BACK-010 | Backup frequency | Daily (overnight, SA timezone) |
| BACK-011 | Backup location | Azure South Africa (za-north) |
| BACK-012 | Encryption | AES-256 at rest, TLS 1.3 in transit |
| BACK-013 | Restore requests | Included in support, 4-hour RTO (Premium) |
| BACK-014 | Overage billing | R2/GB/month for usage beyond allocation |

### 15.3 Security Features by Tier

| Rule ID | Feature | Essential | Professional | Premium | Enterprise |
|---------|---------|:---------:|:------------:|:-------:|:----------:|
| SEC-001 | Email security (anti-spam) | ✓ | ✓ | ✓ | ✓ |
| SEC-002 | Managed firewall | — | ✓ | ✓ | ✓ |
| SEC-003 | Endpoint protection | — | ✓ | ✓ | ✓ |
| SEC-004 | Web content filtering | — | ✓ | ✓ | ✓ |
| SEC-005 | Security awareness training | — | — | Quarterly | Monthly |
| SEC-006 | Threat intelligence | — | — | ✓ | ✓ |
| SEC-007 | SIEM/SOC monitoring | — | — | — | ✓ |
| SEC-008 | Penetration testing | — | — | — | Annual |

---

## 16. Upgrade/Downgrade/Migration Rules

### 16.1 Upgrade Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| UPG-001 | Upgrade timing | Effective immediately or next billing cycle (customer choice) |
| UPG-002 | Upgrade pro-rata | Difference billed pro-rata for current month |
| UPG-003 | Connectivity upgrade | May require site visit (included for Premium+) |
| UPG-004 | M365 licence upgrade | Immediate provisioning of higher tier licences |
| UPG-005 | Retained data | All data, configurations, and history retained |

### 16.2 Downgrade Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| DOWN-001 | Downgrade notice | 30 days written notice required |
| DOWN-002 | Downgrade effective date | Next billing cycle after notice period |
| DOWN-003 | Licence reduction | Excess M365 licences removed (customer selects which users) |
| DOWN-004 | Backup reduction | Data exceeding new tier allocation deleted after 30 days |
| DOWN-005 | Feature removal | Premium features (24/7 support, etc.) removed immediately at downgrade |
| DOWN-006 | Minimum commitment block | Cannot downgrade within first 3 months |

### 16.3 Migration from Competitors

| Rule ID | Rule | Logic |
|---------|------|-------|
| MIG-001 | Email migration | Included (up to 50 mailboxes, Enterprise unlimited) |
| MIG-002 | Data migration | 100GB included, R2/GB thereafter |
| MIG-003 | DNS management | Included (domain transfer assistance) |
| MIG-004 | Parallel running | 14 days overlap with old provider supported |
| MIG-005 | Migration SLA | Complete within 7 business days of domain verification |

---

## 17. Cancellation & Churn Policies

### 17.1 Cancellation Process

| Rule ID | Rule | Logic |
|---------|------|-------|
| CAN-001 | Written notice required | Email to support@circletel.co.za |
| CAN-002 | Notice period | 30 days (month-to-month), end of term (contract) |
| CAN-003 | Exit interview | Account manager must conduct retention call |
| CAN-004 | Equipment return | CPE must be returned within 14 days |
| CAN-005 | Final invoice | Pro-rated to cancellation date + any penalties |
| CAN-006 | Data export | Customer may request data export within 30 days |
| CAN-007 | Data deletion | All customer data deleted 90 days post-cancellation |

### 17.2 Early Termination Fees

| Rule ID | Contract Type | Penalty |
|---------|---------------|---------|
| CAN-010 | Month-to-month | None (30-day notice) |
| CAN-011 | 12-month contract | 50% of remaining months' MRC |
| CAN-012 | 24-month contract | 50% of remaining months' MRC |
| CAN-013 | 36-month contract | 50% of remaining months' MRC |
| CAN-014 | Free installation clawback | R2,500 if within 6 months |

### 17.3 Retention Incentives

| Rule ID | Offer | Eligibility | Approval |
|---------|-------|-------------|----------|
| RET-001 | 1 month free | All customers | Account Manager |
| RET-002 | Tier upgrade trial (3mo) | Professional+ | Sales Manager |
| RET-003 | Pricing match | Documented competitor quote | Sales Director |
| RET-004 | Contract restructure | Multi-year commitment | Product Lead |

---

## 18. Partner & Reseller Rules

### 18.1 Partner Types

| Rule ID | Partner Type | Commission | Volume Target |
|---------|--------------|------------|---------------|
| PART-001 | Referral Partner | 5% MRC (12 months) | None |
| PART-002 | Reseller Bronze | 10% MRC (ongoing) | R10,000 MRR |
| PART-003 | Reseller Silver | 15% MRC (ongoing) | R50,000 MRR |
| PART-004 | Reseller Gold | 20% MRC (ongoing) | R150,000 MRR |
| PART-005 | White Label | Wholesale rate | R500,000 MRR |

### 18.2 Partner Eligibility

| Rule ID | Rule | Criteria |
|---------|------|----------|
| PART-010 | Business registration | Must be registered SA company/CC |
| PART-011 | FICA compliance | Must provide partner FICA documents |
| PART-012 | Training completion | Must complete CircleTel Partner Certification |
| PART-013 | Agreement signed | Must sign Partner Agreement |
| PART-014 | Bank details | Must provide bank account for commission payments |

### 18.3 Commission Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| PART-020 | Commission trigger | Paid on customer payment (not invoice) |
| PART-021 | Commission period | Start: customer first payment, End: per partner tier |
| PART-022 | Commission calculation | % of base MRC (excludes add-ons, once-off fees) |
| PART-023 | Payment cycle | Monthly, 15th of following month |
| PART-024 | Clawback | Full clawback if customer cancels within 90 days |
| PART-025 | Churn penalty | Commission paused if partner churn >20% |

### 18.4 Link-up ICT Partnership

| Rule ID | Rule | Logic |
|---------|------|-------|
| LINK-001 | Overflow support | Link-up ICT provides Enterprise-tier overflow support |
| LINK-002 | Microsoft expertise | Link-up ICT handles complex Azure/M365 issues |
| LINK-003 | SLA alignment | Link-up ICT must meet CircleTel SLA commitments |
| LINK-004 | Escalation path | CircleTel L2 → Link-up ICT L3 → Microsoft |
| LINK-005 | Cost absorption | Link-up ICT fees absorbed in Enterprise margin |

---

## 19. Regulatory & Compliance Policies

### 19.1 POPIA Compliance

| Rule ID | Rule | Logic |
|---------|------|-------|
| POPIA-001 | Privacy notice | Must be acknowledged before service activation |
| POPIA-002 | Data processing | CircleTel is data operator; customer is responsible party |
| POPIA-003 | Consent records | Kept for duration of service + 5 years |
| POPIA-004 | Data breach | Customer notified within 72 hours of discovery |
| POPIA-005 | Subject access requests | Fulfilled within 30 days |
| POPIA-006 | Data localisation | All customer data stored in Azure South Africa |

### 19.2 ICASA Compliance

| Rule ID | Rule | Logic |
|---------|------|-------|
| ICASA-001 | Licence requirement | CircleTel operates under ECNS/ECS licence |
| ICASA-002 | Emergency services | Not applicable (data services, no voice) |
| ICASA-003 | Consumer protection | Code of conduct compliance |
| ICASA-004 | Tariff filing | Pricing updates filed with ICASA |

### 19.3 Microsoft CSP Compliance

| Rule ID | Rule | Logic |
|---------|------|-------|
| CSP-001 | Agreement flow | Microsoft Customer Agreement passed to end customer |
| CSP-002 | Acceptable Use | Customer must comply with Microsoft AUP |
| CSP-003 | Audit rights | Microsoft may audit licence usage |
| CSP-004 | Indirect CSP | CircleTel operates under indirect CSP via distributor |

---

## 20. Exception Handling & Escalation

### 20.1 Exception Categories

| Rule ID | Category | Example | Approver |
|---------|----------|---------|----------|
| EXC-001 | Pricing exception | Discount >20% | CEO |
| EXC-002 | Credit exception | Approve <400 score | Finance Director |
| EXC-003 | SLA exception | Waive penalty | Operations Manager |
| EXC-004 | Contract exception | Custom terms | Legal + Product Lead |
| EXC-005 | Technical exception | Non-standard CPE | IT Lead |
| EXC-006 | Process exception | Skip steps | Operations Manager |

### 20.2 Escalation Matrix

| Level | Role | Scope | Response Time |
|-------|------|-------|---------------|
| L1 | Support Agent | Standard issues, first contact | Immediate |
| L2 | IT Team | Technical issues, M365, connectivity | 2 hours |
| L3 | Link-up ICT | Complex Azure, enterprise issues | 4 hours |
| L4 | Product/Operations | Policy exceptions, business decisions | 8 hours |
| L5 | Executive | Critical escalations, legal, reputation | NBD |

### 20.3 Exception Request Process

1. Document the exception request in support ticket
2. Justify business case and customer impact
3. Route to appropriate approver per matrix
4. Document approval in ticket and CRM
5. Monitor exception for pattern (>3 = rule review)

---

## Appendix A: Decision Trees

### A.1 New Customer Qualification

```
START: Customer enquiry
  │
  ├─► Is customer a business entity?
  │     │
  │     ├─ NO → Redirect to WorkConnect SOHO
  │     │
  │     └─ YES → Check SkyFibre coverage
  │                 │
  │                 ├─ NO COVERAGE → Offer waitlist OR WorkConnect with standalone IT (TBD)
  │                 │
  │                 └─ COVERAGE → Run credit check
  │                                 │
  │                                 ├─ SCORE <400 → Offer prepaid option
  │                                 │
  │                                 └─ SCORE ≥400 → Proceed to tier selection
```

### A.2 Tier Selection

```
START: Qualified customer
  │
  ├─► How many M365 users needed?
  │     │
  │     ├─ 1-5 → Essential (R2,999)
  │     │
  │     ├─ 6-10 → Essential + add-on users (R2,999 + R179/user)
  │     │
  │     ├─ 10-15 → Professional (R5,999)
  │     │
  │     ├─ 16-25 → Professional + add-on users (R5,999 + R329/user)
  │     │
  │     ├─ 25-35 → Premium (R12,999)
  │     │
  │     ├─ 36-50 → Premium + add-on users (R12,999 + R549/user)
  │     │
  │     ├─ 50-100 → Enterprise (POA, min R35,000)
  │     │
  │     └─ 100+ → Custom (engage Product/Sales leadership)
```

### A.3 Support Escalation

```
START: Support ticket received
  │
  ├─► What is the priority?
  │     │
  │     ├─ P1 (Service down) → Immediately escalate to L2
  │     │     │
  │     │     ├─ Resolved? → Close ticket
  │     │     │
  │     │     └─ Not resolved in 1hr → Escalate to L3 (Link-up ICT)
  │     │
  │     ├─ P2 (Major impact) → L1 initial response
  │     │     │
  │     │     ├─ Resolved? → Close ticket
  │     │     │
  │     │     └─ Not resolved in 4hr → Escalate to L2
  │     │
  │     ├─ P3 (Minor issue) → L1 handles
  │     │     │
  │     │     └─ Escalate to L2 if specialist knowledge needed
  │     │
  │     └─ P4 (Request) → Schedule in queue
```

### A.4 Cancellation Retention

```
START: Cancellation request received
  │
  ├─► Schedule exit interview
  │     │
  │     ├─► What is the reason?
  │     │     │
  │     │     ├─ PRICE → Offer pricing match (if competitor quote) or 1 month free
  │     │     │
  │     │     ├─ SERVICE → Offer tier upgrade trial (3mo) + dedicated review
  │     │     │
  │     │     ├─ MOVING → Offer service transfer to new address (if coverage)
  │     │     │
  │     │     ├─ CLOSING BUSINESS → Process cancellation, offer personal plan
  │     │     │
  │     │     └─ OTHER → Investigate, escalate to Sales Director if high-value
  │     │
  │     └─► Customer declines all offers
  │           │
  │           └─► Process cancellation per policy
```

---

## Appendix B: Quick Reference Tables

### B.1 Pricing Quick Reference

| Tier | Price | M365 | Extra Users | Support |
|------|-------|------|-------------|---------|
| Essential | R2,999 | 5 BB | R179/user | Mon-Fri 8-5 |
| Professional | R5,999 | 10 BS | R329/user | Mon-Sat 7am-7pm |
| Premium | R12,999 | 15 BP | R549/user | 24/7, 4hr SLA |
| Enterprise | POA (min R35k) | 20 E3 | R799/user | 24/7 Priority, 2hr SLA |

### B.2 User Count to Tier Mapping

| Users | Recommended | Monthly Cost Range |
|-------|-------------|-------------------|
| 1-5 | Essential | R2,999 |
| 6-10 | Essential + add-ons | R3,178-R3,894 |
| 10-15 | Professional | R5,999-R7,646 |
| 16-25 | Professional + add-ons | R7,975-R10,934 |
| 25-35 | Premium | R12,999-R18,489 |
| 36-50 | Premium + add-ons | R18,538-R26,724 |
| 50+ | Enterprise | POA (min R35,000) |

### B.3 Discount Authority

| Discount | Approver |
|----------|----------|
| 0-5% | Sales Rep |
| 6-10% | Sales Manager |
| 11-15% | Sales Director |
| 16-20% | Product Lead |
| >20% | CEO |

### B.4 Key Contacts

| Role | Responsibility | Escalation Authority |
|------|----------------|---------------------|
| Account Manager | Day-to-day relationship | Retention offers |
| IT Lead (Lindokuhle) | Technical escalation | Technical exceptions |
| Sales Director | Commercial decisions | Discount >15% |
| Product Lead | Pricing, tier rules | Policy exceptions |
| Finance Director | Credit, billing | Credit exceptions |
| Operations Manager | SLA, provisioning | Process exceptions |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 12 March 2026 | Product Team | Initial BRD based on CPS v2.0 |

---

*This document governs operational execution of Managed IT Services. For commercial strategy and unit economics, see CT-MITS-CPS-2026-002 (Commercial Product Spec v2.0).*

*CircleTel (Pty) Ltd — Reliable Tech Solutions*
