# CircleTel Agent System

This file provides guidance for AI agents (Claude Code, Windsurf, etc.) when working with the CircleTel Digital Service Provider platform.

## Quick Reference

### Project Type
**Digital Service Provider Platform** - South African ISP and Managed IT Services

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand + React Query
- **Authentication**: Supabase Auth with RBAC
- **Deployment**: Vercel
- **CMS**: Strapi (Headless CMS)
- **PWA**: next-pwa with offline support

### Key Integrations
- **Zoho**: CRM, Billing, Calendar (via MCP)
- **Google Maps**: Coverage checking and address autocomplete
- **MTN**: Multi-provider coverage integration (WMS API)
- **Netcash**: Payment processing
- **Resend**: Transactional emails

---

## Agent Team Configuration

CircleTel uses **specialized AI agents** for different development tasks. Each agent has specific expertise and follows established patterns.

### 1. Analyst Agent
**Focus**: Business requirements and market analysis

**Expertise**:
- South African telecommunications market
- ISP services and managed IT
- B2B/B2C customer journeys
- Competitor analysis (WebAfrica, Supersonic, etc.)

**Use For**:
- Market research and validation
- Customer journey mapping
- Business requirement analysis
- Success metric definition
- User story creation from BRS

**Context**:
- Target: 25 customers, R32,000 MRR by October 2025
- South African market focus (load shedding, connectivity challenges)
- Multi-provider fibre integration strategy

---

### 2. Architect Agent
**Focus**: Technical architecture and system design

**Expertise**:
- Next.js 15 App Router architecture
- Supabase integration patterns
- Multi-provider coverage aggregation
- RBAC system design
- API design and integration patterns

**Use For**:
- Component architecture planning
- Database schema design
- Integration pattern design
- Performance and scalability planning
- Security architecture decisions

**Key Patterns**:
- Multi-provider registry pattern (`/lib/coverage/providers/`)
- Service layer abstraction
- React Query for server state
- Zustand for client state
- RBAC with 17 role templates, 100+ permissions

---

### 3. Scrum Master Agent
**Focus**: Feature breakdown and story creation

**Expertise**:
- 6-day sprint cycles
- Epic to story breakdown
- Dependency identification
- Risk assessment and mitigation

**Use For**:
- Breaking epics into implementable stories
- Sprint planning and sizing
- Task sequencing and dependencies
- Quality gate definition
- Feature backlog management

**Workflow**:
```
Epic → Context-Rich Stories → Quality Gates → Implementation
```

**Feature Backlog**: See `docs/features/backlog/` for ready-to-implement specs

---

### 4. Developer Agent (Full-Stack)
**Focus**: Implementation using CircleTel patterns

**Expertise**:
- TypeScript, React, Tailwind CSS
- Supabase database operations
- shadcn/ui component library
- Next.js 15 conventions
- CircleTel design system

**Use For**:
- Complete feature implementation (DB + Backend + Frontend)
- Code pattern guidance
- Component implementation
- Integration with existing systems
- Testing strategy development

