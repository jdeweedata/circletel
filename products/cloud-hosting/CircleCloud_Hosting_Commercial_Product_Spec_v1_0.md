# CircleCloud Hosting — Commercial Product Specification

## Web Hosting & Reseller Services for SME

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-CPS-CIRCLECLOUD-2026-001 |
| **Version** | 1.0 |
| **Effective Date** | March 2026 |
| **Classification** | CONFIDENTIAL — Internal & Partner Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | CircleTel Product Team |
| **Approved By** | [Pending] |
| **Status** | DEVELOPMENT |

---

## Version Control & Change Log

| Version | Date | Author | Change Description | Status |
|---------|------|--------|--------------------|--------|
| 1.0 | Mar 2026 | Product Team | Initial CPS based on NameHero research and market analysis | **CURRENT** |

---

## Table of Contents

1. Executive Summary
2. Infrastructure Partner Analysis
3. Wholesale Cost Structure
4. Retail Product Architecture
5. Unit Economics & Margin Analysis
6. Technical Specifications
7. Service Level Agreements
8. Installation & Provisioning
9. Support Framework
10. Competitive Positioning
11. Bundle Strategy
12. Risk Register
13. Implementation Roadmap
14. Financial Projections
15. Approval

---

## 1. Executive Summary

CircleCloud Hosting extends CircleTel's single-provider value proposition by adding managed web hosting and reseller services to our connectivity and IT portfolio. This creates a complete digital infrastructure offering for SMEs who want one trusted partner for all their technology needs.

### 1.1 Strategic Context

**Market Opportunity:**
- South African web hosting market dominated by budget providers (Hetzner, Afrihost)
- SME segment underserved for bundled hosting + connectivity + IT
- No major ISP offers integrated hosting with connectivity SLA

**Strategic Fit:**
- Extends Managed IT Services bundle (R2,999–R19,999/mo)
- Creates sticky recurring revenue with 55–75% margins
- Every hosting customer is a connectivity/IT prospect
- Differentiates on service, not price

### 1.2 Strategic Metrics Summary

| Metric | Value | Notes |
|--------|-------|-------|
| Strategic Priority | ★★ Secondary Focus | Value-add to core connectivity |
| Target Market | SME with website needs | 1–50 staff, existing or new customers |
| Infrastructure Partner | NameHero (USA) | CloudShield VPS platform |
| Base Tier Margin | 55–65% | Before bundle attach |
| Full Bundle Margin | 70–75% | Hosting + Connectivity + IT |
| Technology | CloudLinux, LiteSpeed, cPanel/WHM | Industry standard |
| Pricing Model | Tiered + Add-ons | Transparent, competitive |

---

## 2. Infrastructure Partner Analysis

### 2.1 Vendor Selection: NameHero

