# Story: Coverage Stage with Package Selection

**Story ID**: OSI-001-02
**Epic**: Order System Implementation (OSI-001)
**Created**: September 27, 2025
**Status**: Ready for Development
**Points**: 8 (3 days)
**Assignee**: Full-Stack Developer

## Story Overview

As a **CircleTel customer**, I need to **check service coverage at my address and select an internet package** so that **I can see available services and pricing before proceeding with my order**.

### Business Value
- Enables customers to verify service availability before committing
- Displays transparent pricing with VAT calculations
- Reduces customer service inquiries about coverage
- Provides foundation for accurate order processing

## Context Engineering

### Current Architecture Context
```typescript
// Existing coverage functionality (if any)
// Need to identify existing coverage checking components
/components/                 # Existing components
/lib/services/              # Supabase integration patterns
/lib/utils/                 # Utility functions

// Current address/location patterns
// Check if existing components handle address input
```

### Required Coverage Stage Implementation
```typescript
// Coverage stage component structure
/components/order/stages/
├── CoverageStage.tsx       # Main coverage stage component
├── AddressInput.tsx        # Address input with autocomplete
├── PackageSelector.tsx     # Package selection component
├── PricingDisplay.tsx      # Pricing breakdown component
└── CoverageMap.tsx         # Optional: Visual coverage map

// Coverage API integration
/lib/order/
├── coverage-api.ts         # Coverage checking API client
├── packages-api.ts         # Package/pricing API client
└── validation.ts           # Address and selection validation

// Coverage data types
interface CoverageResponse {
  available: boolean;
  packages: Package[];
  coverage: {
    fibre: boolean;
    wireless: boolean;
    mobile: boolean;
  };
  message?: string;
}
```

### Integration with Existing Patterns
```typescript
// Use existing form components
import { FormSection } from '@/components/forms/common/FormSection';
import { InputField } from '@/components/forms/common/FormFields';
import { Button } from '@/components/ui/button';

// Follow existing API patterns
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation } from '@tanstack/react-query';
```

## Technical Implementation

### Step 1: Create Coverage Data Types
**File**: `lib/order/types.ts` (extend existing)

```typescript
// Add to existing order types
export interface CoverageData {
  address: string;
  coordinates?: { lat: number; lng: number };
  selectedPackage?: Package;
  pricing?: PricingBreakdown;
  coverageResult?: CoverageResponse;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  type: 'fibre' | 'wireless' | 'mobile';
  speed: {
    download: number;
    upload: number;
    unit: 'Mbps' | 'Gbps';
  };
  pricing: {
    monthly: number;
    installation: number;
    equipment?: number;
  };
  features: string[];
  popular?: boolean;
  businessOnly?: boolean;
}

export interface CoverageResponse {
  success: boolean;
  available: boolean;
  packages: Package[];
  coverage: {
    fibre: {
      available: boolean;
      providers: string[];
    };
    wireless: {
      available: boolean;
      signal: 'excellent' | 'good' | 'fair' | 'poor';
    };
    mobile: {
      available: boolean;
      providers: string[];
    };
  };
  estimatedInstallDate?: string;
  message?: string;
}

export interface PricingBreakdown {
  monthly: number;
  installation: number;
  equipment: number;
  subtotal: number;
  vat: number;
  total: number;
  currency: 'ZAR';
}
```

### Step 2: Create Coverage API Client
**File**: `lib/order/coverage-api.ts`

