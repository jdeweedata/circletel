'use client';

import React, { useEffect, useState } from "react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        // Use mock data for demo
        setData(getMockBillingData());
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
          throw new Error('Failed to fetch billing data');
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          // Fallback to mock data
          setData(getMockBillingData());
        }
      } catch (err) {
        console.error('Billing error:', err);
        // Use mock data on error
        setData(getMockBillingData());
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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg text-gray-600">Failed to load billing information</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-orange-50 to-white p-6 rounded-xl border-2 border-orange-100">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">Billing & Payments</h1>
        <p className="text-base lg:text-lg text-gray-600 mt-2">
          Manage your invoices, payments, and payment methods
        </p>
      </div>

      {/* Billing Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Current Balance</p>
                <p className="text-3xl lg:text-4xl font-extrabold text-circleTel-orange mt-2 tabular-nums">
                  R{data.billing_summary.current_balance.toFixed(2)}
                </p>
              </div>
              <Wallet className="h-12 w-12 text-circleTel-orange opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Paid This Year</p>
                <p className="text-3xl lg:text-4xl font-extrabold text-green-600 mt-2 tabular-nums">
                  R{data.billing_summary.total_paid_ytd.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Next Billing</p>
                <p className="text-lg font-extrabold text-gray-900 mt-2">
                  {new Date(data.billing_summary.next_billing_date).toLocaleDateString('en-ZA', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <Calendar className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg. Monthly</p>
                <p className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2 tabular-nums">
                  R{data.billing_summary.average_monthly.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Invoices</CardTitle>
              <CardDescription>View and download your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.invoices.length > 0 ? (
                  data.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-4 border-2 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-circleTel-orange"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left side - Invoice info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-14 w-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="h-7 w-7 text-circleTel-orange" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-lg text-gray-900">{invoice.invoice_number}</p>
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
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Issued: {new Date(invoice.invoice_date).toLocaleDateString('en-ZA')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Due: {new Date(invoice.due_date).toLocaleDateString('en-ZA')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Amount and actions */}
                        <div className="flex items-center gap-4 lg:flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Amount Due</p>
                            <p className="text-3xl font-extrabold text-circleTel-orange tabular-nums">
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
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-16 w-16 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-semibold">No invoices yet</p>
                    <p className="text-sm mt-1">Your invoices will appear here once generated</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Payment History</CardTitle>
              <CardDescription>View all your past payments and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.payments.length > 0 ? (
                  data.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-circleTel-orange"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
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
                          <p className="font-bold text-base text-gray-900">
                            {payment.payment_method}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(payment.payment_date).toLocaleDateString('en-ZA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Ref: {payment.transaction_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-xl text-gray-900 tabular-nums">
                          R{payment.amount.toFixed(2)}
                        </p>
                        <Badge
                          variant={payment.status === 'successful' ? 'default' : 'secondary'}
                          className="mt-2 text-xs font-semibold"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Receipt className="h-16 w-16 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-semibold">No payment history</p>
                    <p className="text-sm mt-1">Your payment transactions will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Payment Methods</CardTitle>
                  <CardDescription>Manage your saved payment methods</CardDescription>
                </div>
                <Button className="bg-circleTel-orange hover:bg-orange-600 gap-2">
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.payment_methods.length > 0 ? (
                  data.payment_methods.map((method) => (
                    <div
                      key={method.id}
                      className="relative p-6 border-2 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-circleTel-orange bg-gradient-to-br from-gray-50 to-white"
                    >
                      {method.is_primary && (
                        <Badge className="absolute top-3 right-3 bg-circleTel-orange text-white border-0">
                          Primary
                        </Badge>
                      )}
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CreditCard className="h-7 w-7 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg text-gray-900 capitalize mb-1">
                            {method.card_brand || method.bank_name || method.type.replace('_', ' ')}
                          </p>
                          <p className="text-2xl font-mono font-bold text-gray-700 mb-2">
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
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    <CreditCard className="h-16 w-16 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-semibold">No payment methods saved</p>
                    <p className="text-sm mt-1 mb-4">Add a payment method for faster checkout</p>
                    <Button className="bg-circleTel-orange hover:bg-orange-600 gap-2">
                      <Plus className="h-4 w-4" />
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock data for demonstration
function getMockBillingData(): BillingData {
  return {
    billing_summary: {
      current_balance: 799.00,
      total_paid_ytd: 9588.00,
      next_billing_date: '2025-11-27',
      average_monthly: 799.00
    },
    invoices: [
      {
        id: '1',
        invoice_number: 'INV-2025-001',
        invoice_date: '2025-10-01',
        due_date: '2025-10-15',
        total_amount: 799.00,
        amount_due: 799.00,
        amount_paid: 0,
        status: 'pending',
        description: 'Fibre 100Mbps - October 2025',
        service_period_start: '2025-10-01',
        service_period_end: '2025-10-31'
      },
      {
        id: '2',
        invoice_number: 'INV-2025-002',
        invoice_date: '2025-09-01',
        due_date: '2025-09-15',
        total_amount: 799.00,
        amount_due: 0,
        amount_paid: 799.00,
        status: 'paid',
        description: 'Fibre 100Mbps - September 2025',
        service_period_start: '2025-09-01',
        service_period_end: '2025-09-30'
      },
      {
        id: '3',
        invoice_number: 'INV-2025-003',
        invoice_date: '2025-08-01',
        due_date: '2025-08-15',
        total_amount: 799.00,
        amount_due: 0,
        amount_paid: 799.00,
        status: 'paid',
        description: 'Fibre 100Mbps - August 2025',
        service_period_start: '2025-08-01',
        service_period_end: '2025-08-31'
      }
    ],
    payments: [
      {
        id: '1',
        payment_date: '2025-09-10',
        amount: 799.00,
        payment_method: 'Credit Card (Visa)',
        transaction_id: 'TXN-2025-09-0001',
        status: 'successful',
        invoice_id: '2'
      },
      {
        id: '2',
        payment_date: '2025-08-10',
        amount: 799.00,
        payment_method: 'Credit Card (Visa)',
        transaction_id: 'TXN-2025-08-0001',
        status: 'successful',
        invoice_id: '3'
      },
      {
        id: '3',
        payment_date: '2025-07-10',
        amount: 799.00,
        payment_method: 'EFT Transfer',
        transaction_id: 'TXN-2025-07-0001',
        status: 'successful'
      }
    ],
    payment_methods: [
      {
        id: '1',
        type: 'credit_card',
        last_four: '4242',
        expiry_date: '12/2026',
        is_primary: true,
        card_brand: 'Visa'
      },
      {
        id: '2',
        type: 'bank_account',
        last_four: '1234',
        is_primary: false,
        bank_name: 'Standard Bank'
      }
    ]
  };
}
