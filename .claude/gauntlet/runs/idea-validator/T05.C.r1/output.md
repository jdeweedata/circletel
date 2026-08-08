**Quick Verdict: Skip it as described — Maybe for a narrower version you haven't described yet**

**Why**: "AI thing for HR teams, maybe CV screening, maybe onboarding" isn't an idea, it's a category you noticed. Both specific versions you named are the worst two picks in that category for a solo builder: AI CV screening is now a free bundled feature inside every ATS and HRIS (Workable, Greenhouse, Ashby, Manatal, Recruitee, BambooHR all ship it), and onboarding at 20-200 headcount is checklists plus document collection plus account provisioning — which is exactly the wedge Rippling, Deel, Gusto, HiBob and Personio use to sell their core payroll/HRIS product. On top of that you picked the segment with the least screening pain: a 60-person company hires maybe 15-25 people a year, so "reading CVs" costs their one HR generalist a few hours a month. That is a vitamin, not a painkiller, and it is a vitamin the incumbent already gives away.

There's a second problem specific to this space. Automated hiring decisions are now regulated: NYC Local Law 144 requires an annual independent bias audit and public results for automated employment decision tools; Illinois' amended Human Rights Act (HB 3773) took effect Jan 2026; Colorado's AI Act covers consequential employment decisions; and recruitment/employee-selection sits in Annex III of the EU AI Act as high-risk, with the heavy obligations (risk management, logging, human oversight, documentation, conformity assessment) landing across 2026-27 — the exact window you'd be selling into, delay proposals notwithstanding. This is not a blocker you can ignore, because the first serious question a 200-person company's lawyer asks is "who indemnifies us if this rejects candidates in a way we can't defend?" A solo builder is a bad answer to that question. Anyone telling you to ship an AI CV ranker and figure out compliance later is telling you to build the one AI product with real legal downside.

The honest read on feasibility: an MVP is easy — parse PDFs, embed a rubric, score against a job spec — two to three weeks, comfortably. **That ease is the trap, not the opportunity.** Hundreds of people built exactly this in 2024-25 and the survivors are the ones that already owned the candidate pipeline. Building is not your constraint; distribution into a low-ACV, sales-led, bundle-dominated SMB market is.

**Similar Existing Products**:

*CV screening / AI in the funnel:*
- **Workable, Greenhouse, Ashby, Lever, Recruitee, Teamtailor, JazzHR, Breezy, Manatal, Pinpoint**: full ATS from roughly $100-500/mo — all of them now ship AI CV summarisation, ranking or matching as an included feature. Your product is a checkbox on their pricing page.
- **Paradox (Olivia)**: conversational AI that screens and schedules high-volume hourly hiring; heavily funded, owns the McDonald's/Chipotle-scale end of the market. Key differentiator: it handles volume nobody wants to touch, not the 15-hires-a-year office.
- **HireVue / Sapia.ai / Harver**: assessment-and-screening platforms with in-house I/O psychologists and published bias audits. Their differentiator is defensibility — the audit trail and validation studies you cannot produce alone.
- **SeekOut / hireEZ / Fetcher / Covey**: AI sourcing and outbound rather than inbound filtering — they win because they *create* candidates instead of sorting them.
- **Metaview**: AI interview notes → structured scorecards. Closest thing to a genuinely defensible narrow wedge in this space, and it's already taken and funded.

*Onboarding:*
- **Rippling / Deel / Gusto**: onboarding is their loss-leader — offer letter, e-sign, payroll, device and app provisioning, all free with the payroll you're already buying. You cannot beat "included".
- **BambooHR / HiBob / Personio**: SMB HRIS where onboarding workflows are a standard module; Personio in particular owns the 20-200 European segment.
- **Enboarder / Talmundo / Sapling (Kallidus) / WorkBright**: standalone onboarding-experience vendors — note that this category has consolidated rather than grown, which tells you what standalone onboarding is worth.
- **Process Street / Trainual / Notion templates**: what small companies actually use, at $0-50/mo, and it's good enough.

**What Would Make This Stronger**:

- **Kill the 20-200 white-collar segment and go where the volume is.** Screening pain scales with applicants-per-hire, not headcount. A 40-person accounting firm gets 30 CVs a role. A 3-branch clinic group, care home operator, security firm, restaurant group, call centre or logistics depot gets 400 for a role paying minimum wage, and they're drowning. Same company size, ten times the pain, and Paradox is too expensive and too enterprise for them. That's a real gap.

- **Sell the regulated paperwork, not the intelligence.** AI screening is discretionary; statutory reporting is not. If you're outside the US/EU this is even sharper — e.g. in South Africa, employers over 50 staff must file annual Employment Equity (EEA2/EEA4) returns against sectoral targets, and B-BBEE scorecards depend on getting that data right. That is a deadline with a penalty attached, which means a budget line. Global HR vendors handle it badly or not at all. "AI that ranks CVs" is a nice-to-have; "the thing that stops us failing our EE submission" is a purchase order. Substitute your own jurisdiction's equivalent.

- **Flip the buyer to someone whose revenue depends on hiring.** Recruitment and staffing agencies pay for tools because a faster placement is directly more money, and they screen hundreds of CVs a week. Downside: Bullhorn, Loxo, Manatal and hireEZ are all there already, so you'd need a real wedge — but at least the willingness-to-pay is proven, unlike the 60-person company whose HR person is also doing payroll and office snacks.

- **Move downstream of the decision, not upstream.** The legally hazardous, incumbent-owned part is "who should we reject". The unowned part is what happens after: structured interview debriefs, consistent scorecards, reference checks, and a defensible record of why each decision was made. Lower legal risk (you're documenting human decisions, not automating them), and the new AI-hiring regulations actually *create* the demand rather than obstruct it. Metaview is there, but the SMB and non-US end is thin.

- **Meet them where they already work.** Most SMB hiring outside big US/EU tech runs on WhatsApp, email and a spreadsheet, not an ATS. A WhatsApp-first screening and scheduling flow for a company with no ATS at all is a far better wedge than a better ranking algorithm for a company that already has one — because you're replacing a spreadsheet, not displacing a paid incumbent.

**Before you write any code, run this kill test (5 days, zero build):**

1. Talk to 15 HR leads or owner-operators at 30-200 person companies in *one* vertical. Don't pitch. Ask two questions: "walk me through the last hire you made, start to finish" and "what part of that did you personally hate?" Write down their exact words.
2. Count how many say screening or onboarding unprompted. If it's under 5 of 15, both your ideas are dead and you've saved a month.
3. Ask the ones who do complain: "what does your ATS/HRIS already do here?" If 8 in 10 say "it kind of does that already", you're building a feature.
4. Then try to pre-sell: "if I build this, will you pay $200/month starting next month?" Get card details or a signed LOI from **three** people. Not "sounds great" — three payments.

No three payments in three weeks, no build. If you get them, you'll also have been handed the exact narrow product to build, which solves the "haven't locked it down" problem for free.

**The real red flag**: you said "maybe CV screening, maybe onboarding, haven't locked it down". That ordering means you started from "AI + HR is a market" and are now reverse-engineering a problem to attach to it. Ideas that work almost always run the other way — you watch a specific person suffer through a specific task and can't stop thinking about it. Right now you have a category, a segment and a technology, but no victim. Go find the victim first; the product picks itself after that.
