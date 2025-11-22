'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CreditCard,
  Calendar,
  PlayCircle,
  CheckCircle,
  XCircle,
  PauseCircle,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { StatusUpdateModal } from './StatusUpdateModal';
import { InstallationCompletionModal } from './InstallationCompletionModal';
import { OrderActivationModal } from './OrderActivationModal';
import { InstallationDocumentUploadModal } from './InstallationDocumentUploadModal';

interface StatusAction {
  status: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  description: string;
  requiresInput?: boolean;
}

interface StatusActionButtonsProps {
  currentStatus: string;
  orderId: string;
  orderNumber?: string;
  packagePrice?: number;
  firstName?: string;
  lastName?: string;
  onStatusUpdate: () => void;
}

const STATUS_ACTIONS: Record<string, StatusAction[]> = {
  pending: [
    {
      status: 'payment_method_pending',
      label: 'Request Payment Method',
      icon: CreditCard,
      variant: 'default',
      description: 'Ask customer to register their payment method',
    },
    {
      status: 'cancelled',
      label: 'Cancel Order',
      icon: XCircle,
      variant: 'destructive',
      description: 'Cancel this order',
      requiresInput: true,
    },
  ],
  payment_method_pending: [
    {
      status: 'payment_method_registered',
      label: 'Confirm Payment Method',
      icon: CheckCircle,
      variant: 'default',
      description: 'Mark payment method as registered',
    },
    {
      status: 'cancelled',
      label: 'Cancel Order',
      icon: XCircle,
      variant: 'destructive',
      description: 'Cancel this order',
      requiresInput: true,
    },
  ],
  payment_method_registered: [
    {
      status: 'installation_scheduled',
      label: 'Schedule Installation',
      icon: Calendar,
      variant: 'default',
      description: 'Set installation date and time',
      requiresInput: true,
    },
    {
      status: 'cancelled',
      label: 'Cancel Order',
      icon: XCircle,
      variant: 'destructive',
      description: 'Cancel this order',
      requiresInput: true,
    },
  ],
  installation_scheduled: [
    {
      status: 'installation_in_progress',
      label: 'Start Installation',
      icon: PlayCircle,
      variant: 'default',
      description: 'Mark installation as started',
    },
    {
      status: 'installation_scheduled',
      label: 'Reschedule',
      icon: Calendar,
      variant: 'secondary',
      description: 'Reschedule installation date',
      requiresInput: true,
    },
    {
      status: 'cancelled',
      label: 'Cancel Order',
      icon: XCircle,
      variant: 'destructive',
      description: 'Cancel this order',
      requiresInput: true,
    },
  ],
  installation_in_progress: [
    {
      status: 'installation_completed',
      label: 'Complete Installation',
      icon: CheckCircle,
      variant: 'default',
      description: 'Mark installation as completed with document upload',
      requiresInput: true, // Will use custom modal
    },
    {
      status: 'installation_scheduled',
      label: 'Reschedule',
      icon: Calendar,
      variant: 'secondary',
      description: 'Client unavailable - Reschedule',
      requiresInput: true,
    },
    {
      status: 'failed',
      label: 'Mark as Failed',
      icon: AlertTriangle,
      variant: 'destructive',
      description: 'Installation failed',
      requiresInput: true,
    },
    {
      status: 'cancelled',
      label: 'Cancel Order',
      icon: XCircle,
      variant: 'destructive',
      description: 'Cancel this order',
      requiresInput: true,
    },
  ],
  installation_completed: [
    {
      status: 'active',
      label: 'Activate Service',
      icon: PlayCircle,
      variant: 'default',
      description: 'Activate service and start billing',
      requiresInput: true, // Will use custom modal
    },
    {
      status: 'upload_document',
      label: 'Upload Document',
      icon: Upload,
      variant: 'outline',
      description: 'Upload or update installation proof',
      requiresInput: true,
    },
    {
      status: 'failed',
      label: 'Mark as Failed',
      icon: AlertTriangle,
      variant: 'destructive',
      description: 'Service activation failed',
      requiresInput: true,
    },
  ],
  active: [
    {
      status: 'suspended',
      label: 'Suspend Service',
      icon: PauseCircle,
      variant: 'secondary',
      description: 'Temporarily suspend the service',
      requiresInput: true,
    },
    {
      status: 'upload_document',
      label: 'Upload Document',
      icon: Upload,
      variant: 'outline',
      description: 'Upload or update installation proof',
      requiresInput: true,
    },
    {
      status: 'cancelled',
      label: 'Cancel Service',
      icon: XCircle,
      variant: 'destructive',
      description: 'Permanently cancel the service',
      requiresInput: true,
    },
  ],
  suspended: [
    {
      status: 'active',
      label: 'Reactivate Service',
      icon: PlayCircle,
      variant: 'default',
      description: 'Reactivate the suspended service',
    },
    {
      status: 'cancelled',
      label: 'Cancel Service',
      icon: XCircle,
      variant: 'destructive',
      description: 'Permanently cancel the service',
      requiresInput: true,
    },
  ],
  failed: [
    {
      status: 'installation_scheduled',
      label: 'Reschedule Installation',
      icon: Calendar,
      variant: 'default',
      description: 'Schedule a new installation attempt',
      requiresInput: true,
    },
    {
      status: 'cancelled',
      label: 'Cancel Order',
      icon: XCircle,
      variant: 'destructive',
      description: 'Cancel this order',
      requiresInput: true,
    },
  ],
};

