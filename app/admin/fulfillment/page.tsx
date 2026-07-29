'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  PiPackageBold,
  PiTruckBold,
  PiCheckCircleBold,
  PiClockBold,
  PiLightningBold,
  PiWifiHighBold,
  PiShoppingCartBold,
  PiWarningCircleBold,
  PiArrowRightBold,
} from 'react-icons/pi';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  AdminPage,
  PageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';

interface FulfillmentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  package_name: string;
  fulfillment_status: string;
  payment_status: string;
  terms_accepted: boolean;
  sim_serial: string | null;
  router_serial: string | null;
  router_model: string | null;
  delivery_status: string | null;
  activation_date: string | null;
  created_at: string;
  kyc_verified: boolean;
  card_validated: boolean;
}

const FULFILLMENT_STATUS_VARIANT: Record<string, StatusVariant> = {
  order_confirmed: 'info',
  equipment_prepared: 'info',
  shipped: 'info',
  out_for_delivery: 'warning',
  delivered: 'info',
  installation_scheduled: 'warning',
  installation_in_progress: 'warning',
  installation_completed: 'success',
  service_activated: 'success',
  completed: 'success',
  cancelled: 'error',
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FulfillmentDashboard() {
  useAdminAuth();
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('consumer_orders')
      .select(
        'id, order_number, first_name, last_name, email, package_name, status, payment_status, terms_accepted, sim_serial, router_serial, router_model, created_at, metadata'
      )
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setOrders(
        data.map((o: any) => ({
          ...o,
          customer_name: `${o.first_name} ${o.last_name}`,
          customer_email: o.email,
          fulfillment_status: o.status,
          kyc_verified: o.metadata?.card_validated || false,
          card_validated: o.metadata?.card_validated || false,
        }))
      );
    }
    setLoading(false);
  };

  const stats = {
    total: orders.length,
    pendingPayment: orders.filter((o) => o.payment_status === 'pending').length,
    readyForDispatch: orders.filter((o) => o.payment_status === 'paid' && o.terms_accepted).length,
    inTransit: orders.filter(
      (o) => o.fulfillment_status === 'shipped' || o.fulfillment_status === 'out_for_delivery'
    ).length,
    pendingActivation: orders.filter((o) => o.fulfillment_status === 'delivered').length,
    active: orders.filter(
      (o) =>
        o.fulfillment_status === 'service_activated' || o.fulfillment_status === 'completed'
    ).length,
  };

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading fulfillment queue..." />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="Order Fulfillment"
        subtitle="Track device dispatch, delivery and service activation"
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<PiShoppingCartBold className="h-5 w-5" />}
        />
        <StatCard
          label="Need Payment"
          value={stats.pendingPayment}
          icon={<PiClockBold className="h-5 w-5" />}
        />
        <StatCard
          label="Ready"
          value={stats.readyForDispatch}
          icon={<PiPackageBold className="h-5 w-5" />}
        />
        <StatCard
          label="In Transit"
          value={stats.inTransit}
          icon={<PiTruckBold className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Act."
          value={stats.pendingActivation}
          icon={<PiLightningBold className="h-5 w-5" />}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<PiWifiHighBold className="h-5 w-5" />}
        />
      </div>

      <SectionCard title="Fulfillment Queue">
        {orders.length === 0 ? (
          <EmptyState
            icon={<PiPackageBold />}
            title="No orders in fulfillment"
            description="Orders will appear here once placed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Order
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Package
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    KYC
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    T&C
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Devices
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-sm text-circleTel-orange hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      <div className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-ZA')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-xs text-gray-400">{order.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.package_name}</td>
                    <td className="px-4 py-3 text-center">
                      {order.kyc_verified ? (
                        <PiCheckCircleBold className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <PiWarningCircleBold className="h-5 w-5 text-amber-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.terms_accepted ? (
                        <PiCheckCircleBold className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <PiClockBold className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.sim_serial || order.router_serial ? (
                        <PiCheckCircleBold className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <PiClockBold className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={
                          order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)
                        }
                        variant={order.payment_status === 'paid' ? 'success' : 'warning'}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={statusLabel(order.fulfillment_status)}
                        variant={FULFILLMENT_STATUS_VARIANT[order.fulfillment_status] ?? 'neutral'}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-circleTel-orange hover:text-orange-600 inline-flex items-center gap-1 text-sm font-medium"
                      >
                        View <PiArrowRightBold className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AdminPage>
  );
}
