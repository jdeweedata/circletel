'use client';

import { PiBuildingsBold, PiCalendarBold, PiEyeBold, PiFileTextBold, PiMagnifyingGlassBold, PiPlusBold, PiSpinnerBold } from 'react-icons/pi';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ContractQuote {
  id: string;
  quoteNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  quoteId: string;
  customerId: string;
  kycSessionId: string;
  contractType: string;
  contractTermMonths: number;
  startDate: string;
  endDate: string;
  monthlyRecurring: number;
  onceOffFee: number;
  installationFee: number;
  totalContractValue: number;
  status: string;
  signedPdfUrl: string | null;
  signature: {
    zohoSignRequestId: string | null;
    customerSignatureDate: string | null;
    circletelSignatureDate: string | null;
    fullySignedDate: string | null;
  };
  zoho: {
    dealId: string | null;
    lastSyncedAt: string | null;
  };
  quote: ContractQuote | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContractsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, [statusFilter]);

  useEffect(() => {
    // Filter contracts based on search term
    if (searchTerm) {
      const filtered = contracts.filter(contract =>
        contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.quote?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.quote?.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.quote?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContracts(filtered);
    } else {
      setFilteredContracts(contracts);
    }
  }, [searchTerm, contracts]);

  const fetchContracts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('pageSize', '50');

      // Add 30 second timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`/api/admin/contracts?${params.toString()}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setContracts(data.data.contracts);
          setFilteredContracts(data.data.contracts);
        } else {
          setError(data.error || 'Failed to load contracts');
        }
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds. The server may be experiencing issues.');
        }
        throw fetchErr;
      }
    } catch (err: unknown) {
      console.error('Error fetching contracts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      pending_signature: 'bg-yellow-500',
      partially_signed: 'bg-orange-500',
      fully_signed: 'bg-blue-500',
      active: 'bg-green-500',
      expired: 'bg-red-500',
      terminated: 'bg-red-700'
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatContractType = (type: string) => {
    const types: Record<string, string> = {
      fibre: 'Fibre',
      wireless: 'Wireless',
      hybrid: 'Hybrid',
      managed_wireless: 'Managed Wireless'
    };
    return types[type] || type;
  };

  // Calculate stats
  const totalContracts = contracts.length;
  const pendingSignature = contracts.filter(c =>
    c.status === 'pending_signature' || c.status === 'partially_signed'
  ).length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const monthlyRevenue = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + c.monthlyRecurring, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PiSpinnerBold className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
            <Button onClick={fetchContracts} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-navy">Contracts</h1>
          <p className="text-circleTel-secondaryNeutral mt-1">
            Manage and track business contracts
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/contracts/new')}
          className="bg-circleTel-orange hover:bg-circleTel-orange-dark"
        >
          <PiPlusBold className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <PiMagnifyingGlassBold className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by company name or contract number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md bg-white min-w-[200px]"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_signature">Pending Signature</option>
              <option value="partially_signed">Partially Signed</option>
              <option value="fully_signed">Fully Signed</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-circleTel-navy">
              {totalContracts}
            </div>
            <div className="text-sm text-circleTel-secondaryNeutral">Total Contracts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingSignature}
            </div>
            <div className="text-sm text-circleTel-secondaryNeutral">Pending Signature</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {activeContracts}
            </div>
            <div className="text-sm text-circleTel-secondaryNeutral">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-circleTel-orange">
              {formatCurrency(monthlyRevenue)}
            </div>
            <div className="text-sm text-circleTel-secondaryNeutral">Monthly Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <PiFileTextBold className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-circleTel-secondaryNeutral">
                {searchTerm ? 'No contracts match your search' : 'No contracts found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredContracts.map((contract) => (
            <Card
              key={contract.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/contracts/${contract.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-circleTel-navy">
                        {contract.contractNumber}
                      </h3>
                      <Badge className={`${getStatusColor(contract.status)} text-white`}>
                        {formatStatus(contract.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatContractType(contract.contractType)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-circleTel-secondaryNeutral">
                      <PiBuildingsBold className="w-4 h-4" />
                      <span className="font-medium">{contract.quote?.companyName || 'N/A'}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-circleTel-secondaryNeutral">
                      <div>
                        <span className="font-medium">Contact:</span> {contract.quote?.contactPerson || 'N/A'} ({contract.quote?.email || 'N/A'})
                      </div>
                      <div>
                        <span className="font-medium">Term:</span> {contract.contractTermMonths} months
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-circleTel-secondaryNeutral">
                      <PiCalendarBold className="w-3 h-3" />
                      <span>Created {formatDate(contract.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-circleTel-navy">
                      {formatCurrency(contract.monthlyRecurring)}
                      <span className="text-sm font-normal text-circleTel-secondaryNeutral">/mo</span>
                    </div>
                    <div className="text-sm text-circleTel-secondaryNeutral">
                      Total: {formatCurrency(contract.totalContractValue)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/contracts/${contract.id}`);
                      }}
                    >
                      <PiEyeBold className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
