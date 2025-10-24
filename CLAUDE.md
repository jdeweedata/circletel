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

**Daily Memory Management** (Required for 16GB systems):
1. **Morning:** Run `npm run workflow:start` to optimize memory
2. **Development:** Use `npm run dev:memory` (never use standard `npm run dev`)
3. **End of Day:** Run `npm run workflow:cleanup` to free resources

**Pre-Commit Checklist** (Required before every commit):
1. Run `npm run type-check:memory` to catch TypeScript errors
2. Fix any errors reported
3. Run `npm run type-check:memory` again to verify fixes
4. Commit and push

This prevents Vercel build failures by catching type errors locally. The build process includes both linting and type checking, so running `npm run type-check` locally ensures your commits will deploy successfully.

**Memory Management Commands:**
- `npm run workflow:start` - Morning memory optimization (interactive)
- `npm run workflow:start:auto` - Morning optimization (auto-cleanup)
- `npm run workflow:cleanup` - End-of-day cleanup
- `npm run memory:check` - Quick memory status
- `npm run memory:detail` - Detailed memory analysis
- **Claude Code:** `/memory-start` or `/memory-cleanup`

See: `docs/guides/MEMORY_WORKFLOW_QUICK_START.md` for complete workflow guide.

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
**CircleTel Primary Colors**:
- `circleTel-orange`: #F5831F (primary brand color)
- `circleTel-white`: #FFFFFF
- `circleTel-darkNeutral`: #1F2937
- `circleTel-secondaryNeutral`: #4B5563
- `circleTel-lightNeutral`: #E6E9EF

**WebAfrica-Inspired Colors** (added 2025-10-23):
- `webafrica-pink`: #E91E63 (can be substituted with circleTel-orange for branding)
- `webafrica-blue`: #1E4B85 (dark blue for buttons and text)
- `webafrica-blue-light`: #CDD6F4 (input borders)
- `webafrica-blue-lighter`: #E8F0FF (backgrounds)
- `webafrica-blue-bg`: #F5F9FF (soft backgrounds)
- `webafrica-blue-dark`: #163a6b (button hover states)

**Design Pattern**: Use CircleTel orange for primary actions and accents, WebAfrica blue for secondary elements and text. This creates a professional, conversion-optimized look while maintaining brand identity.

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

#### Customer Authentication (NEW - 2025-10-24)
Complete customer-facing authentication system with WebAfrica-inspired design:

**Authentication Pages**:
- `/order/account` - Customer signup (WebAfrica-inspired design)
- `/auth/login` - Customer login
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset confirmation
- `/auth/callback` - Email verification callback handler
- `/order/verify-email` - Email verification instructions

**Authentication Service** (`lib/auth/customer-auth-service.ts`):
- Centralized customer authentication logic
- Methods: `signUp()`, `signIn()`, `signOut()`, `getSession()`, `getCustomer()`
- Email verification: `resendVerificationEmail()`, `isEmailVerified()`
- Password reset: `sendPasswordResetEmail()`, `updatePassword()`

**Server-Side Customer Creation**:
- API route: `/app/api/auth/create-customer/route.ts`
- Uses service role to bypass RLS timing issues during signup
- Creates customer record in `customers` table immediately after auth user creation
- Prevents "new row violates row-level security policy" errors

**Database Triggers** (Migration: `20251024000003_fix_email_verification_trigger.sql`):
- `sync_customer_email_verified()` - Syncs email verification from auth.users to customers table
- `update_customer_last_login()` - Updates last_login on customer sign-in
- Both use `SECURITY DEFINER` to bypass RLS during trigger execution
- Proper GRANT statements ensure triggers can execute successfully

**Key Implementation Details**:
- Supabase Auth with PKCE flow for enhanced security
- Email verification required (Supabase sends emails automatically)
- Database synchronization via triggers (auth.users ↔ customers table)
- Service role pattern for privileged operations during signup
- WebAfrica-inspired UI: Soft blue gradients, floating labels, 56px inputs

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
- **netlify**: Netlify deployment and site management (new as of 2025-10-20)
- **canva**: Canva design integration
- **github**: GitHub repository management

#### Agent System (Claude Code AI Assistants)

