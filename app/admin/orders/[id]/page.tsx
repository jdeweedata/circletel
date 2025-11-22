'use client';

// Forced update to trigger recompilation
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Download,
  Inbox,
  Banknote,
  Wrench,
  CheckSquare,
  Wifi
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { WorkflowStepper, WorkflowStep } from '@/components/admin/orders/WorkflowStepper';
import { StatusActionButtons } from '@/components/admin/orders/StatusActionButtons';
import { CommunicationTimeline } from '@/components/admin/orders/CommunicationTimeline';
import { InstallationSection } from '@/components/admin/orders/InstallationSection';
import { PaymentMethodStatus } from '@/components/admin/orders/PaymentMethodStatus';
import { PaymentMethodRegistrationModal } from '@/components/admin/orders/PaymentMethodRegistrationModal';

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

  // Enriched Data from API
  payment_method_active?: boolean;
  payment_method_mandate_status?: string;
  
  // Installation Documentation
  installation_document_url?: string;
  installation_document_name?: string;
  installation_completed_at?: string;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAdminAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethodModal, setPaymentMethodModal] = useState(false);

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
    return (
      <Badge className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        status === 'active' || status === 'Service Active'
          ? 'bg-green-100 text-green-700 border-green-200'
          : status.includes('Progress') || status.includes('Installation')
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : status === 'completed' || status === 'Installation Complete' || status === 'installation_completed'
          ? 'bg-green-100 text-green-700 border-green-200'
          : status === 'pending' || status === 'Payment Pending'
          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
          : status === 'cancelled' || status === 'Failed'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-gray-100 text-gray-700 border-gray-200'
      }`}>
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

  const getWorkflowSteps = (currentStatus: string): WorkflowStep[] => {
    // Helper function to determine step status
    const getStepStatus = (orderStatus: string, stepName: string): 'completed' | 'active' | 'pending' => {
      const statusMap: Record<string, number> = {
        'pending': 1,
        'payment_method_pending': 2,
        'payment_method_registered': 3,
        'installation_scheduled': 4,
        'installation_in_progress': 5,
        'installation_completed': 6,
        'active': 7,
        'suspended': 7, // Treat as active phase
        'cancelled': 0, // Special case
        'failed': 0 // Special case
      };

      const stepIds: Record<string, number> = {
        'Order Received': 1,
        'Payment Method': 2,
        'Payment Confirmed': 3,
        'Scheduled': 4,
        'Installation': 5,
        'Completion': 6,
        'Active': 7,
      };

      const currentStepId = statusMap[orderStatus] || 1;
      const thisStepId = stepIds[stepName] || 1;

      if (currentStepId === 0) return 'pending'; // Cancelled/Failed
      if (thisStepId < currentStepId) return 'completed';
      if (thisStepId === currentStepId) return 'active';
      return 'pending';
    };

    // Helper function to format date
    const formatShortDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    if (!order) return [];

    return [
      {
        id: 1,
        label: "Order Received",
        subLabel: "Order created",
        status: order.status === 'pending' ? 'active' : 'completed',
        icon: Inbox,
        date: order.created_at ? formatShortDate(order.created_at) : undefined
      },
      {
        id: 2,
        label: "Payment Method",
        subLabel: "Method registered",
        status: getStepStatus(order.status, 'Payment Method'),
        icon: CreditCard,
        date: order.payment_date ? formatShortDate(order.payment_date) : undefined // Approximation
      },
      {
        id: 3,
        label: "Payment Confirmed",
        subLabel: "Deposit received",
        status: getStepStatus(order.status, 'Payment Confirmed'),
        icon: Banknote,
        date: order.payment_date ? formatShortDate(order.payment_date) : undefined
      },
      {
        id: 4,
        label: "Scheduled",
        subLabel: "Install booked",
        status: getStepStatus(order.status, 'Scheduled'),
        icon: Calendar,
        date: order.installation_scheduled_date ? formatShortDate(order.installation_scheduled_date) : undefined
      },
      {
        id: 5,
        label: "Installation",
        subLabel: "Tech on-site",
        status: getStepStatus(order.status, 'Installation'),
        icon: Wrench,
        date: order.installation_scheduled_date ? formatShortDate(order.installation_scheduled_date) : undefined
      },
      {
        id: 6,
        label: "Completion",
        subLabel: "Work finished",
        status: getStepStatus(order.status, 'Completion'),
        icon: CheckSquare,
        date: order.installation_completed_date ? formatShortDate(order.installation_completed_date) : undefined
      },
      {
        id: 7,
        label: "Active",
        subLabel: "Service live",
        status: getStepStatus(order.status, 'Active'),
        icon: Wifi,
        date: order.activation_date ? formatShortDate(order.activation_date) : undefined
      },
    ];
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
    <main className="flex-1 overflow-x-hidden overflow-y-auto pb-10 bg-gray-50">
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Back Button */}
            <Link
              href="/admin/orders"
              className="mt-1 p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              title="Back to Orders"
            >
              <ArrowLeft size={24} />
            </Link>

            {/* Order ID and Status */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order #{order.order_number}
                </h2>
                {getStatusBadge(order.status)}
              </div>
              <span className="text-sm text-gray-500 mt-1 block">
                Created {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 justify-end">
            <StatusActionButtons
              currentStatus={order.status}
              orderId={order.id}
              orderNumber={order.order_number}
              packagePrice={order.package_price}
              firstName={order.first_name}
              lastName={order.last_name}
              onStatusUpdate={fetchOrder}
            />
            <div className="h-8 w-px bg-gray-200 mx-1 hidden lg:block" />
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-9 whitespace-nowrap">
              <Printer size={16} />
              <span className="hidden lg:inline">Print</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-9 whitespace-nowrap">
              <Download size={16} />
              <span className="hidden lg:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Workflow Stepper */}
      <Card className="shadow-sm overflow-hidden">
        <WorkflowStepper steps={getWorkflowSteps(order.status)} currentStatus={order.status} />
      </Card>

      {/* Tabs Interface */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white p-1 border border-gray-200 rounded-lg shadow-sm h-auto grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Overview</TabsTrigger>
          <TabsTrigger value="installation" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Installation & Service</TabsTrigger>
          <TabsTrigger value="financials" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Financials</TabsTrigger>
          <TabsTrigger value="history" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">History & Notes</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Customer & Package */}
            <div className="space-y-6">
              {/* Customer Information */}
              <Card className="shadow-sm">
                <CardHeader className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-gray-700" />
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Customer Information
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {order.first_name} {order.last_name}
                      </p>
                    </div>
                    {order.account_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">CircleTel Account Number</label>
                        <p className="text-base font-semibold text-circleTel-orange mt-1">
                          {order.account_number}
                        </p>
                      </div>
                    )}
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

              {/* Package Details */}
              <Card className="shadow-sm">
                <CardHeader className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-gray-700" />
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Package Details
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
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
            </div>

            {/* Right Column: Order Source & Timestamps */}
            <div className="space-y-6">
              {/* Order Source */}
              <Card className="shadow-sm">
                <CardHeader className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-gray-700" />
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Order Source
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
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

              {/* Timestamps */}
              <Card className="shadow-sm">
                <CardHeader className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-gray-700" />
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Timestamps
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created</span>
                    <span className="text-gray-900">{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-gray-900">{new Date(order.updated_at).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* INSTALLATION TAB */}
        <TabsContent value="installation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
               {/* Installation Section */}
               <InstallationSection orderId={order.id} className="shadow-sm" />
            </div>
            <div className="space-y-6">
               {/* Installation Address */}
               <Card className="shadow-sm">
                <CardHeader className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <MapPin size={20} className="text-gray-700" />
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Installation Address
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
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

               {/* Installation Documentation */}
               {order.installation_document_url && (
                <Card className="shadow-sm">
                  <CardHeader className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-gray-700" />
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        Installation Documentation
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded border">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm truncate max-w-[150px] sm:max-w-[200px]" title={order.installation_document_name}>
                            {order.installation_document_name || 'Installation Proof'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded {order.installation_completed_at ? new Date(order.installation_completed_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = order.installation_document_url?.startsWith('http')
                            ? order.installation_document_url
                            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/installation-documents/${order.installation_document_url}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* FINANCIALS TAB */}
        <TabsContent value="financials" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="space-y-6">
               {/* Payment Information */}
               <Card className="shadow-sm">
                <CardHeader className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} className="text-gray-700" />
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Payment Information
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
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

               {/* Payment Method Status */}
               <PaymentMethodStatus
                orderId={order.id}
                onRequestPaymentMethod={() => setPaymentMethodModal(true)}
              />
             </div>
             <div className="space-y-6">
               {/* Billing Address */}
               {!order.billing_same_as_installation && order.billing_address && (
                <Card className="shadow-sm">
                  <CardHeader className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-gray-700" />
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        Billing Address
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
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
             </div>
           </div>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="space-y-6">
               {/* Communication Timeline */}
               <CommunicationTimeline orderId={order.id} />
             </div>
             <div className="space-y-6">
               {/* Notes */}
               {(order.technician_notes || order.internal_notes) && (
                <Card className="shadow-sm">
                  <CardHeader className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-gray-700" />
                      <CardTitle className="text-lg font-semibold text-gray-800">
                        Notes
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
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
             </div>
           </div>
        </TabsContent>
      </Tabs>

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
          fetchOrder(); // Refresh order data
          setPaymentMethodModal(false);
        }}
      />
    </div>
    </main>
  );
}
