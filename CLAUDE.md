# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

### Validation & CI Optimization
- `npm run validate` - Smart validation (changed files only, ~5s)
- `npm run validate:full` - Full validation without tests (~22s)
- `npm run validate:all` - Complete validation with tests (~7min)
- `npm run type-check` - TypeScript type checking only
- `npm run lint:fix` - Auto-fix linting issues

### Design System Testing
- `npm run ds:validate [scenario]` - Run design system validation tests
- `npm run ds:component <url> <name>` - Validate new component
- `npm run ds:page <url> <name>` - Validate new page
- `npm run ds:report` - Generate validation report
- `npm run ds:install` - Install Playwright dependencies
- `npm run ds:update-baselines` - Update visual regression baselines
- `npm run test:design-system` - Run design system tests with Playwright
- `npm run test:design-system:ui` - Run design system tests with UI mode

### Design System Validation Scenarios
- `full` - Complete validation (default)
- `components` - Component-only validation
- `accessibility` - Accessibility testing
- `tokens` - Design token consistency
- `visual` - Visual regression testing
- `mobile` - Mobile-specific validation
- `browsers` - Cross-browser testing

## Architecture Overview

This is a CircleTel business website built with Vite + React + TypeScript + shadcn/ui components.

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast builds
- **Styling**: Tailwind CSS with custom CircleTel brand colors
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router DOM
- **State Management**: React Query (@tanstack/react-query)
- **Backend**: Supabase with Edge Functions
- **Forms**: React Hook Form with Zod validation

### Project Structure

- `src/components/` - Organized by feature and UI components
  - `src/components/ui/` - shadcn/ui base components
  - `src/components/common/` - Shared components across pages
  - `src/components/{feature}/` - Feature-specific components (home, contact, pricing, etc.)
- `src/pages/` - Route components matching the URL structure
- `src/lib/utils.ts` - Utility functions including the `cn()` helper for className merging
- `supabase/functions/` - Supabase Edge Functions for backend logic

### Routing Structure
The site follows a structured routing pattern:
- `/` - Homepage
- `/services` - Main services with sub-routes for business sizes
- `/pricing` and `/bundles` - Pricing and package information
- `/connectivity` - Connectivity solutions with technology-specific pages
- `/cloud` - Cloud services (migration, hosting, backup, virtual desktops)
- `/resources` - Tools and guides

