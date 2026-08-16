'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPage, ErrorState } from '@/components/backend';
import { AdminModernistShell } from '@/components/admin/modernist/AdminModernistShell';
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
  const [statusFilter, setStatusFilter] = useState<string>('open');
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
      params.append('status', statusFilter);
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
      } catch (fetchErr: unknown) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds. The server may be experiencing issues.');
        }
        throw fetchErr;
      }
    } catch (err: unknown) {
      console.error('Error fetching quotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  if (error && quotes.length === 0) {
    return (
      <AdminModernistShell>
        <AdminPage>
          <ErrorState
            title="Failed to Load Quotes"
            message={error}
            onRetry={fetchQuotes}
          />
        </AdminPage>
      </AdminModernistShell>
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
    <AdminModernistShell>
      <AdminPage>
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
      </AdminPage>
    </AdminModernistShell>
  );
}
