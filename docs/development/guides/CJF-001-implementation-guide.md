# 🚀 Starting CJF-001: Implementation Guide
## Service Availability & Product Discovery - BMAD Method in Action

---

## 📅 Day 0: Pre-Sprint Setup (Today)

### 1. Environment Preparation
```bash
# Navigate to your project
cd C:\Projects\circletel-nextjs

# Install any missing dependencies
npm install @googlemaps/js-api-loader
npm install @supabase/supabase-js
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react
npm install sonner  # For toast notifications

# Verify your environment variables
# Check .env.local for:
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
# NEXT_PUBLIC_SUPABASE_URL=your_url_here
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### 2. Database Setup
```sql
-- Run this in your Supabase SQL editor
-- Create coverage_areas table
CREATE TABLE coverage_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL CHECK (service_type IN ('SkyFibre', 'HomeFibreConnect', 'BizFibreConnect')),
  area_name TEXT NOT NULL,
  polygon JSONB NOT NULL,
  available_speeds JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'coming_soon', 'planned')),
  activation_days INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  coordinates JSONB,
  requested_service TEXT,
  source TEXT DEFAULT 'coverage_checker',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('connectivity', 'it_services', 'bundle')),
  service_type TEXT,
  description TEXT,
  features JSONB DEFAULT '[]',
  pricing JSONB NOT NULL,
  requirements JSONB DEFAULT '[]',
  bundle_components TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_coverage_areas_service_type ON coverage_areas(service_type);
CREATE INDEX idx_coverage_areas_status ON coverage_areas(status);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
```

### 3. Create Initial Project Structure
```bash
# Create the necessary directories
mkdir -p components/coverage
mkdir -p components/products
mkdir -p components/recommendations
mkdir -p lib/api
mkdir -p lib/hooks
mkdir -p lib/utils
mkdir -p supabase/functions/check-coverage
mkdir -p supabase/functions/capture-lead
mkdir -p supabase/functions/get-products
```

---

## 🎯 Day 1: Start Development with BMAD

### Morning: Setup and First Component

#### Step 1: Review the BMAD Story
```bash
# Open and read the detailed story
code C:\Projects\circletel-nextjs\docs\development\stories\CJF-001-01-coverage-checker-component.md
```

#### Step 2: Create Base Coverage Checker Component
Create `components/coverage/CoverageChecker.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface CoverageCheckerProps {
  onCoverageFound?: (services: any[]) => void;
  onNoCoverage?: () => void;
  className?: string;
}

