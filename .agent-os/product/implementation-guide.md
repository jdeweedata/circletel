# CircleTel Implementation Guide

## Quick Start Guide

### Local Development Setup

#### Prerequisites
- **Node.js**: Version 18+ (LTS recommended)
- **npm**: Version 9+ (comes with Node.js)
- **Git**: For version control and deployment
- **Supabase CLI**: For local development and deployment

#### Environment Configuration
```bash
# Clone repository
git clone <repository-url>
cd circletel.co.za

# Install dependencies
npm install

# Setup pre-commit hooks
npm run prepare

# Copy environment variables
cp .env.example .env
# Update .env with your API keys
```

#### Required Environment Variables
```env
# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Supabase Configuration
VITE_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Zoho Integration
ZOHO_MCP_URL=your_zoho_mcp_url
ZOHO_MCP_KEY=your_zoho_key
ZOHO_ORG_ID=your_org_id
```

#### Development Commands
```bash
# Start development server (port 8080)
npm run dev

# Run validation (fast, ~5s)
npm run validate

# Build for production
npm run build

# Preview production build
npm run preview
```

### Branch Management

#### Current Active Development
- **Main Branch**: `main` - Production-ready code
- **Feature Branch**: `003-interactive-coverage-checker` - Active development
- **Development Workflow**: Feature branches → main via pull requests

#### Branch Naming Convention
```bash
# Feature branches
001-feature-name
002-another-feature

# Bug fixes
bugfix-short-description

# Hotfixes
hotfix-critical-issue
```

## Architecture Implementation

### Frontend Component Structure

#### Design System Usage
```typescript
// Import design system components
import { Button, Card, Heading, Text } from '@/design-system';
import { colors, typography, spacing } from '@/design-system/tokens';

// Component implementation
export const ExampleComponent = () => {
  return (
    <Card className="p-6">
      <Heading level={2} variant="section" color="primary">
        Service Overview
      </Heading>
      <Text variant="body" color="secondary" className="mt-4">
        Description text using design system tokens
      </Text>
      <Button variant="default" size="lg" className="mt-6">
        Get Started
      </Button>
    </Card>
  );
};
```

#### Route Implementation
```typescript
// Page component structure
// src/pages/ExamplePage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const ExamplePage = () => {
  // React Query for server state
  const { data, isLoading, error } = useQuery({
    queryKey: ['example-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('example_table')
        .select('*');

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page content using design system */}
    </div>
  );
};
```

### Backend Edge Function Implementation

