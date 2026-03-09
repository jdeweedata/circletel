'use client';

import { StatusBadge, StatusVariant } from '@/components/admin/shared/StatusBadge';
import { ContractStatus } from '@/lib/contracts/types';

interface ContractStatusBadgeProps {
  status: ContractStatus | string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: StatusVariant }> = {
  draft: { label: 'Draft', variant: 'info' },
  pending_signature: { label: 'Pending Signature', variant: 'warning' },
  partially_signed: { label: 'Partially Signed', variant: 'warning' },
  fully_signed: { label: 'Fully Signed', variant: 'success' },
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'error' },
  terminated: { label: 'Terminated', variant: 'error' },
};

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    variant: 'neutral' as StatusVariant,
  };

  return <StatusBadge status={config.label} variant={config.variant} className={className} />;
}

export function getContractStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    variant: 'neutral' as StatusVariant,
  };
}
