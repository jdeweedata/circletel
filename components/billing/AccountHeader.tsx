'use client';

import { Badge } from '@/components/ui/badge';

interface AccountHeaderProps {
  accountName: string;
  accountId: string;
  workspace: string;
  status: 'Active' | 'Inactive' | 'Suspended';
}

export default function AccountHeader({
  accountName,
  accountId,
  workspace,
  status
}: AccountHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{accountName}</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Account ID: {accountId}</span>
              <span>•</span>
              <span>Workspace: {workspace}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
        </div>
      </div>
    </div>
  );
}