```typescript
import { CoverageResponse, Package } from './types';

export class CoverageApiClient {
  private baseUrl = '/api/coverage';

  async checkCoverage(address: string): Promise<CoverageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error(`Coverage check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Coverage check error:', error);
      throw new Error('Unable to check coverage. Please try again.');
    }
  }

  async getPackages(location: string, type?: string): Promise<Package[]> {
    try {
      const params = new URLSearchParams({ location });
      if (type) params.append('type', type);

      const response = await fetch(`${this.baseUrl}/packages?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch packages: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Package fetch error:', error);
      throw new Error('Unable to load packages. Please try again.');
    }
  }

  async calculatePricing(packageId: string, address: string) {
    try {
      const response = await fetch(`${this.baseUrl}/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId, address }),
      });

      if (!response.ok) {
        throw new Error(`Pricing calculation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Pricing calculation error:', error);
      throw new Error('Unable to calculate pricing. Please try again.');
    }
  }
}

export const coverageApi = new CoverageApiClient();
```

### Step 3: Create Address Input Component
**File**: `components/order/stages/AddressInput.tsx`

```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { FormSection } from '@/components/forms/common/FormSection';
import { InputField } from '@/components/forms/common/FormFields';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  onCheckCoverage: (address: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function AddressInput({
  value,
  onChange,
  onCheckCoverage,
  isLoading = false,
  error
}: AddressInputProps) {
  const [localAddress, setLocalAddress] = useState(value);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (localAddress.trim()) {
      onChange(localAddress.trim());
      onCheckCoverage(localAddress.trim());
    }
  }, [localAddress, onChange, onCheckCoverage]);

  const handleInputChange = useCallback((newValue: string) => {
    setLocalAddress(newValue);
    onChange(newValue);
  }, [onChange]);

  return (
    <FormSection
      title="Check Service Availability"
      description="Enter your address to see available internet packages and pricing"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <InputField
              label="Service Address"
              value={localAddress}
              onChange={handleInputChange}
              placeholder="e.g. 123 Main Street, Cape Town, 8001"
              error={error}
              leftIcon={<MapPin className="w-4 h-4 text-gray-400" />}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={!localAddress.trim() || isLoading}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90 px-6"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Checking...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Check Coverage
              </>
            )}
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <p>💡 <strong>Tip:</strong> Include your suburb and postal code for more accurate results</p>
        </div>
      </form>
    </FormSection>
  );
}
```

### Step 4: Create Package Selector Component
**File**: `components/order/stages/PackageSelector.tsx`

```typescript
'use client';

import React from 'react';
import { Package } from '@/lib/order/types';
import { FormSection } from '@/components/forms/common/FormSection';
import { Badge } from '@/components/ui/badge';
import { Check, Wifi, Zap, Users } from 'lucide-react';

interface PackageSelectorProps {
  packages: Package[];
  selectedPackage?: Package;
  onSelectPackage: (pkg: Package) => void;
  customerType?: 'personal' | 'business';
}

export function PackageSelector({
  packages,
  selectedPackage,
  onSelectPackage,
  customerType = 'personal'
}: PackageSelectorProps) {
  const filteredPackages = packages.filter(pkg =>
    customerType === 'business' ? true : !pkg.businessOnly
  );

  const getTypeIcon = (type: Package['type']) => {
    switch (type) {
      case 'fibre': return <Zap className="w-5 h-5" />;
      case 'wireless': return <Wifi className="w-5 h-5" />;
      case 'mobile': return <Users className="w-5 h-5" />;
      default: return <Wifi className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: Package['type']) => {
    switch (type) {
      case 'fibre': return 'bg-green-100 text-green-800';
      case 'wireless': return 'bg-blue-100 text-blue-800';
      case 'mobile': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (filteredPackages.length === 0) {
    return (
      <FormSection title="Available Packages">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <Wifi className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No packages available
          </h3>
          <p className="text-gray-600">
            Unfortunately, we don't have coverage at this address yet.
            Please try a different address or contact us for assistance.
          </p>
        </div>
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Choose Your Package"
      description="Select the internet package that best fits your needs"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`
              relative border-2 rounded-lg p-6 cursor-pointer transition-all duration-200
              ${selectedPackage?.id === pkg.id
                ? 'border-circleTel-orange bg-orange-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
            onClick={() => onSelectPackage(pkg)}
          >
            {/* Selection Indicator */}
            {selectedPackage?.id === pkg.id && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-circleTel-orange rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {/* Popular Badge */}
            {pkg.popular && (
              <div className="absolute -top-2 left-4">
                <Badge className="bg-circleTel-orange text-white">
                  Most Popular
                </Badge>
              </div>
            )}

            {/* Package Type */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-lg ${getTypeColor(pkg.type)}`}>
                {getTypeIcon(pkg.type)}
              </div>
              <span className="text-sm font-medium capitalize">
                {pkg.type} Internet
              </span>
            </div>

            {/* Package Name */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {pkg.name}
            </h3>

            {/* Speed */}
            <div className="text-lg font-semibold text-circleTel-orange mb-3">
              {pkg.speed.download}{pkg.speed.unit}
              {pkg.speed.upload !== pkg.speed.download && (
                <span className="text-sm text-gray-600">
                  ↓ / {pkg.speed.upload}{pkg.speed.unit} ↑
                </span>
              )}
            </div>

            {/* Pricing */}
            <div className="mb-4">
              <div className="text-2xl font-bold text-gray-900">
                R{pkg.pricing.monthly.toLocaleString()}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </div>
              {pkg.pricing.installation > 0 && (
                <div className="text-sm text-gray-600">
                  Installation: R{pkg.pricing.installation.toLocaleString()}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-1">
              {pkg.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-3 h-3 text-green-500" />
                  {feature}
                </div>
              ))}
              {pkg.features.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{pkg.features.length - 3} more features
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mt-3">
              {pkg.description}
            </p>
          </div>
        ))}
      </div>
    </FormSection>
  );
}
```

### Step 5: Create Pricing Display Component
**File**: `components/order/stages/PricingDisplay.tsx`

```typescript
'use client';

import React from 'react';
import { PricingBreakdown } from '@/lib/order/types';
import { FormSection } from '@/components/forms/common/FormSection';

interface PricingDisplayProps {
  pricing: PricingBreakdown;
  packageName: string;
}

export function PricingDisplay({ pricing, packageName }: PricingDisplayProps) {
  return (
    <FormSection title="Pricing Summary">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {packageName}
        </h3>

        <div className="space-y-3">
          {/* Monthly Cost */}
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Monthly Service</span>
            <span className="font-medium">R{pricing.monthly.toLocaleString()}</span>
          </div>

          {/* Installation Cost */}
          {pricing.installation > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Installation Fee</span>
              <span className="font-medium">R{pricing.installation.toLocaleString()}</span>
            </div>
          )}

          {/* Equipment Cost */}
          {pricing.equipment > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Equipment</span>
              <span className="font-medium">R{pricing.equipment.toLocaleString()}</span>
            </div>
          )}

          {/* Subtotal */}
          <div className="flex justify-between py-2 border-t border-gray-200">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">R{pricing.subtotal.toLocaleString()}</span>
          </div>

          {/* VAT */}
          <div className="flex justify-between py-2">
            <span className="text-gray-600">VAT (15%)</span>
            <span className="font-medium">R{pricing.vat.toLocaleString()}</span>
          </div>

          {/* Total */}
          <div className="flex justify-between py-3 border-t-2 border-gray-300">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-circleTel-orange">
              R{pricing.total.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> Installation typically takes 3-5 business days.
            Monthly billing starts after successful installation.
          </p>
        </div>
      </div>
    </FormSection>
  );
}
```

### Step 6: Create Coverage Stage Component
**File**: `components/order/stages/CoverageStage.tsx`

```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { AddressInput } from './AddressInput';
import { PackageSelector } from './PackageSelector';
import { PricingDisplay } from './PricingDisplay';
import { coverageApi } from '@/lib/order/coverage-api';
import { Package, CoverageResponse, PricingBreakdown } from '@/lib/order/types';

export function CoverageStage() {
  const { state, actions } = useOrderContext();
  const { orderData } = state;
  const [address, setAddress] = useState(orderData.coverage.address || '');
  const [selectedPackage, setSelectedPackage] = useState<Package | undefined>(
    orderData.coverage.selectedPackage
  );

  // Coverage check mutation
  const coverageCheck = useMutation({
    mutationFn: (address: string) => coverageApi.checkCoverage(address),
    onSuccess: (data: CoverageResponse) => {
      actions.updateOrderData({
        coverage: {
          ...orderData.coverage,
          address,
          coverageResult: data,
        }
      });
    },
    onError: (error) => {
      actions.setErrors({
        coverage: [`Failed to check coverage: ${error.message}`]
      });
    }
  });

  // Pricing calculation mutation
  const pricingCalc = useMutation({
    mutationFn: ({ packageId, address }: { packageId: string; address: string }) =>
      coverageApi.calculatePricing(packageId, address),
    onSuccess: (pricing: PricingBreakdown) => {
      actions.updateOrderData({
        coverage: {
          ...orderData.coverage,
          pricing,
        }
      });
    }
  });

  const handleAddressChange = useCallback((newAddress: string) => {
    setAddress(newAddress);
    // Clear previous results when address changes
    if (newAddress !== orderData.coverage.address) {
      setSelectedPackage(undefined);
      actions.updateOrderData({
        coverage: {
          address: newAddress,
        }
      });
    }
  }, [orderData.coverage.address, actions]);

  const handleCoverageCheck = useCallback((address: string) => {
    coverageCheck.mutate(address);
  }, [coverageCheck]);

  const handlePackageSelect = useCallback((pkg: Package) => {
    setSelectedPackage(pkg);
    actions.updateOrderData({
      coverage: {
        ...orderData.coverage,
        selectedPackage: pkg,
      }
    });

    // Calculate pricing for selected package
    if (address) {
      pricingCalc.mutate({ packageId: pkg.id, address });
    }
  }, [address, orderData.coverage, actions, pricingCalc]);

  const coverageResult = orderData.coverage.coverageResult;
  const pricing = orderData.coverage.pricing;

  return (
    <div className="space-y-8">
      {/* Address Input */}
      <AddressInput
        value={address}
        onChange={handleAddressChange}
        onCheckCoverage={handleCoverageCheck}
        isLoading={coverageCheck.isPending}
        error={state.errors.coverage?.[0]}
      />

      {/* Coverage Results */}
      {coverageResult && (
        <>
          {coverageResult.available ? (
            <>
              {/* Package Selection */}
              <PackageSelector
                packages={coverageResult.packages}
                selectedPackage={selectedPackage}
                onSelectPackage={handlePackageSelect}
              />

              {/* Pricing Display */}
              {selectedPackage && pricing && (
                <PricingDisplay
                  pricing={pricing}
                  packageName={selectedPackage.name}
                />
              )}
            </>
          ) : (
            /* No Coverage Message */
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.429-.898-6-2.364M12 9V7a3 3 0 00-3-3H7a3 3 0 00-3 3v2.172a3 3 0 002.828 2.829L12 15l5.172-3L20 10.172A3 3 0 0020 7V5a3 3 0 00-3-3h-2a3 3 0 00-3 3v2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Coverage Available
              </h3>
              <p className="text-gray-600 mb-4">
                {coverageResult.message || 'We don\'t have coverage at this address yet.'}
              </p>
              <p className="text-sm text-gray-500">
                Try a different address or contact us for alternative solutions.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### Step 7: Create Coverage Page
**File**: `app/order/coverage/page.tsx`

```typescript
'use client';

import React from 'react';
import { OrderWizard } from '@/components/order/wizard/OrderWizard';
import { CoverageStage } from '@/components/order/stages/CoverageStage';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { useRouter } from 'next/navigation';

export default function CoveragePage() {
  const { state } = useOrderContext();
  const router = useRouter();

  const handleStageComplete = () => {
    // Navigate to account stage
    router.push('/order/account');
  };

  const handleOrderComplete = () => {
    // This won't be called from coverage stage
    router.push('/order/confirmation');
  };

  // Check if stage can proceed (has selected package)
  const canProceed = !!(
    state.orderData.coverage.selectedPackage &&
    state.orderData.coverage.pricing
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Check Coverage & Select Package
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Find the perfect internet package for your location
        </p>
      </div>

      <OrderWizard
        onStageComplete={handleStageComplete}
        onOrderComplete={handleOrderComplete}
      >
        <CoverageStage />
      </OrderWizard>
    </div>
  );
}
```

## Implementation Steps

1. **Extend Order Types**: Add coverage-specific data structures
2. **Create Coverage API Client**: Handle coverage checking and package fetching
3. **Build Address Input**: Address input with validation
4. **Develop Package Selector**: Visual package selection with features
5. **Create Pricing Display**: Clear pricing breakdown with VAT
6. **Integrate Coverage Stage**: Main stage component orchestrating the flow
7. **Set up Coverage Page**: Next.js page with order wizard integration

## Acceptance Criteria

### Functional Requirements
- [ ] Address input with validation and coverage checking
- [ ] Package display with features, pricing, and selection
- [ ] Pricing breakdown showing VAT and total costs
- [ ] Mobile-responsive package selection
- [ ] Error handling for coverage check failures
- [ ] Integration with order wizard navigation

### Technical Requirements
- [ ] Integration with coverage API (mock for development)
- [ ] Proper loading states during API calls
- [ ] TypeScript strict compliance
- [ ] Reuse of existing CircleTel form components

### Quality Requirements
- [ ] Accessible package selection (keyboard navigation)
- [ ] Clear pricing display following South African standards
- [ ] Performance optimization for package rendering
- [ ] Comprehensive error messaging

## Testing Strategy

### Unit Tests
```typescript
describe('CoverageStage', () => {
  it('should render address input correctly', () => {
    // Test implementation
  });

  it('should display packages after successful coverage check', () => {
    // Test implementation
  });

  it('should calculate and display pricing for selected package', () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('Coverage API Integration', () => {
  it('should handle coverage check API calls', () => {
    // Test implementation
  });

  it('should handle API errors gracefully', () => {
    // Test implementation
  });
});
```

## Dependencies

### External Dependencies
- **Coverage API**: Service for checking address coverage
- **Package API**: Service for fetching available packages
- **Pricing API**: Service for calculating pricing with VAT

### Internal Dependencies
- **Order Context**: State management for coverage data
- **Form Components**: Existing CircleTel form components
- **UI Components**: Button, Badge components

## Definition of Done

- [ ] Coverage stage components implemented
- [ ] Address input with coverage checking functional
- [ ] Package selection with pricing display working
- [ ] Mobile-responsive design complete
- [ ] API integration with proper error handling
- [ ] Integration with order wizard navigation
- [ ] TypeScript types comprehensive
- [ ] Unit tests written and passing
- [ ] Code review completed
- [ ] South African VAT calculations verified

## Notes

- Focus on clear, transparent pricing display
- Ensure mobile-first responsive design
- Handle network errors gracefully
- Support both personal and business customers
- Consider future integration with real coverage APIs