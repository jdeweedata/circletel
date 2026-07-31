'use client';

/**
 * Shared dialog for linking a Ruijie device SN → consumer order or corporate site.
 *
 * API contract (POST /api/ruijie/devices/[sn]/link):
 * - body: { type: "consumer"|"corporate", customer_order_id? | corporate_site_id? }
 * - search: GET /api/admin/search/customers?q= (min 2 chars)
 */

import { useState, useCallback } from 'react';
import {
  PiMagnifyingGlassBold,
  PiUserCircleBold,
  PiBuildingsBold,
  PiMapPinBold,
  PiSpinnerBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface CustomerSearchResult {
  id: string;
  type: 'consumer' | 'corporate';
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface LinkCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Device serial number to link */
  sn: string;
  deviceName?: string | null;
  onLinked?: () => void;
}

export function LinkCustomerDialog({
  open,
  onOpenChange,
  sn,
  deviceName,
  onLinked,
}: LinkCustomerDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setSearching(false);
    setLinking(false);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Enter at least 2 characters to search');
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/search/customers?q=${encodeURIComponent(searchQuery)}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Search failed');
        setSearchResults([]);
        return;
      }

      const data = await response.json();
      setSearchResults(data.results || []);

      if ((data.results || []).length === 0) {
        setError('No customers found matching your search');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLink = async (result: CustomerSearchResult) => {
    setLinking(true);
    setError(null);

    try {
      const response = await fetch(`/api/ruijie/devices/${encodeURIComponent(sn)}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: result.type,
          customer_order_id: result.type === 'consumer' ? result.id : undefined,
          corporate_site_id: result.type === 'corporate' ? result.id : undefined,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to link customer');
        return;
      }

      handleOpenChange(false);
      onLinked?.();
    } catch (err) {
      console.error('Link failed:', err);
      setError('Failed to link customer. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Device to Customer</DialogTitle>
          <DialogDescription>
            Search for a consumer order or corporate site to link{' '}
            <span className="font-medium text-slate-700">
              {deviceName || sn}
            </span>
            {deviceName ? (
              <span className="font-mono text-xs text-slate-500"> ({sn})</span>
            ) : null}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
                autoFocus
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <PiSpinnerBold className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center py-2">{error}</p>
          )}

          {searchResults.length > 0 && (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  className="w-full p-3 text-left hover:bg-slate-50 transition-colors disabled:opacity-50"
                  onClick={() => handleLink(result)}
                  disabled={linking}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        result.type === 'corporate' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}
                    >
                      {result.type === 'corporate' ? (
                        <PiBuildingsBold className="w-4 h-4 text-blue-600" />
                      ) : (
                        <PiUserCircleBold className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">{result.name}</p>
                        <Badge
                          variant="outline"
                          className={
                            result.type === 'corporate'
                              ? 'text-blue-600 border-blue-200'
                              : 'text-purple-600 border-purple-200'
                          }
                        >
                          {result.type === 'corporate' ? 'Corporate' : 'Consumer'}
                        </Badge>
                      </div>
                      {result.email && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{result.email}</p>
                      )}
                      {result.address && (
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <PiMapPinBold className="w-3 h-3 flex-shrink-0" />
                          {result.address}
                        </p>
                      )}
                    </div>
                    {linking && (
                      <PiSpinnerBold className="w-4 h-4 text-slate-400 animate-spin" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searching && searchQuery && searchResults.length === 0 && !error && (
            <div className="text-center py-8 text-slate-500">
              <PiMagnifyingGlassBold className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No results found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
