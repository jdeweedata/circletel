'use client';

import { useState } from 'react';
import { PiMagnifyingGlassBold, PiUserBold, PiWifiHighBold } from 'react-icons/pi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function SupportDevicesPage() {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Device Lookup</h1>
        <p className="text-slate-500">Search for a customer to view their linked devices</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by name, email, or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-md"
        />
        <Button onClick={handleSearch} disabled={loading}>
          <PiMagnifyingGlassBold className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Two-column layout: customers | devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PiUserBold className="w-5 h-5" />
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <p className="text-slate-400 text-sm">Search for a customer above</p>
            ) : (
              <div className="space-y-2">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedCustomer?.id === c.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.email}</p>
                    <Badge variant="outline" className="mt-1">
                      {c.type === 'consumer' ? 'Consumer' : 'Corporate'}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PiWifiHighBold className="w-5 h-5" />
              Linked Devices
              {selectedCustomer && (
                <span className="text-sm font-normal text-slate-500">
                  ({devices.length} devices)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCustomer ? (
              <p className="text-slate-400 text-sm">Select a customer to view devices</p>
            ) : devices.length === 0 ? (
              <p className="text-slate-400 text-sm">No devices linked to this customer</p>
            ) : (
              <div className="space-y-3">
                {devices.map((d) => (
                  <Link
                    key={d.sn}
                    href={`/admin/network/devices/${d.sn}`}
                    className="block p-4 rounded-lg border hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{d.device_name}</p>
                        <p className="text-sm text-slate-500">{d.model} - {d.sn}</p>
                      </div>
                      <Badge className={d.status === 'online' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}>
                        {d.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
