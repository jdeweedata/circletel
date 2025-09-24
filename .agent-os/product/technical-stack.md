# CircleTel Technical Stack & Implementation

## Core Technology Stack

### Frontend Architecture

#### Primary Framework
```typescript
// React 18 with TypeScript (Strict Mode)
"react": "^18.3.1"
"typescript": "^5.5.3"
"@types/react": "^18.3.3"
"@types/react-dom": "^18.3.0"
```

#### Build & Development
```javascript
// Vite with SWC for ultra-fast builds
"vite": "^5.4.1"
"@vitejs/plugin-react-swc": "^3.5.0"
```
- **Hot Module Replacement**: Sub-second feedback loops
- **Build Performance**: ~30 second production builds
- **Development Server**: Port 8080 with automatic browser refresh

#### Routing & State
```typescript
// React Router DOM for client-side routing
"react-router-dom": "^6.26.2"

// React Query for server state management
"@tanstack/react-query": "^5.56.2"
```

#### Styling & UI Components
```css
/* Tailwind CSS with custom CircleTel tokens */
"tailwindcss": "^3.4.11"
"tailwindcss-animate": "^1.0.7"
"@tailwindcss/typography": "^0.5.15"

/* Custom CircleTel Brand Colors */
--circleTel-orange: #F5831F
--circleTel-orange-dark: #E6751C
--circleTel-orange-light: #F7931E
```

#### Component Library
```typescript
// shadcn/ui components (Radix UI primitives)
"@radix-ui/react-*": "Latest versions"
"class-variance-authority": "^0.7.1"
"clsx": "^2.1.1"
"tailwind-merge": "^2.5.2"
```

### Backend Infrastructure

#### Supabase Platform
```typescript
// Supabase client configuration
"@supabase/supabase-js": "^2.49.4"

// Environment Configuration
VITE_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Database Architecture
- **PostgreSQL**: Primary database with row-level security
- **PostGIS Extension**: Spatial data processing and indexing
- **Real-time Subscriptions**: WebSocket connections for live updates
- **Edge Functions**: Deno runtime for serverless API endpoints

#### Edge Functions Structure
```
supabase/functions/
├── _shared/                    # Common utilities
│   ├── cors.ts                # CORS configuration
│   ├── database.ts            # Database connection utilities
│   └── validation.ts          # Input validation helpers
├── admin-auth/                # Admin authentication
├── admin-product-management/  # Product CRUD operations
├── check-fttb-coverage/       # Basic coverage checking
├── multi-provider-coverage/   # Advanced coverage engine
├── spatial-coverage-query/    # Next-gen spatial queries (planned)
├── zoho-integration/          # CRM integration
└── unjani-form-submission/   # Client-specific forms
```

### Mapping & Spatial Technology

#### Current Implementation
```typescript
// Google Maps JavaScript API
"@googlemaps/js-api-loader": "^1.16.10"
"@types/google.maps": "^3.58.1"

// Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC-kOFKZqhhmLXgEjXV7upYs_l1s_h3VzU
```

#### Next-Generation Spatial Stack (In Development)
```typescript
// ArcGIS API for JavaScript
// Planned integration for advanced spatial queries
// PostGIS spatial indexing for high-performance coverage queries
// R-tree client-side indexing for optimized performance
```

**Performance Targets**:
- Metro areas: <1 second response time
- Rural areas: <2 seconds response time
- Map interactions: <500ms for pan/zoom operations
- 6+ concurrent spatial queries for parallel processing

### Form Management & Validation

#### Form Handling
```typescript
// React Hook Form with TypeScript integration
"react-hook-form": "^7.53.0"
"@hookform/resolvers": "^3.9.0"

// Zod schema validation
"zod": "^3.23.8"
```

#### Form Architecture Pattern
```typescript
// Example form implementation
interface ContactFormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(1, "Company name is required"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

const form = useForm<ContactFormData>({
  resolver: zodResolver(contactSchema),
  defaultValues: {
    name: "",
    email: "",
    company: "",
    message: ""
  }
});
```

### Design System Architecture

#### Token System
```typescript
// Design tokens in src/design-system/tokens.ts
export const colors = {
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    500: '#F5831F', // CircleTel Orange
    600: '#E6751C',
    900: '#9A3412'
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  }
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'sans-serif'],
    mono: ['Space Mono', 'monospace']
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }]
  }
};
```

#### Component Architecture
```typescript
// Atomic design system structure
src/design-system/
├── tokens.ts                  # Design tokens
├── foundations/              # Typography, spacing guidelines
├── components/
│   ├── atoms/               # Button, Input, Text, etc.
│   ├── molecules/           # SearchField, FormField, etc.
│   └── organisms/           # Header, Footer, HeroSection, etc.
└── index.ts                 # Main export file
```

### Testing & Quality Assurance

#### Testing Framework
```typescript
// Playwright for end-to-end testing
"@playwright/test": "^1.47.0"

