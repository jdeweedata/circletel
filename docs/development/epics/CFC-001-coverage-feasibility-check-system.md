# Epic: Coverage & Feasibility Check System

**Epic ID**: CFC-001
**Created**: October 1, 2025
**Status**: Assessment & Enhancement
**Priority**: High (Core Feature)
**Sprint Target**: Sprint 43-44 (October-November 2025)

## Epic Overview

### Business Context
The Coverage & Feasibility Check System is CircleTel's primary customer acquisition tool, enabling potential customers to:
- Discover high-speed internet availability at their location
- Browse tailored packages based on actual coverage
- Complete orders with integrated payment processing
- Transition smoothly from prospect to subscriber

This epic assesses the current implementation against business requirements (BRS v2.0, Sections 4.1-4.3) and identifies gaps for completion.

### Success Metrics
- **Customer Acquisition**: 90% of visitors complete coverage check
- **Conversion Rate**: 15% of coverage checks → completed orders
- **System Performance**: < 3s average coverage check time
- **Accuracy**: 95%+ coverage prediction accuracy vs. actual service delivery
- **Customer Satisfaction**: 4.5/5 rating for order experience

### Market Context
South African customers expect:
- Instant coverage validation (no callbacks for basic feasibility)
- Transparent pricing with no hidden fees
- Multiple provider options (MTN, DFA, Openserve)
- Secure payment processing
- Clear timelines for service activation

## Current State Analysis

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│  CoverageChecker.tsx  │  CoveragePage  │  OrderWizard       │
│  (Address input,      │  (Public page) │  (Multi-stage)     │
│   Geolocation)        │                │                     │
└─────────┬─────────────┴────────┬───────┴──────────┬─────────┘
          │                      │                   │
          ▼                      ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Route Layer                          │
├─────────────────────────────────────────────────────────────┤
│  /api/coverage/leads  │  /api/coverage/packages  │ /api/... │
│  (Lead creation)      │  (Package recommendation) │          │
└─────────┬─────────────┴──────────┬────────────────┴─────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
├─────────────────────────────────────────────────────────────┤
│         Coverage Aggregation Service (Singleton)             │
│  ┌──────────────────────────────────────────────────┐      │
│  │ 1. Real-time MTN WMS Coverage Check             │      │
│  │ 2. Dual-source MTN (Business + Consumer APIs)   │      │
│  │ 3. PostGIS Geographic Queries (Fallback)        │      │
│  │ 4. Area Name Matching (Legacy Fallback)         │      │
│  └──────────────────────────────────────────────────┘      │
│                                                               │
│  Product Recommendation Engine                               │
│  ┌──────────────────────────────────────────────────┐      │
│  │ • Technical Type → Product Category Mapping      │      │
│  │ • Package Filtering by Coverage                  │      │
│  │ • Promotional Pricing Application                │      │
│  └──────────────────────────────────────────────────┘      │
└─────────┬────────────────────────────────────────────────┬──┘
          │                                                 │
          ▼                                                 ▼
