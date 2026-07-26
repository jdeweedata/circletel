'use client';

import {
  PiBuildingBold,
  PiCalendarBold,
  PiEnvelopeBold,
  PiMagnifyingGlassBold,
  PiPhoneBold,
  PiUserBold,
  PiUserPlusBold,
  PiUsersBold,
} from 'react-icons/pi';
import React from 'react';
import { useRouter } from 'next/navigation';
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
import {
  AdminPage,
  PageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';

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

const CUSTOMER_STATUS_VARIANT: Record<string, StatusVariant> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'error',
  pending: 'warning',
};

export default function CustomersPage() {
  const router = useRouter();
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
      const response = await fetch('/api/admin/customers');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch customers');
      }

      setCustomers(result.data || []);
      setFilteredCustomers(result.data || []);
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

  return (
    <AdminPage>
      <PageHeader
        title="Customer Management"
        subtitle="View and manage customer accounts"
        actions={
          <Button>
            <PiUserPlusBold className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={customers.length}
          icon={<PiUsersBold className="h-5 w-5" />}
        />
        <StatCard
          label="Personal Accounts"
          value={customers.filter((c) => c.account_type === 'personal').length}
          icon={<PiUserBold className="h-5 w-5" />}
        />
        <StatCard
          label="Business Accounts"
          value={customers.filter((c) => c.account_type === 'business').length}
          icon={<PiBuildingBold className="h-5 w-5" />}
        />
        <StatCard
          label="Active Customers"
          value={customers.filter((c) => c.status === 'active').length}
          icon={<PiUserBold className="h-5 w-5" />}
        />
      </div>

      <SectionCard
        title="All Customers"
        action={
          <div className="relative w-72">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        }
      >
        {loading ? (
          <LoadingState message="Loading customers..." />
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<PiUsersBold />}
            title={searchQuery ? 'No customers found matching your search' : 'No customers yet'}
          />
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
                          <PiUserBold className="h-5 w-5 text-circleTel-orange" />
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
                          <PiEnvelopeBold className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{customer.email}</span>
                          {customer.email_verified && (
                            <StatusBadge status="Verified" variant="success" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <PiPhoneBold className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{customer.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={customer.account_type === 'business' ? 'Business' : 'Personal'}
                        variant={customer.account_type === 'business' ? 'info' : 'neutral'}
                        icon={
                          customer.account_type === 'business' ? (
                            <PiBuildingBold className="h-3 w-3" />
                          ) : (
                            <PiUserBold className="h-3 w-3" />
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          customer.status.charAt(0).toUpperCase() + customer.status.slice(1)
                        }
                        variant={CUSTOMER_STATUS_VARIANT[customer.status] ?? 'neutral'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PiCalendarBold className="h-3 w-3 text-gray-400" />
                        {formatDate(customer.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/customers/${customer.id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </AdminPage>
  );
}
