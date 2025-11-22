'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.status}
              variant={action.variant}
              size="sm"
              onClick={() => handleActionClick(action)}
              className="flex items-center gap-2"
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
          orderId={orderId}
          currentStatus={currentStatus}
          newStatus={selectedAction.status}
          actionLabel={selectedAction.label}
          requiresInput={selectedAction.requiresInput || false}
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
