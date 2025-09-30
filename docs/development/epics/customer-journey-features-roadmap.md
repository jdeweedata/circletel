# CircleTel Customer Journey Features Roadmap
## BMAD Method Implementation Plan
### Version 1.0 - September 2025

---

## Executive Summary

This document breaks down CircleTel's customer journeys from the Business Requirements Specification v2.0 into actionable BMAD epics and features. Each epic follows the BMAD methodology with context-rich stories, quality gates, and clear acceptance criteria.

## Priority Matrix

| Priority | Timeline | Focus Area | Business Impact |
|----------|----------|------------|-----------------|
| **P0 - Critical** | Sprint 42-44 | Core Platform & Ordering | MVP Launch Foundation |
| **P1 - High** | Sprint 45-47 | Customer Management | Customer Experience |
| **P2 - Medium** | Sprint 48-50 | Partner & Support | Scale Operations |
| **P3 - Low** | Sprint 51+ | Analytics & Optimization | Growth Enhancement |

---

## Phase 1: Core Platform Foundation (October 2025)
*Critical for MVP Launch with 25 customers*

### Epic CJF-001: Service Availability & Product Discovery
**Priority**: P0 - Critical  
**Timeline**: Sprint 42 (Week 1-2 October)  
**Business Value**: Enable customers to check service availability and browse products

#### Features:
1. **CJF-001-01**: Coverage Checker Component (3 days)
   - Address input with Google Places autocomplete
   - Geolocation support
   - Coverage API integration (SkyFibre, HomeFibreConnect, BizFibreConnect)
   - Lead capture for no-coverage areas
   - Results display with available services

2. **CJF-001-02**: Product Catalog System (2 days)
   - Product listing with filtering
   - Category navigation (Connectivity, IT Services, Bundles)
   - Product comparison tool
   - Pricing display with promotions
   - Bundle savings calculator

3. **CJF-001-03**: Intelligent Recommendations Engine (2 days)
   - Business size assessment
   - Needs-based filtering
   - Bundle recommendations
   - ROI calculator
   - Savings display

**Quality Gate**: 
- Coverage API response < 2 seconds
- Product catalog loads < 1 second
- Mobile responsive design
- Lead capture 100% functional

---

### Epic CJF-002: Order Management System
**Priority**: P0 - Critical  
**Timeline**: Sprint 43 (Week 3-4 October)  
**Business Value**: Enable end-to-end ordering process

#### Features:
1. **CJF-002-01**: Shopping Cart Implementation (2 days)
   - Multi-product cart
   - Bundle configuration
   - Pricing calculations
   - Promotion application
   - Cart persistence

2. **CJF-002-02**: Checkout Process (3 days)
   - Customer information collection
   - KYC document upload
   - Payment method selection
   - Order summary
   - Terms acceptance

3. **CJF-002-03**: Payment Integration (2 days)
   - Netcash payment gateway
   - Multiple payment methods
   - Secure transaction processing
   - Payment confirmation
   - Invoice generation

4. **CJF-002-04**: Order Tracking System (1 day)
   - Order status updates
   - Email/SMS notifications
   - Delivery tracking
   - Installation scheduling
   - Timeline visibility

**Quality Gate**:
- PCI DSS compliant checkout
- Payment processing < 30 seconds
- Order confirmation within 1 minute
- 100% order tracking accuracy

---

### Epic CJF-003: Customer Account Portal
**Priority**: P0 - Critical  
**Timeline**: Sprint 44 (Week 5-6 October)  
**Business Value**: Enable customer self-service and account management

#### Features:
1. **CJF-003-01**: Account Dashboard (2 days)
   - Service overview
   - Billing summary
   - Recent activity
   - Quick actions
   - Notifications

2. **CJF-003-02**: Service Management (2 days)
   - View active services
   - Service details
   - Upgrade/downgrade options
   - Add-on services
   - Cancellation process

3. **CJF-003-03**: Billing & Payments (2 days)
   - Invoice history
   - Payment methods management
   - Auto-pay setup
   - Payment history
   - Statement downloads

4. **CJF-003-04**: Profile Management (1 day)
   - Personal information
   - Contact preferences
   - Security settings
   - Document management
   - Communication preferences

