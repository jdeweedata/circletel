# Unjani Clinic Onboarding — Sales Administrator Guide

**Audience:** CircleTel internal sales administrator who helps Unjani nurses get their clinic set up for billing.
**Purpose:** A plain-language, step-by-step playbook + FAQs so you can confidently guide a nurse through onboarding over the phone or WhatsApp.
**Last updated:** 2026-06-09

---

## 1. The big picture (read this first)

Every Unjani clinic pays **R450 + VAT = R517.50 per month** for CircleTel ClinicConnect (managed internet). Before we can bill a clinic, the nurse must complete a short **online setup wizard** that captures:

1. Their **clinic details** (we pre-fill what we already have — they just confirm)
2. Their **business details** (company registration + VAT)
3. Their **banking details** + a **debit-order (DebiCheck) authorisation**
4. **Supporting documents** (company registration certificate, etc.)
5. Acceptance of the **Service Order terms** + choosing a monthly **payment date**

The nurse does this themselves on their phone by tapping a **personal link** we send them on WhatsApp. Your job is to **send the link, guide them through it, vet their documents, and confirm when billing is live.**

> **One clinic = one setup = one R450 account.** A nurse who runs more than one clinic does the setup **once per clinic** (see §6).

---

## 2. Two kinds of clinic — know which one you're dealing with

| | **Existing clinic** (already connected) | **New clinic** (not yet installed) |
|---|---|---|
| Examples | The ~20 clinics already live (Alexandra, Barcelona, Lens Ext 10, …) | A brand-new site, e.g. Delmas |
| What's needed | Just the **setup wizard** → billing starts | **Coverage check → install → THEN** the wizard/billing |
| Billing starts | As soon as setup is done + debit order is active | Only **after the clinic is installed and activated** |

**If it's a new clinic:** do **not** start billing setup until the **coverage check passes and installation is scheduled/done**. The system is built so a new clinic will not be billed until our technical team activates it — but the correct order is coverage → install → onboarding → billing.

---

## 3. Step-by-step: onboarding an EXISTING clinic

**You will:**