| Attribute | Details |
|-----------|---------|
| **Provider** | NameHero Inc. (USA) |
| **Platform** | CloudShield Managed VPS |
| **Data Centers** | US, UK, Canada, India, Germany, France, Poland |
| **Support** | 24/7 with Level III technicians |
| **Uptime SLA** | 99.9% |
| **Documentation** | [help.namehero.com](https://help.namehero.com/) |

**Sources:** [NameHero VPS Hosting](https://www.namehero.com/vps-hosting), [BestVPSList Comparison](https://www.bestvpslist.com/vps/namehero-business-cloudshield)

### 2.2 CloudShield VPS Tiers

| Plan | CPU | RAM | Storage | Bandwidth | Monthly (USD) | Monthly (ZAR) |
|------|-----|-----|---------|-----------|---------------|---------------|
| **Starter CloudShield** | 2 AMD cores | 4 GB | 150 GB NVMe | 2 TB | $23.70 | R439 |
| **Plus CloudShield** | 6 AMD cores | 8 GB | 250 GB NVMe | 3 TB | $32.43 | R600 |
| **Turbo CloudShield** | 8 AMD cores | 16 GB | 450 GB NVMe | 2 TB | $40.23 | R744 |
| **Business CloudShield** | 10 AMD cores | 32 GB | 500 GB NVMe | 2 TB | $49.03 | R907 |

**Exchange Rate:** $1 = R18.50 (adjust quarterly)

### 2.3 Included Software (All Tiers)

| Software | Starter | Plus+ | Value |
|----------|---------|-------|-------|
| cPanel Solo | ✅ FREE | ✅ FREE | 1 account license |
| WHM (WebHost Manager) | ✅ FREE | ✅ FREE | Server administration |
| WHMCS | ❌ | ✅ FREE | Billing & automation (Plus and above only) |
| LiteSpeed Web Server | ✅ FREE | ✅ FREE | High-performance web server |
| CloudLinux | ✅ FREE | ✅ FREE | Resource isolation |
| Imunify360 | ✅ FREE | ✅ FREE | Security suite |
| SSL Certificates | ✅ FREE | ✅ FREE | Automated SSL via Let's Encrypt |
| Website Migrations | ✅ FREE | ✅ FREE | Free migration assistance |
| 30-Day Money-Back | ✅ | ✅ | Risk-free trial |

**Key Insight:** WHMCS is only free on Plus CloudShield and above. For Starter, WHMCS costs ~$15–20/mo extra. Recommend Plus as minimum for reseller operations.

---

## 3. Wholesale Cost Structure

### 3.1 cPanel License Pricing (Effective December 2025)

The included cPanel Solo supports 1 account only. For reseller operations, additional cPanel licenses are required.

| License Tier | Accounts | Monthly (USD) | Monthly (ZAR) | Use Case |
|--------------|----------|---------------|---------------|----------|
| Solo (included) | 1 | $0 | R0 | Single client |
| Admin | 5 | $35.95 | R665 | Small reseller |
| Pro | 30 | $53.95 | R998 | Growing reseller |
| Premier | 100 | $69.95 | R1,294 | Full-scale hosting |
| 125 accounts | 125 | $82.20 | R1,521 | Large scale |
| 150 accounts | 150 | $94.45 | R1,747 | Enterprise |

**Source:** [LicensePal cPanel Pricing](https://www.licensepal.com/products/cpanel-pricing-update.php)

### 3.2 Total Infrastructure Cost by Scale

| Scale | VPS Tier | cPanel License | Total USD | Total ZAR | Cost/Account |
|-------|----------|----------------|-----------|-----------|--------------|
| 1 account | Starter | Solo (free) | $23.70 | R439 | R439 |
| 5 accounts | Plus | Admin ($35.95) | $68.38 | R1,265 | R253 |
| 30 accounts | Turbo | Pro ($53.95) | $94.18 | R1,742 | R58 |
| 100 accounts | Business | Premier ($69.95) | $118.98 | R2,201 | R22 |

**Key Insight:** At 30 accounts, infrastructure cost drops to R58/account. At 100 accounts, it's only R22/account — enabling 80%+ gross margins on R299+ retail pricing.

### 3.3 Full Cost of Sale Breakdown (30-Account Operation)

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| NameHero Turbo VPS | R744 | 8 CPU, 16GB RAM, 450GB NVMe |
| cPanel Pro License | R998 | 30 accounts |
| Domain Reseller Account | R0 | Pass-through billing |
| Support Allocation | R500 | ~20 min/customer/month |
| AgilityGIS Billing | R150 | Est. for hosting module |
| **Total COS** | **R2,392** | |
| **COS per Account (30)** | **R80** | |

---

## 4. Retail Product Architecture

### 4.1 CircleCloud Hosting Tiers

| Product | Storage | Email Accounts | Bandwidth | Monthly Price | Target |
|---------|---------|----------------|-----------|---------------|--------|
| **CircleCloud Starter** | 5 GB SSD | 5 | 50 GB | R199/mo | Micro-business, 1 website |
| **CircleCloud Basic** | 10 GB SSD | 10 | 100 GB | R349/mo | Small business, 1-2 sites |
| **CircleCloud Business** | 25 GB SSD | 25 | Unlimited | R599/mo | SME, 3-5 websites |
| **CircleCloud Pro** | 50 GB SSD | 50 | Unlimited | R999/mo | Growing SME, 10+ websites |
| **CircleCloud Agency** | 100 GB SSD | Unlimited | Unlimited | R1,999/mo | Web agencies, resellers |

### 4.2 All Tiers Include

- Free SSL certificate (Let's Encrypt)
- Daily automated backups (7-day retention)
- cPanel control panel
- 1-click WordPress installer
- Email with webmail access
- 99.9% uptime SLA
- Basic support (business hours)

### 4.3 Add-on Services

| Add-on | Monthly Price | Cost | Margin | Description |
|--------|---------------|------|--------|-------------|
| Website Migration | R500 once-off | R100 | 80% | Full migration from existing host |
| WordPress Management | R199/mo | R50 | 75% | Updates, security, optimization |
| Extended Backup | R99/mo | R30 | 70% | 30-day retention |
| Dedicated IP | R149/mo | R50 | 66% | Required for some SSL configs |
| Priority Support | R199/mo | R75 | 62% | 4-hour response SLA |
| Malware Removal | R499 once-off | R150 | 70% | Emergency cleanup |
| Website Development | From R5,000 | Variable | 50%+ | Custom design & build |

---

## 5. Unit Economics & Margin Analysis

### 5.1 Per-Account Profitability (at 30-Account Scale)

| Product | Retail Price | COS/Account | Contribution | Margin % |
|---------|--------------|-------------|--------------|----------|
| CircleCloud Starter | R199 | R80 | R119 | 60% |
| CircleCloud Basic | R349 | R80 | R269 | 77% |
| CircleCloud Business | R599 | R80 | R519 | 87% |
| CircleCloud Pro | R999 | R80 | R919 | 92% |
| CircleCloud Agency | R1,999 | R80 | R1,919 | 96% |

**Note:** COS includes proportional infrastructure, cPanel license, and support allocation.

### 5.2 Break-Even Analysis

| Metric | Value | Notes |
|--------|-------|-------|
| Fixed Infrastructure Cost | R2,392/mo | VPS + cPanel Pro (30 accounts) |
| Average Revenue/Account | R450 | Blended across tiers |
| Break-even Accounts | 6 | R2,392 ÷ (R450 - R80) = 6.5 |
| Target Utilization | 80% | 24 of 30 accounts |
| Monthly Revenue at 80% | R10,800 | 24 × R450 |
| Monthly Profit at 80% | R8,408 | Revenue - COS |
| Gross Margin at 80% | 78% | |

### 5.3 Scaling Economics

| Scale | Infrastructure | Revenue (80% util) | COS | Gross Profit | Margin |
|-------|----------------|--------------------|----|--------------|--------|
| 30 accounts | R2,392 | R10,800 | R4,312 | R6,488 | 60% |
| 100 accounts | R2,201 | R36,000 | R10,201 | R25,799 | 72% |
| 150 accounts | R2,491 | R54,000 | R14,491 | R39,509 | 73% |

---

## 6. Technical Specifications

### 6.1 Server Environment

| Specification | Details |
|---------------|---------|
| **CPU** | AMD EPYC (server-grade) |
| **Storage** | NVMe Gen4 SSD |
| **Web Server** | LiteSpeed Enterprise |
| **PHP** | 7.4, 8.0, 8.1, 8.2, 8.3 (selector) |
| **Database** | MySQL 8.0, MariaDB 10.x |
| **Caching** | LiteSpeed Cache, Redis, Memcached |
| **OS** | CloudLinux (resource isolation) |

### 6.2 Security Stack

| Feature | Details |
|---------|---------|
| **Firewall** | Imunify360 WAF |
| **Malware Scanning** | Real-time + scheduled |
| **DDoS Protection** | Always-on network-level |
| **SSL/TLS** | Let's Encrypt auto-provisioning |
| **Backup** | Daily automated, off-site storage |

### 6.3 Control Panels

| Panel | Purpose | Access Level |
|-------|---------|--------------|
| **WHM** | Server administration | CircleTel admin only |
| **cPanel** | Per-account management | Customer access |
| **WHMCS** | Billing & automation | CircleTel admin only |

---

## 7. Service Level Agreements

### 7.1 Uptime Guarantee

| SLA Tier | Uptime Target | Credit per % Below |
|----------|---------------|-------------------|
| Standard (all plans) | 99.9% | 5% monthly fee |
| Priority Support add-on | 99.95% | 10% monthly fee |

### 7.2 Support Response Times

| Priority | Standard | Priority Add-on |
|----------|----------|-----------------|
| Critical (site down) | 4 hours | 1 hour |
| High (functionality) | 8 hours | 2 hours |
| Medium (performance) | 24 hours | 4 hours |
| Low (questions) | 48 hours | 24 hours |

### 7.3 Exclusions

- Third-party software/plugin issues
- Customer-introduced malware
- Domain DNS propagation
- Email deliverability (blacklisting)

---

## 8. Installation & Provisioning

### 8.1 Timeline

| Action | Timeline |
|--------|----------|
| Account creation | Same day |
| cPanel access | Within 2 hours |
| Website migration | 1-3 business days |
| DNS propagation | 24-48 hours (external) |

### 8.2 Migration Service

| Included | Details |
|----------|---------|
| Files | Full website files transfer |
| Databases | MySQL/MariaDB migration |
| Email | Mailbox migration (optional) |
| Testing | Verification before DNS switch |
| Cost | R500 once-off (or free with 12-mo commitment) |

---

## 9. Support Framework

### 9.1 Support Channels

| Channel | Hours | Response |
|---------|-------|----------|
| WhatsApp | 8am-6pm M-F | < 30 min |
| Email | 24/7 | < 4 hours |
| Phone | 8am-5pm M-F | Immediate |
| Emergency | 24/7 | Priority line |

### 9.2 Escalation Path

1. **Level 1:** CircleTel IT team (Lindokuhle, Mmathabo)
2. **Level 2:** NameHero support (server issues)
3. **Level 3:** NameHero senior engineers

---

## 10. Competitive Positioning

### 10.1 South African Hosting Market

| Competitor | Entry Price | Target | CircleTel Differentiation |
|------------|-------------|--------|---------------------------|
| Hetzner SA | R49/mo | Budget | Bundled connectivity + IT support |
| Afrihost | R99/mo | Consumer | Business SLA, no fair use cap |
| RSAWEB | R199/mo | SME | Single provider, integrated billing |
| Xneelo | R299/mo | Business | Local WhatsApp support, Managed IT bundle |
| 1-grid | R69/mo | Budget | No support queues, business focus |

### 10.2 CircleTel Advantage

1. **Single Provider** — Connectivity + IT + Hosting = one bill, one contact
2. **Bundled Savings** — 10-20% discount when combined with SkyFibre/Managed IT
3. **Local Support** — Direct WhatsApp to technicians, no call centre
4. **Business Focus** — Not competing on R49 consumer pricing
5. **Cross-Sell** — Every hosting customer is a connectivity prospect

### 10.3 Target Positioning Statement

> "CircleCloud Hosting: Business-grade web hosting bundled with the connectivity and IT support your business actually needs. One provider. One bill. One team that knows your business."

---

## 11. Bundle Strategy

### 11.1 Connectivity + Hosting Bundle

| Connectivity | Add Hosting | Bundle Price | Savings |
|--------------|-------------|--------------|---------|
| SkyFibre Business 50 (R1,299) | CircleCloud Basic (R349) | R1,549 | R99 (6%) |
| SkyFibre Business 100 (R1,499) | CircleCloud Business (R599) | R1,999 | R99 (5%) |
| SkyFibre Business 200 (R1,899) | CircleCloud Pro (R999) | R2,699 | R199 (7%) |

### 11.2 Managed IT + Hosting Bundle

| Managed IT Tier | Add Hosting | Bundle Price | Savings |
|-----------------|-------------|--------------|---------|
| Essential (R2,999) | CircleCloud Business | R3,399 | R199 (6%) |
| Professional (R5,999) | CircleCloud Pro | R6,799 | R199 (3%) |
| Premium (R9,999) | CircleCloud Agency | R11,499 | R499 (4%) |

### 11.3 Triple Bundle: Connectivity + IT + Hosting

| Package | Components | Bundle Price | Savings |
|---------|------------|--------------|---------|
| **SME Digital Complete** | SkyFibre 100 + Essential IT + CircleCloud Business | R4,999 | R297 (6%) |
| **Business Digital Pro** | SkyFibre 200 + Professional IT + CircleCloud Pro | R8,499 | R497 (6%) |

---

## 12. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| NameHero service outage | High | Low | Monitor uptime, have backup provider shortlist |
| Currency fluctuation (ZAR/USD) | Medium | Medium | Quarterly price review, 10% buffer |
| cPanel price increases | Medium | High | Factor 10% annual increase, explore alternatives |
| Support capacity | Medium | Medium | Phased rollout, training before launch |
| Competition on price | Low | High | Focus on bundled value, not standalone hosting |
| Data sovereignty concerns | Medium | Low | Offer EU data center option |

---

## 13. Implementation Roadmap

### Phase 1: Foundation (Month 1)

| Task | Owner | Status |
|------|-------|--------|
| Finalize NameHero contract | TK | Pending |
| Provision Turbo CloudShield VPS | IT | Pending |
| Purchase cPanel Pro license (30 accounts) | IT | Pending |
| Configure WHM/WHMCS | IT | Pending |
| Create internal SOPs | IT | Pending |
| Train IT team | IT Lead | Pending |

### Phase 2: Soft Launch (Month 2)

| Task | Owner | Status |
|------|-------|--------|
| Migrate CircleTel website to platform | IT | Pending |
| Offer to existing Managed IT customers | Sales | Pending |
| Gather feedback and refine | Product | Pending |
| Document common issues | Support | Pending |

### Phase 3: General Availability (Month 3+)

| Task | Owner | Status |
|------|-------|--------|
| Public launch announcement | Marketing | Pending |
| Website product pages | Web | Pending |
| Sales team training | Sales | Pending |
| Marketing campaign | Marketing | Pending |

---

## 14. Financial Projections

### 14.1 Year 1 Targets

| Metric | Q1 | Q2 | Q3 | Q4 | Year 1 |
|--------|----|----|----|----|--------|
| New Customers | 5 | 10 | 15 | 20 | 50 |
| Total Customers | 5 | 15 | 30 | 50 | 50 |
| Avg MRR/Customer | R400 | R450 | R500 | R550 | R550 |
| Total MRR | R2,000 | R6,750 | R15,000 | R27,500 | R27,500 |
| Annual Revenue | - | - | - | - | R180,000 |

### 14.2 3-Year Projection

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Customers | 50 | 150 | 300 |
| Avg MRR/Customer | R550 | R600 | R650 |
| Monthly MRR | R27,500 | R90,000 | R195,000 |
| Annual Revenue | R180,000 | R1,080,000 | R2,340,000 |
| Gross Margin | 60% | 70% | 75% |
| Gross Profit | R108,000 | R756,000 | R1,755,000 |

### 14.3 Investment Requirements

| Item | Once-off | Monthly | Notes |
|------|----------|---------|-------|
| NameHero VPS (Turbo) | - | R744 | First VPS |
| cPanel Pro License | - | R998 | 30 accounts |
| Domain Reseller Setup | R500 | - | One-time |
| Staff Training | R5,000 | - | IT team |
| Marketing Launch | R10,000 | - | Soft launch |
| **Total Investment** | **R15,500** | **R1,742** | |

### 14.4 ROI Analysis

| Metric | Value |
|--------|-------|
| Initial Investment | R15,500 |
| Monthly Operating Cost | R1,742 |
| Break-even Customers | 6 |
| Time to Break-even | Month 2 |
| Year 1 ROI | 597% |

---

## 15. Approval

### 15.1 Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Managing Director | Jeffrey De Wee | __________ | __________ |
| IT Lead | Lindokuhle Mdake | __________ | __________ |
| Digital Lead | Takalani Manenzhe | __________ | __________ |

### 15.2 Launch Authorization

- [ ] Infrastructure contract signed
- [ ] VPS provisioned and tested
- [ ] Support team trained
- [ ] Pricing approved
- [ ] Legal/terms reviewed
- [ ] Marketing materials ready

---

## Appendix A: NameHero Communication Log

### Support Conversation (10 December 2025)

**Q: Does it come with WHM?**
A: Yes, you will get WHM access with your VPS.

**Q: Does it come with a WHMCS license?**
A: Yes, we offer free WHMCS license with Turbo CloudShield VPS, active while VPS is paid.

**Q: Does it also come with cPanel?**
A: We offer cPanel Solo license for free. Additional accounts require extra license purchase.

**Q: Can we resell hosting to clients?**
A: Yes, you can resell web hosting accounts to other businesses via WHM.

---

## Appendix B: Research Sources

- [NameHero VPS Hosting](https://www.namehero.com/vps-hosting)
- [NameHero CloudShield Comparison](https://www.bestvpslist.com/vps/namehero-business-cloudshield)
- [cPanel 2026 Pricing](https://www.bacloud.com/en/blog/219/cpanel-noc-license-costs-keep-rising-a-20252026-price-comparison-for-hosting-providers.html)
- [LicensePal cPanel Pricing](https://www.licensepal.com/products/cpanel-pricing-update.php)
- [NameHero CloudShield Blog](https://www.namehero.com/blog/introducing-cloudshield-the-future-of-web-hosting-for-msps-resellers-and-web-hosts/)

---

**Document Reference:** CT-CPS-CIRCLECLOUD-2026-001
**Version:** 1.0
**Classification:** CONFIDENTIAL

*CircleTel (Pty) Ltd — Reliable Tech Solutions*