CircleTel uses **Claude Code meta-agents** - specialized AI prompt templates that provide intelligent task routing and automated workflows for complex development tasks.

**Documentation**: See `.claude/agents/README.md` for complete agent system guide

**Active Agents** (14 production-ready):

**Core Orchestration**:
- `orchestrator` - Master coordinator for complex multi-agent workflows, analyzes complexity and routes to optimal agents
- `context-manager` - Manages memory hierarchy and domain contexts for token efficiency
- `file-organizer` - Automated project structure maintenance and cleanup

**Development Specialists**:
- `full-stack-dev` - Complete feature implementation (database + backend + frontend), enforces CircleTel standards
- `frontend-specialist` - UI/UX development with React, shadcn/ui, Tailwind CSS
- `backend-specialist` - API development, server-side logic, Supabase integration
- `integration-specialist` - Third-party API integrations (MTN, Zoho, Stripe, etc.)

**Quality & Maintenance**:
- `bug-hunter` - Debugging, root cause analysis, bug fixes
- `testing-agent` - Test generation (unit, integration, E2E with Playwright)
- `refactoring-agent` - Safe code refactoring and complexity reduction
- `performance-optimizer` - Performance profiling and optimization
- `documentation-agent` - Documentation generation and maintenance
- `product-manager-agent` - Requirements analysis, user story generation

**Infrastructure**:
- `mcp-manager` - MCP server management, health monitoring, troubleshooting

**How It Works**:
```
User: "Implement commission tracking for sales partners"

Claude Code:
1. Loads orchestrator agent
2. Analyzes: Medium complexity, 3 layers (DB + API + UI), 120 minutes
3. Selects: full-stack-dev as primary agent
4. Executes: 5-phase workflow (Planning → Database → Backend → Frontend → Integration)
5. Quality Gates: TypeScript validation, RBAC enforcement, design compliance
6. Handoff: testing-agent → documentation-agent → deployment-check
7. Result: Production-ready feature with tests and docs
```

**Key Features**:
- **Automatic Invocation**: Agents auto-load based on keywords ("implement", "refactor", "debug", etc.)
- **Intelligent Routing**: Orchestrator selects optimal agent(s) based on task complexity
- **CircleTel Standards**: All agents enforce RBAC, design system, and file organization rules
- **Quality Gates**: Built-in TypeScript, testing, and deployment validation
- **Workflow Templates**: Pre-built workflows for common scenarios (complete feature, bug fix, integration)

**Feature Backlog Integration**:
- BRS-derived features stored in `docs/features/backlog/`
- Ready-to-implement specs with orchestrator analysis
- Example: Commission Tracking (120 min), Sales Quote Journey (180 min)

**Usage Examples**:
- "Use the full-stack-dev agent to add customer feedback feature"
- "Analyze and plan the Sales Quote Journey from BRS Section 5.1.1"
- "Implement Commission Tracking from docs/features/backlog/COMMISSION_TRACKING_FEATURE_SPEC.md"

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

- **Multi-Provider Architecture** (Phase 1A Complete - 2025-10-21):
  - **Database Schema**: Enhanced `fttb_network_providers` with `provider_code`, `service_offerings`, `coverage_source`
  - **Product Mapping**: `service_packages.compatible_providers` array links products to multiple providers
  - **Mapping Table**: `provider_product_mappings` for complex provider-to-product transformations
  - **Active Providers**: MTN (enabled), MetroFibre, Openserve, DFA, Vumatel (placeholders)
  - **Provider Registry Pattern**: Centralized provider configuration with standard interfaces
  - **Fallback Strategy**: Multi-tier fallback (MTN Business → MTN Consumer → Provider APIs → Mock)

- **MTN Integration**: Primary provider with dual-source approach
  - Business API: `/lib/coverage/mtn/wms-client.ts` for enterprise services
  - Consumer API: WMS endpoint for residential services
  - Parser: `/lib/coverage/mtn/wms-parser.ts` for response processing
  - Enhanced validation: `/lib/coverage/mtn/validation.ts` with JSON schema validation
  - Performance monitoring: `/lib/coverage/mtn/monitoring.ts` with metrics tracking
  - Geographic validation: `/lib/coverage/mtn/geo-validation.ts` for South African bounds
  - Test data available in `/lib/coverage/mtn/test-data.ts` for development
  - **13 Products**: HomeFibreConnect (4), BizFibreConnect (3), 5G/LTE Consumer (3), 5G/LTE Business (3)

