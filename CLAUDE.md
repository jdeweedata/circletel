# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server (runs on localhost:3006 if 3000 is occupied)
- `npm run dev:memory` - Start development server with increased memory allocation
- `npm run build` - Build production application
- `npm run build:memory` - Build with increased memory allocation for large codebases
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking without emitting files

### Development Workflow

**Pre-Commit Checklist** (Required before every commit):
1. Run `npm run type-check` to catch TypeScript errors
2. Fix any errors reported
3. Run `npm run type-check` again to verify fixes
4. Commit and push

This prevents Vercel build failures by catching type errors locally. The build process includes both linting and type checking, so running `npm run type-check` locally ensures your commits will deploy successfully.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand for client state, React Query for server state
- **Database**: Supabase (PostgreSQL)
- **CMS**: Strapi (Headless CMS for content management)
- **PWA**: next-pwa with offline support and service worker caching
- **Analytics**: Vercel Analytics
- **Testing**: Playwright for E2E testing (configured via MCP)
- **Email**: Resend for transactional email
- **File Processing**: Sharp for image optimization, xml2js for KML parsing, adm-zip for KMZ handling
- **Charts**: Recharts for admin analytics and monitoring dashboards

### Project Structure

#### Core Architecture
- **App Router**: Uses Next.js 15 app directory structure (`/app`)
- **Component Library**: Custom UI components built on Radix UI and shadcn/ui
- **Public Website**: Main CircleTel website pages in `/app`
- **Admin Panel**: Separate admin interface in `/app/admin` with protected routes

#### Key Directories
- `/app` - Next.js app router pages and layouts
- `/app/admin` - Admin panel with sidebar navigation and authentication
- `/app/admin/billing` - Billing system integration
- `/app/admin/coverage` - Complete coverage management module (dashboard, analytics, testing, providers)
- `/app/wireless` - Wireless packages showcase
- `/app/coverage` - Coverage checker with Google Maps integration
- `/app/api` - Next.js API routes for server-side functionality
- `/app/api/admin/providers` - Network provider management APIs
- `/components` - Reusable React components
- `/components/ui` - shadcn/ui components and custom UI library
- `/components/admin` - Admin-specific components
- `/components/providers` - React context providers
- `/components/coverage` - Coverage checking components and maps
- `/components/marketing` - Marketing content components (promotions, campaigns)
- `/components/rbac` - RBAC components (PermissionGate, RoleTemplateSelector)
- `/lib` - Utility functions and configurations
- `/lib/coverage` - Multi-provider coverage aggregation system
- `/lib/types` - TypeScript type definitions
- `/lib/rbac` - RBAC permissions, role templates, and type definitions
- `/lib/auth` - Authentication services and utilities
- `/hooks` - Custom React hooks
- `/hooks/usePermissions.ts` - Permission checking hook for RBAC
- `/hooks/use-promotions.ts` - Marketing promotions data fetching
- `/hooks/use-marketing-pages.ts` - Marketing pages data fetching
- `/hooks/use-campaigns.ts` - Campaign data fetching
- `/supabase` - Database migrations and edge functions
- `/docs/marketing` - Marketing team CMS documentation

### Design System

#### Brand Colors (Tailwind Config)
- `circleTel-orange`: #F5831F (primary brand color)
- `circleTel-white`: #FFFFFF
- `circleTel-darkNeutral`: #1F2937
- `circleTel-secondaryNeutral`: #4B5563
- `circleTel-lightNeutral`: #E6E9EF

#### Typography
- Primary: Arial, Helvetica, sans-serif (system fonts for consistent performance)
- Monospace: Consolas, "Courier New", monospace

### Authentication & Security

#### Admin Authentication
- Production authentication using Supabase Auth with custom admin_users table
- Development mode supports local testing without Supabase Edge Functions
- Login/signup pages at `/app/admin/login` and `/app/admin/signup`
- Protected routes redirect to `/admin/login` when not authenticated
- Session management via `useAdminAuth` hook in `/hooks/useAdminAuth.ts`
- Environment detection: Vercel preview URLs use dev mode for easier testing

#### Role-Based Access Control (RBAC)
Complete RBAC system with granular permissions:

**Architecture**:
- **17 Role Templates**: Predefined roles covering all organizational functions (Executive, Management, Staff, Support levels)
- **100+ Permissions**: Granular permissions following `{resource}:{action}` pattern (e.g., `products:edit`, `users:manage_roles`)
- **Database Tables**: `role_templates`, `admin_users` (with role_template_id, custom_permissions)
- **SQL Functions**: `get_user_permissions()`, `user_has_permission()` for permission resolution
- **RLS Policies**: Row Level Security for secure access control