**Must Follow**:
- File organization rules (see CLAUDE.md)
- CircleTel design system (orange #F5831F, WebAfrica blue palette)
- RBAC enforcement on all admin features
- TypeScript strict mode
- Mobile-first responsive design

---

### 5. Frontend Specialist Agent
**Focus**: UI/UX development

**Expertise**:
- React component architecture
- shadcn/ui and Radix primitives
- Tailwind CSS styling
- Responsive design (mobile-first)
- Accessibility (WCAG 2.1 AA)

**Use For**:
- UI component development
- Design system implementation
- User experience optimization
- Responsive layout creation
- Accessibility compliance

**Design System**:
- **Primary**: `circleTel-orange` (#F5831F)
- **Secondary**: WebAfrica blue palette (`webafrica-blue`, `webafrica-pink`)
- **Typography**: Arial, Helvetica, sans-serif
- **Components**: `/components/ui/` (shadcn/ui based)

---

### 6. Backend Specialist Agent
**Focus**: API development and server-side logic

**Expertise**:
- Next.js API routes
- Supabase Edge Functions
- Database migrations
- Server-side authentication
- Third-party API integrations

**Use For**:
- API endpoint development
- Database schema changes
- Server-side business logic
- Authentication flows
- Integration with external services

**Key Patterns**:
- RESTful API conventions
- Service role pattern for privileged operations
- Error handling with proper HTTP status codes
- Caching strategies (5-15 min TTL)
- Geographic validation for South African coordinates

---

### 7. Integration Specialist Agent
**Focus**: Third-party API integrations

**Expertise**:
- MTN WMS API integration
- Zoho CRM/Billing via MCP
- Google Maps API
- Netcash payment webhooks
- Strapi CMS integration

**Use For**:
- New provider integrations
- API client development
- Webhook handling
- Data transformation and mapping
- Integration testing

**Active Integrations**:
- **MTN**: 3 providers (Wholesale MNS, Business WMS, Consumer)
- **Zoho**: MCP server for CRM/Billing/Calendar
- **Netcash**: Payment processing (staging + production)
- **Strapi**: Marketing content management

---

### 8. Bug Hunter Agent
**Focus**: Debugging and root cause analysis

**Expertise**:
- React debugging patterns
- Authentication flow debugging
- Database query optimization
- Performance profiling
- Error tracking

**Use For**:
- Bug investigation and fixes
- Root cause analysis
- Performance issue resolution
- Error handling improvements
- Debugging authentication flows

**Common Patterns**:
- Infinite loading states (async callback error handling)
- Authentication flow issues (session vs customer record)
- Database RLS policy debugging
- TypeScript type errors

---

### 9. Testing Agent
**Focus**: Test generation and quality assurance

**Expertise**:
- Playwright E2E testing (via MCP)
- Manual testing procedures
- User acceptance criteria
- Performance validation
- Security testing

**Use For**:
- E2E test creation
- Test coverage analysis
- Quality gate validation
- Performance benchmarking
- Security vulnerability testing

**Testing Strategy**:
- Playwright for E2E (configured via MCP)
- Manual testing for admin features
- TypeScript compilation as first-pass validation
- No traditional unit testing framework (relies on TypeScript + E2E)

---

### 10. Refactoring Agent
**Focus**: Code quality and complexity reduction

**Expertise**:
- Safe refactoring patterns
- Component extraction
- Code deduplication
- Performance optimization
- Type safety improvements

**Use For**:
- Code cleanup and organization
- Component refactoring
- Performance optimization
- Type safety improvements
- Technical debt reduction

**Principles**:
- Simplicity First (SF): Choose simplest practical solution
- Minimal upstream fixes over downstream workarounds
- Single-line changes when sufficient
- Preserve existing functionality

---

### 11. Performance Optimizer Agent
**Focus**: Performance profiling and optimization

**Expertise**:
- Next.js performance optimization
- Image optimization (Sharp)
- Caching strategies
- Bundle size reduction
- South African connectivity optimization

**Use For**:
- Performance profiling
- Load time optimization
- Bundle analysis
- Caching strategy implementation
- Low-bandwidth optimization

**Targets**:
- Initial page load under 2s
- Optimized for South African connectivity
- Load shedding resilience
- Offline functionality via PWA

---

### 12. Documentation Agent
**Focus**: Documentation generation and maintenance

**Expertise**:
- Technical documentation
- API documentation
- User guides
- Code comments
- Migration guides

**Use For**:
- Feature documentation
- API reference creation
- Setup guides
- Migration documentation
- Code documentation

**Documentation Structure**:
- `/docs/admin/` - Admin panel documentation
- `/docs/architecture/` - System architecture and design
- `/docs/migrations/` - Database migration guides
- `/docs/testing/` - Testing reports and strategies
- `/docs/templates/` - Document templates (feature proposals)
- `CLAUDE.md` - Main agent guidance
- `ROADMAP.md` - Development roadmap
- `README.md` - Project overview

---

### 13. Product Manager Agent
**Focus**: Requirements analysis and user story generation

**Expertise**:
- Business requirements analysis
- User story creation
- Feature prioritization
- Success metric definition
- Stakeholder communication

**Use For**:
- Analyzing BRS documents
- Creating user stories
- Feature specification
- Priority assessment
- Success criteria definition

**Context**:
- MVP launch October 2025
- 25 customer target
- R32,000 MRR goal
- B2B and B2C customer segments

---

### 14. MCP Manager Agent
**Focus**: MCP server management and troubleshooting

**Expertise**:
- MCP server configuration
- Health monitoring
- Integration troubleshooting
- Server optimization

**Use For**:
- MCP server setup
- Integration debugging
- Performance monitoring
- Configuration management

**Active MCP Servers** (`.mcp.json`):
- **shadcn**: UI component integration
- **zoho**: Remote CircleTel Zoho MCP server
- **supabase**: Database operations (read-only mode)
- **netlify**: Deployment management
- **canva**: Design integration
- **github**: Repository management

---

## Orchestrator Agent

### Master Coordinator
**Focus**: Complex multi-agent workflows

**How It Works**:
1. Analyzes task complexity
2. Selects optimal agent(s)
3. Coordinates multi-phase workflows
4. Enforces quality gates
5. Manages handoffs between agents

**Workflow Example**:
```
User: "Implement commission tracking for sales partners"

Orchestrator:
1. Analyzes: Medium complexity, 3 layers (DB + API + UI), 120 min
2. Selects: full-stack-dev as primary agent
3. Executes: 5-phase workflow
   - Planning → Database → Backend → Frontend → Integration
4. Quality Gates: TypeScript, RBAC, design compliance
5. Handoff: testing-agent → documentation-agent
6. Result: Production-ready feature with tests and docs
```

**Automatic Invocation Keywords**:
- "implement" → full-stack-dev
- "refactor" → refactoring-agent
- "debug" → bug-hunter
- "test" → testing-agent
- "integrate" → integration-specialist
- "optimize" → performance-optimizer
- "document" → documentation-agent

---

## Windsurf Codemaps Integration

### What are Codemaps?

**Codemaps** (Beta) are hierarchical visual maps of your codebase that show how components work together. They bridge human comprehension and AI reasoning, making it possible to navigate, discuss, and modify large codebases with precision.

### Accessing Codemaps

- **Activity Bar**: Click Codemaps icon in left panel
- **Command Palette**: `Ctrl+Shift+P` → "Focus on Codemaps View"

### Using Codemaps with Agents

All 14 CircleTel agents leverage Codemaps for enhanced understanding:

**@-Mention in Cascade**:
```
You: "@coverage-flow-map How do I add a new provider?"
Agent: [Has full context of coverage architecture]
```

**Generate from Cascade**:
- Click "Create Codemap" at bottom of conversation
- Codemap agent analyzes context and generates relevant map

### Pre-Defined CircleTel Codemaps

**Coverage System**:
- `coverage-multi-provider-flow` - User input → Provider APIs
- `mtn-integration-architecture` - MTN WMS integration details
- `dfa-coverage-processing` - DFA data transformation

**Authentication & Security**:
- `auth-rbac-enforcement` - Login → Protected routes
- `admin-access-control` - Admin authentication flow

**Order & Checkout**:
- `order-complete-journey` - Bundle selection → Payment
- `payment-netcash-webhook` - Webhook processing flow

**Admin Dashboard**:
- `admin-dashboard-structure` - Module hierarchy
- `admin-api-routes` - API endpoint organization

**MCP Integrations**:
- `mcp-server-connections` - All MCP server integrations
- `zoho-crm-integration` - Zoho CRM data flow

### Codemap Best Practices

**When to Create**:
- Complex multi-file flows
- New feature development
- Integration planning
- Bug investigation

**Naming Convention**:
```
{system}-{aspect}-{type}
Example: coverage-multi-provider-flow
```

**Update Triggers**:
- Architecture changes
- New integrations
- Major refactoring
- Bug fixes that change flow

### Documentation

For complete Codemap usage guide, see:
- `docs/claude-skills/Codemap Navigator/CODEMAP_README.md`
- `docs/claude-skills/Codemap Navigator/CODEMAP_AGENT_INTEGRATION.md`

---

## Development Workflow

### Daily Workflow (16GB Systems)
1. **Morning**: Run `npm run workflow:start` to optimize memory
2. **Development**: Use `npm run dev:memory` (never standard `npm run dev`)
3. **End of Day**: Run `npm run workflow:cleanup` to free resources

### Pre-Commit Checklist
1. Run `npm run type-check:memory` to catch TypeScript errors
2. Fix any errors reported
3. Run `npm run type-check:memory` again to verify fixes
4. Commit and push

**Why**: Prevents Vercel build failures by catching type errors locally.

### Memory Management Commands
- `npm run workflow:start` - Morning memory optimization (interactive)
- `npm run workflow:start:auto` - Morning optimization (auto-cleanup)
- `npm run workflow:cleanup` - End-of-day cleanup
- `npm run memory:check` - Quick memory status
- `npm run memory:detail` - Detailed memory analysis

---

## Core Development Principles

### 1. Simplicity First (SF)
- Choose the simplest practical solution
- Favor proven patterns over experimental approaches
- Minimize nested components and dependencies
- Always ask "can this be simpler?"

### 2. Performance Priority (PP)
- Design for South African connectivity (low-bandwidth)
- Implement load shedding resilience
- Ensure initial page load under 2s
- Optimize for mobile devices

### 3. Accessibility Standards (AS)
- WCAG 2.1 AA compliance
- Maintain color contrast ratios (especially with #F5831F orange)
- Implement proper semantic HTML
- Support keyboard navigation

### 4. Security By Design (SBD)
- Follow OWASP best practices
- Build with POPIA compliance in mind
- Secure all data transfers and storage
- Implement RBAC on all admin features

### 5. Modern Development (MD)
- Component-based architecture
- Mobile-first responsive design
- Progressive enhancement
- TypeScript strict mode

---

## File Organization Rules

### CRITICAL: Correct Directory Placement

**Configuration Files (Root Only)**:
- `package.json`, `tsconfig.json`, `next.config.js`
- `.env*`, `.gitignore`, `.eslintrc.json`
- `CLAUDE.md`, `AGENTS.md`, `README.md`
- `.mcp.json`

**Never in Root**:
- Source code files (.ts, .tsx, .js, .jsx)
- Migration files (.sql)
- Test files (.test.ts, .spec.ts)
- Documentation files (except CLAUDE.md, AGENTS.md, README.md)
- Screenshots or images

### Directory-Specific Placement

**Pages & Routes** (`/app`):
- Public pages: `/app/page.tsx`, `/app/about/page.tsx`
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
- Testing docs: `/docs/testing/[TEST_DOC].md`
- Screenshots: `/docs/screenshots/[screenshot].png`

**Scripts** (`/scripts`):
- Build scripts: `/scripts/build/[script].js`
- Deployment scripts: `/scripts/deploy/[script].sh`
- Utility scripts: `/scripts/[script].js`
- Database utilities: `/scripts/check-user-verification.js`

---

## Architecture Patterns

### Authentication Architecture

#### Admin Authentication
- Supabase Auth with custom `admin_users` table
- RBAC system with 17 role templates, 100+ permissions
- Protected routes redirect to `/admin/login`
- Session management via `useAdminAuth` hook
- Development mode: `admin@circletel.co.za` / `admin123`

#### Customer Authentication (NEW - 2025-10-24)
- WebAfrica-inspired signup at `/order/account`
- Login at `/auth/login`
- Password reset flow: `/auth/forgot-password` → `/auth/reset-password`
- Email verification via Supabase (automatic emails)
- Database triggers sync auth.users ↔ customers table
- Service role pattern for privileged operations

**Key Files**:
- `lib/auth/customer-auth-service.ts` - Centralized auth logic
- `components/providers/CustomerAuthProvider.tsx` - Auth context
- `app/api/auth/create-customer/route.ts` - Service role customer creation

### Coverage System Architecture

#### Multi-Provider Integration
- **Database Schema**: `fttb_network_providers`, `service_packages`, `provider_product_mappings`
- **Active Providers**: MTN (enabled), MetroFibre, Openserve, DFA, Vumatel (placeholders)
- **MTN Products**: 13 products (HomeFibreConnect, BizFibreConnect, 5G/LTE)
- **Aggregation Service**: `/lib/coverage/aggregation-service.ts` (singleton pattern)
- **Provider Registry**: Centralized provider configuration

**Key Files**:
- `/lib/coverage/providers/` - Provider implementations
- `/lib/coverage/mtn/wms-client.ts` - MTN Business API
- `/lib/coverage/aggregation-service.ts` - Multi-provider aggregation
- `/lib/types/coverage-providers.ts` - Type definitions

### RBAC System

**Architecture**:
- **17 Role Templates**: Executive, Management, Staff, Support levels
- **100+ Permissions**: Granular `{resource}:{action}` pattern
- **Database Tables**: `role_templates`, `admin_users`
- **SQL Functions**: `get_user_permissions()`, `user_has_permission()`
- **RLS Policies**: Row Level Security for secure access control

**Usage**:
```typescript
// Hook usage
const { hasPermission, can } = usePermissions();
if (hasPermission(PERMISSIONS.PRODUCTS.EDIT)) { /* show edit button */ }

// Component usage
<PermissionGate permissions={[PERMISSIONS.PRODUCTS.CREATE]}>
  <Button>Add Product</Button>
</PermissionGate>
```

**Key Files**:
- `/lib/rbac/permissions.ts` - Permission definitions
- `/lib/rbac/role-templates.ts` - Role template definitions
- `/hooks/usePermissions.ts` - Permission checking hook
- `/components/rbac/PermissionGate.tsx` - Permission gate component

---

## Design System

### Brand Colors (Tailwind Config)

**CircleTel Primary**:
- `circleTel-orange`: #F5831F (primary brand color)
- `circleTel-white`: #FFFFFF
- `circleTel-darkNeutral`: #1F2937
- `circleTel-secondaryNeutral`: #4B5563
- `circleTel-lightNeutral`: #E6E9EF

**WebAfrica-Inspired** (added 2025-10-23):
- `webafrica-pink`: #E91E63 (can substitute with circleTel-orange)
- `webafrica-blue`: #1E4B85 (dark blue for buttons/text)
- `webafrica-blue-light`: #CDD6F4 (input borders)
- `webafrica-blue-lighter`: #E8F0FF (backgrounds)
- `webafrica-blue-bg`: #F5F9FF (soft backgrounds)
- `webafrica-blue-dark`: #163a6b (button hover states)

**Design Pattern**: Use CircleTel orange for primary actions and accents, WebAfrica blue for secondary elements and text.

### Typography
- **Primary**: Arial, Helvetica, sans-serif
- **Monospace**: Consolas, "Courier New", monospace

### Component Library
- **Base**: shadcn/ui with Radix UI primitives
- **Location**: `/components/ui/`
- **Customization**: Tailwind CSS classes
- **Icons**: Lucide React, Tabler Icons

---

## Database Migration Strategy

### Migration Application
**ALWAYS use Supabase Dashboard SQL Editor** for migration application:
- Most reliable method with immediate feedback
- Programmatic tools (CLI, Node.js) may encounter auth/network issues
- Verify all migrations with SQL queries after application

### Migration Files
- **Location**: `/supabase/migrations/`
- **Naming**: `YYYYMMDDHHMMSS_description.sql`
- **Idempotency**: Use `IF NOT EXISTS`, `ON CONFLICT` clauses

### Key Migrations (Applied)
- `20250201000005_create_rbac_system.sql` - RBAC with 17 role templates ✅
- `20251019000001_enhance_provider_management_system.sql` - Provider health monitoring ✅
- `20251021000006_cleanup_and_migrate.sql` - Multi-provider architecture ✅
- `20251021000007_add_mtn_products.sql` - 13 MTN products ✅
- `20251022000010_add_account_type_to_customers.sql` - Customer account_type ✅
- `20251024000003_fix_email_verification_trigger.sql` - Email verification triggers ✅

---

## Common Debugging Patterns

### Infinite Loading States
**Symptom**: Component stuck showing "Loading..." indefinitely

**Solution**:
```typescript
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

### Authentication Flow Debugging
**Tools**:
- Browser console: Check for "Auth state changed:" logs
- Network tab: Look for `/auth/v1/token` requests
- LocalStorage: Inspect `sb-{project-ref}-auth-token`
- Database: Query `customers` table to verify records

**Common Issues**:
1. Session exists but dashboard won't load → Check `authLoading` state
2. Multiple SIGNED_IN events → Normal, callbacks must be idempotent
3. Customer record missing → Use service role pattern
4. Email verification not syncing → Check triggers have `SECURITY DEFINER`

---

## Implementation Status

### ✅ Complete Features
- **RBAC System**: 17 role templates, 100+ permissions, database-enforced
- **Multi-Provider Architecture**: Phase 1A (database schema, MTN integration)
- **MTN Integration**: 3 providers configured (13 products)
- **Marketing CMS**: Strapi integration (promotions, campaigns, landing pages)
- **Netcash Payment**: Phase 1A (webhook configuration, staging testing)
- **Interactive Coverage Map**: WebAfrica-style modal with Google Maps
- **Customer Authentication**: Complete signup/login/password reset flow
- **WebAfrica-Style UI**: Package display, account page, progress indicators
- **Admin Dashboard Improvements** (Oct 24, 2025):
  - Comprehensive UI/UX review (750+ lines)
  - Form accessibility (autocomplete attributes)
  - Enhanced empty states with Clear Filters
  - Product count indicators
  - Comprehensive documentation
- **Living Roadmap**: 4-phase development plan with 40+ features tracked
- **Project Organization**: Root directory cleanup, logical folder structure

### 🚧 In Progress
- **Phase 2: Core Features** (Oct-Dec 2024):
  - Product edit page (HIGH priority)
  - Product table synchronization (HIGH priority)
  - Contextual help system (MEDIUM priority)
  - Supabase client consolidation (MEDIUM priority)

### 📋 Backlog
See `ROADMAP.md` for complete roadmap and `docs/features/backlog/` for ready-to-implement features:
- Enhanced analytics dashboard (4-5 hours)
- Bulk operations (3-4 hours)
- Notification system (3-4 hours)
- Mobile optimization (3-4 hours)
- Advanced search & filtering (2-3 hours)

---

## Environment Configuration

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `NEXT_PUBLIC_STRAPI_URL` - Strapi CMS URL (optional)
- `STRAPI_API_TOKEN` - Strapi API token (optional)
- `RESEND_API_KEY` - Resend email API key
- `NETCASH_SERVICE_KEY` - Netcash payment key

### Environment Files
- `.env.local` - Local development (gitignored)
- `.env.example` - Template for required variables
- `.env.netcash.staging.example` - Netcash staging config
- `.env.netcash.production.example` - Netcash production config

---

## Testing Strategy

### E2E Testing (Playwright)
- Configured via MCP integration
- Test files: `/tests/e2e/`
- Coverage: Homepage, coverage checker, admin panel, order flows

### Manual Testing
- Admin features require manual testing
- Coverage system testing tools in `/app/admin/coverage`
- Payment webhook testing via Netcash dashboard

### Type Checking
- **Pre-commit**: `npm run type-check:memory`
- **CI/CD**: Automatic type checking on build
- **No unit tests**: Relies on TypeScript + E2E

---

## Support and Resources

### Documentation
- **Main Guide**: `CLAUDE.md` - Comprehensive project documentation
- **Agent Guide**: `AGENTS.md` - This file
- **Roadmap**: `ROADMAP.md` - Development roadmap (4 phases, 40+ features)
- **README**: `README.md` - Project overview and quick start
- **Admin Docs**: `docs/admin/` - Admin panel guides and UI reviews
- **Architecture**: `docs/architecture/` - System design documentation
- **Migrations**: `docs/migrations/` - Database migration guides
- **Testing**: `docs/testing/` - Test reports and strategies
- **Templates**: `docs/templates/` - Feature proposal templates

### Key Commands
```bash
# Development
npm run dev:memory              # Start dev server with memory optimization
npm run type-check:memory       # TypeScript validation
npm run workflow:start          # Morning memory optimization

# Build & Deploy
npm run build:memory            # Production build
npm run start                   # Start production server

# Memory Management
npm run memory:check            # Quick memory status
npm run workflow:cleanup        # End-of-day cleanup
```

### Project Information
- **Version**: 2.0
- **Target Launch**: October 2025
- **Target Customers**: 25
- **Target MRR**: R32,000
- **Deployment**: Vercel
- **Supabase Project**: agyjovdugmtopasyvlng

---

## Agent Invocation Examples

### Implementing a New Feature
```
"Use the full-stack-dev agent to implement customer feedback feature"
→ Orchestrator selects full-stack-dev
→ 5-phase workflow: Planning → DB → Backend → Frontend → Integration
→ Quality gates: TypeScript, RBAC, design compliance
→ Handoff to testing-agent and documentation-agent
```

### Debugging an Issue
```
"Debug the infinite loading state on customer dashboard"
→ Orchestrator selects bug-hunter
→ Analyzes async callback error handling
→ Implements try-catch-finally pattern
→ Verifies fix with manual testing
```

### Optimizing Performance
```
"Optimize the coverage checker page load time"
→ Orchestrator selects performance-optimizer
→ Analyzes bundle size and network requests
→ Implements caching and lazy loading
→ Validates with performance metrics
```

### Creating Documentation
```
"Document the new commission tracking feature"
→ Orchestrator selects documentation-agent
→ Creates feature specification
→ Adds API documentation
→ Updates user guide
```

---

**Last Updated**: October 24, 2025  
**Version**: 2.0  
**Status**: Active Development  
**Next Review**: November 1, 2025

## Recent Updates (Oct 24, 2025)

### Documentation Organization
- ✅ Moved migration files to `docs/migrations/`
- ✅ Moved testing files to `docs/testing/`
- ✅ Enhanced README with comprehensive overview
- ✅ Created living roadmap with 4 phases

### Admin Dashboard Improvements
- ✅ Comprehensive UI/UX review (8.5/10 score)
- ✅ Form accessibility improvements
- ✅ Enhanced empty states with Clear Filters
- ✅ Tested with Playwright MCP

### Roadmap & Planning
- ✅ Created `ROADMAP.md` (730+ lines)
- ✅ Feature proposal template
- ✅ Quick reference guide
- ✅ 40+ features tracked with estimates
