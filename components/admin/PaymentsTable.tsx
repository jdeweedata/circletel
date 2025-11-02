import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Download, RefreshCw } from 'lucide-react';

export interface Payment {
  id: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  email: string;
  amount: number;
  date?: string;
  method?: string;
}

interface PaymentsTableProps {
  payments: Payment[];
  onViewDetails?: (payment: Payment) => void;
  onDownloadReceipt?: (payment: Payment) => void;
  onRefund?: (payment: Payment) => void;
  showActions?: boolean;
}

const statusConfig = {
  success: {
    label: 'Success',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 hover:bg-green-100'
  },
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
  },
  failed: {
    label: 'Failed',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-100'
  },
  refunded: {
    label: 'Refunded',
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }
};

export function PaymentsTable({
  payments,
  onViewDetails,
  onDownloadReceipt,
  onRefund,
  showActions = true
}: PaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500">No payments found</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Amount</TableHead>
            {showActions && <TableHead className="text-right font-semibold">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const statusInfo = statusConfig[payment.status];

            return (
              <TableRow key={payment.id} className="hover:bg-gray-50">
                <TableCell>
                  <Badge
                    variant={statusInfo.variant}
                    className={statusInfo.className}
                  >
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-gray-900">
                  {payment.email}
                </TableCell>
                <TableCell className="font-semibold text-gray-900">
                  R{payment.amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onViewDetails && (
                          <DropdownMenuItem onClick={() => onViewDetails(payment)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onDownloadReceipt && payment.status === 'success' && (
                          <DropdownMenuItem onClick={() => onDownloadReceipt(payment)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Receipt
                          </DropdownMenuItem>
                        )}
                        {onRefund && payment.status === 'success' && (
                          <DropdownMenuItem
                            onClick={() => onRefund(payment)}
                            className="text-red-600"
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refund Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Row count footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {payments.length} payment{payments.length !== 1 ? 's' : ''} total
        </p>
      </div>
    </div>
  );
}