### Styling Guidelines
- Uses Tailwind CSS with custom CircleTel brand colors defined in `tailwind.config.ts`
- Brand colors: `circleTel-orange` (#F5831F), neutrals, etc.
- shadcn/ui provides consistent component styling
- Custom animations: `fade-in`, `scale-in`, `accordion-down/up`

### Backend Integration
- **Supabase Project**: `agyjovdugmtopasyvlng.supabase.co`
- **Edge Functions**: Multiple functions for different business logic
  - `zoho-crm`, `zoho-callback` - CRM integration
  - `check-fttb-coverage` - Fibre coverage checking
  - `unjani-form-submission` - Contract audit form processing
  - `admin-auth`, `admin-approval-workflow`, `admin-product-management` - Admin system
- **Database**: PostgreSQL with migrations in `supabase/migrations/`
- **Configuration**: JWT verification disabled for public functions in `supabase/config.toml`
- **Shared Code**: Common utilities in `supabase/functions/_shared/`

### Form Handling
- **React Hook Form** for form state management with TypeScript integration
- **Zod schemas** for validation with custom validation utilities
- **Form Persistence** - Auto-save drafts to localStorage with restoration
- **Supabase Integration** - Forms submit to Edge Functions with fallback to localStorage
- **Client Forms** - Specialized forms in `src/components/forms/clients/` (e.g., Unjani contract audits)
- **Validation Utilities** - Centralized in `src/components/forms/utils/validation.ts`
- **Form Components** - Reusable form fields in `src/components/common/FormFields.tsx`

### Design System
- **Comprehensive Design System**: Built using atomic design principles (atoms, molecules, organisms)
- **Design Tokens**: Centralized in `src/design-system/tokens.ts` - colors, typography, spacing, animations
- **Component Library**: Organized in `src/design-system/components/` with atoms, molecules, and organisms
- **Typography System**: Inter (primary) and Space Mono (monospace) with semantic hierarchy
- **Brand Colors**: CircleTel orange (#F5831F) as primary with semantic color system
- **Accessibility**: WCAG 2.1 AA compliant components with proper ARIA labels and keyboard navigation
- **Documentation**: Internal team documentation at `/internal-docs` with interactive examples

#### Design System Usage
```typescript
// Import design system components
import { Button, Card, Heading, Text } from '@/design-system';
import { colors, typography, spacing } from '@/design-system/tokens';

// Use semantic component variants
<Heading level={1} variant="hero" color="accent">Page Title</Heading>
<Text variant="body-large" color="secondary">Description text</Text>
<Button variant="default" size="lg">Primary Action</Button>
```

#### Design System Structure
- `src/design-system/tokens.ts` - All design tokens (colors, typography, spacing)
- `src/design-system/foundations/` - Typography, spacing, iconography guidelines
- `src/design-system/components/atoms/` - Basic components (Button, Input, Text, etc.)
- `src/design-system/components/molecules/` - Composite components (SearchField, FormField, etc.)
- `src/design-system/components/organisms/` - Complex sections (Header, Footer, HeroSection, etc.)
- `src/design-system/index.ts` - Main export file for all design system components

### Admin System Architecture
- **Admin Pages** - Protected admin interface in `src/pages/admin/`
- **Admin Components** - Layout and functionality in `src/components/admin/`
- **Authentication** - Custom admin auth hook in `src/hooks/useAdminAuth.ts`
- **Real-time Sync** - Live data updates with `src/hooks/useRealtimeSync.ts`
- **Product Management** - Full CRUD operations for business products
- **Approval Workflows** - Multi-step approval processes for business operations

### Coverage System
- **FTTB Coverage Component** - Interactive coverage checking in `src/components/coverage/`
- **Google Maps Integration** - Coverage area visualization and address validation
- **Real-time Checking** - Live coverage validation via Supabase Edge Functions

### Testing & Quality Assurance
- **Playwright Configuration** - Specialized config in `playwright.design-system.config.ts`
- **Design System Testing** - Comprehensive visual regression and accessibility testing
- **Test Scripts** - Automated validation via `scripts/design-system-validation.js`
- **Multi-browser Testing** - Chrome, Firefox, Safari across desktop, mobile, tablet
- **Visual Baselines** - Automated screenshot comparison with threshold tolerance

### CI/CD Pipeline Optimization ⚡ VERIFIED WORKING
- **Pre-commit Hooks** - Husky runs `npm run validate` before each commit (prevents broken pushes)
- **Smart CI Strategy** - Parallel jobs with conditional test execution
  - **validate & build**: Always run in parallel (~30s - 2min) ✅
  - **test**: Only runs on PRs or when commit message contains `[run-tests]` ✅
- **Local-first Validation** - Most validation happens locally to save CI time
- **Verified Performance Results**:
  - Local validation: ~5 seconds (changed files only) ✅
  - Regular CI runs: ~30 seconds - 2 minutes (validate + build only) ✅
  - Full CI with tests: ~7-8 minutes (only when needed) ✅

**CRITICAL: DO NOT change the CI conditional logic in `.github/workflows/ci.yml`**
- The test job conditional `if: ${{ github.event_name == 'pull_request' || contains(github.event.head_commit.message, '[run-tests]') }}` is working correctly
- Regular commits should only run 2 jobs (validate + build), test job should show as skipped ⊘

## Key Integration Points

### Supabase Edge Functions
When working with backend functionality:
- Edge Functions are deployed via Supabase CLI: `supabase functions deploy <function-name>`
- Test locally with `supabase functions serve`
- Function logs available via Supabase dashboard or CLI
- CORS headers configured in `_shared/cors.ts`

### Form Development Patterns
When creating new forms:
1. Create form schema with Zod in dedicated `types.ts` file
2. Use form persistence hooks for auto-save functionality
3. Implement progress calculation for multi-step forms
4. Add validation utilities from `src/components/forms/utils/`
5. Submit to corresponding Supabase Edge Function

### Admin Feature Development
- All admin routes require authentication via `useAdminAuth` hook
- Use real-time sync for live data updates in admin interfaces
- Follow approval workflow patterns for business process automation
- Admin components should use design system tokens and patterns

### Client-Specific Implementations
- Client forms organized by client name (e.g., `unjani/`)
- Each client has dedicated types, validation, and components
- Priority calculation algorithms for business logic
- Integration with backend systems for data processing

### Development Notes
- **Path Aliases**: `@/` maps to `src/`
- **Lovable Platform** - Managed through lovable.dev with automatic git integration
- **Environment Variables** - Configured in `.env` for API keys and Supabase connection
- **TypeScript Strict Mode** - Full type safety with React Hook Form integration
- **Git Hooks** - Pre-commit validation automatically runs (use `npm run prepare` to reinstall if needed)

## Development Workflow Best Practices

### Daily Development
1. **Before coding**: Run `npm run validate` to check current state
2. **During development**: Auto-save runs local validation via pre-commit hooks
3. **Before pushing**: Major changes should run `npm run validate:full`
4. **For releases**: Always run `npm run validate:all` to include full test suite

### CI Optimization Guidelines ⚡ PROVEN EFFECTIVE
- **Regular commits**: Let CI run fast validation only (~30s-2min) ✅ VERIFIED
- **When tests needed**: Add `[run-tests]` to commit message (will run ~7min)
- **Pull requests**: Tests run automatically (full validation)
- **Emergency fixes**: Use `git commit --no-verify` to skip pre-commit (not recommended)

**Examples of correct usage:**
```bash
# Fast CI (30s-2min) - for regular development
git commit -m "Add new feature"
git commit -m "Fix bug in payment processing"
git commit -m "Update documentation"

# Full CI with tests (~7min) - when you need comprehensive validation
git commit -m "Add payment integration [run-tests]"
git commit -m "Major refactor of authentication [run-tests]"
```

### Performance Monitoring ✅ CURRENT BENCHMARKS
- **Local validation**: ~5 seconds (ACHIEVED ✅)
- **CI validate/build**: ~30s-2min (ACHIEVED ✅)
- **Full test suite**: ~7-8 minutes (ACHIEVED ✅)
- **Alert thresholds**: If CI exceeds 3min without tests, investigate immediately

**Red flags to watch for:**
- Regular commits taking longer than 3 minutes
- Test job running when it shouldn't (check for ⊘ skipped symbol)
- Pre-commit hooks taking longer than 10 seconds
- Any workflow taking longer than 10 minutes total

### Code Quality Standards
- **Zero TypeScript errors**: Required for all commits
- **ESLint compliance**: Auto-fixable issues should be resolved automatically
- **Build success**: All commits must build successfully
- **Test coverage**: New features should include appropriate tests

## ⚡ Future Development: Maintaining CI Performance

### When Adding New Features
**ALWAYS follow this pattern for optimal CI performance:**

1. **Feature Development Commits** (Regular pace - 30s CI):
   ```bash
   git commit -m "Add user profile component"
   git commit -m "Implement email validation"
   git commit -m "Update API endpoints"
   ```

2. **Major Feature Completion** (Full validation - 7min CI):
   ```bash
   git commit -m "Complete user authentication system [run-tests]"
   ```

3. **Pull Requests** (Automatic full validation):
   - Tests run automatically on all PRs
   - No need to add `[run-tests]` to PR commits

### CI Troubleshooting for Future Developers
If CI is running slow again:

1. **Check workflow run** - Should see only 2 jobs (validate ✅, build ✅, test ⊘)
2. **If test job runs unexpectedly**:
   - Check commit message doesn't accidentally contain `[run-tests]`
   - Verify the conditional in `.github/workflows/ci.yml` hasn't been modified
3. **If CI exceeds 3 minutes regularly**:
   - Review and optimize the validation scripts in `scripts/`
   - Consider adding more files to smart validation exclusions

### Protected CI Configuration
**DO NOT MODIFY** these critical files without careful consideration:
- `.github/workflows/ci.yml` - Optimized conditional logic
- `scripts/validate-changed.js` - Smart validation script
- `.husky/pre-commit` - Pre-commit hook configuration
- `package.json` validation scripts