# Email — Response to Ruth Butcher: Onboarding Process

**From:** Jeffrey De Wee <jeffrey.de.wee@circletel.co.za>
**To:** Ruth Butcher <RButcher@unjani.org>
**Cc:** Tamsyn Jacobs <tamsynb@circletel.co.za>; Darryl Langford <Darryl.Langford@unjani.org>
**Subject:** RE: Onboarding Process
**Date:** 2026-07-15

> Reply to Ruth Butcher's "Onboarding Process" email (15 July 2026, 08:35). Accepts all
> points of Unjani's proposed onboarding process except point 2's "Onboarding strictly
> post-installation," which conflicts with CircleTel's regulatory obligation (ICASA/ECA
> licence conditions, RICA, EUSSC Regulations, POPIA) to complete client onboarding —
> identity/address verification and a signed service agreement — *before* activating
> service. Billing is separated as a standard-business-process matter (Service Order
> issued + one month after activation), not a compliance argument.

---

Hi Ruth

Thank you for setting this out so clearly, and for the work you've put into the Monday.com board. Full visibility of progress and shared alignment is exactly how we'd like to work with Unjani going forward, and we're glad to adopt the board and keep it current on our side.

Having reviewed the process, we're happy to confirm our agreement on the following points:

- Coverage verification and feedback, with Unjani confirming the clinic, and results loaded to Monday.com.
- Introduction and contract outline by Unjani once coverage is confirmed, including the commercial terms (R450 ex VAT p/m with annual CPI escalation, 24-month term, 5-port router, additional access points at extra cost, WhatsApp support line).
- Installation scheduling around the 25th–7th busy period, with the nurse (or a designated representative) present on the day.
- Post-installation signal verification with comparative photos shared with Unjani and the nurse, and uploaded to Monday.com.
- Unjani kept in copy on all clinic communication at all times.
- Proactive network and signal-issue management for client retention.
- No quotes for additional work sent to a nurse without Unjani's prior involvement.
- Free first month, with the nurse free to retain their current contract during that month as backup.
- On cancellation, no charge for the free month, and immediate reversal of any accidental billing.

There is one point I need to align with our regulatory obligations rather than adopt as written — point 2's *"Onboarding strictly post-installation."*

As a licensed electronic communications provider, our standard business process for all corporate and business clients requires that a client's **initial onboarding — identity verification, address confirmation and a signed service agreement — is completed before we activate service at the premises.** This is a regulatory requirement, not an internal preference: as an ICASA-licensed provider we are obliged, under RICA, the Electronic Communications Act and its End-User and Subscriber Service Charter Regulations, and POPIA, to verify and record a client's identity and address and put a signed agreement in place before providing service — with non-compliance being a criminal offence for us as the provider.

The initial pilot clinics were onboarded **retrospectively** — the service was already in place and we had to retrofit those clinics into our systems afterwards, which is precisely the practice we are now correcting. Going forward, for every new Unjani clinic, onboarding will sit **ahead of** installation in the flow, with Unjani kept in copy throughout exactly as your process requires. In practice this simply moves the onboarding step to before installation; every other element of your process is unchanged.

**On billing**, which is a separate matter and will follow our standard business process: for each clinic, billing will commence only once the Service Order has been issued and one month after the service is active, exactly as agreed. We are adding this as a system flag on all future Unjani clinics so the free first month and the one-month delay are enforced automatically, which removes the premature-billing risk at source.

I'll ask Tamsyn to send through our onboarding pack — escalation path, WhatsApp support number and required documents — ahead of Friday, and we can walk through the sequencing point then.

Hope you find this in order.

Kind regards
Jeffrey

---

## Source references (for internal use — not part of the sent email)

The single plain-language compliance line in the email is backed by the following instruments:

| Instrument | Provision | Requirement | Source |
|---|---|---|---|
| RICA (Act 70 of 2002) | s.40, esp. s.40(2)–(3) | Obtain, record and verify customer full name, ID/registration number and address by means of documentation before providing service | https://www.gov.za/sites/default/files/gcis_document/201409/a482008.pdf |
| RICA | s.39–40 | Secure retention of those records (five years) | as above |
| RICA | s.51 | Non-compliance with s.40 is a criminal offence for the provider | as above |
| Electronic Communications Act (36 of 2005) | s.6 (no service without a licence); s.4 read with s.69(3) (ICASA's power to make the EUSSC Regs) | Licensing framework and obligation to comply with licence/regulatory conditions | https://www.icasa.org.za/uploads/files/Electronic-Communications-Act-2005.pdf |
| End-User and Subscriber Service Charter Regulations 2016 (GG 39898, Notice 189) | Reg 8 (Billing), Reg 9 (Quality of Service — install/activation timeframes) *(verified)* | Subscriber-service and record-keeping obligations | https://www.icasa.org.za/uploads/files/End-user-and-Subscriber-Services-Charter-Regulations-2016-No-39898.pdf |
| POPIA (Act 4 of 2013) | s.4, s.11 | Lawful basis / consent to collect and hold the ID, banking and address data captured at onboarding | https://www.justice.gov.za/legislation/acts/2013-004.pdf |

**Note on the "signed service agreement" point:** the specific EUSSC regulation number governing the subscriber agreement was not pinned down — the gazette's early pages are scanned images with poor OCR, and automated extraction of Reg 1–7 headings returned unverifiable results. Reg 8 (Billing) and Reg 9 (Quality of Service) are confirmed from the gazette text. The email therefore cites the EUSSC Regulations as the instrument without over-specifying a clause number.

**Platform gap flagged (2026-07-15):** the CircleTel platform does not currently *enforce* onboarding-before-activation — manual B2B intake (`lib/onboarding/manual-intake.ts`) can set a service `status: "active"` while `onboarding_status` is only `"submitted"`, and vetting only gates *billing* (`lib/onboarding/billing-ready.ts` `maybeMarkBillingReady()`), not activation. To make the stance in this email true in practice, an activation gate (require identity/address verification + signed Service Order before a service can be set active) would need to be added. Currently the ordering is procedural, not system-enforced.