┌─────────────────────────┐                   ┌──────────────────┐
│   Supabase Database     │                   │  External APIs   │
│  • coverage_leads       │                   │  • MTN WMS       │
│  • coverage_areas       │                   │  • DFA/Openserve │
│  • service_packages     │                   │  • Google Maps   │
│  • service_type_mapping │                   └──────────────────┘
└─────────────────────────┘
```

### Implementation Status by Requirement

#### 4.1 High-Speed Internet Availability Check ✅ 90% Complete

**Status Breakdown**:
- ✅ **Address Entry**: Google Maps autocomplete with address validation
  - File: `components/coverage/AddressAutocomplete.tsx`
  - Features: Real-time suggestions, coordinate extraction

- ✅ **Geolocation Support**: Browser geolocation API integration
  - File: `components/coverage/CoverageChecker.tsx:93-161`
  - Features: Permission handling, error fallback

- ✅ **Coverage Database Check**: Multi-provider validation
  - File: `lib/coverage/aggregation-service.ts`
  - Features: MTN WMS, PostGIS, area matching
  - Performance: 5-minute caching, < 3s response time

- ✅ **Package Presentation**: Dynamic package filtering
  - File: `app/api/coverage/packages/route.ts`
  - Features: Service type mapping, promotional pricing

- ✅ **Lead Registration**: Automatic CRM lead creation
  - File: `app/api/coverage/leads/route.ts`
  - Database: `coverage_leads` table with triggers

- 🟡 **Sales Team Notification**: Backend implemented, UI confirmation missing
  - Current: Silent lead creation
  - Gap: No user feedback that sales team notified

**Technical Strengths**:
1. **Sophisticated Fallback Strategy**: 4-tier coverage validation ensures high availability
2. **Performance Optimization**: Singleton pattern with 5-minute cache reduces API load
3. **Multi-Provider Support**: Extensible architecture for adding Vodacom, Cell C, Telkom
4. **Geographic Validation**: South African bounds checking prevents invalid coordinates
5. **Confidence Scoring**: High/medium/low confidence based on data source

**Code Quality**:
- TypeScript strict mode: ✅
- Error handling: ✅ Comprehensive with fallbacks
- Logging: ✅ Console logging for debugging
- Testing: 🟡 Manual testing only (no automated tests)

#### 4.2 Product Search and Selection ✅ 95% Complete

**Status Breakdown**:
- ✅ **Address Feasibility Engine**: Integrated with coverage check
- ✅ **Tailored Product Display**: Packages filtered by location
  - File: `components/coverage/PricingGrid.tsx`
  - Features: Responsive grid, promotional badges

- ✅ **ISP Order Management**: Order flow initiated
  - File: `app/order/page.tsx`
  - Features: Multi-stage wizard, progress tracking

- ✅ **Product Comparison**: Side-by-side package cards
  - File: `components/packages/PackageCard.tsx`
  - Features: Popular badges, feature lists, CTAs

**Technical Strengths**:
1. **Service Type Mapping**: Technical types (uncapped_wireless) → Product categories (SkyFibre)
2. **Dynamic Pricing**: Promotional pricing with duration display
3. **Mobile-First Design**: Responsive grid adapts to screen size
4. **Brand Consistency**: CircleTel design system colors and typography

**Code Quality**:
- Component reusability: ✅ High
- Accessibility: 🟡 Basic (needs ARIA labels)
- Performance: ✅ Optimized with React Query caching

#### 4.3 Order and Subscription 🟡 70% Complete

**Status Breakdown**:
- ✅ **Order Wizard Structure**: 4-stage flow implemented
  - Stages: Coverage → Account → Contact → Installation
  - File: `components/order/wizard/OrderWizard.tsx`

- ✅ **Order Context**: React context for state management
  - File: `components/order/context/OrderContext.tsx`
  - Features: Stage tracking, data persistence

- ✅ **Progress Indicator**: Visual progress through stages
  - File: `components/order/wizard/ProgressIndicator.tsx`

- 🟡 **Order Summary**: Basic structure, needs enhancement
  - Current: Simple package selection
  - Gap: Missing detailed breakdown (pricing, features, installation)

- ❌ **Payment Integration**: Netcash stub only
  - Environment: `.env.netcash.example` exists
  - Gap: No active payment processing
  - Required: Webhook handling, status updates, confirmation emails

- ❌ **Service Activation Instructions**: Not implemented
  - Gap: No timeline, setup instructions, or activation workflow

- ❌ **Subscription Management**: Not implemented
  - Gap: No customer portal for managing services

**Technical Gaps**:
1. **Payment Processing**: Critical gap preventing production deployment
2. **Email Notifications**: Resend configured but not integrated
3. **Order Status Tracking**: No real-time status updates
4. **Customer Portal**: No self-service subscription management

## Gap Analysis & Prioritization

### Critical Gaps (Must Have for MVP) 🔴

#### Gap 1: Payment Integration
**Impact**: Blocks revenue generation
**Effort**: 2 days
**Dependencies**: Netcash merchant account, webhook endpoint
**Story**: CFC-001-01-payment-integration.md

#### Gap 2: Order Summary Enhancement
**Impact**: Poor user experience, confusion about purchase
**Effort**: 1 day
**Dependencies**: None (can reuse existing components)
**Story**: CFC-001-02-order-summary.md

### Medium Priority (Should Have) 🟡

#### Gap 3: CRM Lead Notification UI
**Impact**: User uncertainty about no-coverage areas
**Effort**: 0.5 days
**Dependencies**: Existing lead creation system
**Story**: CFC-001-03-crm-notification-ui.md

### Low Priority (Nice to Have) 🟢

#### Gap 4: Automated Testing
**Impact**: Prevents regression, ensures quality
**Effort**: 3 days
**Dependencies**: Test framework setup (Playwright/Jest)

#### Gap 5: Subscription Management Portal
**Impact**: Reduces support load, improves customer experience
**Effort**: 5 days
**Dependencies**: Authentication system, Zoho Billing integration

## User Journeys Analysis

### Journey 1: Successful Coverage Check → Order
**Current State**: ✅ Works well
```
User visits /coverage
  ↓
