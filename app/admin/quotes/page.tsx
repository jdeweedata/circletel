'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PiWarningCircleBold, PiArrowCounterClockwiseBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import type { BusinessQuote } from '@/lib/quotes/types';

import { QuotesListHeader } from '@/components/admin/quotes/list/QuotesListHeader';
import { QuotesListStatCards } from '@/components/admin/quotes/list/QuotesListStatCards';
import { QuotesFilters } from '@/components/admin/quotes/list/QuotesFilters';
import { QuotesTable } from '@/components/admin/quotes/list/QuotesTable';

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
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = quotes.filter(quote =>
        quote.company_name.toLowerCase().includes(lowerSearch) ||
        quote.quote_number.toLowerCase().includes(lowerSearch) ||
        quote.contact_email.toLowerCase().includes(lowerSearch)
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

  if (error && quotes.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto mt-12">
          <PiWarningCircleBold className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-red-900">Failed to Load Quotes</h3>
          <p className="text-red-700 mt-2 mb-6">{error}</p>
          <Button onClick={fetchQuotes} variant="outline" className="bg-white hover:bg-red-50 border-red-200 text-red-700">
            <PiArrowCounterClockwiseBold className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
  const monthlyRevenue = acceptedQuotes.reduce((sum, q) => sum + (q.total_monthly || 0), 0);

  const stats = {
    totalQuotes: quotes.length,
    pendingApproval: quotes.filter(q => q.status === 'pending_approval').length,
    accepted: acceptedQuotes.length,
    monthlyRevenue,
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <QuotesListHeader />
        
        <QuotesListStatCards stats={stats} />
        
        <QuotesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        
        <QuotesTable 
          quotes={filteredQuotes} 
          loading={loading}
          onRowClick={(id) => router.push(`/admin/quotes/${id}`)}
        />
      </div>
    </div>
  );
}
