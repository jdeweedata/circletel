# Requirements Documentation
## B2B Quote-to-Contract Workflow with KYC Compliance

**Spec ID**: 20251101-b2b-quote-to-contract-kyc
**Created**: 2025-11-01
**Stakeholder**: CircleTel Development Team
**Source Documents**:
- `docs/journeys/b2b-quote-to-contract/Quote-to-Contract Workflow.md` (Version 3.0)
- `docs/journeys/b2b-quote-to-contract/USER_STORIES.md`

---

## User Requirements Gathering Session

### Session Context
- **Command Invoked**: `/feature:plan docs\journeys\b2b-quote-to-contract\Quote-to-Contract Workflow.md`
- **Date**: 2025-11-01
- **Stakeholder Role**: Product Owner / Technical Lead

---

## Questions & Answers

### Question 1: Primary Goals
**Question**: What are your primary goals for this B2B Quote-to-Contract workflow?
- Complete end-to-end automation?
- Reduce manual intervention?
- Improve customer experience?
- Accelerate sales cycles?

**User Response**:
> "Complete end-to-end automation (Quote → Contract → Order Fulfillment -> Invoice → Activation)"

**Interpretation**:
- **Goal**: Full automation of the entire B2B sales cycle
- **Scope**: From initial quote generation to service activation
- **Key Stages**: Quote, Contract, Order Fulfillment, Invoice, Activation
- **Implication**: Minimize manual touchpoints, automate state transitions

---

### Question 2: Critical Integrations
**Question**: Which integrations are critical for your timeline?
- ZOHO CRM sync?
- Email automation (Resend)?
- Payment processing (NetCash)?
- Digital signatures (ZOHO Sign)?
- KYC/FICA compliance (Didit.me)?

**User Response**:
> "ZOHO CRM sync, Email automation (Resend), NetCash payment processing, Digital signatures (ZOHO Sign)"

**Interpretation**:
- **ZOHO CRM**: Bidirectional sync for deals, contacts, accounts
- **Resend**: Branded transactional emails (quote sent, contract ready, payment received, etc.)
- **NetCash**: Multi-method payment processing (20+ payment methods)
- **ZOHO Sign**: ECT Act 2002 compliant digital signatures for contracts
- **Note**: KYC/FICA (Didit.me) integration already specified in source documents (Version 3.0)

---

### Question 3: Implementation Timeline
**Question**: What is your implementation timeline?
- Fast track (1-2 weeks, dedicated developer)?
- Standard (3-4 weeks, shared resources)?
- Phased rollout (6-8 weeks, multiple features)?

**User Response**:
> "Fast track (1-2 weeks, dedicated developer)"

**Interpretation**:
- **Duration**: 2 weeks maximum
- **Team Size**: 1 dedicated developer
- **Expectation**: Aggressive timeline, prioritize core functionality
- **Approach**: Focus on MVP features, defer nice-to-haves

---

### Question 4: PDF Templates
**Question**: Do you have existing PDF templates or branding guidelines for quotes/contracts?
- Ready to use?
- Needs minor adjustments?
- Start from scratch?

**User Response**:
> "Needs minor adjustments"

**Follow-up Clarification**:
> **Template Reference**: `docs/products/contract_docs/Circle Tel SA Head Office - SOS Q6330.pdf`

**Template Analysis**:
- **Current Format**: Fixed Mobile Telecoms "Schedule of Service" (SOS) document
- **Current Branding**: Fixed Mobile Telecoms (orange logo, provider details)
- **Current Flow**: Provider → Customer (Fixed Mobile Telecoms → Circle Tel SA)

**Required Adjustments**:

