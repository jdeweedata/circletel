# Tech Stack

## Context

CircleTel business website tech stack for Agent OS projects, overridable in project-specific `.agent-os/product/tech-stack.md`.

- App Framework: React 18 with TypeScript
- Build Tool: Vite with SWC for fast builds
- Language: TypeScript (strict mode)
- Primary Database: Supabase PostgreSQL with PostGIS
- Backend: Supabase Edge Functions (Deno runtime)
- JavaScript Framework: React 18 with React Router DOM
- State Management: React Query (@tanstack/react-query)
- Package Manager: npm
- Node Version: Latest LTS
- CSS Framework: Tailwind CSS with custom CircleTel brand colors
- UI Components: shadcn/ui (Radix UI primitives)
- Form Handling: React Hook Form with Zod validation
- Font Provider: Google Fonts (Inter primary, Space Mono monospace)
- Font Loading: Self-hosted for performance
- Icons: Lucide React components
- Maps Integration: ArcGIS API for JavaScript
- Application Hosting: Vercel
- Database Hosting: Supabase managed PostgreSQL
- Database Backups: Supabase automated backups
- Asset Storage: Supabase Storage
- CI/CD Platform: GitHub Actions
- CI/CD Trigger: Push to main branch and PRs
- Tests: Playwright for design system validation
- Production Environment: main branch
- Design System: Atomic design principles (atoms, molecules, organisms)
