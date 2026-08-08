# Idea Review: "AI thing for HR teams" (CV screening or onboarding, SMBs 20–200)

**Quick Verdict: Skip it — as currently framed.**

**Why**: You've picked a customer segment and a technology, but not a problem — and "maybe screening, maybe onboarding" is the tell. Those are two different products, sold to different buyers, at different moments, with different economics; nobody who has actually watched an HR person suffer is undecided between them. On top of that, both wedges are the single most crowded category in AI right now, the incumbents (BambooHR, Rippling, Workable, Greenhouse, Ashby) bundle AI screening and onboarding workflows into software these companies already pay for, and a 20–200 person company hires too few people for screening automation to be worth real money. Come back when you can name the person, the week, and the specific hour they lose.

---

**Similar Existing Products**:

- **BambooHR** — the default HRIS for exactly the 20–200 headcount band; onboarding packets, e-signature, task checklists, and offer letters are already included at roughly $8–12/employee/month. Your onboarding idea is a tab inside their product.
- **Workable / Greenhouse / Ashby (and Recruitee, JazzHR)** — SMB-priced ATSs that ship AI CV scoring, summarisation, and candidate matching bundled at no extra charge. Workable in particular has been aggressive at pushing AI screening down-market at ~$150–400/month all-in. Your screening idea is a checkbox inside their product.
- **Rippling / Gusto / Deel** — payroll + HRIS with onboarding workflows, device provisioning, document collection, and compliance built in. They own the billing relationship and the employee record, which means near-zero-cost distribution for any feature you invent.
- **Paradox (Olivia), Sapia.ai, HireVue** — conversational/automated screening, well funded, and they already took the one segment where screening volume genuinely hurts: high-volume hourly hiring (retail, QSR, logistics, healthcare staffing). Note that this is *not* the 20–200 white-collar SMB.
- **Metaview, BrightHire, Pillar, Micro1/Mercor/Apriora** — AI interview notes, scorecards, and AI interviewers. Heavily VC-funded, moving fast, and several are already down-market.
- **ChatGPT / Claude in a browser tab** — the real competitor nobody names. An HR manager at a 60-person company pastes 12 CVs and a job spec into a free chat window and gets a ranked shortlist in 90 seconds. It's good enough, it's free, and it requires no procurement, no vendor review, and no new login.

---

**What Would Make This Stronger**:

- **Change the buyer, not the feature.** The pain you're imagining is real — it just doesn't live at a 60-person company that hires 12 people a year. It lives at *recruitment agencies, staffing firms, RPOs, and fractional-HR/outsourced-HR consultancies* who process the hiring for dozens of those SMBs. They have the volume, the budget, the willingness to pay per placement, and they're also a distribution channel into the SMBs you were originally chasing. Same product, 20× the pain, one-to-many GTM.
- **Sell liability, not time saved.** Time-saving in HR is a vitamin — the work gets absorbed into someone's evening and nobody unlocks budget for it. Fines, audits, and lawsuits are painkillers. Right-to-work / ID verification, licence and credential checks that expire, mandatory policy acknowledgements with an audit trail, records retention, and the new AI-hiring-disclosure obligations themselves are all budget-unlocking. Ironically, "help SMBs stay compliant when they use AI in hiring" is a better business than "sell SMBs AI hiring."
- **Build inside the surface they already live in.** Do not build a new destination with a new login — HR at a 60-person company will not adopt a sixth tool. Ship as a Slack/Teams app, a Gmail/Outlook add-in, or a marketplace app inside BambooHR / Workable / Rippling. Marketplace listings are the only cheap distribution available to a solo builder in this category.
- **Pick a vertical where the SMB behaves like an enterprise.** Multi-site clinics and dental groups, care homes, franchised restaurants, security firms, trades, and logistics all sit in the 20–200 band but hire at high volume with credentialing requirements and heavy churn. That's where CV screening actually has ROI inside your stated segment.
- **Do fifteen discovery calls before writing a line of code.** Ask only backward-looking questions: "Walk me through the last role you filled. How many applications? How long did the shortlist take? What tool did you use? What did you pay for it? What did you do that you hated?" If four or more people describe the *same* hour of the *same* week, you have a product. If you get fifteen different answers, you have a category, which is not the same thing.

---

## The economics, since this is what actually kills it

Run the arithmetic on your stated segment before anything else:

| Input | Realistic value for 20–200 headcount |
|---|---|
| Roles filled per year | 5–25 |
| Applications per role | 50–250 |
| CVs screened per year | ~1,000–4,000 |
| Time saved at ~2 min/CV | 30–130 hours/year |
| Value of that time | roughly $1,500–5,000/year |
| What they'll actually pay | $500–1,500/year — and only if it's *not* already free in their ATS |

At a ~$1,000 annual contract value, $10k MRR needs 120+ paying SMBs. SMB software churns at 3–5% per month, HR software is bought by a one-to-two-person HR function with no procurement process and no budget line, and self-serve conversion in HR tooling is poor because the buyer is risk-averse about anything touching hiring decisions. That's a treadmill, not a business — and it's the same treadmill whether the feature is screening or onboarding.

## Red flags, named explicitly

- **This is a feature, not a product.** AI CV scoring is already a bundled line item in every ATS that serves this segment.
- **The market leader is free and entrenched.** Both the incumbent bundles and the raw chat window cost the customer nothing incremental.
- **This is a vitamin, not a painkiller.** Nobody at a 60-person company has ever been fired for screening CVs slowly.
- **This requires users to change behaviour.** You'd be asking HR to leave the HRIS/ATS where the candidate record already lives. They won't.
- **You're inheriting regulated-decision risk for free.** AI used in hiring is treated as high-risk or specially regulated in several jurisdictions — the EU AI Act's employment provisions, New York City's bias-audit and candidate-notice rules, and recent Illinois and Colorado statutes are the usual examples. I can't verify current effective dates or the status of proposed delays without web access, so confirm before relying on any of it. The point stands regardless: a solo builder selling screening scores may inherit bias-audit, notice, documentation, and record-keeping obligations that a solo builder cannot cheaply discharge. Onboarding carries far less of this exposure.
- **The undecided scope is itself the biggest flag.** "Maybe screening, maybe onboarding" means the idea came from noticing that AI is good at text, not from watching someone struggle.

## If you want to keep going, the cheapest next test

Spend one week, no code. Find five recruitment agencies or fractional-HR consultancies. Offer to do their screening or onboarding admin by hand, for money, using AI privately behind the scenes. If nobody pays for the concierge version, no amount of product will fix that. If two or three do, you now know exactly which of the two ideas to build — and you'll have the first customers already paying before you open an editor.

**Bottom line**: skip the idea as stated, keep the market. There's a real business adjacent to this, but it's sold to the people doing HR *for* small companies rather than to the small companies themselves, and it's sold on risk rather than on time.
