'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Search, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { CustomerRadiusSection } from '@/components/admin/interstellio';
import { PPPoECredentialsSection } from '@/components/admin/pppoe';

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

interface Service {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string | null;
}

interface Ticket {
  id: string;
  ticket_id: string;
  subject: string;
  status: string;
  last_interaction_date: string;
  agent: string | null;
}

interface CustomerService {
  id: string;
  connection_id: string | null;
  package_name: string;
  package_speed: string | null;
  status: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customerServices, setCustomerServices] = useState<CustomerService[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ticket filters
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketDateFilter, setTicketDateFilter] = useState('all');
  const [ticketAgentFilter, setTicketAgentFilter] = useState('all');

  // Success toast state
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);

  // Check for ticket creation success from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketCreated = urlParams.get('ticketCreated');
    const ticketNumber = urlParams.get('ticketNumber');
    const ticketId = urlParams.get('ticketId');
    
    if (ticketCreated === 'true' && ticketNumber) {
      setCreatedTicketNumber(ticketNumber);
      setCreatedTicketId(ticketId);
      setShowSuccessToast(true);
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Auto-hide after 10 seconds
      setTimeout(() => setShowSuccessToast(false), 10000);
    }
  }, []);

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
        const ordersArray = ordersData.data || [];
        setOrders(ordersArray);

        // Derive services from active orders
        const activeOrders = ordersArray.filter(
          (order: Order) => order.status.toLowerCase() === 'active'
        );
        const derivedServices: Service[] = activeOrders.map((order: Order) => ({
          id: order.id,
          name: `${order.package_name} ${order.package_speed}`.trim(),
          status: 'Active',
          start_date: order.created_at,
          end_date: null,
        }));
        setServices(derivedServices);
      }

      // Fetch customer services (with connection_id for Interstellio linking)
      const servicesResponse = await fetch(`/api/admin/customers/${customerId}/services`);
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setCustomerServices(servicesData.services || []);
      }

      // Fetch customer tickets (mock data for now - can be replaced with real API)
      // TODO: Replace with actual ticket API when available
      setTickets([]);
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticketSearch === '' || 
      ticket.ticket_id.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(ticketSearch.toLowerCase());
    const matchesStatus = ticketStatusFilter === 'all' || ticket.status.toLowerCase() === ticketStatusFilter.toLowerCase();
    const matchesAgent = ticketAgentFilter === 'all' || ticket.agent === ticketAgentFilter;
    return matchesSearch && matchesStatus && matchesAgent;
  });

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
    <div className="p-6 max-w-5xl relative">
      {/* Success Toast */}
      {showSuccessToast && createdTicketNumber && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-md animate-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-800">
              Success: Support ticket <span className="font-semibold">#{createdTicketNumber}</span> created successfully.{' '}
              <Link 
                href={`/admin/support/tickets/${createdTicketId}`}
                className="text-blue-600 hover:underline font-medium"
              >
                View Ticket
              </Link>
            </p>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-gray-100 items-start">
            {/* Contact Information */}
            <div className="min-h-[120px]">
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
            <div className="min-h-[120px]">
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
            <div className="min-h-[120px]">
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
      <Card className="mb-6">
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

      {/* Service Delivery Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Service Delivery</h3>
          
          {services.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No active services</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Service Name</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Start Date</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-2 text-gray-900">{service.name}</td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant="outline" 
                          className="bg-green-50 text-green-600 border-green-200 text-xs font-medium"
                        >
                          {service.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-900">{formatDate(service.start_date)}</td>
                      <td className="py-3 px-2 text-gray-500">{service.end_date ? formatDate(service.end_date) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RADIUS / Interstellio Section */}
      <CustomerRadiusSection
        customerId={customerId}
        services={customerServices}
      />

      {/* PPPoE Credentials Section */}
      {customer && customerServices.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <PPPoECredentialsSection
              customerId={customerId}
              serviceId={customerServices[0]?.id}
              accountNumber={customer.account_number}
              customerName={`${customer.first_name} ${customer.last_name}`}
              service={customerServices[0] ? {
                id: customerServices[0].id,
                packageName: customerServices[0].package_name,
                status: customerServices[0].status,
              } : undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Customer Support Interactions Section */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Customer Support Interactions</h3>
            <Button
              size="sm"
              className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white h-8 text-xs"
              onClick={() => router.push(`/admin/support/tickets/new?customerId=${customerId}`)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Create New Ticket
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search interactions..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
            <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ticketDateFilter} onValueChange={setTicketDateFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Date Range: All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Date Range: All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ticketAgentFilter} onValueChange={setTicketAgentFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Agent: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Agent: All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tickets Table */}
          {filteredTickets.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No support tickets found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Ticket ID</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Subject</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-500">Last Interaction Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-2 text-gray-900">{ticket.ticket_id}</td>
                      <td className="py-3 px-2 text-gray-900">{ticket.subject}</td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant="outline" 
                          className={`${
                            ticket.status.toLowerCase() === 'open' 
                              ? 'bg-green-50 text-green-600 border-green-200' 
                              : ticket.status.toLowerCase() === 'pending'
                              ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          } text-xs font-medium`}
                        >
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-900">{formatDate(ticket.last_interaction_date)}</td>
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
