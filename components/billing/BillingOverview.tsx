'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, CreditCard, TrendingUp } from 'lucide-react';

interface BillingOverviewProps {
  currentInvoicePeriod: string;
  dueDate: string;
  balanceDue: number;
  unpaid: boolean;
  nextRecurringCharge: number;
  nextChargeDate: string;
  currentBalance: number;
  availableFunds: number;
}

export default function BillingOverview({
  currentInvoicePeriod,
  dueDate,
  balanceDue,
  unpaid,
  nextRecurringCharge,
  nextChargeDate,
  currentBalance,
  availableFunds
}: BillingOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="px-6 py-6 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Invoice */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Invoice</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balanceDue)}</div>
            <div className="text-xs text-gray-600 mt-1">
              Period: {currentInvoicePeriod}
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={unpaid ? "destructive" : "secondary"}>
                Due: {dueDate}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Next Recurring Charge */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Charge</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(nextRecurringCharge)}</div>
            <div className="text-xs text-gray-600 mt-1">
              On {nextChargeDate}
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="outline">Recurring</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Current Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentBalance)}</div>
            <div className="text-xs text-gray-600 mt-1">
              Current balance
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={currentBalance >= 0 ? "default" : "destructive"}>
                {currentBalance >= 0 ? "Credit" : "Debit"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Available Funds */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Funds</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(availableFunds)}</div>
            <div className="text-xs text-gray-600 mt-1">
              Ready to use
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Available
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}