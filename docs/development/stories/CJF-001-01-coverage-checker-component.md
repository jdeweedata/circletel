# Story: CJF-001-01 - Coverage Checker Component
## Epic: CJF-001 - Service Availability & Product Discovery
### Sprint 42 - October 2025

---

## Story Overview

**ID**: CJF-001-01  
**Title**: Implement Coverage Checker Component  
**Points**: 5 (3 days)  
**Priority**: P0 - Critical  
**Type**: Feature  
**Status**: Ready for Development  

### Business Context
CircleTel needs to enable customers to quickly check if our services (SkyFibre, HomeFibreConnect, BizFibreConnect) are available at their location. This is the first touchpoint for potential customers and critical for lead capture in areas without coverage.

### User Story
As a potential customer,  
I want to check if CircleTel services are available at my address,  
So that I can proceed to purchase the services I need.

---

## Full Context Engineering

### Business Requirements Reference
- **BRS Section**: 4.1 High-Speed Internet Availability Check
- **Customer Journey**: Initial discovery and qualification
- **Business Impact**: 
  - Lead capture for 100% of visitors
  - Coverage qualification in < 2 seconds
  - Conversion rate improvement by 35%
  - No-coverage lead capture for future expansion

### Technical Architecture
```
User Input → Google Places API → Coverage API → Results Display
     ↓              ↓                ↓              ↓
Geolocation    Validation      Database      Lead Capture
```

### Existing CircleTel Components to Reuse
```typescript
// Existing components in the project:
- /components/ui/input.tsx          // shadcn input component
- /components/ui/button.tsx         // shadcn button component
- /components/ui/card.tsx           // shadcn card component
- /components/forms/FormField.tsx   // CircleTel form field wrapper
- /lib/utils/validation.ts          // Validation utilities
- /hooks/useGeolocation.ts          // Geolocation hook
```

### API Endpoints Required
```typescript
// Supabase functions to create:
POST /api/coverage/check
  Request: { 
    address: string, 
    coordinates?: { lat: number, lng: number } 
  }
  Response: {
    available: boolean,
    services: ['SkyFibre' | 'HomeFibreConnect' | 'BizFibreConnect'][],
    speeds: { download: number, upload: number }[],
    message?: string
  }

POST /api/leads/capture
  Request: {
    email: string,
    phone?: string,
    address: string,
    requestedService: string
  }
  Response: { 
    success: boolean, 
    leadId: string 
  }
```

---

## Detailed Implementation Guide

### Component Structure
```typescript
// /components/coverage/CoverageChecker.tsx
interface CoverageCheckerProps {
  onCoverageFound: (services: Service[]) => void;
  onNoCoverage: () => void;
  className?: string;
}

interface CoverageResult {
  available: boolean;
  services: ServiceType[];
  speeds: SpeedOption[];
  coverage_map?: string; // URL to coverage map
}
```

### Implementation Steps

#### Step 1: Create Base Component (Day 1 - Morning)
```typescript
// /components/coverage/CoverageChecker.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from 'sonner';

const addressSchema = z.object({
  address: z.string().min(5, 'Please enter a valid address'),
});

export function CoverageChecker({ onCoverageFound, onNoCoverage, className }: CoverageCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CoverageResult | null>(null);
  const { location, getLocation, loading: geoLoading } = useGeolocation();
  
  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
  });

  // Implementation continues...
}
```

#### Step 2: Integrate Google Places Autocomplete (Day 1 - Afternoon)
```typescript
// /components/coverage/AddressAutocomplete.tsx
import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || autocompleteRef.current) return;

    // South Africa bounds
    const southAfricaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-34.8, 16.5),
      new google.maps.LatLng(-22.1, 32.9)
    );

    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      {
        bounds: southAfricaBounds,
        componentRestrictions: { country: 'za' },
        fields: ['address_components', 'geometry', 'formatted_address'],
      }
    );

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address, place);
      }
    });
  }, [onChange]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
```

#### Step 3: Create Coverage API Integration (Day 2 - Morning)
```typescript
// /lib/api/coverage.ts
import { supabase } from '@/lib/supabase/client';

export interface CoverageCheckParams {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export async function checkCoverage(params: CoverageCheckParams): Promise<CoverageResult> {
  try {
    const { data, error } = await supabase.functions.invoke('check-coverage', {
      body: params,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Coverage check failed:', error);
    throw new Error('Unable to check coverage at this time');
  }
}

// Supabase Edge Function
// /supabase/functions/check-coverage/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

serve(async (req) => {
  const { address, coordinates } = await req.json();
  
  // Query coverage areas from database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: coverageAreas, error } = await supabase
    .from('coverage_areas')
    .select('*')
    .contains('polygon', coordinates || {});

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const availableServices = coverageAreas.map(area => ({
    type: area.service_type,
    speeds: area.available_speeds,
  }));

  return new Response(
    JSON.stringify({
      available: availableServices.length > 0,
      services: availableServices.map(s => s.type),
      speeds: availableServices.flatMap(s => s.speeds),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
```

