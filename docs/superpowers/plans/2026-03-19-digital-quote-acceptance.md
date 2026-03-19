# Digital Quote Acceptance Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a functional digital quote acceptance form with signature canvas (draw/type), replacing the static mockup on the preview page, and calling the existing sign API.

**Architecture:** Two new components (`SignatureCanvas`, `QuoteAcceptanceForm`), one npm dependency (`react-signature-canvas`), one page modification (preview page), and one minor fix (share page contacts). The sign API already exists — no backend changes needed.

**Tech Stack:** Next.js 15, TypeScript, react-signature-canvas, react-hook-form, zod, Tailwind

**Spec:** `docs/superpowers/specs/2026-03-19-digital-quote-acceptance-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `components/quotes/SignatureCanvas.tsx` | **New** — Draw/type signature input with mode toggle, clear, base64 export |
| `components/quotes/QuoteAcceptanceForm.tsx` | **New** — Full acceptance form: signer details, checkboxes, signature, submit to API |
| `app/quotes/business/[id]/preview/page.tsx` | Replace static acceptance section with QuoteAcceptanceForm |
| `app/quotes/share/[token]/page.tsx` | Fix hardcoded contact details to use CONTACT constants |

---

## Task 1: Install react-signature-canvas

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install react-signature-canvas @types/react-signature-canvas
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('react-signature-canvas'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-signature-canvas for digital quote signing"
```

---

## Task 2: Create SignatureCanvas Component

**Files:**
- Create: `components/quotes/SignatureCanvas.tsx`

- [ ] **Step 1: Create the component**

This component provides two modes — Draw (canvas) and Type (cursive text). It exports a base64 PNG string via `onSignatureChange`.

Key implementation details:
- Use `dynamic(() => import('react-signature-canvas'), { ssr: false })` to prevent SSR errors
- Draw mode: `react-signature-canvas` with `penColor="black"`, `backgroundColor="white"`, responsive width
- Type mode: text input rendered in cursive font (`font-family: 'Brush Script MT', 'Segoe Script', cursive`), preview below
- Type mode export: render typed name to a hidden `<canvas>` element, export as base64 PNG
- Mode toggle: tab-style buttons `[Draw] [Type]` — switching clears current signature
- Clear button: resets canvas or typed text
- `onSignatureChange(dataUrl | null)` fires on every change (draw stroke end, type input, clear)

```typescript
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ReactSignatureCanvas = dynamic(
  () => import('react-signature-canvas'),
  { ssr: false }
);

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null, mode: 'drawn' | 'typed') => void;
  disabled?: boolean;
}
```

The component should:
1. Render a tab toggle (`Draw` / `Type`) at the top
2. In **Draw** mode: render the `ReactSignatureCanvas` with a border, "Clear" button below
3. In **Type** mode: render a text input + preview div showing the typed name in cursive font + hidden canvas for export
4. Call `onSignatureChange` with base64 data after each draw stroke (`onEnd` event) or text input change
5. Call `onSignatureChange(null)` when cleared or mode switched
6. Accept `disabled` prop to freeze the canvas/input when form is submitting

- [ ] **Step 2: Verify type check**

