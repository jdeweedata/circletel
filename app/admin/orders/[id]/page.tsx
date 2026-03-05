'use client';

import {
  PiPackageBold,
  PiWarningCircleBold,
  PiArrowLeftBold,
  PiEyeBold,
  PiGearBold,
  PiMoneyBold,
  PiClockCounterClockwiseBold,
  PiCreditCardBold,
  PiMapPinBold,
  PiFileTextBold,
  PiDownloadSimpleBold,
} from 'react-icons/pi';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { InstallationSection } from '@/components/admin/orders/InstallationSection';
import { PaymentMethodStatus } from '@/components/admin/orders/PaymentMethodStatus';
import { PaymentMethodRegistrationModal } from '@/components/admin/orders/PaymentMethodRegistrationModal';
import { OrderInvoices } from '@/components/admin/orders/OrderInvoices';
import { CommunicationTimeline } from '@/components/admin/orders/CommunicationTimeline';
import { OrderHeader } from '@/components/admin/orders/detail/OrderHeader';
import { OrderStatCards } from '@/components/admin/orders/detail/OrderStatCards';
import { OrderOverviewTab } from '@/components/admin/orders/detail/OrderOverviewTab';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone?: string;
  installation_address: string;
  suburb?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  special_instructions?: string;
  residential_address?: string;
  residential_suburb?: string;
  residential_city?: string;
  residential_province?: string;
  residential_postal_code?: string;
  kyc_address_verified?: boolean;
  kyc_address_verified_at?: string;
  billing_same_as_installation: boolean;
  billing_address?: string;
  billing_suburb?: string;
  billing_city?: string;
  billing_province?: string;
  billing_postal_code?: string;
  service_package_id?: string;
  package_name: string;
  package_speed: string;
  package_price: number;
  installation_fee: number;
  router_included: boolean;
  router_rental_fee?: number;
  payment_method?: string;
  payment_status: string;
  payment_reference?: string;
  payment_date?: string;
  total_paid: number;
  status: string;
  preferred_installation_date?: string;
  installation_scheduled_date?: string;
  installation_time_slot?: string;
  installation_completed_date?: string;
  technician_notes?: string;
  activation_date?: string;
  account_number?: string;
  connection_id?: string;
  contact_preference: string;
  marketing_opt_in: boolean;
  whatsapp_opt_in: boolean;
  lead_source: string;
  source_campaign?: string;
  referral_code?: string;
  referred_by?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  payment_method_active?: boolean;
  payment_method_mandate_status?: string;
  installation_document_url?: string;
  installation_document_name?: string;
  installation_completed_at?: string;
}

const PAYMENT_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Paid' },
  partial: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Partial' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
  refunded: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Refunded' },
};

function getPaymentBadge(status: string) {
  const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;
  return <Badge className={cn(config.bg, config.text, 'border-0 font-medium')}>{config.label}</Badge>;
}