**Quality Gate**:
- Single sign-on functional
- Dashboard loads < 2 seconds
- All CRUD operations working
- POPIA compliant data handling

---

## Phase 2: Customer Experience Enhancement (November 2025)
*Focus on retention and satisfaction*

### Epic CJF-004: Support System Integration
**Priority**: P1 - High  
**Timeline**: Sprint 45-46  
**Business Value**: Provide excellent customer support

#### Features:
1. **CJF-004-01**: Multi-Channel Support Hub (3 days)
   - WhatsApp integration via ClickaTel
   - Email ticket creation
   - Phone support logging
   - Live chat widget
   - Support ticket routing

2. **CJF-004-02**: Knowledge Base System (2 days)
   - Article management
   - Search functionality
   - Category organization
   - FAQ section
   - Video tutorials

3. **CJF-004-03**: Ticket Management Interface (2 days)
   - Customer ticket view
   - Status tracking
   - Communication thread
   - Attachment support
   - Resolution confirmation

**Quality Gate**:
- WhatsApp response < 1 minute
- Ticket creation 100% reliable
- Knowledge base search accurate
- SLA tracking functional

---

### Epic CJF-005: Service Modification Journey
**Priority**: P1 - High  
**Timeline**: Sprint 47  
**Business Value**: Enable service flexibility

#### Features:
1. **CJF-005-01**: Service Change Wizard (2 days)
   - Current service display
   - Available modifications
   - Impact calculator
   - Schedule changes
   - Confirmation process

2. **CJF-005-02**: Bundle Management (2 days)
   - Bundle customization
   - Component swapping
   - Pricing updates
   - Savings display
   - Change validation

3. **CJF-005-03**: Prorated Billing Engine (2 days)
   - Calculation logic
   - Credit/debit processing
   - Invoice adjustment
   - Refund processing
   - Notification system

**Quality Gate**:
- Modification process < 5 clicks
- Pricing accuracy 100%
- Changes applied within 24 hours
- Customer notification immediate

---

## Phase 3: Business Customer Features (December 2025)
*SMME and Enterprise capabilities*

### Epic CJF-006: SMME Journey Implementation
**Priority**: P1 - High  
**Timeline**: Sprint 48-49  
**Business Value**: Capture SMME market segment

#### Features:
1. **CJF-006-01**: Business Quote Generator (3 days)
   - Needs assessment form
   - Multi-service quotes
   - Bundle recommendations
   - ROI calculations
   - PDF generation

2. **CJF-006-02**: Business KYC Process (2 days)
   - Company verification
   - Director checks
   - Document requirements
   - Credit assessment
   - Approval workflow

3. **CJF-006-03**: Business Dashboard (2 days)
   - Multi-service overview
   - User management
   - Cost center allocation
   - Usage analytics
   - Department billing

4. **CJF-006-04**: Priority Support Queue (1 day)
   - Dedicated support line
   - Account manager assignment
   - SLA management
   - Escalation process
   - Regular reviews

**Quality Gate**:
- Quote generation < 2 minutes
- KYC process < 48 hours
- Business features tested
- Credit check integration working

---

### Epic CJF-007: Managed IT Services Platform
**Priority**: P2 - Medium  
**Timeline**: Sprint 50  
**Business Value**: Enable IT services delivery

#### Features:
1. **CJF-007-01**: IT Assessment Tool (2 days)
   - Assessment questionnaire
   - Current state capture
   - Gap analysis
   - Recommendation engine
   - Report generation

2. **CJF-007-02**: Microsoft 365 Management (3 days)
   - License provisioning
   - User management
   - Migration tools
   - Usage tracking
   - Billing integration

3. **CJF-007-03**: Service Desk Portal (2 days)
   - IT ticket creation
   - Remote support request
   - Status tracking
   - Knowledge base
   - Asset management

**Quality Gate**:
- SuperOps.ai integrated
- Microsoft CSP connected
- Remote access functional
- Ticketing system operational

---

## Phase 4: Partner & Scale Features (January 2026)
*Enable growth through partners*

### Epic CJF-008: Partner Portal Development
**Priority**: P2 - Medium  
**Timeline**: Sprint 51-52  
**Business Value**: Scale through partner network

