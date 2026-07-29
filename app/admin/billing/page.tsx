'use client';

import {
  PiArrowRightBold,
  PiArrowsClockwiseBold,
  PiCheckCircleBold,
  PiClockBold,
  PiCreditCardBold,
  PiCurrencyDollarBold,
  PiFileTextBold,
  PiTrendUpBold,
  PiUsersBold,
  PiWarningCircleBold,
} from 'react-icons/pi';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  AdminPage,
  PageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';

interface BillingStats {
  totalOutstanding: number;
  pendingInvoices: number;
  overdueInvoices: number;
  paidLast30Days: number;
  collectedLast30Days: number;
  activeCustomers: number;
  activeServices: number;
}

interface RecentInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  amount_due: number;
  status: string;
  due_date: string;
}

interface RecentPayment {
  id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  paid_at: string;
  method: string;
}

const INVOICE_STATUS_VARIANT: Record<string, StatusVariant> = {
  paid: 'success',
  sent: 'info',
  overdue: 'error',
  draft: 'neutral',
  partial: 'warning',
  voided: 'neutral',
  cancelled: 'neutral',
};

export default function BillingDashboard() {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/billing/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const data = await response.json();
      setStats(data.stats);
      setRecentInvoices(data.recentInvoices || []);
      setRecentPayments(data.recentPayments || []);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => (
    <StatusBadge
      status={status.charAt(0).toUpperCase() + status.slice(1)}
      variant={INVOICE_STATUS_VARIANT[status] ?? 'neutral'}
    />
  );

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading billing data..." />
      </AdminPage>
    );
  }

  if (error) {
    return (
      <AdminPage>
        <ErrorState title="Unable to load billing data" message={error} onRetry={fetchBillingData} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="Billing Dashboard"
        subtitle="Overview of billing and revenue"
        actions={
          <>
            <Button variant="outline" onClick={fetchBillingData}>
              <PiArrowsClockwiseBold className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/admin/billing/invoices">
              <Button className="bg-circleTel-orange hover:bg-circleTel-orange-dark">
                <PiFileTextBold className="h-4 w-4 mr-2" />
                View All Invoices
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(stats?.totalOutstanding || 0)}
          icon={<PiCurrencyDollarBold className="h-5 w-5" />}
          subtitle={`${stats?.pendingInvoices || 0} pending invoices`}
        />
        <StatCard
          label="Overdue Invoices"
          value={stats?.overdueInvoices || 0}
          icon={<PiWarningCircleBold className="h-5 w-5" />}
          subtitle="Requires attention"
        />
        <StatCard
          label="Collected (30 days)"
          value={formatCurrency(stats?.collectedLast30Days || 0)}
          icon={<PiTrendUpBold className="h-5 w-5" />}
          subtitle={`${stats?.paidLast30Days || 0} invoices paid`}
        />
        <StatCard
          label="Active Services"
          value={stats?.activeServices || 0}
          icon={<PiUsersBold className="h-5 w-5" />}
          subtitle={`${stats?.activeCustomers || 0} customers`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Recent Invoices"
          action={
            <Link href="/admin/billing/invoices">
              <Button variant="ghost" size="sm">
                View All <PiArrowRightBold className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          }
        >
          {recentInvoices.length === 0 ? (
            <EmptyState
              icon={<PiFileTextBold />}
              title="No invoices found"
              description="New invoices will appear here once generated."
            />
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/admin/billing/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-circleTel-orange/10 flex items-center justify-center">
                      <PiFileTextBold className="h-5 w-5 text-circleTel-orange" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-500">{invoice.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(invoice.total_amount)}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {getStatusBadge(invoice.status)}
                      <span className="text-xs text-gray-500">Due {formatDate(invoice.due_date)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Payments"
          action={
            <Link href="/admin/payments/transactions">
              <Button variant="ghost" size="sm">
                View All <PiArrowRightBold className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          }
        >
          {recentPayments.length === 0 ? (
            <EmptyState
              icon={<PiCheckCircleBold />}
              title="No recent payments"
              description="Successful payments will show up here."
            />
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <PiCheckCircleBold className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.customer_name}</p>
                      <p className="text-sm text-gray-500">
                        {payment.invoice_number} · {payment.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 tabular-nums">
                      +{formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(payment.paid_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/admin/billing/invoices">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
              <PiFileTextBold className="h-6 w-6 text-circleTel-orange" />
              <span>Manage Invoices</span>
            </Button>
          </Link>
          <Link href="/admin/billing/customers">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
              <PiUsersBold className="h-6 w-6 text-blue-500" />
              <span>Customer Billing</span>
            </Button>
          </Link>
          <Link href="/admin/billing/payment-methods">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
              <PiCreditCardBold className="h-6 w-6 text-green-500" />
              <span>Payment Methods</span>
            </Button>
          </Link>
          <Link href="/admin/billing/cron-logs">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
              <PiClockBold className="h-6 w-6 text-purple-500" />
              <span>Cron Logs</span>
            </Button>
          </Link>
        </div>
      </SectionCard>
    </AdminPage>
  );
}