- **Aggregation Service**: `/lib/coverage/aggregation-service.ts`
  - Singleton pattern for consistent state management
  - Caching layer for performance (5-minute TTL)
  - Service recommendation engine with scoring algorithms
  - Support for multiple service types: fibre, 5G, LTE, wireless, etc.
  - Multi-provider product aggregation and deduplication

#### Admin Coverage Management
- **Dashboard**: Real-time monitoring and system overview at `/app/admin/coverage`
- **Analytics**: Performance metrics and trends visualization with charts
- **Testing Tools**: Manual API testing, validation, and debugging interface
- **Provider Management**: Full CRUD operations for network providers
- **Configuration**: Global settings, security, and geographic parameters

#### Network Provider System
- **Database Tables**:
  - `fttb_network_providers` - Core provider data with health monitoring columns
    - **New Columns (2025-10-21)**: `provider_code` (unique), `service_offerings` (JSONB), `coverage_source`, `api_version`, `api_documentation_url`
  - `provider_product_mappings` - Maps provider service types to CircleTel products (NEW 2025-10-21)
  - `provider_api_logs` - API request/response logging with PostGIS coordinates
  - `provider_logos` - Provider logo storage
  - `coverage_files` - KML/KMZ coverage file metadata
  - `provider_configuration` - System-wide provider settings (JSONB)
  - `service_packages` - Product catalog
    - **New Columns (2025-10-21)**: `compatible_providers` (TEXT[]), `provider_specific_config` (JSONB), `provider_priority`
- **Database Views**:
  - `v_active_providers` - Active providers with capabilities
  - `v_products_with_providers` - Products with their compatible provider details
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
  - `20251021000006_cleanup_and_migrate.sql` - Multi-provider architecture (✅ Applied 2025-10-21)
  - `20251021000007_add_mtn_products.sql` - 13 MTN products (✅ Applied 2025-10-21)
  - `20251022000010_add_account_type_to_customers.sql` - Customer account_type column (✅ Applied 2025-10-22)
  - `20251024000001_add_customer_insert_policy.sql` - Initial RLS policy for customer INSERT (⚠️ Superseded)
  - `20251024000002_fix_customer_insert_rls_v2.sql` - Comprehensive RLS policy fix (⚠️ Superseded by API approach)
  - `20251024000003_fix_email_verification_trigger.sql` - Fixed email verification and last_login triggers (✅ Applied 2025-10-24)
- **CLI Migration Research**: See `docs/database/CLI_MIGRATION_RESEARCH_2025-10-22.md` for comprehensive analysis
  - **Conclusion**: Supabase Dashboard SQL Editor is the most reliable method
  - **CLI Limitations**: Authentication issues, connection pooler restrictions, read-only MCP mode
  - **Recommendation**: Continue using Dashboard for all migrations
- **Migration Guide**: See `APPLY_MANUALLY.md` for step-by-step migration application

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

### File Organization Rules
**CRITICAL**: Always create files in the correct directories. Never place files in the project root unless they are configuration files.

#### Configuration Files (Root Directory Only)
**Allowed in root**:
- `package.json`, `package-lock.json` - NPM configuration
- `tsconfig.json` - TypeScript configuration
- `next.config.mjs`, `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.mjs` - PostCSS configuration
- `.env`, `.env.local`, `.env.example` - Environment variables
- `.gitignore`, `.eslintrc.json`, `.prettierrc` - Tool configurations
- `CLAUDE.md`, `README.md`, `LICENSE` - Documentation
- `.mcp.json` - MCP server configuration

**Never in root**:
- Source code files (.ts, .tsx, .js, .jsx)
- Migration files (.sql)
- Test files (.test.ts, .spec.ts)
- Documentation files (except CLAUDE.md and README.md)
- Screenshots or images

#### Directory-Specific File Placement

**Pages & Routes** (`/app`):
- Public pages: `/app/page.tsx`, `/app/about/page.tsx`, etc.
- Admin pages: `/app/admin/[section]/page.tsx`
- API routes: `/app/api/[endpoint]/route.ts`
- Dynamic routes: `/app/[slug]/page.tsx`
- Layout files: `/app/layout.tsx`, `/app/admin/layout.tsx`

