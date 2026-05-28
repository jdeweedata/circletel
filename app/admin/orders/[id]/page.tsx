'use client';

import {
  PiPackageBold,
  PiWarningCircleBold,
  PiArrowLeftBold,
} from 'react-icons/pi';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { PaymentMethodRegistrationModal } from '@/components/admin/orders/PaymentMethodRegistrationModal';
import { OrderHeader } from '@/components/admin/orders/detail/OrderHeader';
import { OrderProgressStrip } from '@/components/admin/orders/detail/OrderProgressStrip';
import { OrderOverviewRedesigned } from '@/components/admin/orders/detail/OrderOverviewRedesigned';
import { OrderDevicesRedesigned } from '@/components/admin/orders/detail/OrderDevicesRedesigned';
import { OrderInstallationRedesigned } from '@/components/admin/orders/detail/OrderInstallationRedesigned';
import { OrderFinancialsRedesigned } from '@/components/admin/orders/detail/OrderFinancialsRedesigned';
import { OrderHistoryRedesigned } from '@/components/admin/orders/detail/OrderHistoryRedesigned';

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
  sim_serial?: string | null;
  router_serial?: string | null;
  router_model?: string | null;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
}

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview' },
  { id: 'devices', label: 'Devices' },
  { id: 'installation', label: 'Installation' },
  { id: 'financials', label: 'Financials' },
  { id: 'history', label: 'History' },
] as const;

type TabId = typeof TAB_CONFIG[number]['id'];

export default function AdminOrderDetailPage() {
  const params = useParams();
  useAdminAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethodModal, setPaymentMethodModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

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

  const handleNavigateToTab = (tab: string) => {
    if (TAB_CONFIG.some(t => t.id === tab)) {
      setActiveTab(tab as TabId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F9] overflow-x-hidden">
      <OrderHeader order={order} onNavigateToTab={handleNavigateToTab} />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Order Progress Strip */}
        <OrderProgressStrip order={order} onNavigateToTab={handleNavigateToTab} />

        {/* Tabs */}
        <UnderlineTabs
          tabs={TAB_CONFIG}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        {/* OVERVIEW TAB */}
        <TabPanel id="overview" activeTab={activeTab}>
          <OrderOverviewRedesigned
            order={order}
            onNavigateToTab={handleNavigateToTab}
          />
        </TabPanel>

        {/* DEVICES TAB */}
        <TabPanel id="devices" activeTab={activeTab}>
          <OrderDevicesRedesigned
            order={order}
            onUpdate={fetchOrder}
          />
        </TabPanel>

        {/* INSTALLATION TAB */}
        <TabPanel id="installation" activeTab={activeTab}>
          <OrderInstallationRedesigned
            order={order}
            onNavigateToTab={handleNavigateToTab}
          />
        </TabPanel>

        {/* FINANCIALS TAB */}
        <TabPanel id="financials" activeTab={activeTab}>
          <OrderFinancialsRedesigned
            order={order}
            onRequestPaymentMethod={() => setPaymentMethodModal(true)}
          />
        </TabPanel>

        {/* HISTORY TAB */}
        <TabPanel id="history" activeTab={activeTab}>
          <OrderHistoryRedesigned order={order} />
        </TabPanel>
      </div>

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
