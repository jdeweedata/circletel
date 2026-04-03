'use client';

import {
  PiArrowLeftBold,
  PiCalendarBold,
  PiCheckCircleBold,
  PiClockBold,
  PiCurrencyDollarBold,
  PiEnvelopeBold,
  PiFileTextBold,
  PiHouseBold,
  PiMapPinBold,
  PiPackageBold,
  PiPhoneBold,
  PiSpinnerBold,
  PiTruckBold,
  PiWarningCircleBold,
  PiWifiHighBold,
  PiWrenchBold,
  PiUserBold,
  PiReceiptBold,
  PiLightningBold,
} from 'react-icons/pi';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { StatusBadge, getStatusVariant } from '@/components/admin/shared/StatusBadge';
import { InfoRow } from '@/components/admin/shared/InfoRow';
import { DetailPageHeader } from '@/components/admin/shared/DetailPageHeader';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import type { OrderWithTracking, OrderTrackingEvent, FulfillmentStatus } from '@/lib/types/order-tracking';
import { getFulfillmentStatusInfo, getOrderWorkflow } from '@/lib/types/order-tracking';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'contact', label: 'Contact' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, session } = useCustomerAuth();
  const [order, setOrder] = useState<OrderWithTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const orderId = params?.id as string;

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails();
    }
  }, [user, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session) {
        setError('Please log in to view order details');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/dashboard/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        setError(response.status === 404 ? 'Order not found' : `Failed to fetch order: ${response.statusText}`);
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        setOrder({
          ...result.data,
          order_type: result.data.order_type || 'fiber',
          fulfillment_status: result.data.fulfillment_status || 'order_confirmed',
          tracking_events: result.data.tracking_events || [],
        });
      } else {
        setError(result.error || 'Failed to load order details');
      }
    } catch (err) {
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <PiSpinnerBold className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 flex flex-col items-center text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <PiWarningCircleBold className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/orders">
              <PiArrowLeftBold className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const workflow = getOrderWorkflow(order.order_type);
  const currentStatusIndex = workflow.indexOf(order.fulfillment_status);
  const progressPercentage = Math.round(((currentStatusIndex + 1) / workflow.length) * 100);
  const statusInfo = getFulfillmentStatusInfo(order.fulfillment_status);
  const paymentVariant = getStatusVariant(order.payment_status);

  const getTimelineIcon = (eventType: string, status: string) => {
    const completed = status === 'completed';
    const active = status === 'in_progress';
    const failed = status === 'failed';

    const iconClass = completed
      ? 'text-emerald-600'
      : active
        ? 'text-circleTel-orange animate-pulse'
        : failed
          ? 'text-red-500'
          : 'text-slate-400';

    const map: Record<string, React.ReactNode> = {
      order_confirmed: <PiCheckCircleBold className={`h-5 w-5 ${iconClass}`} />,
      equipment_prepared: <PiPackageBold className={`h-5 w-5 ${iconClass}`} />,
      equipment_shipped: <PiTruckBold className={`h-5 w-5 ${iconClass}`} />,
      delivery_completed: <PiHouseBold className={`h-5 w-5 ${iconClass}`} />,
      site_survey_scheduled: <PiCalendarBold className={`h-5 w-5 ${iconClass}`} />,
      site_survey_completed: <PiCheckCircleBold className={`h-5 w-5 ${iconClass}`} />,
      installation_scheduled: <PiCalendarBold className={`h-5 w-5 ${iconClass}`} />,
      installation_completed: <PiWrenchBold className={`h-5 w-5 ${iconClass}`} />,
      service_activated: <PiWifiHighBold className={`h-5 w-5 ${iconClass}`} />,
    };

    return map[eventType] || <PiClockBold className={`h-5 w-5 ${iconClass}`} />;
  };

  const getTimelineDotStyle = (status: string) => {
    if (status === 'completed') return 'bg-emerald-500 border-emerald-500';
    if (status === 'in_progress') return 'bg-circleTel-orange border-circleTel-orange ring-4 ring-circleTel-orange/20';
    if (status === 'failed') return 'bg-red-400 border-red-400';
    return 'bg-white border-slate-300';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <DetailPageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Orders', href: '/dashboard/orders' },
          { label: order.order_number },
        ]}
        title={order.order_number}
        status={{
          label: order.payment_status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          variant: paymentVariant,
        }}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/orders">
              <PiArrowLeftBold className="h-4 w-4 mr-1.5" />
              All Orders
            </Link>
          </Button>
        }
      />

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Amount"
            value={`R${(order.total_amount ?? 0).toFixed(2)}`}
            icon={<PiCurrencyDollarBold className="h-5 w-5" />}
            iconBgColor="bg-orange-100"
            iconColor="text-circleTel-orange"
            subtitle="Monthly fee"
          />
          <StatCard
            label="Payment"
            value={order.payment_status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            icon={<PiReceiptBold className="h-5 w-5" />}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <StatCard
            label="Status"
            value={statusInfo.label}
            icon={<PiLightningBold className="h-5 w-5" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            subtitle={`${progressPercentage}% complete`}
          />
          <StatCard
            label="Service Type"
            value={order.order_type.toUpperCase()}
            icon={<PiWifiHighBold className="h-5 w-5" />}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            subtitle={order.package_name}
          />
        </div>

        {/* Progress Card */}
        <SectionCard title="Order Progress" icon={PiLightningBold}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Current: <span className="font-semibold text-slate-900">{statusInfo.label}</span>
              </span>
              <span className="font-semibold text-slate-900">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-circleTel-orange to-orange-400 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {/* Workflow steps */}
            <div className="flex items-center justify-between mt-2 overflow-x-auto gap-1 pb-1">
              {workflow.map((step, index) => {
                const info = getFulfillmentStatusInfo(step);
                const isDone = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                return (
                  <div key={step} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500'
                          : isCurrent
                            ? 'bg-circleTel-orange border-circleTel-orange ring-2 ring-circleTel-orange/30'
                            : 'bg-white border-slate-300'
                      }`}
                    />
                    <span
                      className={`text-[9px] font-medium text-center leading-tight hidden sm:block ${
                        isCurrent ? 'text-circleTel-orange' : isDone ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {order.expected_completion_date && (
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                <PiCalendarBold className="h-3.5 w-3.5" />
                Expected completion: <span className="font-medium text-slate-700">{new Date(order.expected_completion_date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
            )}
          </div>
        </SectionCard>

        {/* Tabbed content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tab nav */}
          <div className="px-6 pt-4">
            <UnderlineTabs
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={(id) => setActiveTab(id as TabId)}
            />
          </div>

          {/* Tab panels */}
          <div className="p-6">
            {/* Overview */}
            <TabPanel id="overview" activeTab={activeTab}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Package Details */}
                <SectionCard title="Package Details" icon={PiPackageBold}>
                  <InfoRow label="Package" value={order.package_name} icon={PiWifiHighBold} />
                  <InfoRow label="Download Speed" value={`${order.speed_down} Mbps`} />
                  <InfoRow label="Upload Speed" value={`${order.speed_up} Mbps`} />
                  <InfoRow
                    label="Service Type"
                    value={
                      <StatusBadge
                        status={order.order_type.toUpperCase()}
                        variant="info"
                        showDot={false}
                      />
                    }
                  />
                  <InfoRow
                    label="Ordered"
                    value={new Date(order.created_at).toLocaleDateString('en-ZA', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                    icon={PiCalendarBold}
                  />
                </SectionCard>

                {/* Order Summary */}
                <SectionCard title="Order Summary" icon={PiReceiptBold}>
                  <InfoRow label="Monthly Fee" value={`R${(order.base_price ?? 0).toFixed(2)}`} />
                  <InfoRow label="Installation Fee" value="R0.00" />
                  <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-900">Total</span>
                    <span className="text-lg font-bold text-circleTel-orange">R{(order.total_amount ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button variant="outline" className="w-full" size="sm" asChild>
                      <Link href="/dashboard/billing">
                        <PiCurrencyDollarBold className="h-4 w-4 mr-2" />
                        View Billing
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <PiFileTextBold className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                  </div>
                </SectionCard>

                {/* Installation Address */}
                <div className="lg:col-span-2">
                  <SectionCard title="Installation Address" icon={PiMapPinBold}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <PiMapPinBold className="h-5 w-5 text-circleTel-orange" />
                      </div>
                      <p className="text-slate-900 font-medium leading-relaxed">{order.installation_address}</p>
                    </div>
                  </SectionCard>
                </div>
              </div>
            </TabPanel>

            {/* Timeline */}
            <TabPanel id="timeline" activeTab={activeTab}>
              <SectionCard title="Order Timeline" icon={PiClockBold}>
                {order.tracking_events && order.tracking_events.length > 0 ? (
                  <div className="space-y-0">
                    {order.tracking_events.map((event, index) => (
                      <div key={event.id} className="relative flex gap-4">
                        {/* Connector line */}
                        {index < order.tracking_events!.length - 1 && (
                          <div className="absolute left-[19px] top-10 bottom-0 w-px bg-slate-100" />
                        )}

                        {/* Dot + icon */}
                        <div className="relative z-10 flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center shadow-sm ${getTimelineDotStyle(event.event_status)}`}
                          >
                            {getTimelineIcon(event.event_type, event.event_status)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-6 pt-1.5">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4 className="text-sm font-semibold text-slate-900 leading-tight">{event.event_title}</h4>
                            <StatusBadge
                              status={event.event_status.replace(/_/g, ' ')}
                              variant={getStatusVariant(event.event_status)}
                              showDot={false}
                            />
                          </div>
                          {event.event_description && (
                            <p className="text-sm text-slate-500 mb-2">{event.event_description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                            {event.completed_date && (
                              <span className="flex items-center gap-1">
                                <PiCheckCircleBold className="h-3.5 w-3.5 text-emerald-500" />
                                {new Date(event.completed_date).toLocaleString('en-ZA', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            )}
                            {event.scheduled_date && !event.completed_date && (
                              <span className="flex items-center gap-1">
                                <PiCalendarBold className="h-3.5 w-3.5 text-circleTel-orange" />
                                Scheduled: {new Date(event.scheduled_date).toLocaleString('en-ZA', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <PiClockBold className="h-7 w-7 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No tracking events yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Check back soon for updates on your order.</p>
                  </div>
                )}
              </SectionCard>
            </TabPanel>

            {/* Contact */}
            <TabPanel id="contact" activeTab={activeTab}>
              <div className="max-w-lg">
                <SectionCard title="Customer Details" icon={PiUserBold}>
                  <InfoRow label="Name" value={order.customer_name} icon={PiUserBold} />
                  <InfoRow
                    label="Email"
                    value={
                      <a href={`mailto:${order.customer_email}`} className="text-circleTel-orange hover:underline">
                        {order.customer_email}
                      </a>
                    }
                    icon={PiEnvelopeBold}
                  />
                  <InfoRow
                    label="Phone"
                    value={
                      order.customer_phone ? (
                        <a href={`tel:${order.customer_phone}`} className="text-circleTel-orange hover:underline">
                          {order.customer_phone}
                        </a>
                      ) : '—'
                    }
                    icon={PiPhoneBold}
                  />
                </SectionCard>
              </div>
            </TabPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
