# Vox Business Customer Journey Analysis

This document analyzes the customer journey for Vox's business connectivity offerings, specifically examining their wireless and fibre solutions to understand best practices for business customer acquisition.

## Pages Analyzed

1. **Vox Wireless Business**: https://www.vox.co.za/wireless-to-the-business/
2. **Vox Fibre Business**: https://www.vox.co.za/fibre-to-the-business/

## Analysis Date
September 26, 2025

## Key Findings

### Wireless Business Page Journey

#### 1. Entry Point & Value Proposition
- **Hero Message**: "Just as fast as Fibre, and more widely available"
- **Positioning**: Quick-deployable connectivity solution over carrier-grade technology
- **Target**: Businesses where fibre is limited or unavailable

#### 2. Coverage & Address Verification
- Prominent address checker in hero section
- "Connect me" CTA directly from address input
- Multiple "Check Coverage" buttons throughout page
- Test address (7 Autumn Street, Rivonia) redirects to shop.vox.co.za coverage checker

#### 3. Product Tiers & Pricing
**Three distinct offerings:**

- **Wireless Lite**: From R900/month
  - 20/4 Mbps starting speed
  - Licensed and unlicensed services
  - Asymmetrical service
  - Broadband only

- **Wireless**: From R1,300/month
  - From 5 Mbps symmetrical
  - Broadband and dedicated services
  - Full duplex capability

- **Wireless Pro**: From R9,300/month
  - From 10 Mbps
  - Dedicated services only
  - Hard-to-reach areas specialty

#### 4. Key Features Emphasized
- Fast unlimited data (uncapped, unshaped)
- 24/7/365 support
- Quick deployment (2-8 weeks vs fibre)
- Low jitter & latency
- Carrier-grade connectivity
- Voice VLAN included (except Lite)

#### 5. Value-Added Services
- **Fixed LTE-A Failover**: R260/month starting
- **Advanced SLA Portfolio**: Mission-critical support
- **Communicate Bundle**: Up to 76% voice cost savings

### Fibre Business Page Journey

#### 1. Entry Point & Promotion
- **Hero Banner**: "Up to 40% off" Frogfoot Premium Business Fibre
- **Savings Message**: "The longer you sign, the more you save"
- **CTA Options**: Coverage check, specialist consultation, view solutions

#### 2. Solution Architecture
**Three-tier approach:**

- **Business Fibre**: Broadband solutions
  - Up to 10:1 contended bandwidth
  - Asymmetrical and symmetrical options
  - Free router included

- **Premium Business Fibre**: Enhanced performance
  - Up to 2:1 contended bandwidth
  - 99% uptime guarantee
  - Symmetrical upload/download

- **Dedicated Fibre**: Enterprise grade
  - Uncontended bandwidth (1:1)
  - 99.5% uptime
  - Multiple service options (DIA, MPLS, etc.)

#### 3. Pricing Structure
- **Starting Price**: R599.40/month (promotional)
- **Speed Tiers**: 20/10 Mbps to 500/250 Mbps shown
- **Pricing Range**: R859 - R3,549+ per month
- Clear "starting from" messaging

#### 4. Value-Added Services
- **Wi-Fi-as-a-Service**: Subscription-based managed Wi-Fi
- **Business Fibre Failover**: Active-active configurations
- **Fibre Plus**: R1,499/month enhancement package
- **Advanced SLA Portfolio**: Enterprise support tiers

### Common Customer Journey Elements

#### 1. Coverage Verification Priority
- Both pages lead with address-based coverage checking
- Multiple coverage check CTAs throughout pages
- Immediate redirection to coverage tool upon address entry

#### 2. Consultation Pathways
- "Speak to a Specialist" prominent on both pages
- Direct enquiry forms for complex products
- Dedicated support for enterprise needs

#### 3. Business Documentation Requirements
- Company registration document (CIPC)
- Director ID copy
- Proof of address (company/director, <3 months)
- Letter of authority (if not signed by director)

#### 4. Installation Process Transparency
**6-step process clearly outlined:**
1. Ordering and Planning
2. Approvals
3. Civil and Hauling
4. Provision
5. Installation
6. Hand Over

#### 5. Support & Credibility
- 24/7/365 support emphasized across all tiers
- Customer testimonials with specific business names
- Partnership logos (WAPA member, technology partners)
- Terms and conditions clearly accessible

#### 6. Technical Features Highlighted
- Uncapped, unshaped, unthrottled data
- Symmetrical vs asymmetrical options clearly defined
- Uptime guarantees (99%, 99.5%)
- Contention ratios specified (10:1, 2:1, 1:1)

## Technical Implementation Notes

### Coverage Checker Functionality
- Address input triggers JavaScript validation
- Redirects to shop.vox.co.za subdomain
- Map integration shows coverage areas
- Some JavaScript errors observed in console

### User Experience Issues Observed
- Console errors during coverage checking
- Google Maps API warnings about loading methods
- Some failed resource loads (404 errors)

## Strategic Insights for CircleTel

### 1. Simplification Opportunities
- Vox presents complex multi-tier offerings
- CircleTel could differentiate with simplified choices
- Clear feature differentiation without overwhelming options

### 2. Speed & Deployment Focus
- Both solutions emphasize installation timelines
- Opportunity for CircleTel to promise faster deployment
- Wireless positioned as faster than fibre alternative

### 3. Pricing Transparency
- Upfront pricing without hidden fees resonates
- Promotional pricing (discounts) drives urgency
- Contract length impacts pricing significantly

### 4. Business Continuity Emphasis
- Failover and redundancy highly valued
- Multiple backup options presented
- Peace of mind messaging effective

### 5. Local Market Focus
- Address-based service availability crucial
- South African-specific requirements (CIPC, etc.)
- Local partnership emphasis builds trust

### 6. Support as Differentiator
- 24/7/365 support consistently highlighted
- SLA options for enterprise customers
- Dedicated account management for premium tiers

## Recommendations for CircleTel Business Journey

1. **Lead with coverage verification** - make address checking the primary CTA
2. **Simplify product tiers** - avoid overwhelming choice architecture
3. **Emphasize speed of deployment** - both technical speed and installation timeline
4. **Transparent pricing** - clear monthly costs without hidden fees
5. **Business continuity focus** - backup and failover options prominent
6. **Local expertise** - South African business requirements and partnerships
7. **Consultation pathway** - easy access to technical specialists
8. **Documentation clarity** - clear business requirements upfront

## Files Referenced

- Analysis conducted via Playwright browser automation
- Test address used: 7 Autumn Street, Rivonia
- Coverage checker functional but with some technical issues
- Both pages redirect to shop.vox.co.za for final coverage verification