export function StatusActionButtons({
  currentStatus,
  orderId,
  orderNumber = '',
  packagePrice = 0,
  firstName = '',
  lastName = '',
  onStatusUpdate,
}: StatusActionButtonsProps) {
  const [selectedAction, setSelectedAction] = useState<StatusAction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const actions = STATUS_ACTIONS[currentStatus] || [];

  const handleActionClick = (action: StatusAction) => {
    // Use custom modals for specific actions
    if (action.status === 'installation_completed') {
      setIsCompletionModalOpen(true);
      return;
    }

    if (action.status === 'active') {
      setIsActivationModalOpen(true);
      return;
    }

    if (action.status === 'upload_document') {
      setIsUploadModalOpen(true);
      return;
    }

    // Use standard modal for other actions
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAction(null);
  };

  const handleStatusUpdated = () => {
    handleModalClose();
    onStatusUpdate();
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.status}
              variant={action.variant === 'destructive' ? 'outline' : action.variant} // Override variant prop for custom styling
              size="sm"
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 h-9 text-sm font-medium rounded-md transition-all duration-200 shadow-sm border",
                // Primary Actions (Orange)
                action.variant === 'default' && "bg-[#F5831F] hover:bg-[#d97219] text-white border-[#F5831F] hover:border-[#d97219] shadow-md hover:shadow-lg",
                // Destructive Actions (Red Outline)
                action.variant === 'destructive' && "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 hover:shadow-md",
                // Outline Actions (Gray)
                action.variant === 'outline' && "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400",
                // Secondary Actions (Gray Fill)
                action.variant === 'secondary' && "bg-gray-100 text-gray-900 border-transparent hover:bg-gray-200 hover:text-gray-950"
              )}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
      </div>

      {selectedAction && (
        <StatusUpdateModal
          open={isModalOpen}
          onClose={handleModalClose}
          order={{
            id: orderId,
            order_number: orderNumber,
            first_name: firstName,
            last_name: lastName,
            status: currentStatus,
          }}
          onSuccess={handleStatusUpdated}
        />
      )}

      <InstallationCompletionModal
        open={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
        onSuccess={handleStatusUpdated}
      />

      <OrderActivationModal
        open={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
        packagePrice={packagePrice}
        onSuccess={handleStatusUpdated}
      />

      <InstallationDocumentUploadModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
        onSuccess={handleStatusUpdated}
      />
    </>
  );
}
