'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  PiPackageBold, PiTruckBold, PiCheckCircleBold,
  PiClockBold, PiLightningBold, PiWifiHighBold,
  PiShoppingCartBold, PiWarningCircleBold, PiArrowRightBold,
} from 'react-icons/pi';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';

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

const STATUS_COLORS: Record<string, string> = {
  order_confirmed: 'bg-blue-100 text-blue-800',
  equipment_prepared: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-cyan-100 text-cyan-800',
  installation_scheduled: 'bg-yellow-100 text-yellow-800',
  installation_in_progress: 'bg-amber-100 text-amber-800',
  installation_completed: 'bg-lime-100 text-lime-800',
  service_activated: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function FulfillmentDashboard() {
  useAdminAuth();
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('consumer_orders')
      .select('id, order_number, first_name, last_name, email, package_name, status, payment_status, terms_accepted, sim_serial, router_serial, router_model, created_at, metadata')
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setOrders(data.map((o: any) => ({
        ...o,
        customer_name: `${o.first_name} ${o.last_name}`,
        customer_email: o.email,
        fulfillment_status: o.status,
        kyc_verified: o.metadata?.card_validated || false,
        card_validated: o.metadata?.card_validated || false,
      })));
    }
    setLoading(false);
  };

  const stats = {
    total: orders.length,
    pendingPayment: orders.filter(o => o.payment_status === 'pending').length,
    readyForDispatch: orders.filter(o => o.payment_status === 'paid' && o.terms_accepted).length,
    inTransit: orders.filter(o => o.fulfillment_status === 'shipped' || o.fulfillment_status === 'out_for_delivery').length,
    pendingActivation: orders.filter(o => o.fulfillment_status === 'delivered').length,
    active: orders.filter(o => o.fulfillment_status === 'service_activated' || o.fulfillment_status === 'completed').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">
      <PiClockBold className="w-8 h-8 animate-spin text-slate-400" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order Fulfillment</h1>
            <p className="text-sm text-slate-500 mt-1">Track device dispatch, delivery and service activation</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatBox icon={<PiShoppingCartBold />} label="Total" value={stats.total} color="bg-slate-100 text-slate-700" />
          <StatBox icon={<PiClockBold />} label="Need Payment" value={stats.pendingPayment} color="bg-amber-100 text-amber-700" />
          <StatBox icon={<PiPackageBold />} label="Ready" value={stats.readyForDispatch} color="bg-purple-100 text-purple-700" />
          <StatBox icon={<PiTruckBold />} label="In Transit" value={stats.inTransit} color="bg-blue-100 text-blue-700" />
          <StatBox icon={<PiLightningBold />} label="Pending Act." value={stats.pendingActivation} color="bg-orange-100 text-orange-700" />
          <StatBox icon={<PiWifiHighBold />} label="Active" value={stats.active} color="bg-emerald-100 text-emerald-700" />
        </div>

        {/* Orders Table */}
        <Card className="border-slate-200">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Package</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">KYC</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">T&C</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Devices</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Payment</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm text-circleTel-orange hover:underline">
                        {order.order_number}
                      </Link>
                      <div className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString('en-ZA')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">{order.customer_name}</div>
                      <div className="text-xs text-slate-400">{order.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{order.package_name}</td>
                    <td className="px-4 py-3 text-center">
                      {order.kyc_verified
                        ? <PiCheckCircleBold className="h-5 w-5 text-emerald-500 mx-auto" />
                        : <PiWarningCircleBold className="h-5 w-5 text-amber-400 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.terms_accepted
                        ? <PiCheckCircleBold className="h-5 w-5 text-emerald-500 mx-auto" />
                        : <PiClockBold className="h-5 w-5 text-slate-300 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.sim_serial || order.router_serial
                        ? <PiCheckCircleBold className="h-5 w-5 text-emerald-500 mx-auto" />
                        : <PiClockBold className="h-5 w-5 text-slate-300 mx-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                        {order.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={STATUS_COLORS[order.fulfillment_status] || 'bg-slate-100 text-slate-700'}>
                        {statusLabel(order.fulfillment_status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${order.id}`} className="text-circleTel-orange hover:text-orange-600 inline-flex items-center gap-1 text-sm font-medium">
                        View <PiArrowRightBold className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
