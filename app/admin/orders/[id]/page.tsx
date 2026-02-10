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
  Loader2,
  Zap,
  Shield,
  Eye,
  Settings,
  History,
  Sparkles,
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

// Stat Card with gradient icon
function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  trend,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  trend?: { label: string; positive?: boolean };
}) {
  return (
    <div className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight truncate">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          {trend && (
            <p className={cn(
              "text-xs flex items-center gap-1 mt-1",
              trend.positive ? "text-emerald-600" : "text-slate-500"
            )}>
              {trend.positive && <TrendingUp className="w-3 h-3" />}
              {trend.label}
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0",
          iconBg
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Section Card with gradient header
function SectionCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  action,
  children,
  headerGradient = "from-slate-50 to-white",
  iconGradient = "from-slate-600 to-slate-800",
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  headerGradient?: string;
  iconGradient?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className={cn("p-5 border-b border-slate-100 bg-gradient-to-r", headerGradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", iconGradient)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {action}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0", className)}>
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{value || '—'}</span>
    </div>
  );
}

// Workflow Step Component for custom stepper
function WorkflowStepItem({
  step,
  isLast,
}: {
  step: WorkflowStep;
  isLast: boolean;
}) {
  const Icon = step.icon;
  const isCompleted = step.status === 'completed';
  const isActive = step.status === 'active';

  return (
    <div className="flex-1 flex flex-col items-center relative group">
      {/* Connector Line */}
      {!isLast && (
        <div className={cn(
          "absolute top-5 left-[calc(50%+24px)] right-0 h-0.5 transition-colors",
          isCompleted ? "bg-emerald-400" : "bg-slate-200"
        )} />
      )}

      {/* Step Circle */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 border-2",
        isCompleted && "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30",
        isActive && "bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/30 animate-pulse",
        !isCompleted && !isActive && "bg-slate-100 border-slate-200"
      )}>
        {isCompleted ? (
          <CheckCircle className="w-5 h-5 text-white" />
        ) : (
          <Icon className={cn(
            "w-5 h-5",
            isActive ? "text-white" : "text-slate-400"
          )} />
        )}
      </div>

      {/* Label */}
      <div className="mt-2 text-center">
        <p className={cn(
          "text-xs font-semibold transition-colors",
          isCompleted && "text-emerald-600",
          isActive && "text-orange-600",
          !isCompleted && !isActive && "text-slate-400"
        )}>
          {step.label}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">{step.subLabel}</p>
        {step.date && (
          <p className="text-[10px] text-slate-500 mt-1 bg-slate-50 px-2 py-0.5 rounded-full">
            {step.date}
          </p>
        )}
      </div>
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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
      installation_completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Installation Complete' },
      installation_scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Installation Scheduled' },
      installation_in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
      payment_method_registered: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Payment Registered' },
      payment_method_pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Payment Pending' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
      failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
      suspended: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Suspended' },
    };
    return configs[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
  };

  const getPaymentBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
      paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Paid' },
      partial: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Partial' },
      failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
      refunded: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Refunded' },
    };
    const config = configs[status] || configs.pending;
    return <Badge className={cn(config.bg, config.text, "border-0 font-medium")}>{config.label}</Badge>;
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
              <Package className="w-6 h-6 text-orange-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Order Not Found</h2>
            <p className="text-slate-500 mb-6">{error || 'The order you are looking for does not exist.'}</p>
            <Link href="/admin/orders">
              <Button className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 relative">
      {/* Subtle crosshatch pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <Link
                href="/admin/orders"
                className="mt-1 p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-slate-900 hover:shadow-md transition-all"
              >
                <ArrowLeft size={20} />
              </Link>

              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 font-serif tracking-tight">
                    Order #{order.order_number}
                  </h1>
                  <Badge className={cn(statusConfig.bg, statusConfig.text, "border-0 font-semibold px-3 py-1")}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-slate-500">
                  Created {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {order.account_number && (
                    <span className="ml-3">
                      Account: <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{order.account_number}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <StatusActionButtons
                currentStatus={order.status}
                orderId={order.id}
                orderNumber={order.order_number}
                packagePrice={order.package_price}
                firstName={order.first_name}
                lastName={order.last_name}
                onStatusUpdate={fetchOrder}
              />
              <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />
              <SendEmailDialog
                defaultTo={order.email}
                defaultSubject={`RE: Order ${order.order_number}`}
                defaultBody={`Hi ${order.first_name},\n\nThank you for choosing CircleTel.\n\n[Your message here]\n\nKind Regards,\nCircleTel Support`}
                customerId={order.customer_id}
                orderId={order.id}
              />
              <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 border-slate-200 gap-2">
                <Printer size={16} />
                <span className="hidden lg:inline">Print</span>
              </Button>
              <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 border-slate-200 gap-2">
                <Download size={16} />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Package"
            value={order.package_name}
            subtitle={order.package_speed}
            icon={Package}
            iconBg="bg-gradient-to-br from-orange-500 to-orange-600"
          />
          <StatCard
            label="Monthly Price"
            value={`R${parseFloat(order.package_price as any).toFixed(2)}`}
            subtitle="Per month"
            icon={Banknote}
            iconBg="bg-gradient-to-br from-emerald-500 to-green-600"
          />
          <StatCard
            label="Payment Status"
            value={order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            subtitle={order.payment_date ? `Paid ${new Date(order.payment_date).toLocaleDateString()}` : 'Awaiting payment'}
            icon={CreditCard}
            iconBg={order.payment_status === 'paid'
              ? "bg-gradient-to-br from-emerald-500 to-green-600"
              : "bg-gradient-to-br from-amber-500 to-orange-500"}
            trend={order.payment_status === 'paid' ? { label: 'Confirmed', positive: true } : undefined}
          />
          <StatCard
            label="Lead Source"
            value={order.lead_source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            subtitle={order.source_campaign || 'Direct'}
            icon={TrendingUp}
            iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
        </div>

        {/* Workflow Stepper */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden">
          <div className="flex items-center overflow-x-auto pb-2 min-w-max lg:min-w-0">
            {getWorkflowSteps(order.status).map((step, index, arr) => (
              <WorkflowStepItem
                key={step.id}
                step={step}
                isLast={index === arr.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white shadow-sm border border-slate-100 p-1 rounded-xl w-full grid grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2.5 transition-all"
            >
              <Eye className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="installation"
              className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2.5 transition-all"
            >
              <Settings className="w-4 h-4 mr-2" />
              Installation
            </TabsTrigger>
            <TabsTrigger
              value="financials"
              className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2.5 transition-all"
            >
              <Banknote className="w-4 h-4 mr-2" />
              Financials
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2.5 transition-all"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Customer Information */}
                <SectionCard
                  icon={User}
                  title="Customer Information"
                  headerGradient="from-blue-50 to-white"
                  iconGradient="from-blue-500 to-indigo-600"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                        <p className="font-semibold text-slate-900">{order.first_name} {order.last_name}</p>
                      </div>
                      {order.account_number && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Account Number</p>
                          <p className="font-mono font-bold text-orange-600">{order.account_number}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <a href={`mailto:${order.email}`} className="text-sm text-blue-600 hover:underline truncate">{order.email}</a>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Phone className="h-4 w-4 text-emerald-600" />
                        </div>
                        <a href={`tel:${order.phone}`} className="text-sm text-slate-700 hover:text-slate-900">{order.phone}</a>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact Pref</p>
                        <p className="text-sm text-slate-700 capitalize">{order.contact_preference}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Marketing</p>
                        <p className="text-sm text-slate-700">{order.marketing_opt_in ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">WhatsApp</p>
                        <p className="text-sm text-slate-700">{order.whatsapp_opt_in ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Residential Address (KYC) */}
                {order.residential_address && (
                  <SectionCard
                    icon={MapPin}
                    title="Current Address"
                    headerGradient="from-emerald-50 to-white"
                    iconGradient="from-emerald-500 to-green-600"
                    badge={order.kyc_address_verified && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-0 gap-1">
                        <Shield className="h-3 w-3" />
                        KYC Verified
                      </Badge>
                    )}
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Street Address</p>
                        <p className="text-slate-900">{order.residential_address}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {order.residential_suburb && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Suburb</p>
                            <p className="text-sm text-slate-700">{order.residential_suburb}</p>
                          </div>
                        )}
                        {order.residential_city && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">City</p>
                            <p className="text-sm text-slate-700">{order.residential_city}</p>
                          </div>
                        )}
                        {order.residential_province && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Province</p>
                            <p className="text-sm text-slate-700">{order.residential_province}</p>
                          </div>
                        )}
                        {order.residential_postal_code && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Postal Code</p>
                            <p className="text-sm text-slate-700">{order.residential_postal_code}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Package Details */}
                <SectionCard
                  icon={Package}
                  title="Package Details"
                  headerGradient="from-orange-50 to-white"
                  iconGradient="from-orange-500 to-orange-600"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Package Name</p>
                      <p className="font-semibold text-slate-900">{order.package_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Speed</p>
                      <p className="text-slate-700">{order.package_speed}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Monthly Price</p>
                      <p className="text-2xl font-bold text-slate-900">R{parseFloat(order.package_price as any).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Installation Fee</p>
                      <p className="text-slate-700">R{parseFloat(order.installation_fee as any).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Router Included</p>
                      <p className="text-slate-700">{order.router_included ? 'Yes' : 'No'}</p>
                    </div>
                    {order.router_rental_fee && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Router Rental</p>
                        <p className="text-slate-700">R{parseFloat(order.router_rental_fee as any).toFixed(2)}/month</p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Order Source */}
                <SectionCard
                  icon={TrendingUp}
                  title="Order Source"
                  headerGradient="from-violet-50 to-white"
                  iconGradient="from-violet-500 to-purple-600"
                >
                  <div className="space-y-3">
                    <InfoRow label="Lead Source" value={order.lead_source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                    {order.source_campaign && <InfoRow label="Campaign" value={order.source_campaign} />}
                    {order.referral_code && (
                      <InfoRow
                        label="Referral Code"
                        value={<span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{order.referral_code}</span>}
                      />
                    )}
                    {order.referred_by && <InfoRow label="Referred By" value={order.referred_by} />}
                  </div>
                </SectionCard>

                {/* Timeline */}
                <SectionCard
                  icon={Clock}
                  title="Timeline"
                  headerGradient="from-cyan-50 to-white"
                  iconGradient="from-cyan-500 to-blue-600"
                >
                  <div className="space-y-1">
                    <InfoRow label="Created" value={new Date(order.created_at).toLocaleString()} />
                    <InfoRow label="Last Updated" value={new Date(order.updated_at).toLocaleString()} />
                    {order.payment_date && (
                      <InfoRow label="Payment Date" value={new Date(order.payment_date).toLocaleString()} />
                    )}
                    {order.installation_scheduled_date && (
                      <InfoRow label="Installation Scheduled" value={new Date(order.installation_scheduled_date).toLocaleString()} />
                    )}
                    {order.activation_date && (
                      <InfoRow
                        label="Activated"
                        value={<span className="text-emerald-600 font-semibold">{new Date(order.activation_date).toLocaleString()}</span>}
                      />
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          {/* INSTALLATION TAB */}
          <TabsContent value="installation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <InstallationSection orderId={order.id} className="border border-slate-100 shadow-sm rounded-2xl" />
              </div>
              <div className="space-y-6">
                {/* Installation Address */}
                <SectionCard
                  icon={MapPin}
                  title="Installation Address"
                  headerGradient="from-amber-50 to-white"
                  iconGradient="from-amber-500 to-orange-500"
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Street Address</p>
                      <p className="text-slate-900">{order.installation_address}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {order.suburb && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Suburb</p>
                          <p className="text-sm text-slate-700">{order.suburb}</p>
                        </div>
                      )}
                      {order.city && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">City</p>
                          <p className="text-sm text-slate-700">{order.city}</p>
                        </div>
                      )}
                      {order.province && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Province</p>
                          <p className="text-sm text-slate-700">{order.province}</p>
                        </div>
                      )}
                      {order.postal_code && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Postal Code</p>
                          <p className="text-sm text-slate-700">{order.postal_code}</p>
                        </div>
                      )}
                    </div>
                    {order.special_instructions && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Special Instructions</p>
                          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4">
                            {order.special_instructions}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </SectionCard>

                {/* Installation Documentation */}
                {order.installation_document_url && (
                  <SectionCard
                    icon={FileText}
                    title="Installation Documentation"
                    headerGradient="from-slate-50 to-white"
                    iconGradient="from-slate-500 to-slate-700"
                  >
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm text-slate-900 truncate max-w-[180px]">
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
                        className="bg-white gap-2"
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
                  </SectionCard>
                )}
              </div>
            </div>
          </TabsContent>

          {/* FINANCIALS TAB */}
          <TabsContent value="financials" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Payment Information */}
                <SectionCard
                  icon={CreditCard}
                  title="Payment Information"
                  headerGradient="from-green-50 to-white"
                  iconGradient="from-green-500 to-emerald-600"
                  badge={getPaymentBadge(order.payment_status)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Payment Method</p>
                      <p className="text-slate-700 capitalize">{order.payment_method || 'Not specified'}</p>
                    </div>
                    {order.payment_reference && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Reference</p>
                        <p className="font-mono text-sm bg-slate-100 px-2 py-1 rounded inline-block">{order.payment_reference}</p>
                      </div>
                    )}
                    {order.payment_date && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Payment Date</p>
                        <p className="text-slate-700">{new Date(order.payment_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Paid</p>
                      <p className="text-2xl font-bold text-emerald-600">R{parseFloat(order.total_paid as any).toFixed(2)}</p>
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
                  className="border border-slate-100 shadow-sm rounded-2xl"
                />

                {/* Billing Address */}
                {!order.billing_same_as_installation && order.billing_address && (
                  <SectionCard
                    icon={FileText}
                    title="Billing Address"
                    headerGradient="from-slate-50 to-white"
                    iconGradient="from-slate-500 to-slate-700"
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Street Address</p>
                        <p className="text-slate-900">{order.billing_address}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {order.billing_suburb && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Suburb</p>
                            <p className="text-sm text-slate-700">{order.billing_suburb}</p>
                          </div>
                        )}
                        {order.billing_city && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">City</p>
                            <p className="text-sm text-slate-700">{order.billing_city}</p>
                          </div>
                        )}
                        {order.billing_province && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Province</p>
                            <p className="text-sm text-slate-700">{order.billing_province}</p>
                          </div>
                        )}
                        {order.billing_postal_code && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Postal Code</p>
                            <p className="text-sm text-slate-700">{order.billing_postal_code}</p>
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
          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Communication Timeline */}
                <CommunicationTimeline orderId={order.id} />
              </div>
              <div className="space-y-6">
                {/* Notes */}
                {(order.technician_notes || order.internal_notes) && (
                  <SectionCard
                    icon={FileText}
                    title="Notes"
                    headerGradient="from-slate-50 to-white"
                    iconGradient="from-slate-500 to-slate-700"
                  >
                    <div className="space-y-4">
                      {order.technician_notes && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technician Notes</p>
                          <p className="text-sm text-blue-800 whitespace-pre-wrap bg-blue-50 border border-blue-100 rounded-xl p-4">
                            {order.technician_notes}
                          </p>
                        </div>
                      )}
                      {order.internal_notes && (
                        <>
                          {order.technician_notes && <Separator />}
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Internal Notes</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-xl p-4">
                              {order.internal_notes}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </SectionCard>
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
    </div>
  );
}