Run: `npm run type-check:memory`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add components/quotes/SignatureCanvas.tsx
git commit -m "feat(quotes): add SignatureCanvas component with draw/type modes"
```

---

## Task 3: Create QuoteAcceptanceForm Component

**Files:**
- Create: `components/quotes/QuoteAcceptanceForm.tsx`

- [ ] **Step 1: Create the component**

This is the main acceptance form. Key implementation details:

**Props:**
```typescript
interface QuoteAcceptanceFormProps {
  quoteId: string;
  quote: {
    status: string;
    valid_until: string;
    contact_name: string;
    contact_email: string;
    accepted_at?: string | null;
    company_name: string;
  };
  onAccepted?: () => void;
}
```

**State management:**
- `formState`: `'idle' | 'submitting' | 'success' | 'error'`
- `errorMessage`: string for API errors
- `signatureData`: base64 string from SignatureCanvas
- `signatureType`: `'drawn' | 'typed'`

**Status gate (render first):**
Use `canSignQuote()` from `lib/quotes/quote-validator.ts` to determine what to render:
- If quote `status === 'accepted'` → show "Quote accepted on [date]" confirmation
- If expired → show "Quote expired" with WhatsApp contact link
- If `status` not in `['sent', 'viewed']` → show "Quote is being prepared"
- Otherwise → show the full form

**Form fields (using controlled state, not react-hook-form — simpler for this use case):**

Signer details section:
- `signer_name` (text, required, pre-filled from `quote.contact_name`)
- `signer_email` (email, required, pre-filled from `quote.contact_email`)
- `signer_id_number` (text, required, 13-digit SA ID — validate with `isValidSAIDNumber()`)
- `signer_title` (text, optional)

Acceptance checkboxes section (all must be checked):
- `terms_accepted` — "I accept the terms and conditions as outlined above" (→ sent to API)
- `address_confirmed` — "I confirm the service address and technical requirements are correct" (→ UI-only)
- `installation_authorised` — "I authorize CircleTel to proceed with installation" (→ UI-only)
- `signing_authority` — "I have authority to sign on behalf of the company" (→ UI-only)
- `fica_documents_confirmed` — "I confirm I will provide the required FICA documentation" (→ sent to API)
- `cipc_documents_confirmed` — "I confirm the company's CIPC registration documentation" (→ sent to API)

Signature section:
- `SignatureCanvas` component with `onSignatureChange` callback
- Validate: signature data exists and is < 500KB

Additional notes:
- `additional_notes` (textarea, optional)

**Submit handler:**
```typescript
const handleSubmit = async () => {
  // Client-side validation
  // All 6 checkboxes must be checked
  // signer_name min 2 chars, signer_email valid, signer_id_number valid SA ID
  // signature_data not empty, < 500KB

  setFormState('submitting');

  const payload: SignQuoteRequest = {
    quote_id: quoteId,
    signer_name,
    signer_email,
    signer_id_number,
    signer_title: signerTitle || undefined,
    signature_type: signatureType, // 'drawn' or 'typed'
    signature_data: signatureData,
    terms_accepted: true,
    fica_documents_confirmed: true,
    cipc_documents_confirmed: true,
    additional_notes: additionalNotes || undefined,
  };

  const res = await fetch(`/api/quotes/business/${quoteId}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (data.success) {
    setFormState('success');
    onAccepted?.();
  } else {
    setFormState('error');
    setErrorMessage(data.error || 'Failed to sign quote');
  }
};
```

**Success state renders:**
- Green checkmark icon
- "Quote Accepted Successfully"
- "What happens next:" list:
  1. Our team will review your acceptance
  2. You will be contacted for FICA/KYC document verification
  3. A formal service contract will be prepared
  4. Installation will be scheduled
- WhatsApp link using `CONTACT.WHATSAPP_LINK` from `lib/constants/contact.ts`

**Submit button:**
- Text: "ACCEPT QUOTE & SIGN DIGITALLY"
- Disabled until all validations pass
- Shows spinner + "Signing..." when submitting
- Orange background (`bg-circleTel-orange`) matching existing button style
- `print:hidden` class (hidden when printing)

**Print fallback:**
- Below the button, a `hidden print:block` div: "This quote can be accepted digitally via the online portal or manually signed and returned."

- [ ] **Step 2: Verify type check**

Run: `npm run type-check:memory`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add components/quotes/QuoteAcceptanceForm.tsx
git commit -m "feat(quotes): add QuoteAcceptanceForm with signer details, checkboxes, and signature"
```

---

## Task 4: Update Preview Page

**Files:**
- Modify: `app/quotes/business/[id]/preview/page.tsx`

- [ ] **Step 1: Add import**

At the top of the file, add:

```typescript
import { QuoteAcceptanceForm } from '@/components/quotes/QuoteAcceptanceForm';
```

- [ ] **Step 2: Replace the static acceptance section**

Find the `{/* Customer Acceptance Section */}` block (the `<div className="bg-gray-50 border-2 border-circleTel-orange p-6 mb-8 customer-acceptance">` element containing disabled checkboxes, static "Sign Here" div, and the non-functional button).

Replace the entire block (from `{/* Customer Acceptance Section */}` through the closing `</div>` before `{/* Professional Footer */}`) with:

```tsx
{/* Customer Acceptance Section */}
<div className="mb-8 customer-acceptance print:hidden">
  <QuoteAcceptanceForm
    quoteId={quote.id}
    quote={quote}
    onAccepted={() => {
      // Refresh to show updated status
      window.location.reload();
    }}
  />
</div>

{/* Print-only acceptance section (static for printed quotes) */}
<div className="hidden print:block bg-gray-50 border-2 border-circleTel-orange p-6 mb-8">
  <h3 className="text-lg font-bold text-circleTel-navy mb-6 text-center">
    CUSTOMER ACCEPTANCE
  </h3>
  <div className="grid grid-cols-2 gap-8">
    <div>
      <h4 className="font-medium mb-4">ACCEPTANCE DECLARATION</h4>
      <div className="space-y-3 text-sm">
        <p>☐ I accept the terms and conditions as outlined above</p>
        <p>☐ I confirm the service address and technical requirements are correct</p>
        <p>☐ I authorize CircleTel to proceed with installation</p>
        <p>☐ I have authority to sign on behalf of the company</p>
      </div>
    </div>
    <div>
      <h4 className="font-medium mb-4">SIGNATURE</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1">Authorized Signatory Name:</label>
          <div className="border-b border-gray-400 h-8"></div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Position/Title:</label>
          <div className="border-b border-gray-400 h-8"></div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Date:</label>
          <div className="border-b border-gray-400 h-8"></div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Signature:</label>
          <div className="border-2 border-dashed border-gray-400 h-16 flex items-center justify-center text-gray-500 text-xs">
            Sign Here
          </div>
        </div>
      </div>
    </div>
  </div>
  <div className="mt-6 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
    This quote can be accepted digitally via the online portal or manually signed and returned.
  </div>
</div>
```

This preserves the print layout for physical signatures while showing the digital form on screen.

- [ ] **Step 3: Verify type check**

Run: `npm run type-check:memory`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add app/quotes/business/\[id\]/preview/page.tsx
git commit -m "feat(quotes): replace static acceptance mockup with digital acceptance form"
```

---

## Task 5: Fix Share Page Contact Details

**Files:**
- Modify: `app/quotes/share/[token]/page.tsx`

- [ ] **Step 1: Add import**

At the top of `app/quotes/share/[token]/page.tsx`, add:

```typescript
import { CONTACT } from '@/lib/constants/contact';
```

- [ ] **Step 2: Replace hardcoded contact details**

Find the error state section (lines 87-89):

```tsx
<p><strong>Email:</strong> sales@circletel.co.za</p>
<p><strong>Phone:</strong> +27 87 087 6305</p>
```

Replace with:

```tsx
<p><strong>Email:</strong> <a href={`mailto:${CONTACT.EMAIL_SALES}`} className="text-circleTel-orange hover:underline">{CONTACT.EMAIL_SALES}</a></p>
<p><strong>WhatsApp:</strong> <a href={CONTACT.WHATSAPP_LINK} className="text-circleTel-orange hover:underline">{CONTACT.WHATSAPP_NUMBER}</a></p>
```

This removes the phone number (per contact-details rule — no phone for inbound) and uses WhatsApp instead.

- [ ] **Step 3: Commit**

```bash
git add app/quotes/share/\[token\]/page.tsx
git commit -m "fix(quotes): use CONTACT constants on share page error state"
```

---

## Task 6: Final Verification

- [ ] **Step 1: Run type check**

Run: `npm run type-check:memory`
Expected: PASS (no new errors from our changes)

- [ ] **Step 2: Visual check — form renders**

Start dev server and navigate to a quote preview page. Verify:
- Acceptance form renders below the T&Cs section
- Signer name and email are pre-filled from quote contact details
- All 6 checkboxes are interactive (not disabled)
- Signature canvas renders in Draw mode by default
- Switching to Type mode shows text input with cursive preview
- Clear button resets the signature
- Submit button is disabled until all fields are valid
- Print view shows the static acceptance section (not the form)

- [ ] **Step 3: Visual check — status gates**

Verify the form renders different states:
- Quote with status `draft` → "Quote is being prepared" message
- Quote with status `sent`/`viewed` → Full acceptance form
- Quote with status `accepted` → "Quote accepted" confirmation
- Expired quote → "Quote expired" message with WhatsApp link

- [ ] **Step 4: Functional check — submit**

On a quote with status `sent` or `viewed`:
1. Fill all signer details (valid name, email, SA ID)
2. Check all 6 checkboxes
3. Draw a signature
4. Click "ACCEPT QUOTE & SIGN DIGITALLY"
5. Verify success state renders
6. Verify quote status updated to `accepted` in database

- [ ] **Step 5: Commit and push**

```bash
git push origin main
```
