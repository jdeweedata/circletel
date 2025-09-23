# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

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
- Supabase project configured with Edge Functions
- Functions include Zoho CRM integration (`zoho-crm`, `zoho-callback`)
- Functions have JWT verification disabled in `supabase/config.toml`

### Form Handling
- React Hook Form for form state management
- Zod for schema validation
- Forms integrate with Supabase Edge Functions for lead processing

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

### Development Notes
- Uses path aliases: `@/` maps to `src/`
- Vite config includes Lovable component tagger for development
- ESLint configured for React + TypeScript best practices
- The project is managed through Lovable platform integration
- Add to memory. The Fibre to the Business FTTB coverage check component and modal.