**Role Templates** (see `/lib/rbac/role-templates.ts`):
- **Executive**: Super Admin, CEO, CFO, COO
- **Management**: Finance Manager, Product Manager, Operations Manager, Sales Manager, Marketing Manager, Support Manager
- **Staff**: Accountant, Billing Specialist, Product Analyst, Sales Rep, Content Editor, Support Agent
- **Support**: Viewer (read-only access)

**Permission Categories** (see `/lib/rbac/permissions.ts`):
- Dashboard, Products, Customers, Orders, Billing, Finance
- Marketing, Sales, Users, System, Coverage, Support
- Inventory, Content (100+ total permissions)

**Implementation**:
- **React Hooks**: `usePermissions()` hook provides `hasPermission()`, `can.view()`, `can.edit()`, etc.
- **Permission Gates**: `<PermissionGate>` component for conditional rendering based on permissions
- **UI Integration**: Admin dashboard, products page, and coverage pages use permission gates
- **Database Migration**: `supabase/migrations/20250201000005_create_rbac_system.sql`

**Usage Example**:
```typescript
// Hook usage
const { hasPermission, can } = usePermissions();
if (hasPermission(PERMISSIONS.PRODUCTS.EDIT)) { /* show edit button */ }
if (can.create('products')) { /* show create button */ }

// Component usage
<PermissionGate permissions={[PERMISSIONS.PRODUCTS.CREATE]}>
  <Button>Add Product</Button>
</PermissionGate>
```

**Documentation**:
- Complete RBAC guide: `/docs/rbac/RBAC_SYSTEM_GUIDE.md`
- Setup instructions: `/docs/setup/SUPABASE_AUTH_USER_CREATION.md`
- Quick start: `/docs/setup/QUICK_START_PRODUCTION_AUTH.md`

### Data Layer

#### Supabase Integration
- PostgreSQL database with migrations in `/supabase/migrations/`
- Edge Functions in `/supabase/functions/`
- Client configured in providers
- Image uploads supported via Supabase storage
- Database types should be generated and stored in `/lib/types/`
- MCP server integration for database operations

#### Strapi CMS Integration
- Headless CMS backend located in `/strapi-cms` directory
- Frontend integration via `@strapi/client` package
- TypeScript types defined in `/lib/types/strapi.ts` with separate interfaces:
  - `StrapiResponse<T>` for single entity responses
  - `StrapiCollectionResponse<T>` for collection responses
- React Query hooks for data fetching in `/hooks/use-strapi.ts`
- Admin UI integration at `/admin/cms` for content management
- Environment variables: `NEXT_PUBLIC_STRAPI_URL` and `STRAPI_API_TOKEN`

##### Marketing Content System
Complete marketing content management built on Strapi:
- **Content Types**: Promotions, Marketing Pages, Campaigns
- **Components**: Hero sections, promo grids, feature lists, CTA banners, image+text sections
- **Frontend Pages**:
  - `/promotions` - All active promotions with category filtering
  - `/marketing/[slug]` - Dynamic marketing landing pages
  - `/campaigns/[slug]` - Campaign pages with linked promotions
- **React Components**:
  - `PromotionCard` - Individual promotion display
  - `PromotionGrid` - Grid layout with filtering
  - `MarketingHero` - Hero banner component
  - `MarketingSections` - Dynamic section renderer
- **Hooks**:
  - `usePromotions()` - Fetch all promotions with filtering
  - `useFeaturedPromotions()` - Fetch featured promos
  - `useActivePromotions()` - Fetch currently active promos
  - `useMarketingPage()` - Fetch marketing page by slug
  - `useCampaign()` - Fetch campaign by slug
- **Documentation**: Complete guides in `/docs/marketing/`
  - `README.md` - Full user guide for marketing team
  - `quick-start-guide.md` - 5-minute quickstart
  - `SETUP.md` - Technical setup instructions
- **Access Control**: Marketing Manager role with content-only permissions
- **Setup**: Run `./scripts/setup-strapi-marketing.sh` for automated setup

#### State Management
- **React Query**: Server state, caching, and data fetching
- **Zustand**: Client-side state management
- **Local Storage**: IndexedDB via Dexie for offline data

### Integrations

#### MCP (Model Context Protocol) Servers
Configured in `.mcp.json`:
- **shadcn**: UI component integration for Claude Code
- **Zoho**: Remote CircleTel Zoho MCP server for CRM, Mail, Calendar operations
- **supabase**: Supabase MCP server for database operations

#### Zoho Integration
- Full Zoho MCP integration in `/app/admin/zoho`
- TypeScript types in `/lib/types/zoho.ts`
- React hooks in `/hooks/use-zoho-mcp.ts`
- API routes in `/app/api/zoho/`
- Uses both direct API and MCP approaches

#### PWA Features
- Offline functionality via service worker
- Push notifications capability
- Custom caching strategies for different resource types
- App manifest configured for installable web app

### Component Architecture

