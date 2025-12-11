'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_number: string;
  account_type: string;
  account_status: string;
  email_verified: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  business_name: string | null;
  business_registration: string | null;
  tax_number: string | null;
}

interface Order {
  id: string;
  order_number: string;
  package_name: string;
  package_speed: string;
  package_price: number;
  status: string;
  payment_status: string;
  installation_address: string;
  created_at: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // Fetch customer details
      const customerResponse = await fetch(`/api/admin/customers/${customerId}`);
      if (!customerResponse.ok) {
        throw new Error('Failed to fetch customer');
      }
      const customerData = await customerResponse.json();
      setCustomer(customerData.data);

      // Fetch customer orders
      const ordersResponse = await fetch(`/api/admin/customers/${customerId}/orders`);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.data || []);
      }
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '/');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${formatDate(dateString)}, ${date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading customer details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Customer not found'}</p>
            <Button variant="outline" onClick={() => router.push('/admin/customers')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'inactive':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      case 'suspended':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getOrderStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'payment':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'kyc':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'installation':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'cancelled':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Customer Details</h1>
        <p className="text-sm text-gray-500">View customer account information</p>
      </div>

      {/* Customer Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Back Button + Name + Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/customers')}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {customer.first_name} {customer.last_name}
                </h2>
                <p className="text-sm text-gray-500">{customer.account_number}</p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${getStatusBadgeClass(customer.status)} font-medium px-3 py-1`}
            >
              {customer.status}
            </Badge>
          </div>

          {/* Three Column Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-gray-100">
            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{customer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{customer.phone}</p>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Account Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Account Number</p>
                  <p className="text-sm text-gray-900">{customer.account_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Type</p>
                  <p className="text-sm text-gray-900 capitalize">{customer.account_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Status</p>
                  <p className="text-sm text-gray-900">{customer.account_status}</p>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Activity</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">{formatDateTime(customer.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">{formatDateTime(customer.updated_at)}</p>
                </div>
                {customer.last_login && (
                  <div>
                    <p className="text-xs text-gray-500">Last Login</p>
                    <p className="text-sm text-gray-900">{formatDateTime(customer.last_login)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Business Information (if applicable) */}
          {customer.business_name && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-xs text-gray-500">Business Name</p>
                  <p className="text-sm text-gray-900">{customer.business_name}</p>
                </div>
                {customer.business_registration && (
                  <div>
                    <p className="text-xs text-gray-500">Registration Number</p>
                    <p className="text-sm text-gray-900">{customer.business_registration}</p>
                  </div>
                )}
                {customer.tax_number && (
                  <div>
                    <p className="text-xs text-gray-500">Tax Number</p>
                    <p className="text-sm text-gray-900">{customer.tax_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Orders ({orders.length})</h3>
          
          {orders.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Order Number</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Package</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Price</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Payment</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-2 text-gray-900">{order.order_number}</td>
                      <td className="py-3 px-2 text-gray-900">
                        {order.package_name} {order.package_speed}
                      </td>
                      <td className="py-3 px-2 text-gray-900">R{order.package_price}/mo</td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant="outline" 
                          className={`${getOrderStatusBadgeClass(order.status)} text-xs font-medium`}
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant="outline" 
                          className={`${getOrderStatusBadgeClass(order.payment_status)} text-xs font-medium`}
                        >
                          {order.payment_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-900">{formatDate(order.created_at)}</td>
                      <td className="py-3 px-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