Enters address or uses geolocation
  ↓
Coverage checked (< 3s)
  ↓
Packages displayed (filtered by coverage)
  ↓
User selects package
  ↓
Redirected to /order?package=X&lead=Y
  ↓
🟡 Order flow (partially complete)
  ↓
❌ Payment fails (not integrated)
```

**Gap**: Order flow incomplete, payment missing

### Journey 2: No Coverage → Lead Registration
**Current State**: 🟡 Works but lacks feedback
```
User visits /coverage
  ↓
Enters address
  ↓
Coverage checked → No service available
  ↓
Lead automatically created in database
  ↓
🟡 Alert shown: "Sorry, no coverage available"
  ↓
❌ No confirmation that sales team notified
  ↓
User leaves uncertain
```

**Gap**: Missing user reassurance and next steps

### Journey 3: Mobile User → Quick Check
**Current State**: ✅ Works well
```
User visits /coverage on mobile
  ↓
Clicks "Use my current location"
  ↓
Browser requests location permission
  ↓
Coverage checked with coordinates
  ↓
Mobile-responsive package grid displayed
  ↓
User taps package card
  ↓
Mobile-optimized order flow begins
```

**Gap**: None for coverage check, but payment flow not mobile-tested

## Dependencies

### External Dependencies
- **MTN WMS API**: Coverage data source (primary)
- **DFA ArcGIS**: Fibre coverage data (secondary)
- **Google Maps API**: Geocoding and address autocomplete
- **Netcash Payment Gateway**: Payment processing (not integrated)
- **Resend Email API**: Transactional emails (configured, not used)

### Internal Dependencies
- **Supabase Database**: Coverage data, leads, packages
- **Authentication System**: Customer login for order tracking
- **Zoho CRM Integration**: Lead management (via MCP)
- **Admin Panel**: Coverage area management, package administration

## Risk Assessment

### High Risk 🔴

#### Risk 1: MTN WMS API Availability
**Probability**: Medium
**Impact**: High (breaks primary coverage check)
**Mitigation**:
- ✅ 4-tier fallback strategy implemented
- ✅ 5-minute caching reduces API dependency
- 🟡 Need monitoring alerts for API failures

#### Risk 2: Payment Integration Complexity
**Probability**: Low (Netcash well-documented)
**Impact**: High (blocks revenue)
**Mitigation**:
- Use existing Netcash integration patterns
- Implement webhook validation
- Test with sandbox environment

### Medium Risk 🟡

#### Risk 3: Geocoding Accuracy
**Probability**: Medium (South African addresses can be imprecise)
**Impact**: Medium (wrong coverage results)
**Mitigation**:
- ✅ Google Maps autocomplete improves accuracy
- ✅ Manual address entry fallback
- 🟡 Need address validation service

### Low Risk 🟢

#### Risk 4: Performance at Scale
**Probability**: Low
**Impact**: Medium (slow coverage checks)
**Mitigation**:
- ✅ Caching implemented
- ✅ Singleton pattern prevents duplicate requests
- ✅ Database indexes on coverage tables

## Story Breakdown Preview

### Epic Stories (Estimated: 3.5 days)

1. **CFC-001-01**: Complete Netcash payment integration (2 days)
   - Payment form with PCI compliance
   - Webhook endpoint for payment status
   - Order confirmation emails via Resend
   - Failed payment handling and retry

2. **CFC-001-02**: Enhance order summary display (1 day)
   - Detailed package breakdown component
   - Installation timeline and instructions
   - Pricing summary with promotional details
   - Terms and conditions acceptance

3. **CFC-001-03**: Add CRM lead notification UI (0.5 days)
   - Toast notification on lead creation
   - Modal with "We'll contact you soon" message
   - Sales team timeline expectation
   - Alternative options display

**Total Estimate**: 3.5 days (fits in single 6-day sprint)

## Acceptance Criteria (Epic Level)

### Must Have (MVP) ✅
- [x] Customers can enter address or use geolocation
- [x] System checks coverage database accurately
- [x] Available packages displayed for covered areas
- [x] Leads registered for non-covered areas
- [x] Multi-provider coverage aggregation
- [ ] Payment processing completes successfully
- [ ] Order summary shows complete details
- [ ] Lead notification confirmation displayed

### Should Have (Post-MVP) 🟡
- [ ] Automated test coverage (E2E, unit)
- [ ] Performance monitoring dashboard
- [ ] A/B testing for conversion optimization
- [ ] Multi-language support (English, Afrikaans, Zulu)

### Could Have (Future) 🟢
- [ ] Coverage heatmap visualization
- [ ] Service comparison tools
- [ ] Customer reviews and ratings
- [ ] Subscription management portal

## Quality Gates

See detailed quality gate: `docs/development/qa/gates/CFC-001-epic-quality-gate.yml`

### Technical Quality Checkpoints
- [ ] TypeScript strict mode compilation
- [ ] Coverage check < 3s (95th percentile)
- [ ] Lead creation success rate > 99%
- [ ] Payment processing < 5s
- [ ] Mobile responsiveness verified
- [ ] Accessibility WCAG 2.1 AA compliance

### Business Quality Checkpoints
- [ ] User can complete coverage check (4.1) ✅
- [ ] User can view tailored packages (4.2) ✅
- [ ] User can complete order with payment (4.3) ❌
- [ ] Sales team receives lead notifications ✅
- [ ] Order confirmation email sent ❌

### Security Quality Checkpoints
- [ ] Payment data PCI DSS compliant
- [ ] User data POPIA compliant
- [ ] API endpoints rate-limited
- [ ] Coordinates validated (SA bounds)
- [ ] SQL injection prevention

## Success Indicators

### Development Metrics
- **Code Coverage**: 80%+ for critical paths
- **TypeScript Errors**: 0 compilation errors
- **Performance**: < 3s coverage check, < 5s payment
- **Reliability**: 99.9% uptime for coverage API

### Business Metrics
- **Conversion Rate**: 15% coverage check → completed order
- **Coverage Accuracy**: 95%+ prediction vs. actual service
- **Customer Satisfaction**: 4.5/5 order experience rating
- **Support Tickets**: < 5% related to coverage check issues

### User Experience Metrics
- **Time to Complete Check**: < 1 minute
- **Mobile Conversion**: 60% of total traffic
- **Bounce Rate**: < 20% on coverage page
- **Return Rate**: 30% of users return to complete order

## Next Steps

1. **Create Quality Gate**: Define automated and manual validation
2. **Write Stories**: Detailed implementation specs for gaps
3. **Sprint Planning**: Schedule CFC-001-01 (payment) for Sprint 43
4. **Testing Strategy**: Define E2E test scenarios
5. **Monitoring Setup**: Configure alerts for coverage API failures

---

**Epic Owner**: Product Manager
**Technical Lead**: Full-Stack Developer
**Stakeholders**: Sales, Customer Success, Finance, Operations
**Review Date**: Weekly during sprint
**Target Completion**: Sprint 44 (November 2025)
