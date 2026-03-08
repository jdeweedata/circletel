'use client';

import { useState, useCallback } from 'react';
import {
  PiUserBold,
  PiLinkBold,
  PiLinkBreakBold,
  PiMagnifyingGlassBold,
  PiUserCircleBold,
  PiBuildingsBold,
  PiEnvelopeBold,
  PiPhoneBold,
  PiMapPinBold,
  PiCheckCircleBold,
  PiSpinnerBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/admin/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Device {
  sn: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_order_id: string | null;
  corporate_site_id: string | null;
}

interface SearchResult {
  id: string;
  type: 'consumer' | 'corporate';
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface DeviceCustomerLinkProps {
  device: Device;
  onUpdate: () => void;
}

export function DeviceCustomerLink({ device, onUpdate }: DeviceCustomerLinkProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLinked = device.customer_name !== null;
  const linkType = device.customer_order_id ? 'consumer' : device.corporate_site_id ? 'corporate' : null;

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

      if (data.results.length === 0) {
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

  const handleLink = async (result: SearchResult) => {
    setLinking(true);
    setError(null);

    try {
      const response = await fetch(`/api/ruijie/devices/${device.sn}/link`, {
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

      setDialogOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      onUpdate();
    } catch (err) {
      console.error('Link failed:', err);
      setError('Failed to link customer. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    setError(null);

    try {
      const response = await fetch(`/api/ruijie/devices/${device.sn}/link`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to unlink customer');
        return;
      }

      onUpdate();
    } catch (err) {
      console.error('Unlink failed:', err);
      setError('Failed to unlink customer. Please try again.');
    } finally {
      setUnlinking(false);
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  return (
    <>
      <SectionCard icon={PiUserBold} title="Customer Assignment" compact>
        {isLinked ? (
          <div className="space-y-4">
            {/* Linked Customer Info */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  {linkType === 'corporate' ? (
                    <PiBuildingsBold className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <PiUserCircleBold className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900 truncate">
                      {device.customer_name}
                    </p>
                    <Badge
                      className={
                        linkType === 'corporate'
                          ? 'bg-blue-100 text-blue-700 border-0'
                          : 'bg-purple-100 text-purple-700 border-0'
                      }
                    >
                      {linkType === 'corporate' ? 'Corporate' : 'Consumer'}
                    </Badge>
                  </div>
                  {device.customer_email && (
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <PiEnvelopeBold className="w-3.5 h-3.5" />
                      {device.customer_email}
                    </p>
                  )}
                  {device.customer_phone && (
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <PiPhoneBold className="w-3.5 h-3.5" />
                      {device.customer_phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Unlink Button */}
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleUnlink}
              disabled={unlinking}
            >
              {unlinking ? (
                <PiSpinnerBold className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PiLinkBreakBold className="w-4 h-4 mr-2" />
              )}
              Unlink Customer
            </Button>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* No Customer Linked */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <PiUserBold className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">
                This device is not linked to any customer.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Link it to a consumer order or corporate site for easier identification.
              </p>
            </div>

            {/* Link Button */}
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleOpenDialog}
            >
              <PiLinkBold className="w-4 h-4 mr-2" />
              Link to Customer
            </Button>
          </div>
        )}
      </SectionCard>

      {/* Search Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Link Device to Customer</DialogTitle>
            <DialogDescription>
              Search for a consumer order or corporate site to link this device.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Input */}
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

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-600 text-center py-2">{error}</p>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="w-full p-3 text-left hover:bg-slate-50 transition-colors disabled:opacity-50"
                    onClick={() => handleLink(result)}
                    disabled={linking}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          result.type === 'corporate'
                            ? 'bg-blue-100'
                            : 'bg-purple-100'
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
                          <p className="font-medium text-slate-900 truncate">
                            {result.name}
                          </p>
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
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {result.email}
                          </p>
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

            {/* Empty State after search */}
            {!searching && searchQuery && searchResults.length === 0 && !error && (
              <div className="text-center py-8 text-slate-500">
                <PiMagnifyingGlassBold className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No results found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
