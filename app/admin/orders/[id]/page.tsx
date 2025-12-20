'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
  AlertCircle,
  Printer,
  Download,
  Inbox,
  Banknote,
  Wrench,
  CheckSquare,
  Wifi,
  TrendingUp,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { WorkflowStepper, WorkflowStep } from '@/components/admin/orders/WorkflowStepper';
import { StatusActionButtons } from '@/components/admin/orders/StatusActionButtons';
import { CommunicationTimeline } from '@/components/admin/orders/CommunicationTimeline';
import { InstallationSection } from '@/components/admin/orders/InstallationSection';
import { PaymentMethodStatus } from '@/components/admin/orders/PaymentMethodStatus';
import { PaymentMethodRegistrationModal } from '@/components/admin/orders/PaymentMethodRegistrationModal';
import { OrderInvoices } from '@/components/admin/orders/OrderInvoices';
import { SendEmailDialog } from '@/components/admin/support/SendEmailDialog';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;

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

  // Residential Address (from KYC verification)
  residential_address?: string;
  residential_suburb?: string;
  residential_city?: string;
  residential_province?: string;
  residential_postal_code?: string;
  kyc_address_verified?: boolean;
  kyc_address_verified_at?: string;

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

// Dashboard-style card component
function DashboardCard({
  children,
  className,
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden border border-gray-200 bg-white',
        'shadow-sm transition-all duration-200 rounded-lg',
        onClick && 'cursor-pointer hover:shadow-lg hover:scale-[1.01] hover:border-circleTel-orange/30',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Dashboard-style card header
function DashboardCardHeader({
  icon: Icon,
  title,
  badge,
  action
}: {
  icon: React.ElementType;
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Icon className="h-5 w-5 text-circleTel-orange" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {action}
        </div>
      </div>
    </div>
  );
}

// Dashboard-style stat card
function OrderStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-gray-100',
  iconColor = 'text-gray-600',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className={cn(
      'relative overflow-hidden border border-gray-200 bg-white',
      'shadow-sm transition-all duration-200 rounded-lg p-6',
      'hover:shadow-lg hover:scale-[1.02] hover:border-circleTel-orange/30'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </div>
      <div className="mb-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
      </div>
      <div className="mb-1">
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
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
    const isActive = status === 'active' || status === 'Service Active';
    const isCompleted = status === 'completed' || status === 'Installation Complete' || status === 'installation_completed';
    const isInProgress = status.includes('Progress') || status.includes('Installation');
    const isPending = status === 'pending' || status === 'Payment Pending';
    const isCancelled = status === 'cancelled' || status === 'Failed';

    return (
      <Badge className={cn(
        'px-3 py-1 rounded-full text-sm font-semibold border',
        isActive || isCompleted ? 'bg-green-100 text-green-700 border-green-200' :
        isInProgress ? 'bg-blue-100 text-blue-700 border-blue-200' :
        isPending ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
        isCancelled ? 'bg-red-100 text-red-700 border-red-200' :
        'bg-gray-100 text-gray-700 border-gray-200'
      )}>
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-700 border-green-200' },
      partial: { label: 'Partial', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' },
      refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-700 border-gray-200' }
    };

    const { label, className } = config[status] || config.pending;

    return (
      <Badge className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border', className)}>
        {label}
      </Badge>
    );
  };

  const getWorkflowSteps = (currentStatus: string): WorkflowStep[] => {
    const getStepStatus = (orderStatus: string, stepName: string): 'completed' | 'active' | 'pending' => {
      const statusMap: Record<string, number> = {
        'pending': 1,
        'payment_method_pending': 2,
        'payment_method_registered': 3,
        'installation_scheduled': 4,
        'installation_in_progress': 5,
        'installation_completed': 6,
        'active': 7,
        'suspended': 7,
        'cancelled': 0,
        'failed': 0
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

      if (currentStepId === 0) return 'pending';
      if (thisStepId < currentStepId) return 'completed';
      if (thisStepId === currentStepId) return 'active';
      return 'pending';
    };

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
        date: order.payment_date ? formatShortDate(order.payment_date) : undefined
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
        <DashboardCard className="p-12">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
            <Link href="/admin/orders">
              <Button className="bg-circleTel-orange hover:bg-orange-600">View All Orders</Button>
            </Link>
          </div>
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Clean Modern Header - Dashboard Style */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/orders"
            className="mt-1 p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-gray-900">
                Order #{order.order_number}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-sm text-gray-500">
              Created {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              {order.account_number && (
                <span className="ml-3">
                  Account: <span className="font-medium text-circleTel-orange">{order.account_number}</span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 ml-12">
          <StatusActionButtons
            currentStatus={order.status}
            orderId={order.id}
            orderNumber={order.order_number}
            packagePrice={order.package_price}
            firstName={order.first_name}
            lastName={order.last_name}
            onStatusUpdate={fetchOrder}
          />
          <div className="h-6 w-px bg-gray-200 mx-1 hidden lg:block" />
          <SendEmailDialog
            defaultTo={order.email}
            defaultSubject={`RE: Order ${order.order_number}`}
            defaultBody={`Hi ${order.first_name},\n\nThank you for choosing CircleTel.\n\n[Your message here]\n\nKind Regards,\nCircleTel Support`}
            customerId={order.customer_id}
            orderId={order.id}
          />
          <Button variant="outline" size="sm" className="gap-2 border-gray-200 hover:border-circleTel-orange/30">
            <Printer size={16} />
            <span className="hidden lg:inline">Print</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-gray-200 hover:border-circleTel-orange/30">
            <Download size={16} />
            <span className="hidden lg:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats - Dashboard Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <OrderStatCard
          title="Package"
          value={order.package_name}
          subtitle={order.package_speed}
          icon={Package}
          iconBg="bg-orange-100"
          iconColor="text-circleTel-orange"
        />
        <OrderStatCard
          title="Monthly Price"
          value={`R${parseFloat(order.package_price as any).toFixed(2)}`}
          subtitle="Per month"
          icon={CreditCard}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <OrderStatCard
          title="Payment Status"
          value={order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
          subtitle={order.payment_date ? `Paid ${new Date(order.payment_date).toLocaleDateString()}` : 'Awaiting payment'}
          icon={Banknote}
          iconBg={order.payment_status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'}
          iconColor={order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}
        />
        <OrderStatCard
          title="Lead Source"
          value={order.lead_source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          subtitle={order.source_campaign || 'Direct'}
          icon={TrendingUp}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
      </div>

      {/* Workflow Stepper - Dashboard Card Style */}
      <DashboardCard>
        <WorkflowStepper steps={getWorkflowSteps(order.status)} currentStatus={order.status} />
      </DashboardCard>

      {/* Tabs Interface - Dashboard Style */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white p-1.5 border border-gray-200 rounded-xl shadow-sm h-auto grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger
            value="overview"
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-circleTel-orange data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-50"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="installation"
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-circleTel-orange data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-50"
          >
            Installation & Service
          </TabsTrigger>
          <TabsTrigger
            value="financials"
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-circleTel-orange data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-50"
          >
            Financials
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-circleTel-orange data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-50"
          >
            History & Notes
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Customer Information */}
              <DashboardCard>
                <DashboardCardHeader icon={User} title="Customer Information" />
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {order.first_name} {order.last_name}
                      </p>
                    </div>
                    {order.account_number && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Number</label>
                        <p className="text-base font-semibold text-circleTel-orange mt-1">
                          {order.account_number}
                        </p>
                      </div>
                    )}
                    <div className="min-w-0">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                      <div className="flex items-center gap-2 mt-1 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <a href={`mailto:${order.email}`} className="text-sm text-blue-600 hover:underline truncate" title={order.email}>
                          {order.email}
                        </a>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        <a href={`tel:${order.phone}`} className="text-sm text-blue-600 hover:underline">
                          {order.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Pref</label>
                      <p className="text-sm text-gray-900 mt-1 capitalize">{order.contact_preference}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Marketing</label>
                      <p className="text-sm text-gray-900 mt-1">{order.marketing_opt_in ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">WhatsApp</label>
                      <p className="text-sm text-gray-900 mt-1">{order.whatsapp_opt_in ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* Residential Address (KYC Verified) */}
              {order.residential_address && (
                <DashboardCard>
                  <DashboardCardHeader
                    icon={MapPin}
                    title="Current Address"
                    badge={order.kyc_address_verified && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        KYC Verified
                      </Badge>
                    )}
                  />
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Street Address</label>
                      <p className="text-sm text-gray-900 mt-1">{order.residential_address}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {order.residential_suburb && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suburb</label>
                          <p className="text-sm text-gray-900 mt-1">{order.residential_suburb}</p>
                        </div>
                      )}
                      {order.residential_city && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</label>
                          <p className="text-sm text-gray-900 mt-1">{order.residential_city}</p>
                        </div>
                      )}
                      {order.residential_province && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Province</label>
                          <p className="text-sm text-gray-900 mt-1">{order.residential_province}</p>
                        </div>
                      )}
                      {order.residential_postal_code && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Postal Code</label>
                          <p className="text-sm text-gray-900 mt-1">{order.residential_postal_code}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DashboardCard>
              )}

              {/* Package Details */}
              <DashboardCard>
                <DashboardCardHeader icon={Package} title="Package Details" />
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Package Name</label>
                      <p className="text-base font-semibold text-gray-900 mt-1">{order.package_name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Speed</label>
                      <p className="text-sm text-gray-900 mt-1">{order.package_speed}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Price</label>
                      <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">
                        R{parseFloat(order.package_price as any).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Installation Fee</label>
                      <p className="text-sm text-gray-900 mt-1">
                        R{parseFloat(order.installation_fee as any).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Router Included</label>
                      <p className="text-sm text-gray-900 mt-1">{order.router_included ? 'Yes' : 'No'}</p>
                    </div>
                    {order.router_rental_fee && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Router Rental</label>
                        <p className="text-sm text-gray-900 mt-1">
                          R{parseFloat(order.router_rental_fee as any).toFixed(2)}/month
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </DashboardCard>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Order Source */}
              <DashboardCard>
                <DashboardCardHeader icon={TrendingUp} title="Order Source" />
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lead Source</label>
                    <p className="text-sm text-gray-900 mt-1 capitalize">{order.lead_source.replace('_', ' ')}</p>
                  </div>
                  {order.source_campaign && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Campaign</label>
                      <p className="text-sm text-gray-900 mt-1">{order.source_campaign}</p>
                    </div>
                  )}
                  {order.referral_code && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Referral Code</label>
                      <p className="text-sm font-mono text-gray-900 mt-1 bg-gray-50 px-2 py-1 rounded inline-block">
                        {order.referral_code}
                      </p>
                    </div>
                  )}
                  {order.referred_by && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Referred By</label>
                      <p className="text-sm text-gray-900 mt-1">{order.referred_by}</p>
                    </div>
                  )}
                </div>
              </DashboardCard>

              {/* Timestamps */}
              <DashboardCard>
                <DashboardCardHeader icon={Clock} title="Timeline" />
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium text-gray-900">{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">{new Date(order.updated_at).toLocaleString()}</span>
                  </div>
                  {order.payment_date && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Payment Date</span>
                      <span className="text-sm font-medium text-gray-900">{new Date(order.payment_date).toLocaleString()}</span>
                    </div>
                  )}
                  {order.installation_scheduled_date && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Installation Scheduled</span>
                      <span className="text-sm font-medium text-gray-900">{new Date(order.installation_scheduled_date).toLocaleString()}</span>
                    </div>
                  )}
                  {order.activation_date && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Activated</span>
                      <span className="text-sm font-medium text-green-600">{new Date(order.activation_date).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </DashboardCard>
            </div>
          </div>
        </TabsContent>

        {/* INSTALLATION TAB */}
        <TabsContent value="installation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <InstallationSection orderId={order.id} className="border border-gray-200 shadow-sm rounded-lg" />
            </div>
            <div className="space-y-6">
              {/* Installation Address */}
              <DashboardCard>
                <DashboardCardHeader icon={MapPin} title="Installation Address" />
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Street Address</label>
                    <p className="text-sm text-gray-900 mt-1">{order.installation_address}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {order.suburb && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suburb</label>
                        <p className="text-sm text-gray-900 mt-1">{order.suburb}</p>
                      </div>
                    )}
                    {order.city && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</label>
                        <p className="text-sm text-gray-900 mt-1">{order.city}</p>
                      </div>
                    )}
                    {order.province && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Province</label>
                        <p className="text-sm text-gray-900 mt-1">{order.province}</p>
                      </div>
                    )}
                    {order.postal_code && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Postal Code</label>
                        <p className="text-sm text-gray-900 mt-1">{order.postal_code}</p>
                      </div>
                    )}
                  </div>
                  {order.special_instructions && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Special Instructions</label>
                        <p className="text-sm text-gray-900 mt-1 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                          {order.special_instructions}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </DashboardCard>

              {/* Installation Documentation */}
              {order.installation_document_url && (
                <DashboardCard>
                  <DashboardCardHeader icon={FileText} title="Installation Documentation" />
                  <div className="p-6">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm text-gray-900 truncate max-w-[180px]" title={order.installation_document_name}>
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
                        className="gap-2 border-gray-200 hover:border-circleTel-orange/30"
                        onClick={() => {
                          const url = order.installation_document_url?.startsWith('http')
                            ? order.installation_document_url
                            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/installation-documents/${order.installation_document_url}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </DashboardCard>
              )}
            </div>
          </div>
        </TabsContent>

        {/* FINANCIALS TAB */}
        <TabsContent value="financials" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Payment Information */}
              <DashboardCard>
                <DashboardCardHeader
                  icon={CreditCard}
                  title="Payment Information"
                  badge={getPaymentBadge(order.payment_status)}
                />
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Method</label>
                      <p className="text-sm text-gray-900 mt-1 capitalize">
                        {order.payment_method || 'Not specified'}
                      </p>
                    </div>
                    {order.payment_reference && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reference</label>
                        <p className="text-sm font-mono text-gray-900 mt-1 bg-gray-50 px-2 py-1 rounded inline-block">
                          {order.payment_reference}
                        </p>
                      </div>
                    )}
                    {order.payment_date && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Date</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(order.payment_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Paid</label>
                      <p className="text-xl font-bold text-green-600 mt-1 tabular-nums">
                        R{parseFloat(order.total_paid as any).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </DashboardCard>

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
                className="border border-gray-200 shadow-sm rounded-lg"
              />

              {/* Billing Address */}
              {!order.billing_same_as_installation && order.billing_address && (
                <DashboardCard>
                  <DashboardCardHeader icon={FileText} title="Billing Address" />
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Street Address</label>
                      <p className="text-sm text-gray-900 mt-1">{order.billing_address}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {order.billing_suburb && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suburb</label>
                          <p className="text-sm text-gray-900 mt-1">{order.billing_suburb}</p>
                        </div>
                      )}
                      {order.billing_city && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</label>
                          <p className="text-sm text-gray-900 mt-1">{order.billing_city}</p>
                        </div>
                      )}
                      {order.billing_province && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Province</label>
                          <p className="text-sm text-gray-900 mt-1">{order.billing_province}</p>
                        </div>
                      )}
                      {order.billing_postal_code && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Postal Code</label>
                          <p className="text-sm text-gray-900 mt-1">{order.billing_postal_code}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DashboardCard>
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
                <DashboardCard>
                  <DashboardCardHeader icon={FileText} title="Notes" />
                  <div className="p-6 space-y-4">
                    {order.technician_notes && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Technician Notes</label>
                        <p className="text-sm text-gray-900 mt-2 whitespace-pre-wrap bg-blue-50 border border-blue-100 rounded-lg p-3">
                          {order.technician_notes}
                        </p>
                      </div>
                    )}
                    {order.internal_notes && (
                      <>
                        {order.technician_notes && <Separator />}
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Internal Notes</label>
                          <p className="text-sm text-gray-900 mt-2 whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-lg p-3">
                            {order.internal_notes}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </DashboardCard>
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
          fetchOrder();
          setPaymentMethodModal(false);
        }}
      />
    </div>
  );
}