**Components** (`/components`):
- UI components: `/components/ui/[component].tsx`
- Admin components: `/components/admin/[section]/[component].tsx`
- Feature components: `/components/[feature]/[component].tsx`
- Shared components: `/components/shared/[component].tsx`

**Libraries & Utilities** (`/lib`):
- Type definitions: `/lib/types/[domain].ts`
- Utility functions: `/lib/utils/[function].ts` or `/lib/utils.ts`
- Service classes: `/lib/[service]/[class].ts`
- Configuration: `/lib/config/[config].ts`

**React Hooks** (`/hooks`):
- Custom hooks: `/hooks/use-[hook-name].ts`
- Admin hooks: `/hooks/admin/use-[hook-name].ts`
- Feature hooks: `/hooks/[feature]/use-[hook-name].ts`

**Database** (`/supabase`):
- Migrations: `/supabase/migrations/[timestamp]_[description].sql`
- Edge functions: `/supabase/functions/[function-name]/index.ts`
- Types: `/supabase/types/[type].ts`

**Documentation** (`/docs`):
- Feature docs: `/docs/features/[FEATURE_NAME].md`
- API docs: `/docs/api/[API_NAME].md`
- Setup guides: `/docs/setup/[GUIDE_NAME].md`
- Architecture: `/docs/architecture/[DOC_NAME].md`
- Roadmaps: `/docs/roadmap/[ROADMAP_NAME].md`
- Migration history: `/docs/migration-history/[migration].sql` (archived migrations)
- Testing docs: `/docs/testing/[TEST_DOC].md`
- Screenshots: `/docs/screenshots/[screenshot].png`
- Archive: `/docs/archive/[old-doc].md` (deprecated documentation)

**Scripts** (`/scripts`):
- Build scripts: `/scripts/build/[script].js`
- Deployment scripts: `/scripts/deploy/[script].sh`
- Utility scripts: `/scripts/[script].js`
- Test scripts: `/scripts/test/[script].js`
- Database utilities: `/scripts/check-user-verification.js` (check email verification status)

**Public Assets** (`/public`):
- Images: `/public/images/[image].png`
- Icons: `/public/icons/[icon].svg`
- Fonts: `/public/fonts/[font].woff2`
- Static files: `/public/[file]`

**Styles** (`/styles` or inline):
- Global styles: `/styles/globals.css`
- Component styles: Use Tailwind CSS classes inline
- CSS modules: `/styles/[component].module.css`

#### File Naming Conventions

**React Components**:
- Use PascalCase: `UserProfile.tsx`, `AdminDashboard.tsx`
- Page files: `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`
- Route files: `route.ts`

**TypeScript Files**:
- Use kebab-case: `user-service.ts`, `auth-utils.ts`
- Hooks: `use-auth.ts`, `use-permissions.ts`
- Types: `user-types.ts`, `api-types.ts`

**SQL Files**:
- Migration format: `YYYYMMDDHHMMSS_description.sql`
- Example: `20251020000001_create_payment_transactions.sql`

**Documentation Files**:
- Use SCREAMING_SNAKE_CASE for guides: `SETUP_GUIDE.md`, `API_REFERENCE.md`
- Use Title Case for features: `Phase_2_Extensions.md`, `B2B_Roadmap.md`

#### Migration & Cleanup Rules

**When migrating old files**:
1. Identify file type and purpose
2. Move to appropriate directory (see above)
3. Update any imports that reference the moved file
4. Archive old versions to `/docs/archive/` if needed
5. Delete temporary or duplicate files

**Archive locations**:
- Old documentation → `/docs/archive/`
- Old migrations → `/docs/migration-history/`
- Test files → `/docs/testing/` or `/tests/`
- Screenshots → `/docs/screenshots/`

**Root directory should only contain**:
- Configuration files (listed above)
- Core documentation (CLAUDE.md, README.md)
- Git files (.git, .gitignore)
- Node modules (node_modules/)

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

### Common Debugging Patterns

