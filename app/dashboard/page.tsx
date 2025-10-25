'use client';

import React, { useEffect, useState } from "react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, CreditCard, Package, AlertCircle, CheckCircle, Clock, ChevronRight, Server, MapPin, Copy, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

interface DashboardData {
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    customerSince: string;
  };
  services: Array<{
    id: string;
    package_name: string;
    service_type: string;
    status: string;
    monthly_price: number;
    installation_address: string;
    speed_down: number;
    speed_up: number;
  }>;
  billing: {
    account_balance: number;
    payment_method: string;
    payment_status: string;
    next_billing_date: string;
    days_overdue: number;
  } | null;
  orders: Array<{
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    invoice_date: string;
    total_amount: number;
    amount_due: number;
    status: string;
  }>;
  stats: {
    activeServices: number;
    totalOrders: number;
    pendingOrders: number;
    overdueInvoices: number;
    accountBalance: number;
  };
}

export default function DashboardPage() {
  const { user, session } = useCustomerAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.access_token) {
        console.log('No session token available');
        setError('Please log in to view your dashboard');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching dashboard data...');
        const response = await fetch('/api/dashboard/summary', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch dashboard data`);
        }

        const result = await response.json();
        console.log('Dashboard data received:', result);
        
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to load dashboard');
        }
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          {error.includes('log in') && (
            <Link href="/auth/login">
              <Button className="bg-circleTel-orange hover:bg-orange-600">Go to Login</Button>
            </Link>
          )}
          {!error.includes('log in') && (
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
              <Link href="/">
                <Button className="bg-circleTel-orange hover:bg-orange-600">Go Home</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Package className="h-12 w-12 text-gray-400" />
        <p className="text-lg text-gray-600">No data available</p>
        <Link href="/">
          <Button>Browse Packages</Button>
        </Link>
      </div>
    );
  }

  return <DashboardContent data={data} />;
}

function DashboardContent({ data }: { data: DashboardData }) {
  const displayName = [data.customer.firstName, data.customer.lastName].filter(Boolean).join(' ') || data.customer.email;
  const primaryService = data.services[0];
  const hasActiveService = data.stats.activeServices > 0;
  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:gap-10">
          <div className="space-y-1">
            <div className="text-sm font-medium">Onboarding Progress</div>
            <p className="text-xs text-muted-foreground">
              Complete the key onboarding steps to get the most out of Share.
            </p>
          </div>
          <CircularProgress value={75} />
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
            <Step label="Payment" done />
            <Step label="Scheduling" done />
            <Step label="Deployment" active />
            <Step label="Activation" />
            <div className="hidden items-center justify-end md:flex">
              <Button variant="secondary" size="sm" className="gap-1">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Your Plan */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Your Plan</CardTitle>
              <AnchorLink href="#" className="text-xs text-primary hover:underline">
                Manage plan
              </AnchorLink>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">Premium Family</div>
                <div className="text-xs text-muted-foreground">Monthly Subscription</div>
              </div>
              <Badge className="ml-auto" variant="secondary">
                Active
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Metric label="Data usage" value="450 GB / 1 TB" />
              <Metric label="Download speed" value="850 Mbps" />
              <Metric label="Price" value="$15/mo" />
            </div>
          </CardContent>
        </Card>

        {/* Billing Summary */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Billing Summary</CardTitle>
              <AnchorLink href="#" className="text-xs text-primary hover:underline">
                Change payment method
              </AnchorLink>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <div className="font-medium">MASTERCARD ••2876</div>
                <div className="text-xs text-emerald-600">Payment active</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Metric label="Card name" value="Edgar Joe" />
              <Metric label="Exp date" value="02/27" />
              <Metric label="Next billing date" value="09/08/2025" />
            </div>
          </CardContent>
        </Card>

        {/* Your Network */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Your Network</CardTitle>
              <AnchorLink href="#" className="text-xs text-primary hover:underline">
                Report network issue
              </AnchorLink>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">090240287465</div>
                  <div className="text-xs text-emerald-600">Active</div>
                </div>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Signal strength" value="Excellent" hintColor="text-emerald-600" />
              <Metric label="" value="Lagos, Nigeria" icon={<MapPin className="h-4 w-4" />} />
            </div>
          </CardContent>
        </Card>

        {/* Referrals */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Referrals</CardTitle>
              <AnchorLink href="#" className="text-xs text-primary hover:underline">
                Track referrals
              </AnchorLink>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3 text-sm">
              <div>
                <div className="font-medium">Refer 10 friends</div>
                <div className="text-xs text-muted-foreground">Get 1 month free!</div>
              </div>
              <div className="text-xs text-muted-foreground">2/10 referrals completed</div>
            </div>
            <div className="flex gap-2">
              <Input readOnly value="https://www.share.inc.referral/254163" className="rounded-xl" />
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={() => navigator.clipboard.writeText('https://www.share.inc.referral/254163')}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnchorLink({ href = '#', children, className }: { href?: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (href === '#') e.preventDefault();
      }}
    >
      {children}
    </a>
  );
}

function CircularProgress({ value = 0 }: { value?: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} strokeWidth="10" className="text-muted-foreground/10" stroke="currentColor" fill="transparent" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="10"
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-semibold">{clamped}%</div>
      </div>
    </div>
  );
}

function Step({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={
          'h-2 w-20 rounded-full ' +
          (done ? 'bg-primary' : active ? 'bg-primary/60' : 'bg-muted-foreground/20')
        }
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function Metric({ label, value, hintColor, icon }: { label: string; value: string; hintColor?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className={`text-sm font-medium ${hintColor ?? ''}`}>{value}</div>
    </div>
  );
}
