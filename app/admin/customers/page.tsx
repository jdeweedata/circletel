'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Mail, Phone, Building, User, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_type: 'personal' | 'business';
  business_name?: string;
  status: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredCustomers, setFilteredCustomers] = React.useState<Customer[]>([]);

  React.useEffect(() => {
    fetchCustomers();
  }, []);

  React.useEffect(() => {
    if (searchQuery) {
      const filtered = customers.filter((customer) => {
        const query = searchQuery.toLowerCase();
        return (
          customer.first_name.toLowerCase().includes(query) ||
          customer.last_name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.phone.includes(query) ||
          (customer.business_name && customer.business_name.toLowerCase().includes(query))
        );
      });
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAccountTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'business' ? 'secondary' : 'outline'}>
        {type === 'business' ? (
          <>
            <Building className="h-3 w-3 mr-1" />
            Business
          </>
        ) : (
          <>
            <User className="h-3 w-3 mr-1" />
            Personal
          </>
        )}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">View and manage customer accounts</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>
                {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-circleTel-orange/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-circleTel-orange" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </p>
                            {customer.business_name && (
                              <p className="text-sm text-gray-500">{customer.business_name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{customer.email}</span>
                            {customer.email_verified && (
                              <Badge variant="outline" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{customer.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getAccountTypeBadge(customer.account_type)}</TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDate(customer.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Customers</CardDescription>
            <CardTitle className="text-3xl">{customers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Personal Accounts</CardDescription>
            <CardTitle className="text-3xl">
              {customers.filter((c) => c.account_type === 'personal').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Business Accounts</CardDescription>
            <CardTitle className="text-3xl">
              {customers.filter((c) => c.account_type === 'business').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Customers</CardDescription>
            <CardTitle className="text-3xl">
              {customers.filter((c) => c.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
