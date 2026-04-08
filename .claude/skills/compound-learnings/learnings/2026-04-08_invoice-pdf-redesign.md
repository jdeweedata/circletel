---
name: invoice-pdf-redesign
description: Patterns for redesigning jsPDF invoices to match HTML previews, fixing VAT bugs, and triggering real file downloads
type: session
---

# Invoice PDF Redesign Session

## Date: 2026-04-08

## Context

Redesigned `generateInvoicePDF()` in `lib/invoices/invoice-pdf-generator.ts` to match the branded HTML `InvoicePreview.tsx` component. Fixed a VAT double-calculation bug. Wired the "Download PDF" button to produce a real file download instead of a browser print dialog.

---

## Pattern 1: VAT Calculation — CircleTel stores prices as EXCL VAT

**Bug**: Old code treated `unit_price` as incl-VAT and divided by 1.15, causing ~13% understatement.

```typescript
// ❌ WRONG — was treating unit_price as incl-VAT
const exclTotal = Math.round((inclTotal / 1.15) * 100) / 100;

// ✅ CORRECT — unit_price in DB is excl-VAT; multiply forward
const VAT_RATE = 0.15;
const exclUnitPrice = parseFloat(String(item.unit_price ?? item.amount ?? 0));
const exclTotal = Math.round(exclUnitPrice * quantity * (1 - discountPercent / 100) * 100) / 100;
const inclTotal = Math.round(exclTotal * (1 + VAT_RATE) * 100) / 100;
```

**Takeaway:** CircleTel's `customer_invoices.line_items[].unit_price` is ALWAYS excl-VAT. Multiply by `1.15` to get incl amounts. Never divide incoming prices.

---

## Pattern 2: PDF File Download — fetch/blob instead of window.print()

`window.print()` shows a browser print dialog with grey overlay — not a file download.

```typescript
// ✅ Real PDF download pattern
const handleDownloadPDF = async () => {
  setDownloading(true);
  try {
    const res = await fetch(`${pdfEndpoint}/${invoiceId}/pdf?download=true`);
    if (!res.ok) throw new Error('Failed to generate PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CircleTel_Invoice_${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    window.print(); // graceful fallback
  } finally {
    setDownloading(false);
  }
};
```

**Key details:**
- Browser `fetch()` auto-sends cookies (same-origin) — no auth headers needed
- API route must return `Content-Type: application/pdf` + `Content-Disposition: attachment`
- `URL.revokeObjectURL()` prevents memory leak
- Add `downloading` state for UX spinner

---

## Pattern 3: Print CSS — Static Tailwind classes beat dynamic injection

Dynamic CSS injection via `useEffect` does NOT reliably hide `position:fixed` admin layout elements (sidebar, header) when printing.

```typescript
// ❌ UNRELIABLE — dynamic style injection
useEffect(() => {
  const style = document.createElement('style');
  style.textContent = `@media print { header { display: none !important; } }`;
  document.head.appendChild(style);
}, []);

// ✅ RELIABLE — static Tailwind class on the layout component itself
// In AdminHeader.tsx:
<header className="print:hidden ...">

// In Sidebar.tsx:
<aside className="print:hidden ...">
```

**Takeaway:** Always add `print:hidden` directly to layout components. Dynamic injection fails because specificity/order is unpredictable at print time.

---

## Pattern 4: jsPDF Multi-Page Footer

Use `didDrawPage` callback in autoTable to redraw footer on every page:

```typescript
function drawFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Footer text here', 105, pageHeight - 8, { align: 'center' });
}

autoTable(doc, {
  // ...table config...
  didDrawPage: () => { drawFooter(doc); }
});

// Also call drawFooter() once at end for final page
drawFooter(doc);
```

---

## Pattern 5: jsPDF Page Overflow Guard

Before drawing large sections that must not break mid-way (payment summary, banking card):

```typescript
function ensureSpace(doc: jsPDF, needed: number, margin = 15): number {
  let y = (doc as any).__currentY ?? margin;
  const pageHeight = doc.internal.pageSize.height - margin - 10; // footer buffer
  if (y + needed > pageHeight) {
    doc.addPage();
    drawFooter(doc);
    y = margin + 5;
    (doc as any).__currentY = y;
  }
  return y;
}
```

---

## Pattern 6: pdfEndpoint Prop Pattern for Dual-Context Components

When a shared component (`InvoicePreview`) serves both admin and customer contexts with different PDF endpoints:

```typescript
interface InvoicePreviewProps {
  invoiceId: string;
  apiEndpoint: string;   // for preview data fetch
  pdfEndpoint?: string;  // for PDF download (optional — falls back to window.print)
}

// Admin billing: pdfEndpoint="/api/admin/invoices"
// Admin customer: pdfEndpoint="/api/admin/invoices"
// Dashboard:      pdfEndpoint="/api/dashboard/invoices"
```

**Pattern:** Keep `pdfEndpoint` optional with `window.print()` fallback so the component works even if the PDF endpoint isn't configured.

---

## What Worked

- Writing `drawFooter()` and `ensureSpace()` as inner helpers keeps them tightly scoped to `generateInvoicePDF()` — no export pollution
- Separating `generateInvoicePDF()` (returns jsPDF doc) from `generateInvoicePDFBuffer()` (returns ArrayBuffer) makes both usable
- Storing `(doc as any).__currentY` to track cursor position across sections works around jsPDF's lack of a built-in cursor API

## What Failed / Corrected

- Tried `window.print()` for PDF download — user rejected (grey overlay, not a real download)
- Tried dynamic CSS injection to hide admin chrome during print — failed for `position:fixed` elements; static `print:hidden` Tailwind was the fix

## Related Files

- `lib/invoices/invoice-pdf-generator.ts` — Complete rewrite with all patterns
- `components/invoices/InvoicePreview.tsx` — pdfEndpoint prop + fetch download handler
- `app/api/admin/invoices/[id]/pdf/route.ts` — Admin PDF route
- `app/api/dashboard/invoices/[id]/pdf/route.ts` — Dashboard PDF route

## Time Savings

- VAT rule: ~30 min (avoid re-debugging incl/excl confusion)
- Fetch/blob download: ~20 min (no more print-dialog rabbit hole)
- Print CSS rule: ~15 min (avoid dynamic injection attempts)
- jsPDF page overflow: ~25 min (avoid layout corruption debugging)