#### Features:
1. **CJF-008-01**: Partner Onboarding System (2 days)
   - Registration process
   - Document verification
   - Agreement management
   - Training modules
   - Certification tracking

2. **CJF-008-02**: Lead Management Platform (2 days)
   - Lead capture forms
   - Pipeline management
   - Activity tracking
   - Quote generation
   - Conversion tracking

3. **CJF-008-03**: Commission Management (2 days)
   - Sales tracking
   - Commission calculation
   - Statement generation
   - Payment processing
   - Performance dashboards

4. **CJF-008-04**: Partner Resources (1 day)
   - Marketing materials
   - Product documentation
   - Training content
   - Co-branding tools
   - Support resources

**Quality Gate**:
- Partner registration complete
- Commission accuracy 100%
- Resource library accessible
- Training modules functional

---

## Phase 5: Analytics & Optimization (February 2026)
*Data-driven improvements*

### Epic CJF-009: Analytics Platform
**Priority**: P3 - Low  
**Timeline**: Sprint 53  
**Business Value**: Enable data-driven decisions

#### Features:
1. **CJF-009-01**: Customer Analytics (2 days)
   - Behavior tracking
   - Satisfaction metrics
   - Churn analysis
   - LTV calculations
   - Segment analysis

2. **CJF-009-02**: Operational Dashboards (2 days)
   - Service performance
   - Support metrics
   - Order analytics
   - Network health
   - Financial KPIs

3. **CJF-009-03**: Marketing Analytics (1 day)
   - Campaign performance
   - Lead sources
   - Conversion funnels
   - ROI tracking
   - Attribution analysis

**Quality Gate**:
- Real-time data updates
- Dashboard load < 3 seconds
- Data accuracy validated
- Export functionality working

---

## Implementation Guidelines

### Development Approach
1. **Story Creation**: Use BMAD Scrum Master agent for detailed stories
2. **Context Engineering**: Include full business context in each story
3. **Component Reuse**: Leverage existing CircleTel components
4. **Quality First**: Define quality gates before development
5. **Incremental Delivery**: Deploy features as completed

### Technical Standards
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Components**: shadcn/ui with CircleTel patterns
- **State**: Zustand + React Query
- **Backend**: Supabase with real-time features
- **Testing**: Quality gates for each epic

### Success Metrics
- **MVP Launch**: October 2025 with core features
- **Customer Target**: 25 customers by end October
- **Revenue Goal**: R32,000 MRR
- **Service Delivery**: 3-day activation achieved
- **Customer Satisfaction**: >90% CSAT score

---

## BMAD Agent Assignments

### Epic Ownership
| Epic | Primary Agent | Supporting Agents |
|------|--------------|-------------------|
| CJF-001 | Architect | Developer, QA |
| CJF-002 | Developer | Architect, QA |
| CJF-003 | Developer | UX, QA |
| CJF-004 | Scrum Master | Developer, Support |
| CJF-005 | Developer | Business Analyst |
| CJF-006 | Business Analyst | Developer, Sales |
| CJF-007 | Architect | Developer, IT Ops |
| CJF-008 | Business Analyst | Developer, Sales |
| CJF-009 | Architect | Developer, Data |

### Story Templates Location
All story templates following BMAD methodology are in:
`docs/development/stories/[epic-id]-[story-number]-[description].md`

### Quality Gate Templates
Quality gates for each epic are in:
`docs/development/qa/gates/[epic-id]-epic-quality-gate.yml`

---

## Next Steps

1. **Immediate Actions** (This Week):
   - Review and approve epic priorities
   - Assign development resources
   - Create detailed stories for CJF-001
   - Set up development environment

2. **Sprint 42 Planning**:
   - Kickoff CJF-001 (Service Availability)
   - Complete coverage checker component
   - Deploy product catalog system

3. **Continuous Activities**:
   - Daily standups using BMAD framework
   - Story refinement with context engineering
   - Quality gate validation
   - Customer feedback integration

---

*Document maintained by BMAD Scrum Master Agent*  
*Last Updated: September 28, 2025*  
*Next Review: October 5, 2025*