#### Basic Edge Function Structure
```typescript
// supabase/functions/example-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { data } = await req.json();

    // Validate input
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Missing required data' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Business logic
    const result = await supabase
      .from('table_name')
      .insert(data)
      .select();

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### Database Schema Implementation

#### Migration Example
```sql
-- supabase/migrations/timestamp_create_example_table.sql
CREATE TABLE IF NOT EXISTS example_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security
ALTER TABLE example_table ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON example_table
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON example_table
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_example_table_email ON example_table(email);
CREATE INDEX idx_example_table_created_at ON example_table(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_example_table_updated_at
  BEFORE UPDATE ON example_table
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Feature Implementation Patterns

### Form Implementation Pattern

#### 1. Define Types and Schema
```typescript
// src/types/example-form.ts
import { z } from 'zod';

export const exampleFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(1, "Company name is required"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

export type ExampleFormData = z.infer<typeof exampleFormSchema>;
```

#### 2. Create Form Component
```typescript
// src/components/forms/ExampleForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label } from '@/design-system';
import { exampleFormSchema, type ExampleFormData } from '@/types/example-form';

export const ExampleForm = () => {
  const form = useForm<ExampleFormData>({
    resolver: zodResolver(exampleFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: ""
    }
  });

  const onSubmit = async (data: ExampleFormData) => {
    try {
      const response = await fetch('/api/example-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Submission failed');

      // Handle success
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />
      </div>

      {/* Additional form fields */}

      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full"
      >
        {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
};
```

### Coverage Checking Implementation

#### 1. Coverage Service
```typescript
// src/services/coverageService.ts
import { supabase } from '@/lib/supabase';

interface CoverageRequest {
  latitude: number;
  longitude: number;
  address: string;
}

export const checkCoverage = async (request: CoverageRequest) => {
  const { data, error } = await supabase.functions.invoke(
    'check-fttb-coverage',
    {
      body: request,
      headers: { 'Content-Type': 'application/json' }
    }
  );

  if (error) throw error;
  return data;
};
```

#### 2. Coverage Hook
```typescript
// src/hooks/useCoverage.ts
import { useQuery } from '@tanstack/react-query';
import { checkCoverage } from '@/services/coverageService';

export const useCoverage = (coordinates: { lat: number; lng: number } | null) => {
  return useQuery({
    queryKey: ['coverage', coordinates],
    queryFn: () => checkCoverage({
      latitude: coordinates!.lat,
      longitude: coordinates!.lng,
      address: '' // Will be populated from geocoding
    }),
    enabled: !!coordinates,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};
```

## Deployment Guide

### Frontend Deployment (Vercel)

#### 1. Environment Variables Setup
```bash
# In Vercel dashboard, add environment variables:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

#### 2. Build Configuration
```typescript
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "npm run build",
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Backend Deployment (Supabase)

#### 1. Edge Function Deployment
```bash
# Deploy single function
supabase functions deploy function-name

# Deploy all functions
supabase functions deploy

# Deploy with environment variables
supabase secrets set KEY=value
```

#### 2. Database Migration
```bash
# Run migrations
supabase db push

# Reset database (development only)
supabase db reset

# Generate types
supabase gen types typescript --local > src/types/supabase.ts
```

## Testing Implementation

### Component Testing Pattern
```typescript
// tests/components/ExampleComponent.test.ts
import { test, expect } from '@playwright/test';

test.describe('Example Component', () => {
  test('should render correctly', async ({ page }) => {
    await page.goto('/example-page');

    await expect(page.locator('h1')).toContainText('Example Title');
    await expect(page.locator('[data-testid="example-component"]')).toBeVisible();
  });

  test('should handle form submission', async ({ page }) => {
    await page.goto('/example-page');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

### Design System Testing
```bash
# Run design system validation
npm run ds:validate

# Run specific scenarios
npm run ds:validate accessibility
npm run ds:validate visual
npm run ds:validate mobile

# Update visual baselines
npm run ds:update-baselines
```

## Performance Optimization

### Code Splitting Implementation
```typescript
// Lazy loading for route components
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/design-system';

const LazyExamplePage = lazy(() => import('@/pages/ExamplePage'));

export const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyExamplePage />
    </Suspense>
  );
};
```

### Image Optimization
```typescript
// Optimized image component
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export const OptimizedImage = ({ src, alt, width, height }: OptimizedImageProps) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoading(false)}
        className={`transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};
```

## Security Best Practices

### Input Validation
```typescript
// Always validate inputs with Zod
import { z } from 'zod';

const userInputSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().min(1).max(100),
  message: z.string().min(10).max(1000)
}).strict();

// In Edge Functions
const validatedData = userInputSchema.parse(requestData);
```

### Database Security
```sql
-- Always use Row Level Security
ALTER TABLE sensitive_table ENABLE ROW LEVEL SECURITY;

-- Restrict access appropriately
CREATE POLICY "Users can only see their own data" ON sensitive_table
  FOR ALL USING (auth.uid() = user_id);
```

## Monitoring & Analytics

### Error Tracking Implementation
```typescript
// Error boundary for React components
import { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught error:', error, errorInfo);
    // Send to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>Please refresh the page or contact support.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Performance Monitoring
```typescript
// Custom performance tracking
export const trackPageLoad = (pageName: string) => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // Send to analytics
    console.log(`Page ${pageName} loaded in ${loadTime}ms`);
  };
};
```

This implementation guide provides the foundation for extending and maintaining the CircleTel platform while following established patterns and best practices.