'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Eye, Calendar, Building2, FileText, Plus } from 'lucide-react';
import type { BusinessQuote } from '@/lib/quotes/types';

interface QuoteWithDetails extends BusinessQuote {
  item_count: number;
  created_by_admin?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function AdminQuotesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteWithDetails[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<QuoteWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter]);

  useEffect(() => {
    // Filter quotes based on search term
    if (searchTerm) {
      const filtered = quotes.filter(quote =>
        quote.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQuotes(filtered);
    } else {
      setFilteredQuotes(quotes);
    }
  }, [searchTerm, quotes]);

  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('limit', '50');

      // Add 30 second timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`/api/quotes/business/list?${params.toString()}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setQuotes(data.quotes);
          setFilteredQuotes(data.quotes);
        } else {
          setError(data.error || 'Failed to load quotes');
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds. The server may be experiencing issues.');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      console.error('Error fetching quotes:', err);
      setError(err.message || 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      pending_approval: 'bg-yellow-500',
      approved: 'bg-blue-500',
      sent: 'bg-purple-500',
      viewed: 'bg-indigo-500',
      accepted: 'bg-green-500',
      rejected: 'bg-red-500',
      expired: 'bg-orange-500'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
            <Button onClick={fetchQuotes} className="mt-4">
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
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">Business Quotes</h1>
          <p className="text-circleTel-secondaryNeutral mt-1">
            Manage and track business quote requests
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/quotes/new')}
          className="bg-circleTel-orange hover:bg-circleTel-orange/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Quote
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by company, quote number, or email..."
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
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-circleTel-darkNeutral">
              {quotes.length}
            </div>
            <div className="text-sm text-circleTel-secondaryNeutral">Total Quotes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {quotes.filter(q => q.status === 'pending_approval').length}
            </div>
            <div className="text-sm text-circleTel-secondaryNeutral">Pending Approval</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {quotes.filter(q => q.status === 'accepted').length}
            </div>
            <div className="text-sm text-circleTel-secondaryNeutral">Accepted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-circleTel-orange">
              {formatCurrency(
                quotes
                  .filter(q => q.status === 'accepted')
                  .reduce((sum, q) => sum + q.total_monthly, 0)
              )}
            </div>
            <div className="text-sm text-circleTel-secondaryNeutral">Monthly Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-circleTel-secondaryNeutral">
                {searchTerm ? 'No quotes match your search' : 'No quotes found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQuotes.map((quote) => (
            <Card
              key={quote.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/quotes/${quote.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-circleTel-darkNeutral">
                        {quote.quote_number}
                      </h3>
                      <Badge className={`${getStatusColor(quote.status)} text-white`}>
                        {formatStatus(quote.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {quote.customer_type.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-circleTel-secondaryNeutral">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{quote.company_name}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-circleTel-secondaryNeutral">
                      <div>
                        <span className="font-medium">Contact:</span> {quote.contact_name} ({quote.contact_email})
                      </div>
                      <div>
                        <span className="font-medium">Services:</span> {quote.item_count}
                      </div>
                      <div>
                        <span className="font-medium">Contract:</span> {quote.contract_term} months
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-circleTel-secondaryNeutral">
                      <Calendar className="w-3 h-3" />
                      <span>Created {formatDate(quote.created_at)}</span>
                      {quote.created_by_admin && (
                        <span>by {quote.created_by_admin.full_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-circleTel-darkNeutral">
                      {formatCurrency(quote.total_monthly)}
                      <span className="text-sm font-normal text-circleTel-secondaryNeutral">/mo</span>
                    </div>
                    {quote.total_installation > 0 && (
                      <div className="text-sm text-circleTel-secondaryNeutral">
                        + {formatCurrency(quote.total_installation)} installation
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/quotes/${quote.id}`);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
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
