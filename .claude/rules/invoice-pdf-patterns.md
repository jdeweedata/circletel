---
paths:
  - "lib/invoices/**"
  - "app/api/*/invoices/**"
  - "components/invoices/**"
---

Rule: invoice-pdf-patterns
Loaded by: CLAUDE.md
Scope: jsPDF invoice generation, VAT calculations, PDF download, print CSS

---

## VAT Calculation — CircleTel stores prices as EXCL VAT

**CRITICAL**: `customer_invoices.line_items[].unit_price` is ALWAYS excl-VAT.
Multiply by `1.15` to get incl amounts. **Never divide incoming prices by 1.15.**

```typescript
// ❌ WRONG — treats unit_price as incl-VAT (caused ~13% understatement bug)
const exclTotal = inclTotal / 1.15;

// ✅ CORRECT — unit_price is excl-VAT; multiply forward
const VAT_RATE = 0.15;
const exclTotal = exclUnitPrice * quantity * (1 - discountPercent / 100);
const inclTotal = Math.round(exclTotal * (1 + VAT_RATE) * 100) / 100;
```

**Source**: 2026-04-08 session — bug caused every line item to be ~13% too low in PDF.

---

## PDF File Download — fetch/blob, not window.print()

`window.print()` shows a browser print dialog with a grey overlay — it is NOT a file download.

```typescript
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

- Browser `fetch()` sends cookies automatically (same-origin) — no auth header needed
- API route must return `Content-Type: application/pdf` + `Content-Disposition: attachment`
- Always call `URL.revokeObjectURL()` to prevent memory leak

---

## Print CSS — Static Tailwind beats dynamic injection

Dynamic `useEffect` style injection does NOT reliably hide `position:fixed` admin layout elements (sidebar, header) when the browser prints.

```typescript
// ❌ UNRELIABLE — useEffect injection fails for fixed-position elements
useEffect(() => {
  const style = document.createElement('style');
  style.textContent = `@media print { header { display: none !important; } }`;
  document.head.appendChild(style);
}, []);

// ✅ RELIABLE — add print:hidden directly to the layout component
// In AdminHeader.tsx and Sidebar.tsx:
<header className="print:hidden ...">
<aside className="print:hidden ...">
```

**Rule**: For any admin layout chrome that should not print, add `print:hidden` directly to that component — not via dynamic injection.

---

## jsPDF Multi-Page Footer

Always redraw footer on every page via `didDrawPage` callback:

```typescript
autoTable(doc, {
  // ...
  didDrawPage: () => { drawFooter(doc); }
});
drawFooter(doc); // final page (autoTable doesn't fire didDrawPage on last page)
```

## jsPDF Page Overflow Guard

Before drawing sections that must not split across pages:

```typescript
function ensureSpace(doc: jsPDF, needed: number, drawFooter: () => void, margin = 15): number {
  let y = (doc as any).__currentY ?? margin;
  const limit = doc.internal.pageSize.height - margin - 10;
  if (y + needed > limit) {
    doc.addPage();
    drawFooter();
    y = margin + 5;
  }
  return y;
}
```

---

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Divide `unit_price` by 1.15 | ~13% understatement | Multiply `exclTotal * 1.15` |
| `window.print()` on Download button | Grey overlay, no file | Use fetch→blob→`<a download>` |
| Dynamic CSS injection for print | Admin chrome shows in PDF | Add `print:hidden` to layout components |
| Forget `URL.revokeObjectURL()` | Memory leak per download | Always call after `a.click()` |