1. **Confirm the clinic's WhatsApp number** is correct on file (this is where the link goes).
2. **Send the onboarding link.** From the admin tool, choose the clinic and "Send onboarding link (WhatsApp)". The nurse receives a WhatsApp from **CircleTel (+27 84 773 9467)** that says *"Hi [Clinic], let's set up your CircleTel billing"* with a **Start setup** button.
   - The link is valid for **7 days** and is **single-use** (it's used up once they finish).
3. **Tell the nurse what to expect:** *"Tap the orange Start setup button. It takes about 5 minutes. Have your company registration number, VAT number if you have one, your clinic's bank details, and photos of your documents ready."*
4. **The nurse completes the 6 steps** (see §5). They tap through; most clinic details are already filled in.
5. **They submit.** They'll see a success screen with their CircleTel account number, and a message that we're reviewing their documents.
6. **You vet their documents** in the admin **B2B vetting queue** (`/admin/b2b/vetting`): open the clinic, view each uploaded document, and **Approve** or **Reject with a reason** (see §7).
7. **The nurse signs the debit order.** Separately, NetCash sends the nurse a DebiCheck request to authorise the monthly debit on their banking app / via OTP. This must be **approved by the nurse** at their bank.
8. **Billing goes live automatically** once **(a) all documents are approved AND (b) the debit order is active.** The clinic then appears as **billing-ready** and the first invoice is generated on their chosen payment date (pro-rated for the first month).

**Your "done" checklist for an existing clinic:** link sent ✅ → wizard submitted ✅ → documents approved ✅ → debit order active ✅ → status shows **billing-ready** ✅.

---

## 4. Step-by-step: onboarding a NEW clinic (e.g. Delmas)

1. **Capture the clinic's details** (clinic name, nurse name, contact number, email, physical address).
2. **Request a coverage/feasibility check** at the clinic's address (our technical team checks Tarana / MTN coverage). **Wait for this to pass.**
3. **Schedule and complete the installation.** The technical team installs and **activates** the service.
4. **Only now** follow the existing-clinic steps in §3 (send link → wizard → vet docs → debit order → billing).

> Until the clinic is installed and activated, it stays **dormant** in the system — no link, no billing. This is deliberate so we never bill for a service that isn't live.

---

## 5. What the nurse sees in the wizard (so you can guide them)

The link opens a 6-step form on their phone, branded like the CircleTel website:

| Step | What they do | Tips to give the nurse |
|---|---|---|
| **1. Clinic details** | Confirm pre-filled name, Unjani account no., province, contact, mobile, email, address | "Only change something if it's out of date." |
| **2. Business details** | Entity name, **CIPC registration number**, VAT (Yes/No + number), registered address | Sole proprietor? The field changes to **Owner ID number** (13-digit SA ID). |
| **3. Banking & debit order** | Account holder, bank, account type, account number, branch code, tick the **DebiCheck consent** | **Account holder name must match the clinic's registered name** — mismatches are the #1 reason debit orders get rejected. |
| **4. Documents** | Upload: CIPC certificate, VAT certificate (if VAT-registered), bank confirmation letter/statement, owner/director ID, proof of business address | Photos from the phone camera are fine (PDF/JPG/PNG, under 5MB each). |
| **5. Service order** | Pick a **payment date** (1st / 15th / 20th / 25th), review the R450 + VAT, read & **accept** the Service Order terms | The first month is **pro-rated** (they only pay for the days from activation to the first payment date). |
| **6. Done** | Sees their **CircleTel account number** + "what happens next" | Reassure them we'll review documents and set up the debit order. |

---

## 6. Nurses who run more than one clinic

Each clinic is a **separate account** with its **own link**. A nurse with two clinics (e.g. Lesedi Mmoneng runs **Barcelona** and **Delmas**) will:

- Receive **two separate WhatsApp links** — even if both go to the **same phone number**.
- Each message names its clinic ("…*Barcelona*…" / "…*Delmas*…").
- Complete the wizard **once per clinic** (each is billed R450 separately).

There is no mix-up: each link is locked to one specific clinic, so finishing one doesn't affect the other. **Just make sure they understand they must do it for each clinic.**

---

## 7. Document vetting — what to check (for YOU)

In `/admin/b2b/vetting`, open the clinic and review each document. The account only becomes billing-ready once **all required documents are Approved**.

| Document | Approve if… | Reject if… |
|---|---|---|
| **Company registration (CIPC)** | Legible, shows the registered entity name + reg number matching what they typed | Wrong entity, unreadable, expired/placeholder |
| **VAT certificate** (only if VAT=Yes) | Shows the VAT number they entered | Number mismatch, not a VAT cert |
| **Bank confirmation / statement** | Shows the **same account holder name & account number** they entered | Name/number mismatch, older than 3 months, illegible |
| **Owner / Director ID** | Clear SA ID/passport of the owner | Cut off, unreadable |
| **Proof of business address** | Recent (≤3 months), shows the clinic address | Too old, wrong address |

- **Reject with a clear reason** — the nurse is told what to fix and can re-upload just that document.
- **Watch the name-match warning:** if the bank account holder name ≠ the registered entity name, the debit order will likely fail. Resolve this before approving.

---

## 8. How to read a clinic's status

| Status you'll see | Meaning | What to do |
|---|---|---|
| **pending** | Nothing sent yet | Send the onboarding link |
| **in progress** | Link sent, not yet completed | Follow up if it's been a few days |
| **submitted** | Nurse finished the wizard; awaiting your document review | Vet the documents |
| **documents approved** | You approved all docs; waiting on the debit order | Remind the nurse to approve the DebiCheck request at their bank |
| **billing-ready** | Docs approved **and** debit order active | Done — billing will run on the payment date |
| **failed** | Debit order was rejected | Check bank details / name match; re-send / re-do banking step |

---

## 9. FAQ — Questions YOU (Sales Administrator) might have

**Q: How do I know which clinic a link is for?**
The link is locked to one clinic when we create it — you select the clinic and send. The nurse can't accidentally land on another clinic's setup.

**Q: The nurse says they never got the WhatsApp.**
Check: (1) is the number on file correct? (2) is it a WhatsApp-enabled number? (3) re-send the link (this issues a fresh one). As a fallback you can send the same link by SMS or read it to them. If WhatsApp sends are failing for everyone, the message template may still be pending Meta approval — escalate to the tech team.

**Q: The link expired / "already used".**
Links last 7 days and are single-use. Just **send a new one**.

**Q: The nurse runs 3 clinics — one link or three?**
**Three** — one per clinic. They complete the wizard for each. (See §6.)

**Q: It's a brand-new clinic. Can I send the link now?**
Not yet. New clinics need a **coverage check and installation first**. Capture their details, request the coverage check, and only send the link after install. (See §4.)

**Q: When does the clinic actually get charged?**
Only once **documents are approved AND the debit order is active** (and, for new clinics, after installation). The first invoice is pro-rated.

**Q: The nurse entered their personal mobile that's also on another clinic — is that a problem?**
No. Business/clinic accounts are allowed to share a nurse's number. Each clinic still gets its own link and its own bill.

**Q: What's the price again?**
**R450 excluding VAT = R517.50 including VAT, per month, per clinic.** First month pro-rated.

**Q: A document looks wrong — what do I do?**
Reject it with a clear reason in the vetting screen. The nurse is prompted to re-upload just that one.

**Q: The debit order isn't activating.**
The nurse must approve the DebiCheck request at their bank (app/USSD/OTP). If it was rejected, it's usually a **name mismatch** between the bank account holder and the registered clinic name — fix the banking details and re-do that step. If it's stuck pending for many days, escalate to the tech team.

---

## 10. FAQ — Questions the NURSE might ask (and your answers)

**Q: Is this safe? Why do you need my bank details?**
Yes. It's the secure CircleTel setup page (same look as circletel.co.za). We need your bank details to set up the monthly debit order for your R517.50 ClinicConnect fee — the same as any normal debit order. You authorise it yourself through your bank (DebiCheck), so nothing is taken without your approval.

**Q: How much will I pay and when?**
R450 + VAT = **R517.50 per month**. You choose the day it comes off (1st, 15th, 20th or 25th). Your **first month is pro-rated** — you only pay for the days from when your service started to your first payment date.

**Q: How long does it take?**
About **5 minutes**. Most of your clinic details are already filled in.

**Q: What documents do I need?**
Your **company registration certificate (CIPC)**, **VAT certificate** (only if you're VAT-registered), a **bank confirmation letter or statement**, your **ID**, and **proof of your clinic's address**. Photos from your phone are fine.

**Q: My bank account is in my name, not the clinic's — is that okay?**
Tell us — the account holder name should match your registered clinic/entity. If it doesn't match, the debit order can be rejected. We'll help you get it right.

**Q: I run two clinics — do I do this twice?**
Yes please — each clinic has its own setup and its own monthly bill. You'll get a separate WhatsApp link for each, named for that clinic.

**Q: I didn't finish / my link stopped working.**
No problem — we'll send you a fresh link.

**Q: What happens after I submit?**
We review your documents, your bank confirms the debit order with you, and then your billing is set up. We'll let you know when it's all active.

**Q: Who do I contact for help?**
CircleTel: WhatsApp **082 487 3900** or email **contactus@circletel.co.za** (Mon–Fri, 8am–5pm). Your sales administrator can also help you live.

---

## 11. Quick reference

- **Onboarding sender (WhatsApp):** +27 84 773 9467 ("Start setup" button)
- **Support line nurses know:** 082 487 3900 · contactus@circletel.co.za
- **Price:** R450 ex VAT / R517.50 incl / month / clinic (first month pro-rated)
- **Link validity:** 7 days, single-use
- **Required docs:** CIPC cert · VAT cert (if VAT) · bank confirmation · owner/director ID · proof of address
- **Vetting screen:** Admin → B2B vetting queue
- **Billing starts when:** documents approved + debit order active (+ installed, for new clinics)

---

*Internal document. For the technical/implementation detail behind this process, see `docs/superpowers/plans/2026-06-09-unjani-b2b-onboarding.md`.*