#### UI Components
- Built on Radix UI primitives with shadcn/ui styling
- Consistent with design system colors and typography
- Form components use react-hook-form with Zod validation

#### Admin Components
- Sidebar navigation with role-based menu items
- Header with user info and logout functionality
- Layout system supports collapsed/expanded sidebar states

#### Provider Hierarchy
```
QueryProvider
└── PWAProvider
    └── OfflineProvider
        └── TooltipProvider
```

### API Routes
- `/api/zoho/*` - Zoho integration endpoints
- `/api/coverage/*` - Coverage checking and package recommendation endpoints
- `/api/admin/providers/*` - Network provider management (CRUD, logo upload, coverage files)
- `/api/coverage/mtn/monitoring` - Performance monitoring and health checks
- `/api/coverage/geo-validate` - Geographic coordinate validation
- RESTful conventions for CRUD operations
- Error handling with proper HTTP status codes

### Coverage System Architecture

#### Multi-Provider Coverage Integration
The coverage system is designed to aggregate data from multiple telecommunications providers:

- **MTN Integration**: Primary provider with dual-source approach
  - Business API: `/lib/coverage/mtn/wms-client.ts` for enterprise services
  - Consumer API: WMS endpoint for residential services
  - Parser: `/lib/coverage/mtn/wms-parser.ts` for response processing
  - Enhanced validation: `/lib/coverage/mtn/validation.ts` with JSON schema validation
  - Performance monitoring: `/lib/coverage/mtn/monitoring.ts` with metrics tracking
  - Geographic validation: `/lib/coverage/mtn/geo-validation.ts` for South African bounds
  - Test data available in `/lib/coverage/mtn/test-data.ts` for development

- **Aggregation Service**: `/lib/coverage/aggregation-service.ts`
  - Singleton pattern for consistent state management
  - Caching layer for performance (5-minute TTL)
  - Service recommendation engine with scoring algorithms
  - Support for multiple service types: fibre, 5G, LTE, wireless, etc.

#### Admin Coverage Management
- **Dashboard**: Real-time monitoring and system overview at `/app/admin/coverage`
- **Analytics**: Performance metrics and trends visualization with charts
- **Testing Tools**: Manual API testing, validation, and debugging interface
- **Provider Management**: Full CRUD operations for network providers
- **Configuration**: Global settings, security, and geographic parameters

#### Network Provider System
- **Database Tables**:
  - `fttb_network_providers` - Core provider data with health monitoring columns
  - `provider_api_logs` - API request/response logging with PostGIS coordinates
  - `provider_logos` - Provider logo storage
  - `coverage_files` - KML/KMZ coverage file metadata
  - `provider_configuration` - System-wide provider settings (JSONB)
- **Type Definitions**: `/lib/types/coverage-providers.ts` with comprehensive interfaces
- **File Upload Support**: KML/KMZ coverage maps with metadata extraction using `xml2js` and `adm-zip`
- **Logo Management**: Image processing with Sharp for optimization and resizing
- **API Testing**: Built-in connection testing for provider APIs
- **Health Monitoring**: SQL functions for success rate and response time calculations
  - `calculate_provider_success_rate_24h(provider_id)` - Returns success percentage
  - `calculate_provider_avg_response_time_24h(provider_id)` - Returns avg response time in ms
  - `update_provider_health_metrics(provider_id)` - Updates health status (healthy/degraded/down)

#### Coverage API Endpoints
- `GET /api/coverage/packages?leadId={id}` - Get available packages for a coverage check
- `POST /api/coverage/mtn/check` - Enhanced coverage checking with geographic validation
- `GET /api/coverage/mtn/monitoring` - Performance stats and health monitoring
- `POST /api/coverage/geo-validate` - Geographic coordinate validation for South Africa
- Coverage checking uses coordinate-based PostGIS queries with address fallback
- Package recommendations based on available services and user preferences

### Environment Configuration
- Development/production environment handling
- Zoho API credentials via environment variables (see `.env.example`)
- Supabase configuration (project ref: `agyjovdugmtopasyvlng`)
- Google Maps API integration for coverage checking
- Analytics and third-party service keys
- Strapi CMS integration (optional, falls back to demo mode)
- Resend API key for transactional emails (`RESEND_API_KEY`)
- Netcash payment integration (see `.env.netcash.example`)

## Key Architectural Patterns

### File Upload Architecture
- **Image Processing**: Sharp library for resizing and optimization with size limits (5MB for logos)
- **File Validation**: Type and size validation before processing
- **Storage Strategy**: Local filesystem under `/uploads/` with relative path references
- **Metadata Extraction**: Automatic parsing of KML/KMZ files for geographic bounds and feature counts
- **Database Integration**: File records stored with metadata in dedicated tables

