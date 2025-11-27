'use client';

import React, { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, Package, AlertCircle, Calendar, MapPin, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Service {
  id: string;
  package_name: string;
  service_type: string;
  product_category: string;
  monthly_price: number;
  setup_fee: number;
  status: string;
  active: boolean;
  installation_address: string;
  installation_date: string;
  activation_date: string;
  speed_down: number;
  speed_up: number;
  data_cap_gb: number | null;
  provider_code: string;
  provider_name: string;
  contract_months: number;
  contract_start_date: string;
  contract_end_date: string | null;
  created_at: string;
}

export default function ServicesPage() {
  const { session } = useCustomerAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/dashboard/services', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }

        const result = await response.json();
        if (result.success) {
          setServices(result.data);
        } else {
          setError(result.error || 'Failed to load services');
        }
      } catch (err) {
        console.error('Services error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch services');
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg text-gray-600">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const activeServices = services.filter(s => s.active);
  const inactiveServices = services.filter(s => !s.active);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
          <p className="text-gray-600 mt-1">Manage your active and past services</p>
        </div>
        <Link href="/">
          <Button className="bg-circleTel-orange hover:bg-orange-600">
            <Package className="h-4 w-4 mr-2" />
            Add New Service
          </Button>
        </Link>
      </div>

      {/* Active Services */}
      {activeServices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Active Services ({activeServices.length})</h2>
          <div className="grid grid-cols-1 gap-4">
            {activeServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Services */}
      {inactiveServices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-600">Past Services ({inactiveServices.length})</h2>
          <div className="grid grid-cols-1 gap-4">
            {inactiveServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {services.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Yet</h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              You don't have any active services. Browse our packages to get started with high-speed internet.
            </p>
            <Link href="/">
              <Button className="bg-circleTel-orange hover:bg-orange-600">
                Add New Service
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const isActive = service.active && service.status === 'active';
  const isPending = service.status === 'pending';
  const isSuspended = service.status === 'suspended';
  
  const getStatusColor = () => {
    if (isActive) return 'bg-green-100 text-green-800';
    if (isPending) return 'bg-yellow-100 text-yellow-800';
    if (isSuspended) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getServiceIcon = () => {
    const type = service.service_type.toLowerCase();
    if (type.includes('fibre')) return <Wifi className="h-6 w-6" />;
    if (type.includes('lte') || type.includes('5g')) return <TrendingUp className="h-6 w-6" />;
    return <Zap className="h-6 w-6" />;
  };

  return (
    <Card className={`${isActive ? 'border-circleTel-orange/30 bg-orange-50/30' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              isActive ? 'bg-circleTel-orange/10 text-circleTel-orange' : 'bg-gray-100 text-gray-600'
            }`}>
              {getServiceIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{service.package_name}</CardTitle>
              <p className="text-sm text-gray-600 capitalize">{service.service_type}</p>
            </div>
          </div>
          <Badge className={getStatusColor()}>
            {service.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Speed</p>
            <p className="font-medium">{service.speed_down}/{service.speed_up} Mbps</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Monthly Price</p>
            <p className="font-medium text-circleTel-orange">R{service.monthly_price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Data Cap</p>
            <p className="font-medium">{service.data_cap_gb ? `${service.data_cap_gb} GB` : 'Uncapped'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Contract</p>
            <p className="font-medium">{service.contract_months === 0 ? 'Month-to-month' : `${service.contract_months} months`}</p>
          </div>
        </div>

        {/* Provider Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="h-4 w-4" />
          <span>Provider: {service.provider_name}</span>
        </div>

        {/* Installation Address */}
        {service.installation_address && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{service.installation_address}</span>
          </div>
        )}

        {/* Dates */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {service.installation_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Installed: {new Date(service.installation_date).toLocaleDateString()}</span>
            </div>
          )}
          {service.activation_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Activated: {new Date(service.activation_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {isActive && (
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="flex-1">
              Manage Service
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Upgrade
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              Report Issue
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