1. **Rebrand to CircleTel**:
   - Replace Fixed Mobile Telecoms logo with CircleTel logo
   - Update company details (address, contact, VAT, registration number)
   - Change color scheme from orange (#FF6600) to CircleTel orange (#F5831F)

2. **Reverse Party Roles**:
   - **From**: CircleTel (service provider)
   - **To**: Customer (business/SME)
   - Maintain same layout structure but flip sender/recipient

3. **Document Type Variants** (3 variants from same base template):
   - **Quote (BQ-YYYY-NNN)**: "BUSINESS QUOTE" header, pricing details, "Valid for 30 days"
   - **Contract (CT-YYYY-NNN)**: "SERVICE CONTRACT" header, terms, signature blocks, ZOHO Sign fields
   - **Invoice (INV-YYYY-NNN)**: "TAX INVOICE" header, payment instructions, banking details

4. **Add KYC Compliance Badge**:
   - Position: Top-right corner near document number
   - Content: "✓ KYC VERIFIED" badge (green checkmark icon)
   - Conditional: Only show when KYC status = 'approved'
   - Design: 24px height, green (#10B981) background, white text

5. **Digital Signature Compatibility**:
   - Signature blocks at bottom (already present)
   - Ensure fields are ZOHO Sign compatible:
     - Name field (text input)
     - Date field (date picker)
     - Signature field (signature pad)
     - Witness signature field (optional)

6. **Service Line Item Table** (keep existing structure):
   - Description, Recurring Price, Once-Off Price, Qty
   - VAT calculations (15%)
   - Totals summary

7. **Footer Updates**:
   - Quote: "This quote is valid for 30 days. Pricing subject to change."
   - Contract: "Binding agreement subject to Master Service Agreement terms."
   - Invoice: "Payment due within 30 days. Banking details below."

**Template Reusability**:
- Leverage existing `lib/utils/pdf/quote-generator.ts` (421 lines) for base PDF generation
- Extend with contract and invoice variants
- Use same jsPDF + autoTable approach
- Add KYC badge rendering logic

---

## Additional Clarifications (Post-Verification)

### Clarification 5: Team Size & Timeline (2025-11-01)
**Question**: Do you have 3-4 developers available, or just 1 dedicated developer?

**User Response**:
> "team size 1 dedicated developer"

**Interpretation**:
- **Team Composition**: 1 full-stack developer (not 3-4 developers)
- **Timeline Commitment**: 2 weeks is fine (user confirmed)
- **Velocity Implication**: 61 story points ÷ 1 developer ÷ 2 weeks = ~30 points/week
- **Reality Check**: This requires aggressive execution (standard velocity ~15-20 points/week)

**Adjusted Expectations**:
- Developer must work full-time on this feature (no context switching)
- Prioritize core automation over edge cases
- Leverage existing code aggressively (reuse quote-generator, NetCash service, etc.)
- Defer advanced features (e.g., auto-retry webhooks, advanced analytics)

---

### Clarification 6: Timeline Adjustment (2025-11-01)
**Question**: If 1 developer, are you okay with 3-4 weeks instead of 2 weeks?

**User Response**:
> "2-weeks is fine"

**Interpretation**:
- **Timeline**: 2 weeks FIRM (10 business days)
- **Expectation**: High-intensity sprint
- **Approach**:
  - Work in parallel where possible (database + API stubs, frontend mockups)
  - Test iteratively (don't wait for full system integration)
  - Use existing CircleTel patterns (RBAC, Supabase RLS, shadcn/ui)
  - Focus on happy path first, edge cases in sprint 2

---

### Clarification 7: PDF Template Location (2025-11-01)
**Question**: Which existing templates need adjustment, and what changes are needed?

**User Response**:
> "see example PDF template docs\products\contract_docs\Circle Tel SA Head Office - SOS Q6330.pdf"

**Template Details**:
- **File Path**: `C:\Projects\circletel-nextjs\docs\products\contract_docs\Circle Tel SA Head Office - SOS Q6330.pdf`
- **Document Type**: Schedule of Service (SOS)
- **Provider**: Fixed Mobile Telecoms (Pty) Ltd
- **Customer**: Circle Tel SA (Pty) Ltd
- **Format**: 2-page PDF with branding, pricing tables, signature blocks

**Analysis Complete**: See "Required Adjustments" in Question 4 above.

---

## Explicit Features (Derived from User Responses)

### Core Features (MUST HAVE - Sprint 1 & 2)

1. **Quote Generation**:
   - Branded PDF using adjusted CircleTel template
   - Auto-numbering (BQ-YYYY-NNN)
   - Recurring + Once-Off pricing with VAT
   - Email delivery via Resend
   - Store in Supabase

2. **KYC Verification**:
   - Didit.me integration (light flows for SME/Consumer)
   - 3-5 document upload (ID, CK1, Proof of Address)
   - AI extraction + liveness detection
   - Auto-approval for low-risk (<R500k)
   - KYC badge on PDFs when verified

3. **Contract Generation**:
   - Same template as quote, rebranded as "SERVICE CONTRACT"
   - ZOHO Sign integration for e-signatures
   - Trigger on KYC approval
   - Email notification with signature link

4. **Payment Processing**:
   - NetCash Pay Now integration (extend existing service)
   - 20+ payment methods (Card, EFT, Scan-to-Pay, etc.)
   - Payment status tracking
   - Webhook handling for payment confirmation

5. **Invoice Generation**:
   - Same template as quote/contract, rebranded as "TAX INVOICE"
   - Trigger on payment confirmation
   - Banking details in footer
   - Email delivery via Resend

6. **ZOHO CRM Sync**:
   - Bidirectional sync (Quote → Deal, Customer → Contact)
   - Status updates (quote accepted → contract signed → paid)
   - Custom field mapping

7. **Order Fulfillment**:
   - Create order record on payment confirmation
   - RICA submission (auto-populated from KYC data)
   - Activation workflow trigger

### Enhanced Features (NICE TO HAVE - If time permits)

1. **Admin Quote Approval Queue**:
   - High-risk quotes (>R500k) require manual approval
   - Notification system for pending approvals
   - RBAC permissions (Finance Manager, Sales Manager)

2. **Webhook Retry Logic**:
   - Auto-retry failed webhooks (ZOHO, NetCash, Didit)
   - Exponential backoff (1s, 2s, 4s, 8s, 16s)
   - Dead letter queue for manual review

3. **RICA Paired Submission**:
   - Zero manual data entry (auto-populated from Didit)
   - ICASA tracking ID storage
   - Status monitoring

### Out of Scope (Future Enhancements)

1. Customer self-service quote editing
2. Multi-currency support
3. Advanced analytics dashboard
4. SLA tracking for quote→activation cycle
5. Contract amendment workflows
6. Recurring billing automation (separate feature)

---

## Constraints

### Technical Constraints
- **Database**: Supabase PostgreSQL with RLS policies
- **Framework**: Next.js 15 App Router (strict TypeScript)
- **UI**: shadcn/ui components + Tailwind CSS
- **PDF**: jsPDF + autoTable (existing pattern)
- **Auth**: Supabase Auth with RBAC

### Business Constraints
- **Timeline**: 2 weeks (10 business days)
- **Team**: 1 dedicated full-stack developer
- **Budget**: Use existing integrations (no new paid services)
- **Compliance**: FICA, RICA, POPIA, ECT Act 2002

### Integration Constraints
- **Didit.me**: Free tier (unlimited basic verifications)
- **ZOHO**: Existing OAuth setup, API rate limits (100 calls/min)
- **NetCash**: Existing Pay Now account, webhook verification
- **Resend**: Existing account, 100 emails/day limit (development)

---

## Success Criteria

### Business Metrics
- **Quote-to-Contract Time**: <3 days (from 21 days)
- **KYC Completion Rate**: >85% (3-minute SME flow)
- **Payment Success Rate**: >95% (NetCash reliability)
- **Manual Intervention**: <10% of orders (only high-risk approvals)

### Technical Metrics
- **PDF Generation**: <2 seconds per document
- **KYC Session Creation**: <500ms API response
- **ZOHO Sync**: <3 seconds bidirectional sync
- **Email Delivery**: <10 seconds via Resend
- **Payment Redirect**: <1 second to NetCash portal

### User Experience Metrics
- **Admin Approval Queue**: <5 clicks to approve/reject
- **Customer KYC Flow**: <3 minutes for 80% of SMEs
- **Contract Signature**: <2 minutes via ZOHO Sign
- **Payment Completion**: <5 minutes (multi-method selection)

---

## Reusability Opportunities

### Existing Code to Leverage

1. **Quote PDF Generator** (`lib/utils/pdf/quote-generator.ts` - 421 lines):
   - Reuse jsPDF + autoTable setup
   - Extend with contract/invoice variants
   - Add KYC badge rendering

2. **NetCash Service** (`lib/payments/netcash-service.ts`):
   - Existing payment initiation
   - Extend with webhook handling
   - Add invoice payment tracking

3. **Notification Framework** (`lib/notifications/`):
   - Existing Resend integration
   - Extend with new email templates (contract ready, payment received, etc.)

4. **RBAC System** (`lib/rbac/`):
   - Existing permission checking
   - Add new permissions (quotes:approve, contracts:view, invoices:generate)

5. **Supabase Client Patterns** (`lib/supabase/`):
   - Existing server/client setup
   - Use same RLS policy patterns

### New Components Required

1. **Didit KYC Client** (`lib/integrations/didit/client.ts`):
   - Session creation
   - Webhook handling
   - Data extraction parsing

2. **ZOHO Sign Service** (`lib/integrations/zoho-sign/service.ts`):
   - Document upload
   - Signer invitation
   - Signature webhook handling

3. **RICA Submission Service** (`lib/compliance/rica-service.ts`):
   - Paired submission logic
   - ICASA API integration
   - Status tracking

4. **Quote Workflow Orchestrator** (`lib/workflows/quote-to-contract.ts`):
   - State machine management
   - Event-driven transitions
   - Error handling

---

## Risk Mitigation

### High-Risk Items

1. **Timeline Pressure (1 developer, 2 weeks)**:
   - **Mitigation**: Aggressive code reuse, focus on happy path first
   - **Fallback**: Defer webhook retry logic and admin approval queue to Phase 2

2. **ZOHO Sign Integration Complexity**:
   - **Mitigation**: Use ZOHO's webhook-driven flow (async, non-blocking)
   - **Fallback**: Manual signature upload if API integration fails

3. **Didit KYC Free Tier Limitations**:
   - **Mitigation**: Confirm unlimited basic verifications with Didit support
   - **Fallback**: Manual KYC review for first 50 customers

4. **RICA System Availability**:
   - **Mitigation**: Store submissions locally, retry on ICASA API downtime
   - **Fallback**: Manual RICA submission with auto-populated forms

### Medium-Risk Items

1. **PDF Template Adjustments**:
   - **Mitigation**: Start with quote variant first, validate branding with stakeholder
   - **Fallback**: Use simple table-based layout if complex rebranding fails

2. **Payment Webhook Reliability**:
   - **Mitigation**: Implement idempotency keys, signature verification
   - **Fallback**: Manual payment reconciliation dashboard

---

## Validation & Acceptance

### Definition of Done (Per Feature)

- [ ] TypeScript type-safe (no `any`)
- [ ] RLS policies enforced in Supabase
- [ ] RBAC permissions checked in API routes
- [ ] Unit tests written (2-8 per task group)
- [ ] E2E test scenario passes (Playwright)
- [ ] Documentation updated (API docs, README)
- [ ] Stakeholder demo completed

### Final Acceptance Criteria

- [ ] End-to-end flow works: Quote → KYC → Contract → Payment → Invoice → Fulfillment
- [ ] All 4 integrations functional (ZOHO, Resend, NetCash, ZOHO Sign)
- [ ] PDF templates adjusted with CircleTel branding
- [ ] KYC badge appears on verified quotes/contracts
- [ ] Admin approval queue accessible to Finance/Sales Managers
- [ ] Payment status updates trigger downstream actions
- [ ] RICA submission auto-populates from KYC data
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Deployed to staging environment (Vercel preview)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-01
**Status**: ✅ Complete