#### Infinite Loading States in React
**Symptom**: Component stuck showing "Loading..." indefinitely
**Common Causes**:
1. **Async callbacks without error handling**: Unhandled promise rejections in event handlers prevent state updates
2. **Missing finally blocks**: Loading state not set to false if async operation fails
3. **Competing state updates**: Multiple components or effects setting conflicting states

**Solution Pattern**:
```typescript
// ❌ BAD: No error handling
useEffect(() => {
  const callback = async () => {
    const data = await fetchData(); // If this throws, loading never becomes false
    setState(data);
    setLoading(false);
  };
  someListener(callback);
}, []);

// ✅ GOOD: Proper error handling
useEffect(() => {
  const callback = async () => {
    try {
      const data = await fetchData();
      setState(data);
    } catch (error) {
      console.error('Failed to fetch:', error);
      setState(null);
    } finally {
      setLoading(false); // Always executes
    }
  };
  someListener(callback);
}, []);
```

**Real Example**: `CustomerAuthProvider` (components/providers/CustomerAuthProvider.tsx:107-113)
- The `onAuthStateChange` callback must wrap `getCustomer()` in try-catch
- Ensures `setLoading(false)` always executes even if customer fetch fails
- See commit `24547cb` for implementation

#### Authentication Flow Debugging
**Tools**:
- Browser console: Check for "Auth state changed:" logs
- Network tab: Look for `/auth/v1/token` requests
- LocalStorage: Inspect `sb-{project-ref}-auth-token` for session data
- Database: Query `customers` table to verify customer records exist

**Common Issues**:
1. **Session exists but dashboard won't load**: Check `authLoading` state in provider
2. **Multiple SIGNED_IN events**: Normal behavior, but callbacks must be idempotent
3. **Customer record missing**: Use `/api/auth/create-customer` API route pattern
4. **Email verification not syncing**: Check database triggers have `SECURITY DEFINER` and proper grants

### Key Implementation Status
- **RBAC System**: ✅ Complete (17 role templates, 100+ permissions, database-enforced)
- **Agent System**: ✅ Complete (14 agents, orchestrator tested, feature backlog integration)
  - See `.claude/agents/README.md` for full agent system documentation
  - See `docs/features/backlog/` for ready-to-implement BRS features
  - Test case: Commission Tracking feature (validated 2025-10-20)
- **Multi-Provider Architecture**: ✅ Phase 1A Complete (2025-10-21)
  - Database schema enhanced with `provider_code`, `service_offerings`, `coverage_source`
  - `service_packages` table enhanced with `compatible_providers` array
  - New `provider_product_mappings` table for complex provider-product relationships
  - 5 providers configured: MTN (active), MetroFibre, Openserve, DFA, Vumatel (placeholder)
  - 13 MTN products added: HomeFibreConnect (4), BizFibreConnect (3), 5G/LTE Consumer (3), 5G/LTE Business (3)
  - Views created: `v_active_providers`, `v_products_with_providers`
  - See `docs/features/customer-journey/MERGED_IMPLEMENTATION_PLAN.md` for roadmap
  - See `docs/features/customer-journey/MULTI_PROVIDER_ARCHITECTURE.md` for technical architecture
- **Provider Management**: ✅ Phase 1 Complete (database ready, health monitoring, API logging)
  - Phase 2 (Service Layer) - In Progress: Provider mapping interfaces, registry, directory structure
  - See `docs/features/COVERAGE_PROVIDER_IMPLEMENTATION_STATUS.md` for roadmap
- **MTN Integration**: ✅ 3 providers configured (Wholesale MNS, Business WMS, Consumer)
- **Marketing CMS**: ✅ Complete (Strapi integration with promotions, campaigns, landing pages)
- **Netcash Payment Integration**: ✅ Phase 1A Complete (Webhook configuration, staging testing)
  - Staging webhooks configured and tested (Account 52340889417)
  - Customer creation fixed (account_type column migration applied)
  - E2E order flow validated (address → coverage → packages → account)
  - **Known Issues**: See `docs/features/backlog/UX_ORDER_SUMMARY_PACKAGE_DISPLAY.md` for UX improvements
  - **Next Steps**: Production environment configuration and smoke test
