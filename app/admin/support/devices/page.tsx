'use client';

import { useState } from 'react';
import {
  PiMagnifyingGlassBold,
  PiUserBold,
  PiWifiHighBold,
  PiWifiSlashBold,
  PiBuildingsBold,
  PiUserCircleBold,
  PiEnvelopeBold,
  PiPhoneBold,
  PiMapPinBold,
  PiCaretRightBold,
  PiDevicesBold,
  PiArrowsClockwiseBold,
} from 'react-icons/pi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Customer {
  id: string;
  type: 'consumer' | 'corporate';
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface Device {
  sn: string;
  device_name: string;
  model: string | null;
  status: string;
  group_name: string | null;
  online_clients: number;
  synced_at: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function SupportDevicesPage() {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearchPerformed(true);
    try {
      const response = await fetch(`/api/admin/search/customers?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setCustomers(data.results || []);
      setSelectedCustomer(null);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/customers/${customer.id}/devices?type=${customer.type}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setDevices(data.devices || []);
    } finally {
      setLoading(false);
    }
  };

  const consumerCount = customers.filter((c) => c.type === 'consumer').length;
  const corporateCount = customers.filter((c) => c.type === 'corporate').length;
  const onlineDevices = devices.filter((d) => d.status === 'online').length;
  const offlineDevices = devices.filter((d) => d.status === 'offline').length;

  return (
    <div className="min-h-screen bg-slate-50 -m-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/admin" className="hover:text-slate-700">
            Admin
          </Link>
          <PiCaretRightBold className="w-3 h-3" />
          <Link href="/admin/support" className="hover:text-slate-700">
            Support
          </Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">Device Lookup</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Device Lookup</h1>
        <p className="text-slate-500 mt-1">
          Search for customers by name, email, or phone to view their linked network devices
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by customer name, email, or phone number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-11"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="h-11 px-6"
            >
              {loading ? (
                <PiArrowsClockwiseBold className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PiMagnifyingGlassBold className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Press Enter to search
          </p>
        </CardContent>
      </Card>

      {/* Stats Row - Show after search */}
      {searchPerformed && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Results</p>
                  <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <PiUserBold className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Consumers</p>
                  <p className="text-2xl font-bold text-slate-900">{consumerCount}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <PiUserCircleBold className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Corporate</p>
                  <p className="text-2xl font-bold text-slate-900">{corporateCount}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-full">
                  <PiBuildingsBold className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Devices Found</p>
                  <p className="text-2xl font-bold text-slate-900">{devices.length}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-full">
                  <PiDevicesBold className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <PiUserBold className="w-5 h-5 text-slate-600" />
                Customers
                {customers.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {customers.length}
                  </Badge>
                )}
              </h2>
            </div>
            <CardContent className="p-0">
              {!searchPerformed ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <PiMagnifyingGlassBold className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">Search for a customer</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Enter a name, email, or phone number above
                  </p>
                </div>
              ) : loading && !selectedCustomer ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-slate-100 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : customers.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <PiUserBold className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">No customers found</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`w-full text-left p-4 transition-colors ${
                        selectedCustomer?.id === customer.id
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 truncate">
                            {customer.name}
                          </p>
                          {customer.email && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <PiEnvelopeBold className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-sm text-slate-500 truncate">
                                {customer.email}
                              </span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <PiPhoneBold className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-sm text-slate-500">
                                {customer.phone}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            customer.type === 'corporate'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }
                        >
                          {customer.type === 'consumer' ? (
                            <PiUserCircleBold className="w-3 h-3 mr-1" />
                          ) : (
                            <PiBuildingsBold className="w-3 h-3 mr-1" />
                          )}
                          {customer.type === 'consumer' ? 'Consumer' : 'Corporate'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Device List */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <PiWifiHighBold className="w-5 h-5 text-slate-600" />
                  Linked Devices
                  {selectedCustomer && devices.length > 0 && (
                    <Badge variant="secondary">{devices.length}</Badge>
                  )}
                </h2>
                {selectedCustomer && devices.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {onlineDevices} online
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      {offlineDevices} offline
                    </span>
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <p className="text-sm text-slate-500 mt-1">
                  Showing devices for{' '}
                  <span className="font-medium text-slate-700">{selectedCustomer.name}</span>
                </p>
              )}
            </div>
            <CardContent className="p-0">
              {!selectedCustomer ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <PiDevicesBold className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">Select a customer</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Choose a customer from the list to view their linked devices
                  </p>
                </div>
              ) : loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-slate-100 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : devices.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <PiWifiSlashBold className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">No devices found</p>
                  <p className="text-sm text-slate-400 mt-1">
                    This customer doesn't have any linked devices
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {devices.map((device) => (
                    <Link
                      key={device.sn}
                      href={`/admin/network/devices/${device.sn}`}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            device.status === 'online'
                              ? 'bg-emerald-100'
                              : 'bg-slate-100'
                          }`}
                        >
                          {device.status === 'online' ? (
                            <PiWifiHighBold className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <PiWifiSlashBold className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                            {device.device_name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {device.model || 'Unknown model'} • {device.sn}
                          </p>
                          {device.group_name && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Group: {device.group_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              device.status === 'online'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }
                          >
                            {device.status}
                          </Badge>
                          <p className="text-xs text-slate-400 mt-1">
                            {device.online_clients} clients • {formatRelativeTime(device.synced_at)}
                          </p>
                        </div>
                        <PiCaretRightBold className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Details Card - Show when customer selected */}
          {selectedCustomer && (
            <Card className="mt-6">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Customer Details</h2>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <PiUserBold className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Name</p>
                      <p className="text-sm font-medium text-slate-900">{selectedCustomer.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {selectedCustomer.type === 'corporate' ? (
                        <PiBuildingsBold className="w-4 h-4 text-slate-600" />
                      ) : (
                        <PiUserCircleBold className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Type</p>
                      <p className="text-sm font-medium text-slate-900 capitalize">
                        {selectedCustomer.type}
                      </p>
                    </div>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <PiEnvelopeBold className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
                        <p className="text-sm font-medium text-slate-900">{selectedCustomer.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <PiPhoneBold className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Phone</p>
                        <p className="text-sm font-medium text-slate-900">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <PiMapPinBold className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Address</p>
                        <p className="text-sm font-medium text-slate-900">{selectedCustomer.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
