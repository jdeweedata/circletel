'use client';

import {
  PiArrowLeftBold,
  PiArrowSquareOutBold,
  PiArrowsClockwiseBold,
  PiBellSimpleBold,
  PiBuildingBold,
  PiCheckBold,
  PiCheckCircleBold,
  PiClockBold,
  PiCopyBold,
  PiCreditCardBold,
  PiDownloadSimpleBold,
  PiEnvelopeBold,
  PiEyeBold,
  PiFileTextBold,
  PiPhoneBold,
  PiPlusCircleBold,
  PiSpinnerBold,
  PiWarningBold,
  PiXCircleBold,
} from 'react-icons/pi';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ManualPaymentDialog } from '@/components/admin/billing/ManualPaymentDialog';
import { openKycDocument } from '@/lib/admin/open-kyc-document';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Payment {
  id: string;
  transaction_id: string | null;
  reference: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  provider: string | null;
  zoho_payment_id: string | null;
  zoho_sync_status: string;
  zoho_last_synced_at: string | null;
  zoho_last_sync_error: string | null;
  initiated_at: string;
  completed_at: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  subtotal: number | null;
  vat_amount?: number | null;
  tax_amount?: number | null;
  amount_paid: number;
  amount_due: number;
  currency?: string | null;
  due_date: string;
  invoice_date?: string | null;
  paid_at: string | null;
  created_at: string;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    business_name: string | null;
  } | null;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceData {
  invoice: Invoice;
  payments: Payment[];
  lineItems: LineItem[];
  serviceOrder?: {
    pdf_path: string | null;
    issued_at: string | null;
  } | null;
  summary: {
    totalPaid: number;
    paymentCount: number;
    remainingBalance: number;
  };
}

type StatusTone = 'green' | 'amber' | 'blue' | 'red' | 'gray';

const toneClasses: Record<StatusTone, string> = {
  green: 'border-green-200 bg-green-50 text-green-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  red: 'border-red-200 bg-red-50 text-red-700',
  gray: 'border-gray-200 bg-gray-100 text-gray-700',
};

function StatusPill({
  tone = 'gray',
  children,
}: {
  tone?: StatusTone;
  children: ReactNode;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold',
        toneClasses[tone]
      )}
    >
      {children}
    </Badge>
  );
}

