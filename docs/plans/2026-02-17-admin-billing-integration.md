# Admin Billing Dashboard Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add billing tab to customer detail page with invoice generation controls, and create cron logs audit page.

**Architecture:** Tab-based customer detail page with new Billing tab containing service billing settings, generate invoice button, and invoice history. Separate cron logs page for audit trail.

**Tech Stack:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, Supabase

---

## Task 1: Create API Endpoint - Get Customer Services with Billing

**Files:**
- Create: `app/api/admin/customers/[id]/billing-services/route.ts`

**Step 1: Create the API endpoint**

```typescript
/**
 * Get customer services with billing information
 * Returns services with billing_day, last_invoice_date, and recent invoices
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await context.params;
    const supabase = await createClient();

    // Get customer services with package info
    const { data: services, error: servicesError } = await supabase
      .from('customer_services')
      .select(`
        id,
        customer_id,
        package_id,
        status,
        monthly_price,
        billing_day,
        last_invoice_date,
        created_at,
        package:service_packages(
          id,
          name,
          description,
          price
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (servicesError) {
      return NextResponse.json({ error: servicesError.message }, { status: 500 });
    }

    // Get recent invoices for this customer
    const { data: invoices, error: invoicesError } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, total_amount, status, invoice_date, due_date, service_id, paynow_url')
      .eq('customer_id', customerId)
      .order('invoice_date', { ascending: false })
      .limit(10);

    if (invoicesError) {
      return NextResponse.json({ error: invoicesError.message }, { status: 500 });
    }

    // Handle Supabase join returning arrays
    const formattedServices = (services || []).map(service => ({
      ...service,
      package: Array.isArray(service.package) ? service.package[0] : service.package,
    }));

    return NextResponse.json({
      services: formattedServices,
      invoices: invoices || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/admin/customers/[id]/billing-services/route.ts
git commit -m "feat(api): add customer billing services endpoint"
```

---

## Task 2: Create API Endpoint - Update Service Billing Day

**Files:**
- Create: `app/api/admin/customers/[id]/billing-services/[serviceId]/route.ts`

**Step 1: Create the API endpoint**

```typescript
/**
 * Update service billing settings (billing_day)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id: customerId, serviceId } = await context.params;
    const body = await request.json();
    const { billing_day } = body;

    // Validate billing_day
    if (billing_day !== undefined) {
      const day = parseInt(billing_day);
      if (isNaN(day) || day < 1 || day > 28) {
        return NextResponse.json(
          { error: 'billing_day must be between 1 and 28' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Verify service belongs to customer
    const { data: service, error: verifyError } = await supabase
      .from('customer_services')
      .select('id')
      .eq('id', serviceId)
      .eq('customer_id', customerId)
      .single();

    if (verifyError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Update billing_day
    const { data: updated, error: updateError } = await supabase
      .from('customer_services')
      .update({ billing_day: parseInt(billing_day) })
      .eq('id', serviceId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ service: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/admin/customers/[id]/billing-services/[serviceId]/route.ts
git commit -m "feat(api): add update service billing day endpoint"
```

---

## Task 3: Create API Endpoint - Generate Invoice for Customer

**Files:**
- Create: `app/api/admin/customers/[id]/generate-invoice/route.ts`

**Step 1: Create the API endpoint**

```typescript
/**
 * Generate invoice for a customer's service
 * Uses the MonthlyInvoiceGenerator with single customer mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { MonthlyInvoiceGenerator } from '@/lib/billing/monthly-invoice-generator';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { serviceId, dryRun = false } = body;

    const generator = new MonthlyInvoiceGenerator();

    const result = await generator.generateMonthlyInvoices({
      customerId,
      dryRun,
      billingDay: new Date().getDate(), // Use current day to bypass billing_day filter
    });

    if (!result.results || result.results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active services found for billing',
      }, { status: 400 });
    }

    const serviceResult = serviceId
      ? result.results.find(r => r.serviceId === serviceId)
      : result.results[0];

    if (!serviceResult) {
      return NextResponse.json({
        success: false,
        error: 'Service not found or not eligible for billing',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: serviceResult.success,
      dryRun,
      invoice: serviceResult.success ? {
        id: serviceResult.invoiceId,
        invoice_number: serviceResult.invoiceNumber,
        amount: serviceResult.amount,
      } : null,
      zohoSynced: serviceResult.zohoSynced,
      emailSent: serviceResult.emailSent,
      smsSent: serviceResult.smsSent,
      errors: serviceResult.errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/admin/customers/[id]/generate-invoice/route.ts
git commit -m "feat(api): add generate invoice endpoint for customer"
```

---

## Task 4: Create API Endpoint - Send Pay Now

**Files:**
- Create: `app/api/admin/customers/[id]/send-paynow/route.ts`

**Step 1: Create the API endpoint**

```typescript
/**
 * Send Pay Now link for an unpaid invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { processPayNowForInvoice } from '@/lib/billing/paynow-billing-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await context.params;
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify invoice belongs to customer and is unpaid
    const { data: invoice, error: verifyError } = await supabase
      .from('customer_invoices')
      .select('id, status, customer_id')
      .eq('id', invoiceId)
      .eq('customer_id', customerId)
      .single();

    if (verifyError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    // Process Pay Now
    const result = await processPayNowForInvoice(invoiceId, {
      sendEmail: true,
      sendSms: true,
      smsTemplate: 'paymentReminder',
      forceRegenerate: false,
    });

    return NextResponse.json({
      success: result.success,
      paymentUrl: result.paymentUrl,
      emailSent: result.notificationResult?.emailSent || false,
      smsSent: result.notificationResult?.smsSent || false,
      errors: result.errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/admin/customers/[id]/send-paynow/route.ts
git commit -m "feat(api): add send pay now endpoint for customer"
```

---

## Task 5: Create API Endpoint - Cron Logs

**Files:**
- Create: `app/api/admin/billing/cron-logs/route.ts`

**Step 1: Create the API endpoint**

```typescript
/**
 * Get billing cron run logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();

    // Get cron logs
    const { data: logs, error: logsError, count } = await supabase
      .from('billing_cron_logs')
      .select('*', { count: 'exact' })
      .order('run_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    // Get latest run stats
    const latestRun = logs?.[0] || null;

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      latestRun,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/admin/billing/cron-logs/route.ts
git commit -m "feat(api): add billing cron logs endpoint"
```

---

## Task 6: Create CustomerBillingTab Component

**Files:**
- Create: `components/admin/customers/CustomerBillingTab.tsx`

**Step 1: Create the component**

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  FileText,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { CustomerPaymentMethods } from './CustomerPaymentMethods';

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

interface CustomerService {
  id: string;
  customer_id: string;
  package_id: string;
  status: string;
  monthly_price: number;
  billing_day: number;
  last_invoice_date: string | null;
  package: ServicePackage | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  invoice_date: string;
  due_date: string;
  service_id: string | null;
  paynow_url: string | null;
}

interface CustomerBillingTabProps {
  customerId: string;
}

export function CustomerBillingTab({ customerId }: CustomerBillingTabProps) {
  const [services, setServices] = useState<CustomerService[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}/billing-services`);
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const data = await response.json();
      setServices(data.services || []);
      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [customerId]);

  const handleBillingDayChange = async (serviceId: string, newDay: string) => {
    try {
      setActionLoading(`billing-${serviceId}`);

      const response = await fetch(
        `/api/admin/customers/${customerId}/billing-services/${serviceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billing_day: newDay }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update billing day');
      }

      setActionResult({ type: 'success', message: 'Billing day updated' });
      fetchBillingData();
    } catch (err) {
      setActionResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Update failed',
      });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionResult(null), 3000);
    }
  };

  const handleGenerateInvoice = async (serviceId: string) => {
    try {
      setActionLoading(`generate-${serviceId}`);

      const response = await fetch(`/api/admin/customers/${customerId}/generate-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate invoice');
      }

      setActionResult({
        type: 'success',
        message: `Invoice ${data.invoice?.invoice_number} created! Email: ${data.emailSent ? '✓' : '✗'} SMS: ${data.smsSent ? '✓' : '✗'}`,
      });
      fetchBillingData();
    } catch (err) {
      setActionResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Generation failed',
      });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionResult(null), 5000);
    }
  };

  const handleSendPayNow = async (invoiceId: string) => {
    try {
      setActionLoading(`paynow-${invoiceId}`);

      const response = await fetch(`/api/admin/customers/${customerId}/send-paynow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send Pay Now');
      }

      setActionResult({
        type: 'success',
        message: `Pay Now sent! Email: ${data.emailSent ? '✓' : '✗'} SMS: ${data.smsSent ? '✓' : '✗'}`,
      });
    } catch (err) {
      setActionResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Send failed',
      });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionResult(null), 5000);
    }
  };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'partial':
        return <Badge className="bg-orange-100 text-orange-800">Partial</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading billing data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={fetchBillingData} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Result Toast */}
      {actionResult && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            actionResult.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {actionResult.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{actionResult.message}</span>
        </div>
      )}

      {/* Services & Billing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-circleTel-orange" />
            Services & Billing Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No services found</p>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {service.package?.name || 'Unknown Package'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(service.monthly_price || service.package?.price || 0)}/month
                        {' • '}
                        <Badge
                          className={
                            service.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {service.status}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Billing Day:</span>
                      <Select
                        value={String(service.billing_day || 1)}
                        onValueChange={(value) => handleBillingDayChange(service.id, value)}
                        disabled={actionLoading === `billing-${service.id}`}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={String(day)}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-sm text-gray-500">
                      Last Billed:{' '}
                      {service.last_invoice_date
                        ? formatDate(service.last_invoice_date)
                        : 'Never'}
                    </div>

                    <div className="flex gap-2 ml-auto">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateInvoice(service.id)}
                        disabled={
                          actionLoading === `generate-${service.id}` ||
                          service.status !== 'active'
                        }
                        className="bg-circleTel-orange hover:bg-circleTel-orange/90"
                      >
                        {actionLoading === `generate-${service.id}` ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <FileText className="h-4 w-4 mr-1" />
                        )}
                        Generate Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Invoice History
          </CardTitle>
          <Link href={`/admin/billing/invoices?customer=${customerId}`}>
            <Button variant="ghost" size="sm">
              View All <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invoices found</p>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-500">
                        Due {formatDate(invoice.due_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    {invoice.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendPayNow(invoice.id)}
                        disabled={actionLoading === `paynow-${invoice.id}`}
                      >
                        {actionLoading === `paynow-${invoice.id}` ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <CustomerPaymentMethods customerId={customerId} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/admin/customers/CustomerBillingTab.tsx
git commit -m "feat(ui): add CustomerBillingTab component"
```

---

## Task 7: Create Cron Logs Page

**Files:**
- Create: `app/admin/billing/cron-logs/page.tsx`

**Step 1: Create the page**

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Play,
  ChevronDown,
  FileText,
  Mail,
  MessageSquare,
  Building,
} from 'lucide-react';

interface CronLog {
  id: string;
  cron_type: string;
  run_date: string;
  services_processed: number;
  invoices_created: number;
  zoho_synced: number;
  emails_sent: number;
  sms_sent: number;
  failed: number;
  skipped: number;
  dry_run: boolean;
  details: any;
  created_at: string;
}

export default function CronLogsPage() {
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<CronLog | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/billing/cron-logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRunCron = async (dryRun: boolean) => {
    try {
      setRunningAction(dryRun ? 'dry-run' : 'run');
      const response = await fetch('/api/cron/generate-monthly-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      const data = await response.json();

      if (data.success) {
        alert(
          dryRun
            ? `Dry Run: Would process ${data.servicesFound} services`
            : `Processed ${data.servicesProcessed} services, created ${data.invoicesCreated} invoices`
        );
        if (!dryRun) fetchLogs();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to run cron');
    } finally {
      setRunningAction(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (log: CronLog) => {
    if (log.dry_run) {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    if (log.failed > 0) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const latestRun = logs[0];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading cron logs...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Cron Logs</h1>
          <p className="text-gray-500 mt-1">Audit trail for automated billing jobs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                {runningAction ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Now
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleRunCron(true)}>
                <Clock className="h-4 w-4 mr-2" />
                Dry Run (Preview)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRunCron(false)}>
                <Play className="h-4 w-4 mr-2" />
                Run Now (Live)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Stats */}
      {latestRun && !latestRun.dry_run && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Run Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Clock className="h-4 w-4" />
              Last Run: {formatDate(latestRun.run_date)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {latestRun.services_processed}
                </div>
                <div className="text-xs text-gray-500">Processed</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {latestRun.invoices_created}
                </div>
                <div className="text-xs text-gray-500">Invoices</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {latestRun.zoho_synced}
                </div>
                <div className="text-xs text-gray-500">ZOHO Synced</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {latestRun.emails_sent}
                </div>
                <div className="text-xs text-gray-500">Emails</div>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-600">
                  {latestRun.sms_sent}
                </div>
                <div className="text-xs text-gray-500">SMS</div>
              </div>
              {latestRun.failed > 0 && (
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {latestRun.failed}
                  </div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run History */}
      <Card>
        <CardHeader>
          <CardTitle>Run History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No cron runs yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(log)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formatDate(log.run_date)}
                        </span>
                        {log.dry_run && (
                          <Badge className="bg-blue-100 text-blue-800">Dry Run</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {log.cron_type} • {log.services_processed} services →{' '}
                        {log.invoices_created} invoices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {log.zoho_synced}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {log.emails_sent}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {log.sms_sent}
                    </div>
                    {log.failed > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        {log.failed} failed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Cron Run Details - {selectedLog && formatDate(selectedLog.run_date)}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Type</span>
                  <p className="font-medium">{selectedLog.cron_type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Dry Run</span>
                  <p className="font-medium">{selectedLog.dry_run ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Services Processed</span>
                  <p className="font-medium">{selectedLog.services_processed}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Invoices Created</span>
                  <p className="font-medium">{selectedLog.invoices_created}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ZOHO Synced</span>
                  <p className="font-medium">{selectedLog.zoho_synced}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Emails Sent</span>
                  <p className="font-medium">{selectedLog.emails_sent}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">SMS Sent</span>
                  <p className="font-medium">{selectedLog.sms_sent}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Failed</span>
                  <p className="font-medium text-red-600">{selectedLog.failed}</p>
                </div>
              </div>
              {selectedLog.details && (
                <div>
                  <span className="text-sm text-gray-500">Details (JSON)</span>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/admin/billing/cron-logs/page.tsx
git commit -m "feat(ui): add billing cron logs page"
```

---

## Task 8: Update Customer Detail Page with Tabs

**Files:**
- Modify: `app/admin/customers/[id]/page.tsx`

**Step 1: Refactor to tab-based layout**

This is a larger refactor. The implementer should:
1. Import `Tabs, TabsContent, TabsList, TabsTrigger` from shadcn/ui
2. Import the new `CustomerBillingTab` component
3. Wrap existing sections in tabs (Overview, Orders, Services, Billing, Tickets)
4. Move services section to its own tab
5. Add the new Billing tab

**Key changes:**
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerBillingTab } from '@/components/admin/customers/CustomerBillingTab';

// In the return, wrap content in tabs:
<Tabs defaultValue="overview" className="w-full">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="orders">Orders</TabsTrigger>
    <TabsTrigger value="services">Services</TabsTrigger>
    <TabsTrigger value="billing">Billing</TabsTrigger>
    <TabsTrigger value="tickets">Tickets</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    {/* Customer info card */}
  </TabsContent>

  <TabsContent value="orders">
    {/* Orders section */}
  </TabsContent>

  <TabsContent value="services">
    {/* Services section */}
  </TabsContent>

  <TabsContent value="billing">
    <CustomerBillingTab customerId={customerId} />
  </TabsContent>

  <TabsContent value="tickets">
    {/* Tickets section */}
  </TabsContent>
</Tabs>
```

**Step 2: Commit**

```bash
git add app/admin/customers/[id]/page.tsx
git commit -m "feat(ui): refactor customer detail page to tabs with billing tab"
```

---

## Task 9: Add Navigation Link to Cron Logs

**Files:**
- Modify: `app/admin/billing/page.tsx`

**Step 1: Add link to cron logs in Quick Actions**

Add a new button in the Quick Actions grid:

```typescript
<Link href="/admin/billing/cron-logs">
  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
    <Clock className="h-6 w-6 text-purple-500" />
    <span>Cron Logs</span>
  </Button>
</Link>
```

**Step 2: Commit**

```bash
git add app/admin/billing/page.tsx
git commit -m "feat(ui): add cron logs link to billing dashboard"
```

---

## Verification Checklist

- [ ] API: `/api/admin/customers/[id]/billing-services` returns services with billing_day
- [ ] API: PATCH billing_day updates correctly
- [ ] API: Generate invoice creates invoice, syncs ZOHO, sends notifications
- [ ] API: Send Pay Now sends email and SMS
- [ ] API: Cron logs returns history
- [ ] UI: Customer detail page has working tabs
- [ ] UI: Billing tab shows services with billing day selector
- [ ] UI: Generate Invoice button works
- [ ] UI: Send Pay Now button works
- [ ] UI: Cron logs page shows run history
- [ ] UI: Run Now dropdown triggers cron
- [ ] Type check passes