// Configuration files
playwright.design-system.config.ts  // Design system testing
playwright.admin.config.ts           // Admin interface testing
```

#### Validation Scripts
```javascript
// Custom validation scripts
scripts/
├── validate-changed.js        # Smart validation (5s)
├── validate.js               # Full validation (~22s)
└── design-system-validation.js  # Design system testing
```

#### CI/CD Performance
- **Regular Commits**: 30 seconds - 2 minutes (validate + build only)
- **Full Validation**: ~7-8 minutes (includes comprehensive test suite)
- **Changed File Validation**: ~5 seconds (local development)
- **Pre-commit Hooks**: Husky with ESLint and validation

### Development Tools & Configuration

#### Code Quality
```javascript
// ESLint configuration
"eslint": "^9.9.0"
"typescript-eslint": "^8.0.1"
"eslint-plugin-react-hooks": "^5.1.0"

// Husky for pre-commit hooks
"husky": "^9.1.7"
"lint-staged": "^16.2.0"
```

#### Development Commands
```bash
# Core development
npm run dev          # Start development server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build

# Validation & CI optimization
npm run validate     # Smart validation (changed files, ~5s)
npm run validate:full # Full validation without tests (~22s)
npm run validate:all # Complete validation with tests (~7min)

# Design system testing
npm run ds:validate [scenario]  # Run design system validation
npm run test:design-system     # Playwright design system tests
npm run ds:update-baselines    # Update visual regression baselines
```

### Third-Party Integrations

#### CRM Integration
```typescript
// Zoho CRM configuration
ZOHO_MCP_URL=https://circletel-zoho-900485550.zohomcp.com/mcp/message
ZOHO_MCP_KEY=e2f4039d67d5fb236177fbce811a0ff0
ZOHO_ORG_ID=900485550
```

#### Analytics & Monitoring
```typescript
// Vercel Analytics
"@vercel/analytics": "^1.5.0"

// Implementation
import { Analytics } from '@vercel/analytics/react';
```

#### Authentication
```typescript
// JWT Configuration for admin authentication
JWT_KEY_ID=75474cb4-8353-4a20-9375-9ce97b8aac64
JWT_DISCOVERY_URL=https://agyjovdugmtopasyvlng.supabase.co/auth/v1/.well-known/jwks.json
JWT_ALGORITHM=ES256
```

### Deployment & Infrastructure

#### Frontend Deployment
- **Platform**: Vercel
- **Domain**: circletel.co.za
- **CDN**: Automatic global CDN distribution
- **SSL**: Automatic SSL certificate management

#### Backend Deployment
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **Database**: Supabase managed PostgreSQL with PostGIS
- **Real-time**: Supabase Realtime WebSocket subscriptions
- **Storage**: Supabase Storage for file uploads

#### Environment Configuration
```bash
# Production Environment Variables
VITE_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC-kOFKZqhhmLXgEjXV7upYs_l1s_h3VzU
```

### Performance Optimization

#### Frontend Performance
- **Bundle Splitting**: Route-based code splitting with React.lazy()
- **Asset Optimization**: Vite automatic asset optimization
- **Lazy Loading**: Component lazy loading with Suspense boundaries
- **Caching Strategy**: React Query with optimistic updates

#### Backend Performance
- **Database Indexing**: Spatial indexes on coverage areas
- **Connection Pooling**: Supabase managed connection pooling
- **Edge Function Optimization**: Deno runtime with fast cold starts
- **Parallel Processing**: Concurrent coverage queries (6+ providers)

#### Monitoring & Metrics
```typescript
// Performance monitoring targets
const performanceTargets = {
  coverageQueries: {
    metro: "< 1 second",
    rural: "< 2 seconds"
  },
  mapInteractions: "< 500ms",
  buildPerformance: {
    regular: "30s - 2min",
    full: "~7-8min"
  }
};
```

### Security Implementation

#### Authentication & Authorization
- **Admin Authentication**: Custom JWT implementation with Supabase
- **Row-Level Security**: PostgreSQL RLS policies on all tables
- **API Security**: CORS configuration and input validation
- **Environment Security**: Secure secret management

#### Data Protection
```typescript
// Input validation with Zod schemas
const userInputSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().min(1).max(100),
  message: z.string().min(10).max(1000)
}).strict();

// SQL injection prevention through Supabase parameterized queries
const { data, error } = await supabase
  .from('contacts')
  .insert(validatedData);
```

### Future Technology Roadmap

#### Planned Integrations
- **ArcGIS API for JavaScript**: Advanced spatial analysis
- **React Native**: Mobile applications for field service
- **GraphQL**: Complex data relationship queries
- **WebRTC**: Real-time communication features
- **PWA Enhancements**: Offline capabilities and push notifications

#### Technology Upgrades
- **React 19**: When stable for concurrent features
- **Next.js Migration**: For enhanced SSR capabilities (if needed)
- **TypeScript 5.x**: Latest TypeScript features
- **Vite 6**: Next-generation build tools when available