function DetailRow({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
  tone?: 'success' | 'warning';
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd
        className={cn(
          'text-right tabular-nums text-gray-900',
          strong && 'font-bold',
          tone === 'success' && 'font-semibold text-green-700',
          tone === 'warning' && 'font-semibold text-orange-700'
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = (Array.isArray(params.id) ? params.id[0] : params.id) || '';
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openingServiceOrder, setOpeningServiceOrder] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice(invoiceId);
    }
  }, [invoiceId]);

  const fetchInvoice = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/billing/invoices/${id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch invoice');
      }

      setData(result.data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(Number(amount || 0));
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return 'Unknown method';
    return method
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const copyInvoiceNumber = async (invoiceNumber: string) => {
    try {
      await navigator.clipboard.writeText(invoiceNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const openServiceOrderPdf = async (path: string) => {
    try {
      setOpeningServiceOrder(true);
      await openKycDocument(path);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open Service Order');
    } finally {
      setOpeningServiceOrder(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <StatusPill tone="green">
            <PiCheckCircleBold className="h-3 w-3" />
            Paid
          </StatusPill>
        );
      case 'partial':
        return <StatusPill tone="amber">Partial</StatusPill>;
      case 'sent':
      case 'open':
        return <StatusPill tone="blue">Open</StatusPill>;
      case 'overdue':
        return (
          <StatusPill tone="red">
            <PiWarningBold className="h-3 w-3" />
            Overdue
          </StatusPill>
        );
      case 'draft':
        return <StatusPill tone="gray">Draft</StatusPill>;
      case 'void':
      case 'voided':
        return <StatusPill tone="gray">Void</StatusPill>;
      default:
        return <StatusPill tone="gray">{status}</StatusPill>;
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <StatusPill tone="green">
            <PiCheckCircleBold className="h-3 w-3" />
            Synced
          </StatusPill>
        );
      case 'failed':
        return (
          <StatusPill tone="red">
            <PiXCircleBold className="h-3 w-3" />
            Failed
          </StatusPill>
        );
      case 'pending':
        return (
          <StatusPill tone="amber">
            <PiClockBold className="h-3 w-3" />
            Pending
          </StatusPill>
        );
      case 'syncing':
        return (
          <StatusPill tone="blue">
            <PiArrowsClockwiseBold className="h-3 w-3 animate-spin" />
            Syncing
          </StatusPill>
        );
      case 'skipped':
        return (
          <StatusPill tone="amber">
            <PiWarningBold className="h-3 w-3" />
            Skipped
          </StatusPill>
        );
      default:
        return <StatusPill tone="gray">{status || 'Unknown'}</StatusPill>;
    }
  };

  const emptyState = loading ? (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-gray-500" role="status" aria-live="polite">
        <PiSpinnerBold className="h-5 w-5 animate-spin text-gray-400" />
        Loading invoice...
      </div>
    </div>
  ) : null;

  if (emptyState) return emptyState;

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <PiArrowLeftBold className="mr-2 h-4 w-4" />
          Back
        </Button>
        <section className="rounded-lg border border-red-200 bg-white px-6 py-10 text-center shadow-sm">
          <PiWarningBold className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            {error || 'Invoice not found'}
          </h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </section>
      </div>
    );
  }

  const { invoice, payments, summary, serviceOrder } = data;
  const customerName = [invoice.customer?.first_name, invoice.customer?.last_name]
    .filter(Boolean)
    .join(' ') || 'Unknown customer';
  const customerInitials = customerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CT';

  const total = Number(invoice.total_amount || 0);
  const rawSubtotal = Number(invoice.subtotal || 0);
  const rawVat = Number(invoice.vat_amount ?? invoice.tax_amount ?? 0);
  const derivedSubtotal = Math.round((total / 1.15) * 100) / 100;
  const taxBreakdown =
    rawSubtotal > 0 || rawVat > 0
      ? { subtotal: rawSubtotal, vat: rawVat, derived: false }
      : {
          subtotal: derivedSubtotal,
          vat: Math.round((total - derivedSubtotal) * 100) / 100,
          derived: true,
        };

  const paidPercent =
    invoice.total_amount > 0
      ? Math.min(100, Math.max(0, (summary.totalPaid / invoice.total_amount) * 100))
      : 0;
  const isPaid = summary.remainingBalance <= 0 || invoice.status === 'paid';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/admin/billing/invoices" className="hover:text-gray-900 hover:underline">
          Invoices
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">{invoice.invoice_number}</span>
      </div>

      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="-ml-3 mb-2" onClick={() => router.back()}>
            <PiArrowLeftBold className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              {invoice.invoice_number}
            </h1>
            <button
              type="button"
              onClick={() => copyInvoiceNumber(invoice.invoice_number)}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-label="Copy invoice number"
              title="Copy invoice number"
            >
              {copied ? <PiCheckBold className="h-4 w-4 text-green-600" /> : <PiCopyBold className="h-4 w-4" />}
            </button>
            {getStatusBadge(invoice.status)}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
            <span>{customerName}</span>
            <span className="text-gray-300">•</span>
            <span>Created {formatDate(invoice.created_at)}</span>
            {invoice.paid_at && (
              <>
                <span className="text-gray-300">•</span>
                <span>Paid {formatDate(invoice.paid_at)}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.status !== 'paid' && (
            <Button className="bg-green-700 text-white hover:bg-green-800" onClick={() => setShowPaymentDialog(true)}>
              <PiPlusCircleBold className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/admin/billing/invoices/${invoiceId}/preview`} target="_blank">
              <PiEyeBold className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
          <Button variant="default" className="bg-circleTel-navy text-white hover:bg-circleTel-navy/90" asChild>
            <Link href={`/api/admin/invoices/${invoiceId}/pdf`}>
              <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
              Download PDF
            </Link>
          </Button>
          {serviceOrder?.pdf_path && (
            <Button
              type="button"
              variant="outline"
              disabled={openingServiceOrder}
              onClick={() => openServiceOrderPdf(serviceOrder.pdf_path!)}
            >
              {openingServiceOrder ? (
                <PiSpinnerBold className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PiFileTextBold className="mr-2 h-4 w-4" />
              )}
              Service Order
            </Button>
          )}
        </div>
      </header>

      {invoice.status !== 'paid' && (
        <ManualPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          invoice={{
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            total_amount: invoice.total_amount,
            amount_paid: invoice.amount_paid,
            amount_due: invoice.amount_due,
            status: invoice.status,
          }}
          onPaymentRecorded={() => fetchInvoice(invoiceId)}
        />
      )}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Total amount', value: formatCurrency(invoice.total_amount), tone: 'text-gray-950' },
            { label: 'Amount paid', value: formatCurrency(summary.totalPaid), tone: 'text-green-700' },
            { label: 'Balance due', value: formatCurrency(summary.remainingBalance), tone: summary.remainingBalance > 0 ? 'text-orange-700' : 'text-gray-950' },
            { label: 'Payments', value: summary.paymentCount.toString(), tone: 'text-gray-950' },
          ].map((cell) => (
            <div key={cell.label} className="border-b border-r border-gray-200 px-5 py-4 last:border-r-0 md:border-b-0">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{cell.label}</div>
              <div className={cn('mt-1 text-xl font-bold tabular-nums', cell.tone)}>{cell.value}</div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
            <div
              className={cn('h-full rounded-full', isPaid ? 'bg-green-700' : 'bg-orange-500')}
              style={{ width: `${paidPercent}%` }}
            />
          </div>
          <div className="mt-1.5 text-xs text-gray-600">
            {isPaid
              ? 'Fully paid'
              : `${Math.round(paidPercent)}% paid — ${formatCurrency(summary.remainingBalance)} still outstanding`}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Customer"
            action={
              invoice.customer && (
                <Link
                  href={`/admin/customers/${invoice.customer.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-circleTel-orange hover:underline"
                >
                  View profile
                  <PiArrowSquareOutBold className="h-3.5 w-3.5" />
                </Link>
              )
            }
          >
            {invoice.customer ? (
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-circleTel-orange">
                  {customerInitials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-950">{customerName}</div>
                  {invoice.customer.business_name && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-600">
                      <PiBuildingBold className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{invoice.customer.business_name}</span>
                    </div>
                  )}
                  <div className="mt-1 flex flex-col gap-0.5 text-sm text-gray-600">
                    {invoice.customer.email && (
                      <a href={`mailto:${invoice.customer.email}`} className="flex items-center gap-1.5 hover:underline">
                        <PiEnvelopeBold className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate">{invoice.customer.email}</span>
                      </a>
                    )}
                    {invoice.customer.phone && (
                      <a href={`tel:${invoice.customer.phone}`} className="flex items-center gap-1.5 hover:underline">
                        <PiPhoneBold className="h-3.5 w-3.5 text-gray-400" />
                        <span className="tabular-nums">{invoice.customer.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-gray-500">No customer linked</div>
            )}
          </Panel>

          <Panel
            title="Invoice details"
            action={<StatusPill tone="gray">{invoice.currency || 'ZAR'}</StatusPill>}
          >
            <dl className="px-5 py-3">
              <DetailRow label="Issued" value={formatDate(invoice.invoice_date || invoice.created_at)} />
              <DetailRow label="Due date" value={formatDate(invoice.due_date)} />
              <DetailRow label="Payment terms" value="Due on receipt" />
            </dl>
            <div className="border-t border-gray-200 px-5 py-3">
              <DetailRow label="Subtotal" value={formatCurrency(taxBreakdown.subtotal)} />
              <DetailRow
                label={taxBreakdown.derived ? 'VAT (15%, derived)' : 'VAT (15%)'}
                value={formatCurrency(taxBreakdown.vat)}
              />
              <div className="mt-2 border-t border-gray-200 pt-2">
                <DetailRow label="Total" value={formatCurrency(invoice.total_amount)} strong />
                {invoice.paid_at && (
                  <DetailRow label="Paid on" value={formatDate(invoice.paid_at)} tone="success" />
                )}
              </div>
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-3">
          <Panel
            title="Activity"
            description="Everything that has happened on this invoice"
          >
            {payments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <PiCreditCardBold className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-sm font-medium text-gray-700">No payments recorded yet</p>
                <p className="mt-1 text-sm text-gray-500">Payments will appear here once received.</p>
              </div>
            ) : (
              <ol className="px-5 py-4">
                <li className="relative flex gap-3 pb-6">
                  <span className="absolute bottom-0 left-[15px] top-8 w-px bg-gray-200" />
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <PiFileTextBold className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="text-sm font-medium text-gray-950">Invoice created</div>
                    <div className="mt-0.5 text-xs text-gray-500 tabular-nums">{formatDateTime(invoice.created_at)}</div>
                  </div>
                </li>

                {payments.map((payment, index) => {
                  const last = index === payments.length - 1;
                  const reference = payment.transaction_id || payment.reference || null;

                  return (
                    <li key={payment.id} className="relative flex gap-3 pb-6 last:pb-1">
                      {!last && <span className="absolute bottom-0 left-[15px] top-8 w-px bg-gray-200" />}
                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                        <PiCreditCardBold className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-950">
                            Payment received — {formatCurrency(payment.amount)}
                          </span>
                          <StatusPill tone="green">
                            <PiCheckCircleBold className="h-3 w-3" />
                            Completed
                          </StatusPill>
                        </div>
                        <div className="mt-0.5 break-words text-xs text-gray-500">
                          {formatDateTime(payment.completed_at || payment.created_at)}
                          {' · '}
                          {formatPaymentMethod(payment.payment_method)}
                          {payment.provider ? ` · ${payment.provider}` : ''}
                          {reference ? ` · Ref ${reference}` : ''}
                        </div>

                        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <PiArrowsClockwiseBold className="h-4 w-4 text-gray-400" />
                              ZOHO Books sync
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {getSyncStatusBadge(payment.zoho_sync_status)}
                              {payment.zoho_payment_id && (
                                <span className="text-xs text-gray-500">ID: {payment.zoho_payment_id}</span>
                              )}
                            </div>
                          </div>
                          {payment.zoho_sync_status === 'failed' && payment.zoho_last_sync_error && (
                            <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                              <strong>Error:</strong> {payment.zoho_last_sync_error}
                            </div>
                          )}
                          {payment.zoho_sync_status === 'skipped' && (
                            <div className="mt-2 flex items-start gap-2 text-xs text-amber-700">
                              <PiBellSimpleBold className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              Confirm whether this payment should be mirrored into ZOHO Books.
                            </div>
                          )}
                          {payment.zoho_last_synced_at && (
                            <p className="mt-2 text-xs text-gray-500">
                              Last synced: {formatDateTime(payment.zoho_last_synced_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
