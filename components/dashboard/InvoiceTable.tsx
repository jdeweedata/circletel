import Link from 'next/link';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_type?: string;
  total_amount: number;
  amount_due: number;
  status: string;
  pdf_url?: string;
}

const TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  recurring:    { bg: '#eff6ff', color: '#3b82f6', label: 'Recurring' },
  installation: { bg: '#f0fdf4', color: '#16a34a', label: 'Install' },
  pro_rata:     { bg: '#faf5ff', color: '#7c3aed', label: 'Pro-rata' },
  equipment:    { bg: '#fff7ed', color: '#f97316', label: 'Equipment' },
  adjustment:   { bg: '#f1f5f9', color: '#64748b', label: 'Adjustment' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  paid:     { bg: '#dcfce7', color: '#16a34a' },
  unpaid:   { bg: '#fef9c3', color: '#ca8a04' },
  overdue:  { bg: '#fee2e2', color: '#dc2626' },
  draft:    { bg: '#f1f5f9', color: '#64748b' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function TypeBadge({ type }: { type?: string }) {
  const key = (type ?? 'recurring').toLowerCase();
  const style = TYPE_STYLES[key] ?? TYPE_STYLES['adjustment'];
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const style = STATUS_STYLES[key] ?? STATUS_STYLES['draft'];
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface InvoiceTableProps {
  invoices: Invoice[];
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">No invoices found.</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#e2e8f0' }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b" style={{ borderColor: '#e2e8f0' }}>
            {['Invoice #', 'Date', 'Type', 'Amount', 'Status', 'Actions'].map((col) => (
              <th
                key={col}
                className="text-left px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const isUnpaid = ['unpaid', 'overdue'].includes(inv.status.toLowerCase());
            return (
              <tr
                key={inv.id}
                className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                style={{ borderColor: '#f1f5f9' }}
              >
                <td className="px-4 py-3 text-xs font-medium" style={{ color: '#3b82f6' }}>
                  {inv.invoice_number}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDate(inv.invoice_date)}
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={inv.invoice_type} />
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                  R{formatAmount(inv.total_amount)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="px-4 py-3">
                  {isUnpaid ? (
                    <Link
                      href="/dashboard/billing"
                      className="text-xs font-semibold"
                      style={{ color: '#F5831F' }}
                    >
                      Pay Now
                    </Link>
                  ) : inv.pdf_url ? (
                    <a
                      href={inv.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      View PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