function SectionCard({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ElementType;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  useAdminAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethodModal, setPaymentMethodModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!orderId) {
        setError('Invalid order ID');
        return;
      }

      const response = await fetch(`/api/admin/orders/${orderId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch order');
      }

      if (!result.data) {
        setError('Order not found');
        return;
      }

      setOrder(result.data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <PiPackageBold className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 mt-6 font-medium">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error/Not Found State
  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <PiWarningCircleBold className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
            <p className="text-slate-500 mb-6">{error || 'The order you are looking for does not exist.'}</p>
            <Link href="/admin/orders">
              <Button className="bg-primary hover:bg-primary/90">
                <PiArrowLeftBold className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <OrderHeader order={order} onRefresh={fetchOrder} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-6">
        {/* Stat Cards */}
        <OrderStatCards order={order} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl w-full grid grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
            >
              <PiEyeBold className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="installation"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
            >
              <PiGearBold className="w-4 h-4 mr-2" />
              Installation
            </TabsTrigger>
            <TabsTrigger
              value="financials"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
            >
              <PiMoneyBold className="w-4 h-4 mr-2" />
              Financials
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
            >
              <PiClockCounterClockwiseBold className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <OrderOverviewTab
              order={order}
              onViewHistory={() => setActiveTab('history')}
            />
          </TabsContent>

          {/* INSTALLATION TAB */}
          <TabsContent value="installation" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InstallationSection orderId={order.id} className="border border-slate-200 rounded-xl" />

              <div className="space-y-6">
                {/* Installation Address */}
                <SectionCard icon={PiMapPinBold} title="Installation Address">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Street Address</p>
                      <p className="text-slate-900">{order.installation_address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {order.suburb && (
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Suburb</p>
                          <p className="text-sm font-medium">{order.suburb}</p>
                        </div>
                      )}
                      {order.city && (
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">City</p>
                          <p className="text-sm font-medium">{order.city}</p>
                        </div>
                      )}
                      {order.province && (
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Province</p>
                          <p className="text-sm font-medium">{order.province}</p>
                        </div>
                      )}
                      {order.postal_code && (
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Postal Code</p>
                          <p className="text-sm font-medium">{order.postal_code}</p>
                        </div>
                      )}
                    </div>
                    {order.special_instructions && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Special Instructions</p>
                          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
                            {order.special_instructions}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </SectionCard>

                {/* Installation Documentation */}
                {order.installation_document_url && (
                  <SectionCard icon={PiFileTextBold} title="Installation Documentation">
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                          <PiFileTextBold className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">
                            {order.installation_document_name || 'Installation Proof'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Uploaded {order.installation_completed_at ? new Date(order.installation_completed_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const url = order.installation_document_url?.startsWith('http')
                            ? order.installation_document_url
                            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/installation-documents/${order.installation_document_url}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <PiDownloadSimpleBold className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </SectionCard>
                )}
              </div>
            </div>
          </TabsContent>

          {/* FINANCIALS TAB */}
          <TabsContent value="financials" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Payment Information */}
                <SectionCard icon={PiCreditCardBold} title="Payment Information" badge={getPaymentBadge(order.payment_status)}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Method</p>
                      <p className="text-sm capitalize">{order.payment_method || 'Not specified'}</p>
                    </div>
                    {order.payment_reference && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reference</p>
                        <p className="font-mono text-sm bg-slate-100 px-2 py-1 rounded inline-block">{order.payment_reference}</p>
                      </div>
                    )}
                    {order.payment_date && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Date</p>
                        <p className="text-sm">{new Date(order.payment_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Paid</p>
                      <p className="text-xl font-bold text-emerald-600">R{parseFloat(String(order.total_paid)).toFixed(2)}</p>
                    </div>
                  </div>
                </SectionCard>

                {/* Payment Method Status */}
                <PaymentMethodStatus
                  orderId={order.id}
                  onRequestPaymentMethod={() => setPaymentMethodModal(true)}
                />
              </div>

              <div className="space-y-6">
                {/* Invoices Section */}
                <OrderInvoices
                  orderId={order.id}
                  customerId={order.customer_id}
                  packageName={order.package_name}
                  packagePrice={order.package_price}
                  routerFee={order.router_rental_fee}
                  accountNumber={order.account_number}
                  className="border border-slate-200 rounded-xl"
                />

                {/* Billing Address */}
                {!order.billing_same_as_installation && order.billing_address && (
                  <SectionCard icon={PiFileTextBold} title="Billing Address">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Street Address</p>
                        <p className="text-slate-900">{order.billing_address}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {order.billing_suburb && (
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Suburb</p>
                            <p className="text-sm font-medium">{order.billing_suburb}</p>
                          </div>
                        )}
                        {order.billing_city && (
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">City</p>
                            <p className="text-sm font-medium">{order.billing_city}</p>
                          </div>
                        )}
                        {order.billing_province && (
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Province</p>
                            <p className="text-sm font-medium">{order.billing_province}</p>
                          </div>
                        )}
                        {order.billing_postal_code && (
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Postal Code</p>
                            <p className="text-sm font-medium">{order.billing_postal_code}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                )}
              </div>
            </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CommunicationTimeline orderId={order.id} />

              {/* Notes */}
              {(order.technician_notes || order.internal_notes) && (
                <SectionCard icon={PiFileTextBold} title="Notes">
                  <div className="space-y-4">
                    {order.technician_notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Technician Notes</p>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap bg-blue-50 border border-blue-100 rounded-lg p-3">
                          {order.technician_notes}
                        </p>
                      </div>
                    )}
                    {order.internal_notes && (
                      <>
                        {order.technician_notes && <Separator />}
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Internal Notes</p>
                          <p className="text-sm whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-lg p-3">
                            {order.internal_notes}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </SectionCard>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Method Registration Modal */}
      <PaymentMethodRegistrationModal
        open={paymentMethodModal}
        onClose={() => setPaymentMethodModal(false)}
        order={{
          id: order.id,
          order_number: order.order_number,
          first_name: order.first_name,
          last_name: order.last_name,
          email: order.email,
          phone: order.phone,
          package_price: order.package_price,
        }}
        onSuccess={() => {
          fetchOrder();
          setPaymentMethodModal(false);
        }}
      />
    </div>
  );
}
