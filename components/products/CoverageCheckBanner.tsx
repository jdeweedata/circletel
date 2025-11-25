'use client';

import React, { useState } from 'react';
import { CheckCircle, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CoverageResult {
  available: boolean;
  services?: string[];
  address?: string;
  coordinates?: { lat: number; lng: number };
  leadId?: string;
}

interface CoverageCheckBannerProps {
  productServiceType?: string;
  onCoverageConfirmed?: (result: CoverageResult) => void;
  className?: string;
}

/**
 * CoverageCheckBanner Component
 *
 * Address input for coverage checking with success/failure states
 * Integrates with existing /api/coverage/check endpoint
 */
export function CoverageCheckBanner({
  productServiceType,
  onCoverageConfirmed,
  className,
}: CoverageCheckBannerProps) {
  const [address, setAddress] = useState('');
  const [coverageStatus, setCoverageStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const checkCoverage = async () => {
    if (!address.trim()) return;

    setCoverageStatus('checking');
    setErrorMessage('');

    try {
      // Use the existing coverage check API
      const response = await fetch(`/api/coverage/check?address=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (data.available) {
        setCoverageResult({
          available: true,
          services: data.services || ['5G', '4G'],
          address: data.address || address,
          coordinates: data.coordinates,
          leadId: data.leadId,
        });
        setCoverageStatus('success');
        onCoverageConfirmed?.(data);
      } else {
        setCoverageStatus('failed');
        setErrorMessage(data.message || 'Coverage not available at this address');
      }
    } catch (error) {
      console.error('Coverage check failed:', error);
      setCoverageStatus('failed');
      setErrorMessage('Unable to check coverage. Please try again.');
    }
  };

  const resetCheck = () => {
    setCoverageStatus('idle');
    setCoverageResult(null);
    setErrorMessage('');
    setAddress('');
  };

  // Success State
  if (coverageStatus === 'success' && coverageResult) {
    const servicesList = coverageResult.services?.join(' and ') || 'coverage';

    return (
      <div className={cn("bg-amber-400 rounded-xl p-6", className)}>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-6 w-6 text-circleTel-darkNeutral flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-circleTel-darkNeutral text-lg">
              Great! You have both {servicesList} Home Internet in your area.
            </h3>
            <p className="text-circleTel-darkNeutral/80 mt-1 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {coverageResult.address}
            </p>
            <button
              className="text-circleTel-darkNeutral font-semibold underline mt-3 text-sm hover:no-underline"
              onClick={resetCheck}
            >
              Check a different address
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Failed State
  if (coverageStatus === 'failed') {
    return (
      <div className={cn("bg-red-50 border border-red-200 rounded-xl p-6", className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-700 text-lg">
              Coverage not available
            </h3>
            <p className="text-red-600/80 mt-1">
              {errorMessage}
            </p>
            <button
              className="text-red-700 font-semibold underline mt-3 text-sm hover:no-underline"
              onClick={resetCheck}
            >
              Try a different address
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default / Idle State
  return (
    <div className={cn("bg-gray-100 rounded-xl p-6", className)}>
      <h3 className="font-bold text-gray-900 mb-4">Check coverage at your address</h3>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Enter your street address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkCoverage()}
            className="pl-10 h-12"
            disabled={coverageStatus === 'checking'}
          />
        </div>
        <Button
          onClick={checkCoverage}
          disabled={coverageStatus === 'checking' || !address.trim()}
          className="bg-circleTel-orange hover:bg-circleTel-orange/90 h-12 px-6"
        >
          {coverageStatus === 'checking' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Coverage'
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        We'll check if {productServiceType || '5G/Fibre'} services are available at your location
      </p>
    </div>
  );
}

export default CoverageCheckBanner;
