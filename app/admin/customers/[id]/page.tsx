'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Calendar, User, CreditCard, MapPin, Package } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customer details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Customer not found'}</p>
            <Button onClick={() => router.push('/admin/customers')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      payment: 'bg-blue-100 text-blue-800',
      kyc: 'bg-purple-100 text-purple-800',
      installation: 'bg-orange-100 text-orange-800',
      active: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/customers')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-gray-600">{customer.account_number}</p>
          </div>
        </div>
        <Badge className={getStatusColor(customer.status)}>
          {customer.status}
        </Badge>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                  {customer.email}
                </a>
                {customer.email_verified && (
                  <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Verified</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                  {customer.phone}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Account Number</p>
              <p className="font-semibold">{customer.account_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Type</p>
              <p className="font-semibold capitalize">{customer.account_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Status</p>
              <Badge className={getStatusColor(customer.account_status)}>
                {customer.account_status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Business Information (if applicable) */}
        {customer.business_name && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Business Name</p>
                <p className="font-semibold">{customer.business_name}</p>
              </div>
              {customer.business_registration && (
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="font-semibold">{customer.business_registration}</p>
                </div>
              )}
              {customer.tax_number && (
                <div>
                  <p className="text-sm text-gray-600">Tax Number</p>
                  <p className="font-semibold">{customer.tax_number}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-semibold">
                {new Date(customer.created_at).toLocaleString('en-ZA')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-semibold">
                {new Date(customer.updated_at).toLocaleString('en-ZA')}
              </p>
            </div>
            {customer.last_login && (
              <div>
                <p className="text-sm text-gray-600">Last Login</p>
                <p className="font-semibold">
                  {new Date(customer.last_login).toLocaleString('en-ZA')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Order Number</th>
                    <th className="text-left py-3 px-4">Package</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Payment</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-semibold">{order.order_number}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{order.package_name}</p>
                          <p className="text-sm text-gray-600">{order.package_speed}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">R{order.package_price}/mo</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getOrderStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getOrderStatusColor(order.payment_status)}>
                          {order.payment_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(order.created_at).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
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
