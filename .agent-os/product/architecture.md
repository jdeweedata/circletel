# CircleTel Platform Architecture

## Technical Stack

### Frontend Architecture
- **Framework**: React 18 with TypeScript (strict mode)
- **Build System**: Vite with SWC for ultra-fast builds and HMR
- **Routing**: React Router DOM with nested routing structure
- **State Management**: React Query (@tanstack/react-query) for server state
- **Forms**: React Hook Form with Zod validation schemas
- **Styling**: Tailwind CSS with custom CircleTel brand tokens

### UI Component System
- **Base Components**: shadcn/ui (Radix UI primitives)
- **Design System**: Comprehensive atomic design system
  - Atoms: Button, Input, Text, etc.
  - Molecules: SearchField, FormField, etc.
  - Organisms: Header, Footer, HeroSection, etc.
- **Brand System**: Custom CircleTel orange (#F5831F) with semantic color system
- **Typography**: Inter (primary) + Space Mono (monospace)

### Backend Infrastructure
- **Platform**: Supabase (PostgreSQL + Edge Functions)
- **Database**: PostgreSQL with PostGIS extension for spatial data
- **API Layer**: Supabase Edge Functions (Deno runtime)
- **Real-time**: Supabase Realtime with WebSocket subscriptions
- **Authentication**: Supabase Auth with custom admin authentication

### Spatial & Mapping Technology
- **Current**: Google Maps API for basic coverage visualization
- **Next-Gen**: ArcGIS API for JavaScript (in development)
- **Spatial Database**: PostGIS extension for spatial indexing
- **Performance**: R-tree client-side indexing, chunked parallel queries
- **Coverage Engine**: Multi-provider spatial coverage checking

### Development & Deployment
- **Version Control**: Git with optimized CI/CD pipeline
- **CI/CD**: GitHub Actions with smart validation (30s builds, 7min full validation)
- **Testing**: Playwright for end-to-end and visual regression testing
- **Deployment**: Vercel for frontend, Supabase for backend
- **Analytics**: Vercel Analytics integrated

## System Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Supabase Edge  │    │   PostgreSQL    │
│                 │    │   Functions     │    │   + PostGIS     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React Query   │◄──►│ • TypeScript    │◄──►│ • Spatial Index │
│ • React Router  │    │ • Deno Runtime  │    │ • Real-time Sub │
│ • Design System │    │ • CORS Enabled  │    │ • Migrations    │
│ • ArcGIS Client │    │ • JWT Auth      │    │ • Row Security  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  External APIs  │◄─────────────┘
                        ├─────────────────┤
                        │ • Google Maps   │
                        │ • ArcGIS Online │
                        │ • Zoho CRM      │
                        │ • Provider APIs │
                        └─────────────────┘
```

## Key Components & Services

### Edge Functions Architecture
```
supabase/functions/
├── _shared/
│   ├── cors.ts           # CORS configuration
│   ├── database.ts       # Database utilities
│   └── validation.ts     # Common validation
├── admin-auth/           # Admin authentication
├── admin-product-management/  # Product CRUD operations
├── check-fttb-coverage/  # Basic coverage checking
├── multi-provider-coverage/   # Advanced coverage engine
├── spatial-coverage-query/    # Next-gen spatial queries (planned)
├── zoho-integration/     # CRM integration
└── unjani-form-submission/    # Client-specific forms
```

### Frontend Component Structure
```
src/
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── common/          # Shared components
│   ├── coverage/        # Coverage checking components
│   ├── admin/          # Admin interface components
│   └── forms/          # Form components and validation
├── design-system/
│   ├── tokens.ts       # Design tokens (colors, typography, spacing)
│   ├── components/     # Design system components
│   └── foundations/    # Typography, spacing guidelines
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── services/           # API integration services
└── lib/               # Utilities and configurations
```

## Data Flow Architecture

### Coverage Checking Flow
1. **User Input**: Address entry via enhanced address input component
2. **Geocoding**: Google Maps Geocoding API for coordinate resolution
3. **Spatial Query**: PostGIS spatial intersection queries via Edge Functions
4. **Provider Integration**: Multi-provider API calls for real coverage data
5. **Real-time Updates**: WebSocket subscriptions for live status changes
6. **Caching Strategy**: Multi-tier (memory → IndexedDB → network)

### Admin Workflow
1. **Authentication**: Custom admin auth with Supabase
2. **Real-time Sync**: Live data updates via WebSocket subscriptions
3. **Product Management**: Full CRUD operations with approval workflows
4. **Documentation System**: Interactive docs with search and code playground

### Form Processing Pipeline
1. **Client Input**: React Hook Form with real-time validation
2. **Schema Validation**: Zod schemas with custom business rules
3. **Persistence**: Auto-save to localStorage with restoration
4. **Submission**: Edge Function processing with fallback handling
5. **Integration**: CRM updates via Zoho integration

## Performance Architecture

### Frontend Optimization
- **Bundle Splitting**: Dynamic imports for route-based code splitting
- **Component Lazy Loading**: Suspense boundaries for heavy components
- **Asset Optimization**: Image optimization and CDN delivery
- **Caching Strategy**: React Query with optimistic updates

### Backend Performance
- **Database Indexing**: Spatial indexes on coverage areas
- **Connection Pooling**: Supabase connection management
- **Edge Function Optimization**: Deno runtime with fast startup
- **Parallel Processing**: Concurrent coverage queries (6+ providers)

### Target Performance Metrics
- **Metro Areas**: <1 second coverage query response
- **Rural Areas**: <2 seconds coverage query response
- **Map Interactions**: <500ms for pan/zoom operations
- **Real-time Updates**: 30-second refresh cycle
- **Build Performance**: 30s regular CI, 7min full validation

## Security Architecture

### Authentication & Authorization
- **Admin Authentication**: Custom JWT implementation
- **Row-Level Security**: PostgreSQL RLS policies
- **API Security**: CORS configuration and input validation
- **Environment Security**: Secure environment variable management

### Data Protection
- **Input Validation**: Zod schemas with sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **HTTPS Enforcement**: SSL/TLS encryption throughout