#### Step 4: Implement Lead Capture (Day 2 - Afternoon)
```typescript
// /components/coverage/NoCoverageLeadCapture.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { captureLead } from '@/lib/api/leads';
import { toast } from 'sonner';

const leadSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  phone: z.string().regex(/^(\+27|0)[0-9]{9}$/, 'Please enter a valid South African phone number'),
  preferredService: z.enum(['SkyFibre', 'HomeFibreConnect', 'BizFibreConnect']),
});

interface NoCoverageLeadCaptureProps {
  address: string;
  open: boolean;
  onClose: () => void;
}

export function NoCoverageLeadCapture({ address, open, onClose }: NoCoverageLeadCaptureProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      preferredService: 'HomeFibreConnect',
    },
  });

  const onSubmit = async (data: z.infer<typeof leadSchema>) => {
    setIsSubmitting(true);
    try {
      await captureLead({
        ...data,
        address,
        source: 'coverage_checker',
      });
      
      toast.success('Thank you! We'll notify you when service becomes available.');
      onClose();
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Coming Soon to Your Area!</DialogTitle>
          <DialogDescription>
            We're expanding rapidly. Leave your details and we'll notify you as soon as CircleTel services become available at {address}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Form fields implementation */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### Step 5: Create Results Display Component (Day 3 - Morning)
```typescript
// /components/coverage/CoverageResults.tsx
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Wifi, Home, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CoverageResultsProps {
  results: CoverageResult;
  address: string;
}

const serviceIcons = {
  SkyFibre: Wifi,
  HomeFibreConnect: Home,
  BizFibreConnect: Building,
};

const serviceDescriptions = {
  SkyFibre: 'Wireless broadband for quick deployment',
  HomeFibreConnect: 'Premium fibre for residential',
  BizFibreConnect: 'Enterprise-grade fibre for business',
};

export function CoverageResults({ results, address }: CoverageResultsProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span className="font-semibold">Great news! Service is available at your location</span>
      </div>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground mb-4">{address}</p>
        
        <div className="space-y-3">
          {results.services.map((service) => {
            const Icon = serviceIcons[service];
            return (
              <div key={service} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-circleTel-orange" />
                  <div>
                    <p className="font-medium">{service}</p>
                    <p className="text-sm text-muted-foreground">
                      {serviceDescriptions[service]}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Available</Badge>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <Button 
            onClick={() => router.push('/products')}
            className="flex-1"
          >
            View Products
          </Button>
          <Button 
            onClick={() => router.push('/bundles')}
            variant="outline"
            className="flex-1"
          >
            See Bundles
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
```

#### Step 6: Integration and Testing (Day 3 - Afternoon)
```typescript
// /app/page.tsx - Homepage integration
import { CoverageChecker } from '@/components/coverage/CoverageChecker';

export default function HomePage() {
  return (
    <main>
      <section className="hero-section">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">
            South Africa's Next-Gen Digital Service Provider
          </h1>
          <p className="text-xl mb-8">
            Enterprise-Grade IT + Connectivity Bundle for SMEs
          </p>
          
          <CoverageChecker
            onCoverageFound={(services) => {
              // Track analytics event
              analytics.track('Coverage Found', { services });
            }}
            onNoCoverage={() => {
              // Track lead capture opportunity
              analytics.track('No Coverage Area');
            }}
            className="max-w-2xl mx-auto"
          />
        </div>
      </section>
    </main>
  );
}
```

---

## Testing Requirements

### Unit Tests
```typescript
// /components/coverage/__tests__/CoverageChecker.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoverageChecker } from '../CoverageChecker';
import * as coverageAPI from '@/lib/api/coverage';

jest.mock('@/lib/api/coverage');

describe('CoverageChecker', () => {
  it('should display loading state while checking coverage', async () => {
    // Test implementation
  });

  it('should show available services when coverage is found', async () => {
    // Test implementation
  });

  it('should trigger lead capture when no coverage', async () => {
    // Test implementation
  });

  it('should handle geolocation when available', async () => {
    // Test implementation
  });

  it('should validate address input', async () => {
    // Test implementation
  });
});
```

### Integration Tests
1. Google Places API integration
2. Supabase function invocation
3. Lead capture flow
4. Error handling scenarios

### User Acceptance Tests
1. User can enter address manually
2. User can use current location
3. Results display within 2 seconds
4. Lead capture form works for no-coverage areas
5. Mobile responsive design works

---

## Quality Gates

### Performance
- [ ] Coverage check API response < 2 seconds
- [ ] Component loads < 500ms
- [ ] Google Places autocomplete < 300ms response

### Functionality
- [ ] All three service types detected correctly
- [ ] Lead capture saves to database
- [ ] Geolocation works on mobile
- [ ] Address validation prevents invalid inputs

### User Experience
- [ ] Mobile responsive (320px - 1920px)
- [ ] Accessible (WCAG 2.1 Level AA)
- [ ] Loading states implemented
- [ ] Error messages helpful
- [ ] Success feedback clear

### Security
- [ ] API endpoints authenticated
- [ ] Input validation on backend
- [ ] Rate limiting implemented
- [ ] POPIA compliant data handling

---

## Definition of Done

- [ ] Component implemented and tested
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Deployed to staging environment
- [ ] UAT completed and signed off
- [ ] Performance metrics met
- [ ] Security review passed
- [ ] Deployed to production

---

## Dependencies

### External Dependencies
- Google Maps JavaScript API key configured
- Supabase project setup with coverage_areas table
- Analytics tracking configured

### Internal Dependencies
- Design system components ready
- API endpoints deployed
- Database schema migrated

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google API quota exceeded | High | Implement caching and rate limiting |
| Coverage data inaccurate | High | Regular data validation process |
| Poor mobile performance | Medium | Progressive enhancement approach |
| Lead capture fails | Medium | Queue system with retry logic |

---

## References

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [CircleTel Design System](/docs/design-system)
- [Coverage Areas Data Model](/docs/technical/database-schema#coverage-areas)

---

*Story created using BMAD Method*  
*Last Updated: September 28, 2025*  
*Sprint 42 - October 2025*
