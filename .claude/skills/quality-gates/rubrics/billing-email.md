# Rubric: Billing Email

**Target**: Customer billing communications (invoices, payment reminders, receipts)
**Critical Score**: 8/10 minimum
**Max Passes**: 3

## Criteria

| Criterion | Weight | Scoring Guide |
|-----------|--------|---------------|
| **Clarity** | 25% | 10=Crystal clear amounts, dates, actions; 5=Some ambiguity; 1=Confusing |
| **Accuracy** | 25% | 10=100% accurate amounts, refs; 5=Minor errors; 1=Wrong amounts |
| **Tone** | 20% | 10=Professional + friendly; 5=Too formal/casual; 1=Rude or cold |
| **Action** | 15% | 10=Clear, prominent CTA; 5=Buried or vague CTA; 1=No CTA |
| **Compliance** | 15% | 10=All required info present; 5=Minor omissions; 1=Missing critical info |

## Required Elements

Every billing email MUST include:
- [ ] Customer name (personalized)
- [ ] Invoice/reference number
- [ ] Amount due (in Rands, formatted: R 799.00)
- [ ] Due date (specific: "28 February 2026")
- [ ] Payment method (NetCash Pay Now link)
- [ ] Contact info (WhatsApp: 082 487 3900)
- [ ] CircleTel branding

## Evaluation Prompt

```
Evaluate this billing email against the rubric:

[EMAIL CONTENT]

Score each criterion 1-10 with brief justification:
1. Clarity (25%):
2. Accuracy (25%):
3. Tone (20%):
4. Action (15%):
5. Compliance (15%):

Calculate weighted total.
List specific improvement suggestions.
```

## Quality Levels

| Score | Level | Action |
|-------|-------|--------|
| 9-10 | Excellent | Ship immediately |
| 8-8.9 | Good | Ship, note minor improvements |
| 6-7.9 | Needs Work | One more pass required |
| <6 | Poor | Restart with fresh approach |

## Example: High Quality (9.2/10)

```
Subject: Invoice #INV-2024-0042 - R 799.00 Due February 28

Dear John,

Your CircleTel invoice for February 2026 is ready.

Amount Due: R 799.00
Invoice #: INV-2024-0042
Due Date: 28 February 2026

[PAY NOW - SECURE NETCASH PAYMENT]

Questions about your bill? Reply to this email or WhatsApp us
at 082 487 3900 - we're happy to help!

Thank you for choosing CircleTel.

---
CircleTel (Pty) Ltd
www.circletel.co.za
```

## Example: Low Quality (4.8/10)

```
Subject: Pay your bill

Hi,

You owe us money. Pay it soon or we'll disconnect you.

Click here to pay.

Thanks
```

**Issues**: No personalization, no amount, threatening tone, vague CTA, no contact info

## CircleTel-Specific Rules

1. **Use verified sender**: `billing@notify.circletel.co.za`
2. **Include WhatsApp**: Always offer WhatsApp support (082 487 3900)
3. **Use NetCash Pay Now**: Link to payment page, not just bank details
4. **Format amounts**: Always `R 799.00` (space after R, two decimals)
5. **Date format**: `28 February 2026` (day month year, no ordinals)

## Convergence Check

Stop refining when:
- Score >= 8/10
- 3 passes completed
- Score improvement < 0.5 between passes
