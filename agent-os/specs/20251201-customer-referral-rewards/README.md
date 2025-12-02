# Customer Referral & Rewards System

**Spec ID**: `20251201-customer-referral-rewards`
**Created**: 2025-12-01
**Status**: Planning
**Priority**: High

## Overview

Implement a customer referral and rewards system where existing customers earn a free month of service by referring 2+ new customers who successfully sign up, activate, and use CircleTel connectivity services.

## Summary

- **Total Story Points**: 47
- **Estimated Duration**: 3-4 weeks
- **Risk Level**: Medium (fraud prevention, billing integration)
- **Dependencies**: Billing system, customer dashboard, admin portal

## Key Features

1. Unique referral code generation per customer
2. Referral tracking from signup through activation
3. Automated reward calculation and application
4. Free month credit on recurring billing (pro-rata supported)
5. Admin management interface for referral oversight
6. Fraud prevention and validation rules

## Quick Start

### For Developers

1. Read the full specification: `SPEC.md`
2. Review task breakdown: `TASKS.md`
3. Check progress tracking: `PROGRESS.md`
4. Understand architecture: `architecture.md`

### Key Files

- `SPEC.md` - Complete technical specification
- `TASKS.md` - Task groups and assignments
- `PROGRESS.md` - Progress tracking
- `architecture.md` - System architecture and diagrams

### Database Changes

- New table: `customer_referrals`
- New table: `referral_rewards`
- Migration: `20251201_create_referral_system.sql`

### API Endpoints

**Customer Endpoints**:
- `POST /api/customer/referrals` - Generate referral code
- `GET /api/customer/referrals` - List referrals
- `GET /api/customer/referral-balance` - Check reward balance

**Admin Endpoints**:
- `POST /api/admin/customers/[id]/referrals/grant` - Manually grant reward
- `POST /api/admin/customers/[id]/referrals/revoke` - Revoke reward
- `GET /api/admin/customers/[id]/referrals` - View customer referrals

### Core Services

- `lib/rewards/referral-service.ts` - Referral tracking logic
- `lib/rewards/free-month-calculator.ts` - Reward calculation
- Integration with `lib/billing/compliant-billing-service.ts`

## Story Points Breakdown

| Group | Tasks | Points |
|-------|-------|--------|
| Database Engineer | Schema, migrations, RLS | 5 |
| Backend Engineer | Services, business logic | 14 |
| API Engineer | Endpoints, validation | 10 |
| Frontend Engineer | UI components, dashboard | 10 |
| Testing Engineer | Tests, fraud prevention | 8 |
| **TOTAL** | - | **47** |

## Success Criteria

- [ ] Customers can generate unique referral codes
- [ ] System tracks referrals from signup to activation
- [ ] Rewards automatically applied after 2 successful referrals
- [ ] Free month correctly calculated on recurring billing cycle
- [ ] Admin can view, grant, and revoke referral rewards
- [ ] Fraud prevention rules prevent abuse
- [ ] All tests passing (unit, integration, E2E)

## Next Steps

1. Review and approve specification
2. Assign tasks to engineers
3. Create database migration
4. Implement core services
5. Build API endpoints
6. Develop UI components
7. Write comprehensive tests
8. Deploy to staging for testing
9. Production deployment

---

**Maintained by**: Development Team + Claude Code
**Last Updated**: 2025-12-01
