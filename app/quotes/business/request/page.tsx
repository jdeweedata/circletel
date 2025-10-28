'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BusinessQuoteRequestForm from '@/components/quotes/BusinessQuoteRequestForm';
import { Loader2 } from 'lucide-react';

export default function BusinessQuoteRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock data for testing
  const mockLeadId = 'test-lead-' + Date.now();
  const mockAddress = '7 Autumn Street, Rivonia, Sandton, 2128';

  useEffect(() => {
    // Fetch available packages
    const fetchPackages = async () => {
      try {
        // For testing, we'll use mock data
        // In production, this would fetch from /api/coverage/packages
        const mockPackages = [
          {
            id: 'pkg-fibre-100',
            name: 'Business Fibre 100Mbps',
            service_type: 'fibre',
            product_category: 'uncapped_fibre',
            price: 2499,
            installation_fee: 0,
            speed_down: 100,
            speed_up: 100,
            data_cap_gb: null
          },
          {
            id: 'pkg-fibre-200',
            name: 'Business Fibre 200Mbps',
            service_type: 'fibre',
            product_category: 'uncapped_fibre',
            price: 3499,
            installation_fee: 0,
            speed_down: 200,
            speed_up: 200,
            data_cap_gb: null
          },
          {
            id: 'pkg-fibre-500',
            name: 'Business Fibre 500Mbps',
            service_type: 'fibre',
            product_category: 'uncapped_fibre',
            price: 5999,
            installation_fee: 0,
            speed_down: 500,
            speed_up: 500,
            data_cap_gb: null
          },
          {
            id: 'pkg-fibre-1000',
            name: 'Business Fibre 1Gbps',
            service_type: 'fibre',
            product_category: 'uncapped_fibre',
            price: 8999,
            installation_fee: 0,
            speed_down: 1000,
            speed_up: 1000,
            data_cap_gb: null
          },
          {
            id: 'pkg-5g-backup',
            name: '5G Backup Service 50GB',
            service_type: '5g',
            product_category: '5g',
            price: 899,
            installation_fee: 0,
            speed_down: 50,
            speed_up: 20,
            data_cap_gb: 50
          },
          {
            id: 'pkg-5g-backup-unlimited',
            name: '5G Backup Service Unlimited',
            service_type: '5g',
            product_category: '5g',
            price: 1499,
            installation_fee: 0,
            speed_down: 50,
            speed_up: 20,
            data_cap_gb: null
          }
        ];

        setPackages(mockPackages);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load packages');
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleSuccess = (quoteId: string) => {
    // Redirect to quote confirmation page
    setTimeout(() => {
      router.push(`/quotes/business/${quoteId}`);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-2">Error</h2>
          <p className="text-circleTel-secondaryNeutral">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">
            Business Quote Request
          </h1>
          <p className="text-circleTel-secondaryNeutral">
            Get a customized quote for your business connectivity needs
          </p>
        </div>

        <BusinessQuoteRequestForm
          leadId={mockLeadId}
          serviceAddress={mockAddress}
          availablePackages={packages}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
