'use client';

import React, { useEffect, useState } from "react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModernStatCard } from "@/components/dashboard/ModernStatCard";
import {
  Loader2,
  CreditCard,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Receipt,
  DollarSign,
  Calendar,
  TrendingUp,
  Wallet,
  Plus,
  Trash2,
  Eye
} from "lucide-react";
import Link from "next/link";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_due: number;
  amount_paid: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description?: string;
  service_period_start?: string;
  service_period_end?: string;
}

interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: 'successful' | 'pending' | 'failed';
  invoice_id?: string;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_account' | 'eft';
  last_four: string;
  expiry_date?: string;
  is_primary: boolean;
  card_brand?: string;
  bank_name?: string;
}

interface BillingData {
  invoices: Invoice[];
  payments: Payment[];
  payment_methods: PaymentMethod[];
  billing_summary: {
    current_balance: number;
    total_paid_ytd: number;
    next_billing_date: string;
    average_monthly: number;
  };
}

export default function BillingPage() {
  const { session } = useCustomerAuth();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('invoices');

  useEffect(() => {
    async function fetchBillingData() {
      if (!session?.access_token) {
        console.error('No session found');
        setError('Please log in to view billing information');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/dashboard/billing', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch billing data: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
          setError(null);
        } else {
          console.error('Invalid response format:', result);
          setError(result.error || 'Failed to load billing information');
          setData(null);
        }
      } catch (err) {
        console.error('Billing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load billing information');
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBillingData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-semibold text-gray-900">Unable to load billing information</p>
        {error && <p className="text-sm text-gray-600">{error}</p>}
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header - Matching main dashboard style */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-gray-900">Billing & Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your invoices, payments, and payment methods
        </p>
      </div>

      {/* Billing Summary Cards - Using ModernStatCard like main dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernStatCard
          title="Current Balance"
          value={`R${data.billing_summary.current_balance.toFixed(2)}`}
          trend={{
            value: data.billing_summary.current_balance === 0 ? 0 : data.billing_summary.current_balance > 0 ? -10 : 10,
            isPositive: data.billing_summary.current_balance <= 0,
            label: "vs last month"
          }}
          subtitle={data.billing_summary.current_balance === 0 ? "No balance due" : data.billing_summary.current_balance > 0 ? "Payment due" : "Credit available"}
          description={data.billing_summary.current_balance > 0 ? "Please make payment" : "Account in good standing"}
          icon={<Wallet className="h-5 w-5" />}
        />

        <ModernStatCard
          title="Paid This Year"
          value={`R${data.billing_summary.total_paid_ytd.toFixed(2)}`}
          trend={{
            value: data.billing_summary.total_paid_ytd > 0 ? 5 : 0,
            isPositive: true,
            label: "vs last year"
          }}
          subtitle="Year-to-date payments"
          description="Total payments in current year"
          icon={<DollarSign className="h-5 w-5" />}
        />

        <ModernStatCard
          title="Next Billing"
          value={new Date(data.billing_summary.next_billing_date).toLocaleDateString('en-ZA', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
          subtitle={`${Math.ceil((new Date(data.billing_summary.next_billing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days away`}
          description="Next scheduled billing date"
          icon={<Calendar className="h-5 w-5" />}
        />

        <ModernStatCard
          title="Avg. Monthly"
          value={`R${data.billing_summary.average_monthly.toFixed(2)}`}
          trend={{
            value: 0,
            isPositive: true,
            label: "historical average"
          }}
          subtitle="Average monthly payment"
          description="Based on payment history"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Invoices</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Payment History</span>
          </TabsTrigger>
          <TabsTrigger value="methods" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment Methods</span>
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-6">
          <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
              <p className="text-sm text-gray-600 mt-1">View and download your invoices</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {data.invoices.length > 0 ? (
                  data.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left side - Invoice info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-base">{invoice.invoice_number}</p>
                              <Badge variant={
                                invoice.status === 'paid' ? 'default' :
                                invoice.status === 'overdue' ? 'destructive' :
                                'secondary'
                              } className="text-xs font-semibold">
                                {invoice.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {invoice.description || 'Monthly service fee'}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span>Issued: {new Date(invoice.invoice_date).toLocaleDateString('en-ZA')}</span>
                              <span>Due: {new Date(invoice.due_date).toLocaleDateString('en-ZA')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Amount and actions */}
                        <div className="flex items-center gap-4 lg:flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-600">Amount Due</p>
                            <p className="font-extrabold text-lg tabular-nums text-gray-900">
                              R{invoice.amount_due.toFixed(2)}
                            </p>
                            {invoice.amount_paid > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                Paid: R{invoice.amount_paid.toFixed(2)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="outline" className="gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Download className="h-4 w-4" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No invoices yet</p>
                    <p className="text-sm mt-1">Your invoices will appear here once generated</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="mt-6">
          <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
              <p className="text-sm text-gray-600 mt-1">View all your past payments and transactions</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {data.payments.length > 0 ? (
                  data.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                          payment.status === 'successful' ? 'bg-green-100' :
                          payment.status === 'pending' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          {payment.status === 'successful' ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : payment.status === 'pending' ? (
                            <Clock className="h-6 w-6 text-yellow-600" />
                          ) : (
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-base">
                            {payment.payment_method}
                          </p>
                          <p className="text-base text-gray-600">
                            {new Date(payment.payment_date).toLocaleDateString('en-ZA')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ref: {payment.transaction_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-lg tabular-nums">
                          R{payment.amount.toFixed(2)}
                        </p>
                        <Badge
                          variant={payment.status === 'successful' ? 'default' : 'secondary'}
                          className="mt-1 text-xs font-semibold"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Receipt className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No payment history</p>
                    <p className="text-sm mt-1">Your payment transactions will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="mt-6">
          <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage your saved payment methods</p>
                </div>
                <Button className="bg-circleTel-orange hover:bg-orange-600 gap-2">
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.payment_methods.length > 0 ? (
                  data.payment_methods.map((method) => (
                    <div
                      key={method.id}
                      className="relative p-6 border rounded-lg hover:shadow-md transition-all bg-white"
                    >
                      {method.is_primary && (
                        <Badge className="absolute top-3 right-3 bg-circleTel-orange text-white border-0">
                          Primary
                        </Badge>
                      )}
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base text-gray-900 capitalize mb-1">
                            {method.card_brand || method.bank_name || method.type.replace('_', ' ')}
                          </p>
                          <p className="text-xl font-mono font-bold text-gray-700 mb-2">
                            •••• •••• •••• {method.last_four}
                          </p>
                          {method.expiry_date && (
                            <p className="text-sm text-gray-600">
                              Expires: {method.expiry_date}
                            </p>
                          )}
                          <div className="flex gap-2 mt-4">
                            {!method.is_primary && (
                              <Button size="sm" variant="outline" className="text-xs">
                                Set as Primary
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="text-xs text-red-600 hover:text-red-700 gap-1">
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No payment methods saved</p>
                    <p className="text-sm mt-1 mb-4">Add a payment method for faster checkout</p>
                    <Button className="bg-circleTel-orange hover:bg-orange-600 gap-2">
                      <Plus className="h-4 w-4" />
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
