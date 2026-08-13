'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import {
  PortalModernistShell,
  PageHeader,
  KpiStrip,
  FilterChips,
  RuledTable,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import type { StatementData } from '@/lib/billing/statement-pdf-generator';

function formatZar(n: number) {
  return `R${Number(n || 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PortalStatementPage() {
  const { user } = usePortalAuth();
  const [period, setPeriod] = useState('12m');
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/portal/billing/statement?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || 'Failed');
        setStatement(data.statement);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [period]);

  if (!user) return null;

  async function downloadPdf() {
    if (!user) return;
    const orgCode = user.organisation_code;
    setDownloading(true);
    try {
      const res = await fetch(`/api/portal/billing/statement/pdf?period=${period}`);
      if (!res.ok) throw new Error('PDF failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${orgCode}-${period}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Could not download statement PDF');
    } finally {
      setDownloading(false);
    }
  }

  let running = 0;

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow="Billing · Statement"
        title="Account statement"
        subtitle={`Consolidated statement for ${user.organisation_name}`}
        actions={
          <>
            <Link href="/unjani/billing">
              <PmButton variant="ghost">Back to invoices</PmButton>
            </Link>
            <PmButton onClick={downloadPdf} disabled={downloading || !statement}>
              {downloading ? 'Preparing…' : 'Download PDF'}
            </PmButton>
          </>
        }
      />

      <div className="mt-6">
        <FilterChips
          value={period}
          onChange={setPeriod}
          options={[
            { value: '3m', label: '3 months' },
            { value: '6m', label: '6 months' },
            { value: '12m', label: '12 months' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      {error && (
        <p className="mt-4 text-sm" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}

      {loading || !statement ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
          Loading statement…
        </div>
      ) : (
        <>
          <KpiStrip
            items={[
              {
                label: 'Total due',
                value: formatZar(statement.totalDue),
              },
              {
                label: 'Total paid',
                value: formatZar(statement.totalPaid),
              },
              {
                label: 'Current',
                value: formatZar(statement.aging.current),
              },
              {
                label: '30+ days',
                value: formatZar(
                  statement.aging.days30 +
                    statement.aging.days60 +
                    statement.aging.days90 +
                    statement.aging.over120Days
                ),
              },
            ]}
          />

          <RuledTable
            headers={['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance']}
          >
            {statement.transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--pm-body)' }}>
                  No transactions in this period.
                </td>
              </tr>
            ) : (
              statement.transactions.map((tx, i) => {
                running += (tx.debit ?? 0) - (tx.credit ?? 0);
                return (
                  <tr
                    key={`${tx.reference}-${i}`}
                    style={{ borderBottom: '1px solid var(--pm-divider)' }}
                  >
                    <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                      {tx.date}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--pm-navy)' }}>
                      {tx.reference}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                      {tx.description}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--pm-body)' }}>
                      {tx.debit != null ? formatZar(tx.debit) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: '#059669' }}>
                      {tx.credit != null ? formatZar(tx.credit) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--pm-navy)' }}>
                      {formatZar(running)}
                    </td>
                  </tr>
                );
              })
            )}
          </RuledTable>
        </>
      )}
    </PortalModernistShell>
  );
}
