'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Home,
  Calendar,
  Wrench,
  Wifi,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  FileText,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { OrderWithTracking, OrderTrackingEvent, FulfillmentStatus } from '@/lib/types/order-tracking';
import { getFulfillmentStatusInfo, getOrderWorkflow } from '@/lib/types/order-tracking';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCustomerAuth();
  const [order, setOrder] = useState<OrderWithTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // TODO: Replace with actual API call
      // For now, using mock data with tracking events
      const mockOrder: OrderWithTracking = {
        id: orderId,
        order_number: 'ORD-20251028-0001',
        order_type: 'fiber',
        status: 'confirmed',
        payment_status: 'paid',
        fulfillment_status: 'installation_scheduled',
        customer_name: 'Jeffrey De Wee',
        customer_email: 'jeffrey.de.wee@circletel.co.za',
        customer_phone: '+27 82 123 4567',
        installation_address: '123 Main Street, Cape Town, Western Cape, 8001',
        package_name: 'SkyFibre 100Mbps',
        service_type: 'fiber',
        speed_down: 100,
        speed_up: 50,
        base_price: 799.00,
        total_amount: 799.00,
        site_survey_scheduled_date: '2025-10-29T10:00:00Z',
        site_survey_completed_date: '2025-10-29T11:30:00Z',
        site_survey_status: 'passed',
        installation_scheduled_date: '2025-11-05T14:00:00Z',
        installation_technician: 'John Smith',
        expected_completion_date: '2025-11-05T18:00:00Z',
        created_at: '2025-10-28T09:00:00Z',
        updated_at: '2025-10-29T12:00:00Z',
        tracking_events: [
          {
            id: '1',
            order_id: orderId,
            event_type: 'order_confirmed',
            event_status: 'completed',
            event_title: 'Order Confirmed',
            event_description: 'Your order has been confirmed and payment received.',
            completed_date: '2025-10-28T09:00:00Z',
            created_at: '2025-10-28T09:00:00Z',
            updated_at: '2025-10-28T09:00:00Z',
            visible_to_customer: true,
          },
          {
            id: '2',
            order_id: orderId,
            event_type: 'site_survey_scheduled',
            event_status: 'completed',
            event_title: 'Site Survey Scheduled',
            event_description: 'Site survey scheduled for October 29, 2025 at 10:00 AM',
            scheduled_date: '2025-10-29T10:00:00Z',
            completed_date: '2025-10-28T10:00:00Z',
            created_at: '2025-10-28T10:00:00Z',
            updated_at: '2025-10-28T10:00:00Z',
            visible_to_customer: true,
          },
          {
            id: '3',
            order_id: orderId,
            event_type: 'site_survey_completed',
            event_status: 'completed',
            event_title: 'Site Survey Completed',
            event_description: 'Site survey passed. Installation can proceed.',
            completed_date: '2025-10-29T11:30:00Z',
            created_at: '2025-10-29T11:30:00Z',
            updated_at: '2025-10-29T11:30:00Z',
            visible_to_customer: true,
          },
          {
            id: '4',
            order_id: orderId,
            event_type: 'installation_scheduled',
            event_status: 'pending',
            event_title: 'Installation Scheduled',
            event_description: 'Installation scheduled for November 5, 2025 at 2:00 PM. Technician: John Smith',
            scheduled_date: '2025-11-05T14:00:00Z',
            created_at: '2025-10-29T12:00:00Z',
            updated_at: '2025-10-29T12:00:00Z',
            visible_to_customer: true,
          },
        ],
      };

      setOrder(mockOrder);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      completed: 'text-green-600 bg-green-50 border-green-200',
      'in_progress': 'text-blue-600 bg-blue-50 border-blue-200',
      pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      failed: 'text-red-600 bg-red-50 border-red-200',
      cancelled: 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return colorMap[status] || colorMap.pending;
  };

  const getEventIcon = (eventType: string, status: string) => {
    if (status === 'completed') {
      return <CheckCircle2 className="h-6 w-6 text-green-600" />;
    }
    if (status === 'in_progress') {
      return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />;
    }
    if (status === 'failed') {
      return <AlertCircle className="h-6 w-6 text-red-600" />;
    }

    const iconMap: Record<string, JSX.Element> = {
      order_confirmed: <CheckCircle2 className="h-6 w-6 text-gray-400" />,
      equipment_prepared: <Package className="h-6 w-6 text-gray-400" />,
      equipment_shipped: <Truck className="h-6 w-6 text-gray-400" />,
      delivery_completed: <Home className="h-6 w-6 text-gray-400" />,
      site_survey_scheduled: <Calendar className="h-6 w-6 text-gray-400" />,
      site_survey_completed: <CheckCircle2 className="h-6 w-6 text-gray-400" />,
      installation_scheduled: <Calendar className="h-6 w-6 text-gray-400" />,
      installation_completed: <Wrench className="h-6 w-6 text-gray-400" />,
      service_activated: <Wifi className="h-6 w-6 text-gray-400" />,
    };

    return iconMap[eventType] || <Clock className="h-6 w-6 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <Button asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const workflow = getOrderWorkflow(order.order_type);
  const currentStatusIndex = workflow.indexOf(order.fulfillment_status);
  const progressPercentage = ((currentStatusIndex + 1) / workflow.length) * 100;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{order.order_number}</h1>
            <p className="text-gray-600">Order placed on {new Date(order.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Badge className={`${getStatusColor(order.payment_status)} text-lg px-4 py-2 border`}>
            {order.payment_status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Order Progress</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-circleTel-orange to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Current Status: <span className="font-semibold text-gray-900">{getFulfillmentStatusInfo(order.fulfillment_status).label}</span>
            </span>
            {order.expected_completion_date && (
              <span className="text-gray-600">
                Expected: <span className="font-semibold text-gray-900">{new Date(order.expected_completion_date).toLocaleDateString('en-ZA')}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.tracking_events && order.tracking_events.length > 0 ? (
                  order.tracking_events.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      {/* Icon */}
                      <div className="flex flex-col items-center">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getStatusColor(event.event_status)} bg-white`}>
                          {getEventIcon(event.event_type, event.event_status)}
                        </div>
                        {index < order.tracking_events!.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{event.event_title}</h3>
                          <Badge className={`${getStatusColor(event.event_status)} text-xs`}>
                            {event.event_status}
                          </Badge>
                        </div>
                        {event.event_description && (
                          <p className="text-gray-600 mb-2">{event.event_description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {event.completed_date && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              {new Date(event.completed_date).toLocaleString('en-ZA', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                          {event.scheduled_date && !event.completed_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Scheduled: {new Date(event.scheduled_date).toLocaleString('en-ZA', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No tracking events yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Details */}
        <div className="space-y-6">
          {/* Package Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Package Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Package</p>
                <p className="font-semibold text-gray-900">{order.package_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Speed</p>
                <p className="font-semibold text-gray-900">{order.speed_down}Mbps / {order.speed_up}Mbps</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <Badge variant="outline">{order.order_type.toUpperCase()}</Badge>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monthly Fee</span>
                  <span className="text-lg font-bold text-gray-900">R{order.base_price.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installation Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Installation Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-900">{order.installation_address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <p className="text-gray-900">{order.customer_email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-gray-400" />
                <p className="text-gray-900">{order.customer_phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">R{order.base_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Installation Fee</span>
                <span className="font-semibold">R0.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold text-circleTel-orange">R{order.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/billing">
                    <DollarSign className="h-4 w-4 mr-2" />
                    View Billing
                  </Link>
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