### API Design Patterns
- **Error Handling**: Consistent error responses with success/error flags and descriptive codes
- **Caching**: Strategic use of Cache-Control headers (5-15 minutes TTL)
- **Validation**: Input validation at API boundaries with proper HTTP status codes
- **Monitoring**: Built-in performance tracking and health check endpoints
- **Geographic Bounds**: Server-side validation for South African coordinates

### Admin Panel Architecture
- **Modular Design**: Each admin section (`/coverage`, `/billing`, `/zoho`) is self-contained
- **Component Reuse**: Shared UI components from shadcn/ui with consistent styling
- **Data Flow**: React Query for server state with optimistic updates
- **Navigation**: Role-based sidebar with collapsible sections
- **Real-time Updates**: Toast notifications for user feedback

### Database Design Principles
- **Normalization**: Separate tables for providers, logos, and coverage files with proper relations
- **JSON Fields**: Configuration data stored as JSONB for flexibility
- **Indexing**: Strategic indexes on frequently queried fields (enabled, type, status)
- **Timestamps**: Automatic created_at/updated_at with triggers
- **Constraints**: Database-level validation with CHECK constraints

### Database Migration Strategy
- **Migration Files**: Located in `/supabase/migrations/` with timestamp-based naming
- **Idempotency**: All migrations use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN IF NOT EXISTS`, `ON CONFLICT` clauses
- **Applied Migrations**: Track via Supabase Dashboard (Project Settings > Database > Migrations)
- **Manual Application**: Use Supabase Dashboard SQL Editor for most reliable migration application
- **Verification**: Always verify migrations with `SELECT COUNT(*)` queries after application
- **Key Migrations**:
  - `20250201000005_create_rbac_system.sql` - RBAC with 17 role templates (✅ Applied)
  - `20251019000001_enhance_provider_management_system.sql` - Provider health monitoring (✅ Applied)
- **Migration Guide**: See `docs/features/MIGRATION_GUIDE_2025-10-19.md` for detailed procedures

## Important Notes

### Development Considerations
- Admin authentication fully implemented with Supabase Auth and RBAC system
- Test credentials (development mode): `admin@circletel.co.za` / `admin123`
- PWA is disabled in development mode but active in production
- MCP servers require Claude Code or compatible MCP client to function
  - Supabase MCP operates in read-only mode (use Dashboard SQL Editor for migrations)
- Zoho integration has both web UI (demo mode) and MCP server (production) implementations
- Server may restart due to memory constraints with large compilation processes
- Development server defaults to port 3006 if 3000 is occupied
- Coverage system includes test data for development when external APIs are unavailable
- Playwright testing is configured via MCP server for E2E testing capabilities
- File uploads require appropriate directory permissions for `/uploads/` folder
- Admin coverage module provides comprehensive testing tools for API validation
- **Database Migrations**: Always use Supabase Dashboard SQL Editor for migration application
  - Programmatic migration tools (CLI, Node.js scripts) may encounter auth/network issues
  - Dashboard provides most reliable method with immediate feedback
  - Verify all migrations with SQL queries after application

### Build and Deployment
- Uses Vercel for deployment
- PWA assets generated during build process
- Service worker handles caching and offline functionality
- Build process validates TypeScript and runs linting

### File Structure Conventions
- Use `@/` path alias for imports from project root
- Components should be placed in appropriate subdirectories
- Maintain separation between public site and admin functionality
- API routes follow RESTful conventions

### TypeScript Architecture
- Strict TypeScript configuration with comprehensive type safety
- Separate response types for Strapi: `StrapiResponse<T>` vs `StrapiCollectionResponse<T>`
- Type definitions centralized in `/lib/types/` directory
- Custom UI component types in `/components/ui/sidebar/types.ts`
- Coverage system types with multi-provider support in `/lib/coverage/types.ts`
- Network provider types in `/lib/types/coverage-providers.ts` with database schema interfaces
- API route parameters require `context: { params: Promise<{ id: string }> }` pattern for Next.js 15

### Testing Strategy
- Playwright E2E testing via MCP integration
- Test coverage includes homepage, coverage checker, admin panel, and order flows
- Mock data available for coverage APIs during development
- No traditional unit testing framework configured (relies on TypeScript + E2E)

### Key Implementation Status
- **RBAC System**: ✅ Complete (17 role templates, 100+ permissions, database-enforced)
- **Provider Management**: ✅ Phase 1 Complete (database ready, health monitoring, API logging)
  - Phase 2 (Service Layer) - Next: `ProviderApiClient`, `ProviderService`, `CoverageFileParser`
  - See `docs/features/COVERAGE_PROVIDER_IMPLEMENTATION_STATUS.md` for roadmap
- **MTN Integration**: ✅ 3 providers configured (Wholesale MNS, Business WMS, Consumer)
- **Marketing CMS**: ✅ Complete (Strapi integration with promotions, campaigns, landing pages)