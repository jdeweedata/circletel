# Rubric: Contract / Quote

**Target**: B2B contracts, service agreements, formal quotes
**Critical Score**: 9/10 minimum (higher bar for legal documents)
**Max Passes**: 3

## Criteria

| Criterion | Weight | Scoring Guide |
|-----------|--------|---------------|
| **Legal Accuracy** | 30% | 10=All terms correct; 5=Minor ambiguities; 1=Legal errors |
| **Completeness** | 25% | 10=All sections present; 5=Missing optional; 1=Missing required |
| **Clarity** | 20% | 10=Unambiguous language; 5=Some jargon; 1=Confusing terms |
| **Professionalism** | 15% | 10=Polished, branded; 5=Basic; 1=Unprofessional |
| **Customer Focus** | 10% | 10=Clear value prop; 5=Technical focus; 1=One-sided |

## Required Sections

Every contract MUST include:

### Header
- [ ] CircleTel logo and details
- [ ] Contract/Quote number (format: CT-YYYY-NNN)
- [ ] Date issued
- [ ] Valid until date

### Parties
- [ ] CircleTel (Pty) Ltd details
- [ ] Customer business name
- [ ] Customer registration number (if B2B)
- [ ] Contact person and details

### Services
- [ ] Service description
- [ ] Package name and specifications
- [ ] Coverage area / installation address
- [ ] Service level agreement (SLA)

### Commercial
- [ ] Monthly fee (ex VAT and incl VAT)
- [ ] Setup/installation fee
- [ ] Payment terms
- [ ] Contract duration
- [ ] Renewal terms

### Legal
- [ ] Terms and conditions reference
- [ ] Cancellation policy
- [ ] Dispute resolution
- [ ] Signature blocks

## Evaluation Prompt

```
Evaluate this contract/quote against the rubric:

[CONTRACT CONTENT]

Score each criterion 1-10 with brief justification:
1. Legal Accuracy (30%):
2. Completeness (25%):
3. Clarity (20%):
4. Professionalism (15%):
5. Customer Focus (10%):

Calculate weighted total.
List specific improvement suggestions.
Flag any legal concerns.
```

## Quality Levels

| Score | Level | Action |
|-------|-------|--------|
| 9.5-10 | Excellent | Ready for signature |
| 9-9.4 | Good | Minor polish, then send |
| 8-8.9 | Acceptable | One more pass required |
| <8 | Needs Work | Do not send, major revision needed |

## Example Issues to Flag

### Critical (Block Sending)
- Wrong company name or registration number
- Incorrect pricing or calculations
- Missing signature blocks
- Conflicting terms

### Major (Require Fix)
- Missing SLA details
- Vague cancellation terms
- Unprofessional formatting
- Missing payment terms

### Minor (Note for Improvement)
- Inconsistent formatting
- Verbose language
- Missing nice-to-have sections

## CircleTel-Specific Rules

1. **Contract numbering**: CT-YYYY-NNN (e.g., CT-2026-042)
2. **VAT calculation**: Always show ex VAT and incl VAT (15%)
3. **Use admin_notes**: Internal notes go in admin_notes column
4. **ZOHO integration**: Contracts sync to ZOHO CRM
5. **KYC requirement**: B2B contracts require KYC completion

## B2B Quote Flow

```
QUOTE GENERATED
     │
     ▼
QUALITY GATE (this rubric)
     │
     ├─── Score >= 9 ──► SEND TO CUSTOMER
     │
     └─── Score < 9 ──► REFINE ──► RE-EVALUATE
```

## Convergence Check

Stop refining when:
- Score >= 9/10 (higher bar for contracts)
- 3 passes completed
- Legal review completed (for new templates)
