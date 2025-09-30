# Epic: Zoho Billing Integration

**Epic ID**: ZBI-001
**Created**: September 27, 2025
**Status**: Planning
**Priority**: High
**Sprint Target**: Sprint 42 (October 2025)

## Epic Overview

### Business Context
CircleTel currently has CRM, Mail, Calendar, Desk, and Projects integration with Zoho via MCP server. Adding Billing/Books integration is critical for MVP launch to enable:
- Automated invoice generation for customer orders
- Real-time billing status tracking
- Integrated payment processing workflows
- Customer billing history and account management

### Success Metrics
- **Business Impact**: Reduce manual billing overhead by 80%
- **Customer Experience**: Real-time billing status in customer portal
- **Revenue Operations**: Automated invoice generation within 24 hours of order
- **Financial Tracking**: Integrated revenue reporting in admin dashboard

### Market Context
South African B2B customers expect:
- Professional invoicing with VAT compliance
- Multiple payment method support
- Transparent billing history
- Integration with accounting systems

## Technical Context

### Current State
```typescript
// Existing Zoho integration in lib/types/zoho.ts
export type ZohoAction =
  | 'create_lead'
  | 'convert_lead'
  | 'create_contact'
  | 'create_deal'
  | 'send_email'
  | 'create_event'
  | 'create_ticket'
  | 'create_project'
  | 'create_task'
  | 'get_records'
  | 'update_record'
  | 'search_records';
```

### Target State
```typescript
// Enhanced with billing actions
export type ZohoAction =
  | ... // existing actions
  | 'create_invoice'
  | 'create_estimate'
  | 'get_invoice_status'
  | 'update_payment_status'
  | 'get_billing_history'
  | 'create_customer_billing'
  | 'get_payment_methods';
```

### Architecture Integration
- **MCP Server**: Extend existing CircleTel Zoho MCP server
- **Frontend**: New billing components in `/components/billing/`
- **Admin Dashboard**: Billing management section
- **Customer Portal**: Billing history and payment status
- **API Routes**: Billing webhooks in `/app/api/billing/`

## Epic Scope

### In Scope ✅
1. **Invoice Management**
   - Create invoices from completed orders
   - Track invoice status (draft, sent, paid, overdue)
   - Invoice PDF generation and delivery

2. **Customer Billing Portal**
   - View billing history
   - Download invoices
   - Payment status tracking

3. **Admin Billing Dashboard**
   - Invoice management interface
   - Payment tracking and reconciliation
   - Billing reports and analytics

4. **Payment Integration**
   - Payment status updates from Zoho
   - Webhook handling for payment events
   - Integration with South African payment providers

### Out of Scope ❌
- Payment processing (handled by existing providers)
- Tax calculation (Zoho Books handles VAT)
- Multi-currency support (ZAR only for MVP)
- Advanced financial reporting (future epic)

## User Journeys

### Customer Journey: View Billing History
```
Customer logs in → Billing section → View invoices → Download PDF → Check payment status
```

### Admin Journey: Invoice Management
```
Order completed → Auto-generate invoice → Review/approve → Send to customer → Track payment
```

### Financial Journey: Payment Processing
```
Payment received → Webhook notification → Update status → Sync with Zoho → Update dashboard
```

## Dependencies

### External Dependencies
- **Zoho Books API**: Access to billing endpoints
- **MCP Server Update**: Extend CircleTel Zoho MCP with billing actions
- **Payment Provider**: Webhook endpoints for payment status

### Internal Dependencies
- **Authentication**: Customer login for billing portal
- **Order System**: Completed orders to generate invoices
- **Admin Dashboard**: Framework for billing management

## Risk Assessment

### High Risk 🔴
- **MCP Server Limitation**: Zoho MCP might not support Books/Billing
  - *Mitigation*: Fallback to direct Zoho Books API integration

### Medium Risk 🟡
- **Payment Webhook Reliability**: External payment providers may have delays
  - *Mitigation*: Implement retry logic and manual reconciliation

### Low Risk 🟢
- **VAT Compliance**: Zoho Books handles South African VAT
- **PDF Generation**: Zoho Books provides invoice PDFs

## Story Breakdown Preview

### Epic Stories (Estimated)
1. **ZBI-001-01**: Extend Zoho MCP with billing actions (3 days)
2. **ZBI-001-02**: Create billing TypeScript types and hooks (1 day)
3. **ZBI-001-03**: Build admin invoice management interface (2 days)
4. **ZBI-001-04**: Implement customer billing portal (2 days)
5. **ZBI-001-05**: Set up payment status webhooks (1 day)
6. **ZBI-001-06**: Invoice auto-generation from orders (2 days)
7. **ZBI-001-07**: Billing dashboard analytics (1 day)

**Total Estimate**: 12 days (2 x 6-day sprints)

## Acceptance Criteria (Epic Level)

### Must Have (MVP)
- [ ] Customers can view their billing history
- [ ] Admins can generate and send invoices
- [ ] Payment status updates automatically
- [ ] Invoice PDFs are downloadable
- [ ] VAT compliance for South African customers

### Should Have (Post-MVP)
- [ ] Automated payment reminders
- [ ] Billing analytics dashboard
- [ ] Bulk invoice operations
- [ ] Payment plan management

### Could Have (Future)
- [ ] Multi-currency support
- [ ] Advanced financial reporting
- [ ] Integration with accounting software
- [ ] Automated dunning processes

## Quality Gates

### Technical Quality
- [ ] TypeScript strict mode compliance
- [ ] Integration tests with Zoho API
- [ ] Error handling for API failures
- [ ] Performance testing with large invoice volumes

### Business Quality
- [ ] Billing workflows tested with sample customers
- [ ] VAT calculations verified
- [ ] Payment status accuracy validated
- [ ] Admin user journey complete

### Security Quality
- [ ] Customer billing data protection
- [ ] PCI compliance considerations
- [ ] Webhook security validation
- [ ] Access control for billing data

## Next Steps

1. **Validate MCP Support**: Test if Zoho MCP server supports Books/Billing
2. **Create First Story**: Start with "Extend Zoho MCP with billing actions"
3. **Design Review**: UI/UX patterns for billing components
4. **Security Review**: Data protection and access control patterns

---

**Epic Owner**: Product Manager
**Technical Lead**: Full-Stack Developer
**Stakeholders**: Finance, Customer Success, DevOps
**Review Date**: Weekly during sprint