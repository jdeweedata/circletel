'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Circle,
  Clock,
  CreditCard,
  FileText,
  Calendar,
  Wifi,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTimelineProps {
  currentStatus: string;
  createdAt: string;
  paymentDate?: string | null;
  kycSubmittedDate?: string | null;
  kycApprovedDate?: string | null;
  installationScheduledDate?: string | null;
  installationCompletedDate?: string | null;
  activationDate?: string | null;
  cancelledDate?: string | null;
  cancelReason?: string | null;
}

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending' | 'skipped';
  date?: string | null;
  description?: string;
}

export function OrderTimeline({
  currentStatus,
  createdAt,
  paymentDate,
  kycSubmittedDate,
  kycApprovedDate,
  installationScheduledDate,
  installationCompletedDate,
  activationDate,
  cancelledDate,
  cancelReason,
}: OrderTimelineProps) {
  // Format date for display
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine step status based on order status and dates
  const getStepStatus = (
    stepId: string,
    requiredDate?: string | null
  ): 'completed' | 'current' | 'pending' | 'skipped' => {
    // If order is cancelled, mark all future steps as skipped
    if (currentStatus === 'cancelled') {
      const stepOrder = ['pending', 'payment', 'kyc_submitted', 'kyc_approved', 'installation_scheduled', 'installation_completed', 'active'];
      const currentIndex = stepOrder.indexOf(currentStatus);
      const stepIndex = stepOrder.indexOf(stepId);

      if (stepIndex < currentIndex) return 'completed';
      if (stepIndex === currentIndex) return 'current';
      return 'skipped';
    }

    // Normal flow
    if (requiredDate) return 'completed';

    const statusOrder = [
      'pending',
      'payment',
      'kyc_submitted',
      'kyc_approved',
      'installation_scheduled',
      'installation_completed',
      'active',
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  // Build timeline steps
  const steps: TimelineStep[] = [
    {
      id: 'pending',
      label: 'Order Received',
      icon: CheckCircle,
      status: 'completed', // Always completed when order is created
      date: createdAt,
      description: 'Your order has been received and is being processed',
    },
    {
      id: 'payment',
      label: 'Payment Confirmed',
      icon: CreditCard,
      status: getStepStatus('payment', paymentDate),
      date: paymentDate,
      description: paymentDate
        ? 'Payment received successfully'
        : 'Waiting for payment confirmation',
    },
    {
      id: 'kyc_submitted',
      label: 'Documents Submitted',
      icon: FileText,
      status: getStepStatus('kyc_submitted', kycSubmittedDate),
      date: kycSubmittedDate,
      description: kycSubmittedDate
        ? 'KYC documents submitted for verification'
        : 'Please submit required KYC documents',
    },
    {
      id: 'kyc_approved',
      label: 'Documents Approved',
      icon: CheckCircle,
      status: getStepStatus('kyc_approved', kycApprovedDate),
      date: kycApprovedDate,
      description: kycApprovedDate
        ? 'Your documents have been verified and approved'
        : 'Documents under review',
    },
    {
      id: 'installation_scheduled',
      label: 'Installation Scheduled',
      icon: Calendar,
      status: getStepStatus('installation_scheduled', installationScheduledDate),
      date: installationScheduledDate,
      description: installationScheduledDate
        ? `Installation scheduled for ${formatDate(installationScheduledDate)}`
        : 'Waiting to schedule installation',
    },
    {
      id: 'installation_completed',
      label: 'Installation Complete',
      icon: CheckCircle,
      status: getStepStatus('installation_completed', installationCompletedDate),
      date: installationCompletedDate,
      description: installationCompletedDate
        ? 'Installation completed successfully'
        : 'Pending installation',
    },
    {
      id: 'active',
      label: 'Service Active',
      icon: Wifi,
      status: getStepStatus('active', activationDate),
      date: activationDate,
      description: activationDate
        ? 'Your service is now active and running'
        : 'Service will be activated after installation',
    },
  ];

  // If cancelled, add cancellation step
  if (currentStatus === 'cancelled') {
    steps.push({
      id: 'cancelled',
      label: 'Order Cancelled',
      icon: AlertCircle,
      status: 'current',
      date: cancelledDate,
      description: cancelReason || 'Order has been cancelled',
    });
  }

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      case 'payment':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Order Status Timeline</CardTitle>
          <Badge variant="outline" className={cn('font-semibold', getStatusColor(currentStatus))}>
            {currentStatus.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative">
                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-5 top-11 w-0.5 h-10',
                      step.status === 'completed'
                        ? 'bg-green-500'
                        : step.status === 'current'
                        ? 'bg-circleTel-orange'
                        : step.status === 'skipped'
                        ? 'bg-red-300'
                        : 'bg-gray-300'
                    )}
                  />
                )}

                {/* Step content */}
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                      step.status === 'completed'
                        ? 'bg-green-100 border-green-500 text-green-600'
                        : step.status === 'current'
                        ? 'bg-orange-50 border-circleTel-orange text-circleTel-orange ring-4 ring-orange-100'
                        : step.status === 'skipped'
                        ? 'bg-red-50 border-red-300 text-red-400'
                        : 'bg-gray-50 border-gray-300 text-gray-400'
                    )}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : step.status === 'current' ? (
                      <Clock className="w-5 h-5" />
                    ) : step.status === 'skipped' ? (
                      <Circle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className={cn(
                          'font-semibold',
                          step.status === 'completed'
                            ? 'text-gray-900'
                            : step.status === 'current'
                            ? 'text-circleTel-orange'
                            : step.status === 'skipped'
                            ? 'text-red-400'
                            : 'text-gray-500'
                        )}
                      >
                        {step.label}
                      </h4>
                      {step.date && (
                        <span className="text-xs text-gray-500">
                          {formatDate(step.date)}
                        </span>
                      )}
                    </div>

                    <p
                      className={cn(
                        'text-sm',
                        step.status === 'completed'
                          ? 'text-gray-600'
                          : step.status === 'current'
                          ? 'text-gray-700 font-medium'
                          : step.status === 'skipped'
                          ? 'text-red-400'
                          : 'text-gray-500'
                      )}
                    >
                      {step.description}
                    </p>

                    {/* Current step action hints */}
                    {step.status === 'current' && step.id === 'payment' && (
                      <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-sm text-orange-800">
                          <strong>Next Step:</strong> Complete payment to proceed with your order.
                          Check your email for payment instructions.
                        </p>
                      </div>
                    )}

                    {step.status === 'current' && step.id === 'kyc_submitted' && (
                      <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-sm text-orange-800">
                          <strong>Next Step:</strong> Upload your KYC documents (ID, proof of
                          address) to continue.
                        </p>
                      </div>
                    )}

                    {step.status === 'current' && step.id === 'installation_scheduled' && (
                      <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-sm text-orange-800">
                          <strong>Next Step:</strong> Our team will contact you to schedule your
                          installation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help text */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-600">
            Need help with your order?{' '}
            <a
              href="mailto:support@circletel.co.za"
              className="text-circleTel-orange hover:underline font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
