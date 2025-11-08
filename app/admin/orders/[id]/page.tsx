'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Printer,
  Download
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface Order {
  id: string;
  order_number: string;

  // Customer Information
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone?: string;

  // Installation Address
  installation_address: string;
  suburb?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  special_instructions?: string;

  // Billing Address
  billing_same_as_installation: boolean;
  billing_address?: string;
  billing_suburb?: string;
  billing_city?: string;
  billing_province?: string;
  billing_postal_code?: string;

  // Product Selection
  service_package_id?: string;
  package_name: string;
  package_speed: string;
  package_price: number;
  installation_fee: number;
  router_included: boolean;
  router_rental_fee?: number;

  // Payment Information
  payment_method?: string;
  payment_status: string;
  payment_reference?: string;
  payment_date?: string;
  total_paid: number;

  // Order Status
  status: string;

  // Installation Details
  preferred_installation_date?: string;
  installation_scheduled_date?: string;
  installation_time_slot?: string;
  installation_completed_date?: string;
  technician_notes?: string;

  // Activation Details
  activation_date?: string;
  account_number?: string;
  connection_id?: string;

  // Communication Preferences
  contact_preference: string;
  marketing_opt_in: boolean;
  whatsapp_opt_in: boolean;

  // Order Source
  lead_source: string;
  source_campaign?: string;
  referral_code?: string;
  referred_by?: string;

  // Metadata
  internal_notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAdminAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Use API endpoint to bypass RLS
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any; color: string }> = {
      pending: { label: 'Pending', variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
      payment_pending: { label: 'Payment Pending', variant: 'secondary', icon: CreditCard, color: 'text-orange-600' },
      payment_received: { label: 'Payment Received', variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      kyc_pending: { label: 'KYC Pending', variant: 'secondary', icon: FileText, color: 'text-blue-600' },
      kyc_approved: { label: 'KYC Approved', variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      kyc_rejected: { label: 'KYC Rejected', variant: 'destructive', icon: XCircle, color: 'text-red-600' },
      installation_scheduled: { label: 'Installation Scheduled', variant: 'default', icon: Calendar, color: 'text-blue-600' },
      installation_in_progress: { label: 'Installation In Progress', variant: 'default', icon: Package, color: 'text-purple-600' },
      installation_completed: { label: 'Installation Completed', variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      active: { label: 'Active', variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      on_hold: { label: 'On Hold', variant: 'secondary', icon: AlertCircle, color: 'text-yellow-600' },
      cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle, color: 'text-red-600' },
      failed: { label: 'Failed', variant: 'destructive', icon: XCircle, color: 'text-red-600' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const paymentConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      partial: { label: 'Partial', className: 'bg-blue-100 text-blue-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
      refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-800' }
    };

    const config = paymentConfig[status] || paymentConfig.pending;

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The order you are looking for does not exist.'}</p>
            <Link href="/admin/orders">
              <Button>View All Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
            <p className="text-gray-600 mt-1">
              Created {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Order
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Order Status</p>
                <div className="mt-2">{getStatusBadge(order.status)}</div>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Status</p>
                <div className="mt-2">{getPaymentBadge(order.payment_status)}</div>
              </div>
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold mt-2">R{parseFloat(order.package_price as any).toFixed(2)}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {order.first_name} {order.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email Address</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${order.email}`} className="text-base text-blue-600 hover:underline">
                      {order.email}
                    </a>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${order.phone}`} className="text-base text-blue-600 hover:underline">
                      {order.phone}
                    </a>
                  </div>
                </div>
                {order.alternate_phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Alternate Phone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${order.alternate_phone}`} className="text-base text-blue-600 hover:underline">
                        {order.alternate_phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact Preference</label>
                  <p className="text-base text-gray-900 mt-1 capitalize">{order.contact_preference}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Marketing Opt-in</label>
                  <p className="text-base text-gray-900 mt-1">{order.marketing_opt_in ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">WhatsApp Opt-in</label>
                  <p className="text-base text-gray-900 mt-1">{order.whatsapp_opt_in ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installation Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Installation Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Street Address</label>
                <p className="text-base text-gray-900 mt-1">{order.installation_address}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {order.suburb && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Suburb</label>
                    <p className="text-base text-gray-900 mt-1">{order.suburb}</p>
                  </div>
                )}
                {order.city && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">City</label>
                    <p className="text-base text-gray-900 mt-1">{order.city}</p>
                  </div>
                )}
                {order.province && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Province</label>
                    <p className="text-base text-gray-900 mt-1">{order.province}</p>
                  </div>
                )}
                {order.postal_code && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Postal Code</label>
                    <p className="text-base text-gray-900 mt-1">{order.postal_code}</p>
                  </div>
                )}
              </div>
              {order.special_instructions && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Special Instructions</label>
                    <p className="text-base text-gray-900 mt-1">{order.special_instructions}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Billing Address (if different) */}
          {!order.billing_same_as_installation && order.billing_address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Street Address</label>
                  <p className="text-base text-gray-900 mt-1">{order.billing_address}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {order.billing_suburb && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Suburb</label>
                      <p className="text-base text-gray-900 mt-1">{order.billing_suburb}</p>
                    </div>
                  )}
                  {order.billing_city && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">City</label>
                      <p className="text-base text-gray-900 mt-1">{order.billing_city}</p>
                    </div>
                  )}
                  {order.billing_province && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Province</label>
                      <p className="text-base text-gray-900 mt-1">{order.billing_province}</p>
                    </div>
                  )}
                  {order.billing_postal_code && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Postal Code</label>
                      <p className="text-base text-gray-900 mt-1">{order.billing_postal_code}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Package Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Package Name</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">{order.package_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Speed</label>
                  <p className="text-base text-gray-900 mt-1">{order.package_speed}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Monthly Price</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    R{parseFloat(order.package_price as any).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Installation Fee</label>
                  <p className="text-base text-gray-900 mt-1">
                    R{parseFloat(order.installation_fee as any).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Router Included</label>
                  <p className="text-base text-gray-900 mt-1">{order.router_included ? 'Yes' : 'No'}</p>
                </div>
                {order.router_rental_fee && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Router Rental Fee</label>
                    <p className="text-base text-gray-900 mt-1">
                      R{parseFloat(order.router_rental_fee as any).toFixed(2)}/month
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Method</label>
                  <p className="text-base text-gray-900 mt-1 capitalize">
                    {order.payment_method || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Status</label>
                  <div className="mt-1">{getPaymentBadge(order.payment_status)}</div>
                </div>
                {order.payment_reference && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Reference</label>
                    <p className="text-base text-gray-900 mt-1">{order.payment_reference}</p>
                  </div>
                )}
                {order.payment_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Date</label>
                    <p className="text-base text-gray-900 mt-1">
                      {new Date(order.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Paid</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    R{parseFloat(order.total_paid as any).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline & Notes */}
        <div className="space-y-6">
          {/* Installation Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Installation Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.preferred_installation_date && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Preferred Date</label>
                  <p className="text-base text-gray-900 mt-1">
                    {new Date(order.preferred_installation_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {order.installation_scheduled_date && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Scheduled Date</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {new Date(order.installation_scheduled_date).toLocaleDateString()}
                    {order.installation_time_slot && ` - ${order.installation_time_slot}`}
                  </p>
                </div>
              )}
              {order.installation_completed_date && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Completed Date</label>
                  <p className="text-base text-gray-900 mt-1">
                    {new Date(order.installation_completed_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {order.activation_date && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-600">Activation Date</label>
                    <p className="text-base font-semibold text-green-600 mt-1">
                      {new Date(order.activation_date).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
              {order.account_number && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Account Number</label>
                  <p className="text-base font-mono text-gray-900 mt-1">{order.account_number}</p>
                </div>
              )}
              {order.connection_id && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Connection ID</label>
                  <p className="text-base font-mono text-gray-900 mt-1">{order.connection_id}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Source */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Lead Source</label>
                <p className="text-base text-gray-900 mt-1 capitalize">{order.lead_source.replace('_', ' ')}</p>
              </div>
              {order.source_campaign && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Campaign</label>
                  <p className="text-base text-gray-900 mt-1">{order.source_campaign}</p>
                </div>
              )}
              {order.referral_code && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Referral Code</label>
                  <p className="text-base font-mono text-gray-900 mt-1">{order.referral_code}</p>
                </div>
              )}
              {order.referred_by && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Referred By</label>
                  <p className="text-base text-gray-900 mt-1">{order.referred_by}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.technician_notes || order.internal_notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.technician_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Technician Notes</label>
                    <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">{order.technician_notes}</p>
                  </div>
                )}
                {order.internal_notes && (
                  <>
                    {order.technician_notes && <Separator />}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Internal Notes</label>
                      <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">{order.internal_notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Created At</label>
                <p className="text-base text-gray-900 mt-1">
                  {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-base text-gray-900 mt-1">
                  {new Date(order.updated_at).toLocaleDateString()} at {new Date(order.updated_at).toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
