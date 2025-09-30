'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Search, Download, MoreHorizontal } from 'lucide-react';
import type { Invoice } from '@/lib/types/billing';

const mockInvoices: Invoice[] = [
  {
    id: '1',
    customerId: '1',
    number: 'INV-001',
    status: 'paid',
    subtotal: 2500,
    tax: 375, // 15% VAT
    total: 2875,
    currency: 'ZAR',
    dueDate: new Date('2024-02-15'),
    paidAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    items: [
      {
        id: '1',
        description: 'SkyFibre Business 200/200',
        quantity: 1,
        unitAmount: 2500,
        amount: 2500
      }
    ]
  },
  {
    id: '2',
    customerId: '2',
    number: 'INV-002',
    status: 'open',
    subtotal: 1200,
    tax: 180,
    total: 1380,
    currency: 'ZAR',
    dueDate: new Date('2024-02-14'),
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    items: [
      {
        id: '2',
        description: 'SkyFibre Home 50/50',
        quantity: 1,
        unitAmount: 1200,
        amount: 1200
      }
    ]
  },
  {
    id: '3',
    customerId: '3',
    number: 'INV-003',
    status: 'void',
    subtotal: 3400,
    tax: 510,
    total: 3910,
    currency: 'ZAR',
    dueDate: new Date('2024-02-10'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
    items: [
      {
        id: '3',
        description: 'BizFibre Connect Ultra',
        quantity: 1,
        unitAmount: 3400,
        amount: 3400
      }
    ]
  }
];

const customers = {
  '1': 'Acme Corporation',
  '2': 'TechStart Inc',
  '3': 'Global Solutions'
};

export default function InvoicesPage() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'void':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'uncollectible':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage billing and invoices</p>
        </div>
        <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                mockInvoices
                  .filter(inv => inv.status === 'open')
                  .reduce((sum, inv) => sum + inv.total, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paid This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                mockInvoices
                  .filter(inv => inv.status === 'paid')
                  .reduce((sum, inv) => sum + inv.total, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                mockInvoices
                  .filter(inv => inv.status === 'open' && new Date(inv.dueDate) < new Date())
                  .reduce((sum, inv) => sum + inv.total, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            {mockInvoices.length} invoices total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:border-transparent w-full"
              />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(invoice.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customers[invoice.customerId as keyof typeof customers]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}