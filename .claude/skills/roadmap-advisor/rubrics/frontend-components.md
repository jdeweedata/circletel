# Frontend Components Rubric

Evaluate frontend UI coverage and quality for gap analysis.

## Scoring Criteria

| Criterion | Weight | 10 | 5 | 1 |
|-----------|--------|----|----|---|
| **Feature Parity** | 30% | All backend features have UI | Core features only | Many features missing UI |
| **UX Quality** | 25% | Polished, consistent design system | Functional but inconsistent | Confusing, broken flows |
| **Accessibility** | 15% | WCAG AA compliant, keyboard nav | Basic a11y (labels, alt) | No a11y consideration |
| **Mobile Responsiveness** | 15% | Mobile-first, all breakpoints | Functional on mobile | Desktop only |
| **Loading States** | 15% | Skeleton loaders, optimistic UI | Basic spinners | Blank/frozen states |

## CircleTel Thresholds

| Score | Status | Action |
|-------|--------|--------|
| 8-10 | Excellent | No action needed |
| 6-7 | Good | Polish in next iteration |
| 4-5 | Needs Work | Schedule UX improvements |
| 1-3 | Critical | Blocking user experience |

## Portal-Specific Expectations

### Admin Portal (`/admin/*`)
- Full CRUD for all managed entities
- Data tables with search, filter, pagination
- Form validation with clear error messages
- Bulk actions where applicable
- Expected score: 7+ (functional focus)

### Customer Portal (`/dashboard/*`)
- Self-service for 80%+ of common tasks
- Clear service status and usage info
- Payment and billing management
- Support ticket creation
- Expected score: 8+ (customer-facing)

### Partner Portal (`/partners/*`)
- Compliance document upload
- Quote and lead management
- Commission visibility
- Customer management
- Expected score: 7+ (B2B functional)

### Public Pages (`/`, `/packages`, `/checkout`)
- Conversion-optimized flows
- Fast load times (<3s)
- Mobile-first design
- Clear CTAs
- Expected score: 9+ (revenue-critical)

## Component Patterns to Check

### Required Patterns
- [ ] Uses design system colors (`circleTel-orange`, `ui-*` tokens)
- [ ] Uses typography classes (`page-title`, `section-heading`, etc.)
- [ ] Implements loading states (skeleton or spinner)
- [ ] Handles error states gracefully
- [ ] Uses proper form validation

### Anti-Patterns
- Hardcoded colors instead of design tokens
- Inline styles instead of Tailwind classes
- Missing loading states (blank screens)
- Generic error messages
- No mobile breakpoints

## Evaluation Prompt

When scoring a UI area:

1. Check component existence: `components/[domain]/`
2. Verify page routes: `app/[area]/page.tsx`
3. Test responsive behavior (check for Tailwind breakpoints)
4. Check for loading/error states in components
5. Verify design system usage (grep for `circleTel-`, `ui-`)
6. Look for accessibility attributes (`aria-*`, `role`, `tabIndex`)

## Quick Assessment

```
Component Area: [Name]
Portal: [admin/customer/partner/public]

Feature Parity:      _/10 × 0.30 = _
UX Quality:          _/10 × 0.25 = _
Accessibility:       _/10 × 0.15 = _
Responsiveness:      _/10 × 0.15 = _
Loading States:      _/10 × 0.15 = _
─────────────────────────────────────
Total Score:         _/10
Status:              [Excellent/Good/Needs Work/Critical]
```