- **Interactive Coverage Map Modal**: ✅ Complete (WebAfrica-style modal with Google Maps integration)
  - Component: `components/coverage/InteractiveCoverageMapModal.tsx`
  - Global provider: `components/providers/GoogleMapsProvider.tsx` (uses existing GoogleMapsService)
  - Integrated on home page (`HeroWithTabs.tsx`) and coverage checker (`CoverageChecker.tsx`)
  - Features: Address autocomplete, click-to-place marker, draggable marker, map/satellite toggle
  - Fixed Google Maps API multiple loading issue by consolidating to single loader
  - Responsive design: Fixed modal footer visibility on smaller viewports (720px height) with proper flexbox constraints
- **UI Improvements**: ✅ Recent updates (2025-10-23)
  - Removed breadcrumb navigation from packages page (`/app/packages/[leadId]/page.tsx`) for cleaner UI
  - Modal viewport fixes ensuring Close and Search buttons always visible on all screen sizes
  - **WebAfrica-Style Package Display**: ✅ Complete (2025-10-23)
    - **CompactPackageCard**: Small, clickable cards (141px × 135px mobile, 188px × 140px desktop) inspired by WebAfrica's design
    - **Two-Column Layout**: Package cards grid (left) + sticky detail sidebar (right) for improved browsing experience
    - **InfoTooltipModal**: Blue info icon buttons that trigger modals with detailed benefit explanations
    - **Enhanced Sidebar**: Added RECOMMENDED badge, info tooltips for benefits/additional info, expandable sections
    - **Responsive Design**: Desktop shows sticky sidebar, mobile shows full-screen overlay with floating CTA
    - **View 6-8 packages at once** vs previous 3-4, improved visual hierarchy and package comparison
    - Components: `components/ui/compact-package-card.tsx`, `components/ui/info-tooltip-modal.tsx`, enhanced `components/ui/package-detail-sidebar.tsx`
  - **WebAfrica-Style Account Page**: ✅ Complete (2025-10-23)
    - **TopProgressBar**: Orange progress bar with step indicators (Create Account → Payment → Order Confirmation)
    - **FloatingInput**: 56px height inputs with floating labels, light blue borders (#CDD6F4)
    - **CollapsibleSection**: Expandable sections with chevron icons for future use
    - **Simplified Form**: 4 fields only (Name, Surname, Email, Phone) - removed password, account type, business fields
    - **Design**: Soft blue gradient background, decorative circles, centered white card container (1200px max-width)
    - **Branding**: CircleTel orange for progress bar and accents, WebAfrica dark blue (#1E4B85) for submit button
    - **Password Flow**: Moved to email verification step for better UX and security
    - **Components**: `components/order/TopProgressBar.tsx`, `components/ui/floating-input.tsx`, `components/ui/collapsible-section.tsx`
    - **Page**: Complete refactor of `/app/order/account/page.tsx` with WebAfrica-inspired layout
    - **Colors**: Added `webafrica` color palette to Tailwind config (pink, blue variants)
- **Customer Authentication System**: ✅ Complete (2025-10-24)
  - **Signup Flow**: WebAfrica-inspired signup at `/order/account` with automatic email verification
  - **Login Flow**: Customer login at `/auth/login` with password recovery
  - **Password Reset**: Complete forgot password → reset password flow with secure tokens
  - **Email Verification**: Automatic emails via Supabase with callback handling at `/auth/callback`
  - **Database Synchronization**: Triggers sync email verification and last_login between auth.users and customers tables
  - **Service Role Pattern**: API route `/api/auth/create-customer` bypasses RLS timing issues during signup
  - **Authentication Service**: Centralized logic in `lib/auth/customer-auth-service.ts` with 10+ methods
  - **Testing Documentation**: Complete testing reports in `docs/testing/` (AUTH_TESTING_REPORT.md, SUCCESSFUL_SIGNUP_TEST.md)
  - **Critical Fix (2025-10-24)**: Added error handling to `CustomerAuthProvider` `onAuthStateChange` callback to prevent infinite loading states
    - Issue: Unhandled errors in async `getCustomer()` calls would prevent `setLoading(false)` from executing
    - Solution: Wrapped customer fetch in try-catch to ensure loading state always updates
    - Commit: `24547cb` - "fix(auth): add error handling to onAuthStateChange callback"
  - **Known Issue**: Email verification requires clicking link in email (trigger tested successfully with migration `20251024000003`)