export function CoverageChecker({ 
  onCoverageFound, 
  onNoCoverage, 
  className 
}: CoverageCheckerProps) {
  const [address, setAddress] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState(null);

  const handleCheckCoverage = async () => {
    if (!address.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setIsChecking(true);
    try {
      // TODO: Implement API call
      console.log('Checking coverage for:', address);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock results for now
      const mockResults = {
        available: true,
        services: ['HomeFibreConnect', 'SkyFibre'],
        speeds: [
          { download: 50, upload: 25 },
          { download: 100, upload: 50 }
        ]
      };
      
      setResults(mockResults);
      if (mockResults.available && onCoverageFound) {
        onCoverageFound(mockResults.services);
      } else if (!mockResults.available && onNoCoverage) {
        onNoCoverage();
      }
    } catch (error) {
      console.error('Coverage check failed:', error);
      toast.error('Unable to check coverage. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Got location:', latitude, longitude);
        // TODO: Reverse geocode to get address
        toast.success('Location detected! Checking coverage...');
        handleCheckCoverage();
      },
      (error) => {
        toast.error('Unable to get your location');
      }
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-circleTel-orange" />
          Check Service Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter your address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheckCoverage()}
            className="flex-1"
          />
          <Button
            onClick={handleCheckCoverage}
            disabled={isChecking}
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <Button
          variant="outline"
          onClick={handleUseMyLocation}
          className="w-full"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Use My Current Location
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">
              ✅ Great news! Service is available at your location
            </p>
            <p className="text-sm text-green-600 mt-2">
              Available services: {results.services.join(', ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### Step 3: Add to Homepage
Update `app/page.tsx`:

```typescript
import { CoverageChecker } from '@/components/coverage/CoverageChecker';

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            South Africa's Next-Gen Digital Service Provider
          </h1>
          <p className="text-xl text-muted-foreground">
            Enterprise-Grade IT + Connectivity Bundle for SMEs
          </p>
        </div>

        <CoverageChecker 
          className="max-w-2xl mx-auto"
          onCoverageFound={(services) => {
            console.log('Services available:', services);
            // TODO: Navigate to products page
          }}
          onNoCoverage={() => {
            console.log('No coverage - capture lead');
            // TODO: Show lead capture form
          }}
        />
      </section>
    </main>
  );
}
```

#### Step 4: Test Your Progress
```bash
# Start the development server
npm run dev

# Open browser to http://localhost:3000
# Test the basic coverage checker functionality
```

### Afternoon: Add Google Places Integration

#### Step 5: Create Google Maps Loader
Create `lib/utils/google-maps.ts`:

```typescript
let isLoaded = false;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(): Promise<void> {
  if (isLoaded) {
    return Promise.resolve();
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Maps can only be loaded in the browser'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
```

#### Step 6: Create Address Autocomplete Component
Create `components/coverage/AddressAutocomplete.tsx`:

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { loadGoogleMapsScript } from '@/lib/utils/google-maps';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter your address...",
  className,
  disabled
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setIsLoaded(true))
      .catch((error) => console.error('Failed to load Google Maps:', error));
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

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

    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address, place);
      }
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [isLoaded, onChange]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}
```

---

## 📋 Daily BMAD Workflow

### Using BMAD Agents During Development

#### Morning Standup (9:00 AM)
```markdown
## With Scrum Master Agent
*scrum
> What's the focus for today on CJF-001?
> Any blockers from yesterday?
> Review story progress
```

#### When Stuck (Anytime)
```markdown
## With Developer Agent
*dev
> I'm implementing the coverage API integration
> Getting CORS errors with Supabase
> Show me the correct setup pattern
```

#### Architecture Questions
```markdown
## With Architect Agent
*architect
> Should coverage checks be cached?
> What's the best pattern for handling no-coverage scenarios?
> Review my API design for the coverage endpoint
```

#### Quality Checks
```markdown
## With QA Agent
*qa
> Review my coverage checker implementation
> What test cases should I write?
> Check if this meets our quality gates
```

---

## ✅ Daily Checklist

### Day 1 Checklist
- [ ] Basic CoverageChecker component created
- [ ] Component renders on homepage
- [ ] Address input works
- [ ] Use location button works
- [ ] Mock API call simulated
- [ ] Loading states implemented
- [ ] Error handling in place
- [ ] Google Places autocomplete started

### Day 2 Checklist
- [ ] Google Places fully integrated
- [ ] Supabase edge function created
- [ ] Real API calls working
- [ ] Results display component done
- [ ] Lead capture form created
- [ ] Database queries optimized

### Day 3 Checklist
- [ ] All components integrated
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] Performance optimized
- [ ] Mobile responsive verified
- [ ] Documentation complete
- [ ] Code review done
- [ ] Deployed to staging

---

## 🚨 Common Issues & Solutions

### Issue 1: Google Maps API Key
```bash
# If Google Maps isn't loading:
# 1. Check your .env.local file
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_key

# 2. Enable required APIs in Google Cloud Console:
# - Maps JavaScript API
# - Places API
# - Geocoding API

# 3. Add localhost to allowed referrers
```

### Issue 2: Supabase Connection
```bash
# If Supabase isn't connecting:
# 1. Check your environment variables
# 2. Verify your Supabase project is running
# 3. Check CORS settings in Supabase dashboard
```

### Issue 3: TypeScript Errors
```bash
# Install missing types
npm install --save-dev @types/google.maps

# If still having issues, add to tsconfig.json:
{
  "compilerOptions": {
    "types": ["google.maps"]
  }
}
```

---

## 📊 Progress Tracking

### Sprint 42 Progress Board
```markdown
## CJF-001: Service Availability & Product Discovery

### To Do
- [ ] CJF-001-02: Product Catalog System
- [ ] CJF-001-03: Intelligent Recommendations

### In Progress
- [🔄] CJF-001-01: Coverage Checker Component (Day 1 of 3)
  - [x] Basic component structure
  - [x] Address input
  - [ ] Google Places integration
  - [ ] API integration
  - [ ] Results display
  - [ ] Lead capture

### Done
- Nothing yet - let's change that!

### Blocked
- None currently
```

---

## 🎯 Success Metrics to Track

1. **Development Velocity**
   - Story points completed: 0/5 (target: 5)
   - Hours spent: Track in your timesheet

2. **Quality Metrics**
   - Test coverage: 0% (target: 80%)
   - TypeScript errors: 0 (must stay 0)
   - Lighthouse score: Check after implementation

3. **Business Metrics** (After Deployment)
   - Coverage checks performed
   - Leads captured
   - Conversion to product browsing

---

## 🔗 Quick Links

- [Epic Document](./docs/development/epics/CJF-001-service-availability-product-discovery.md)
- [Story Details](./docs/development/stories/CJF-001-01-coverage-checker-component.md)
- [Quality Gates](./docs/development/qa/gates/CJF-001-epic-quality-gate.yml)
- [Component Library](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)
- [Google Maps Docs](https://developers.google.com/maps/documentation)

---

*Remember: The BMAD agents are here to help! Use them whenever you're stuck or need guidance.*

*Daily standup: 9:00 AM SAST*  
*Sprint review: October 12, 2025*
