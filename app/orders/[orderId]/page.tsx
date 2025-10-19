'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle,
  Clock,
  Package,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  FileText,
  Home,
} from 'lucide-react';
import { OrderStatusBadge } from '@/components/customer-journey/OrderStatusBadge';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import type { ConsumerOrder } from '@/lib/types/customer-journey';

export default function OrderTrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;
  const isNewOrder = searchParams.get('new') === 'true';

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<ConsumerOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/consumer?id=${orderId}`);

      if (!response.ok) {
        throw new Error('Order not found');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-lg text-circleTel-secondaryNeutral">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find the order you're looking for. Please check your order number and try again.
            </p>
            <Link href="/coverage">
              <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                <Home className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthlyPrice = order.package_price;
  const installationFee = order.installation_fee || 0;
  const firstMonthTotal = monthlyPrice + installationFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="CircleTel" className="h-8 w-auto" />
              <span className="text-xl font-bold text-circleTel-darkNeutral">CircleTel</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Home</Link>
              <Link href="/coverage" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Coverage</Link>
              <Link href="/contact" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* New Order Success Alert */}
        {isNewOrder && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Order Submitted Successfully!</AlertTitle>
            <AlertDescription className="text-green-800">
              We've received your order and sent a confirmation email to <strong>{order.email}</strong>.
              Our team will contact you within 24 hours to schedule installation.
            </AlertDescription>
          </Alert>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">
                Order Tracking
              </h1>
              <p className="text-lg text-circleTel-secondaryNeutral">
                Order #{order.order_number}
              </p>
            </div>
            <div>
              <OrderStatusBadge status={order.status} type="order" size="lg" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Order Timeline & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-circleTel-orange" />
                  Order Progress
                </CardTitle>
                <CardDescription>
                  Track your order from submission to activation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrderTimeline
                  currentStatus={order.status}
                  createdAt={order.created_at}
                  paymentDate={order.payment_date}
                  installationScheduledDate={order.installation_scheduled_date}
                  installationCompletedDate={order.installation_completed_date}
                  activationDate={order.activation_date}
                />
              </CardContent>
            </Card>

            {/* Package Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-circleTel-orange" />
                  Your Package
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">{order.package_name}</p>
                  <p className="text-sm text-gray-500">{order.package_speed}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Monthly Price</p>
                    <p className="text-xl font-bold text-circleTel-orange">
                      R{monthlyPrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Installation Fee</p>
                    <p className="text-xl font-bold">
                      {installationFee > 0 ? `R${installationFee.toFixed(2)}` : (
                        <span className="text-green-600">Free</span>
                      )}
                    </p>
                  </div>
                </div>

                {order.router_included && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Router included</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Installation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-circleTel-orange" />
                  Installation Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{order.installation_address}</p>
                  {order.suburb && <p className="text-sm text-gray-600">{order.suburb}</p>}
                  {order.city && order.province && (
                    <p className="text-sm text-gray-600">
                      {order.city}, {order.province} {order.postal_code}
                    </p>
                  )}
                </div>

                {order.special_instructions && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-1">Special Instructions</p>
                    <p className="text-sm">{order.special_instructions}</p>
                  </div>
                )}

                {order.preferred_installation_date && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Preferred Installation Date
                    </p>
                    <p className="font-medium">
                      {new Date(order.preferred_installation_date).toLocaleDateString('en-ZA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {order.installation_scheduled_date && (
                  <div className="pt-3 border-t bg-green-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <p className="text-sm text-green-700 mb-1 font-medium">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Scheduled Installation
                    </p>
                    <p className="font-bold text-green-900">
                      {new Date(order.installation_scheduled_date).toLocaleDateString('en-ZA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {order.installation_time_slot && (
                      <p className="text-sm text-green-700 mt-1">
                        Time: {order.installation_time_slot}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                {order.status === 'pending' && (
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-sm font-bold">1</span>
                      <div>
                        <p className="font-medium">Email Confirmation</p>
                        <p className="text-sm text-gray-600">
                          Check your email at {order.email} for your order confirmation
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-sm font-bold">2</span>
                      <div>
                        <p className="font-medium">Payment Processing</p>
                        <p className="text-sm text-gray-600">
                          We'll contact you to arrange payment (R{firstMonthTotal.toFixed(2)})
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-sm font-bold">3</span>
                      <div>
                        <p className="font-medium">Installation Scheduling</p>
                        <p className="text-sm text-gray-600">
                          Our team will contact you within 24 hours to schedule installation
                        </p>
                      </div>
                    </li>
                  </ol>
                )}

                {order.status === 'payment_pending' && (
                  <div className="space-y-3">
                    <p className="font-medium">Payment Required</p>
                    <p className="text-sm text-gray-600">
                      Please complete payment to proceed with your installation. Our team will contact you with payment details.
                    </p>
                  </div>
                )}

                {order.status === 'installation_scheduled' && (
                  <div className="space-y-3">
                    <p className="font-medium">Installation Scheduled</p>
                    <p className="text-sm text-gray-600">
                      Our technician will arrive on your scheduled date. Please ensure someone 18+ is available to provide access.
                    </p>
                  </div>
                )}

                {order.status === 'active' && (
                  <div className="space-y-3">
                    <p className="font-medium text-green-700">Your connection is active!</p>
                    <p className="text-sm text-gray-600">
                      Welcome to CircleTel! If you need any assistance, our support team is here to help.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Contact & Actions */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="border-circleTel-orange">
              <CardHeader className="bg-gradient-to-br from-orange-50 to-white">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-mono font-semibold">{order.order_number}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Date</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleDateString('en-ZA')}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <OrderStatusBadge status={order.status} type="order" size="sm" />
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Monthly</span>
                    <span className="font-semibold">R{monthlyPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Installation</span>
                    <span className="font-semibold">
                      {installationFee > 0 ? `R${installationFee.toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">First Month Total</span>
                    <span className="text-xl font-bold text-circleTel-orange">
                      R{firstMonthTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium">
                    {order.first_name} {order.last_name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    <Mail className="w-3 h-3 inline mr-1" />
                    Email
                  </p>
                  <p className="font-medium text-sm">{order.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    <Phone className="w-3 h-3 inline mr-1" />
                    Phone
                  </p>
                  <p className="font-medium">{order.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="bg-gradient-to-br from-circleTel-orange to-orange-600 text-white">
              <CardHeader>
                <CardTitle className="text-lg text-white">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-white/90">
                  Our support team is here to assist you
                </p>

                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    className="w-full bg-white text-circleTel-orange hover:bg-white/90"
                    onClick={() => window.location.href = 'tel:0860247253'}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call 0860 CIRCLE
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-white text-white hover:bg-white/10"
                    onClick={() => window.location.href = 'mailto:support@circletel.co.za'}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Download Invoice */}
            <Button variant="outline" className="w-full" disabled>
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
              <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
