# CircleTel Technical Preferences

## Established Patterns

### Component Architecture
- **Base Components**: Use shadcn/ui with Radix primitives
- **Form Components**: Custom CircleTel form library in `/components/forms`
- **Layout Components**: Navbar, Footer, Sidebar patterns established
- **Provider Hierarchy**: QueryProvider → PWAProvider → OfflineProvider → TooltipProvider

### Styling Standards
- **Primary Framework**: Tailwind CSS
- **Brand Colors**: circleTel-orange (#F5831F), circleTel-darkNeutral, etc.
- **Typography**: Inter font family for UI, Space Mono for code
- **Responsive Design**: Mobile-first approach

### Data Patterns
- **API Integration**: React Query for server state
- **Client State**: Zustand stores
- **Database**: Supabase with generated types
- **Real-time**: Supabase subscriptions where needed

### File Organization
```
/app                    # Next.js 15 app router pages
/components
  /ui                   # shadcn/ui components
  /forms               # Custom form components
  /layout              # Navigation, footer, etc.
  /admin               # Admin-specific components
  /providers           # React context providers
/lib
  /services            # API clients and services
  /utils               # Utility functions
  /types               # TypeScript type definitions
/hooks                 # Custom React hooks
```

### Import Patterns
- Use `@/` path alias for imports from project root
- Prefer named exports over default exports
- Group imports: React → Third-party → Internal

### Code Style
- TypeScript strict mode enabled
- Use interface over type for object shapes
- Prefer const assertions for immutable data
- Use React Query for all server state
- Custom hooks for business logic

## Integration Preferences

### Zoho Integration
- MCP-based integration via remote server
- TypeScript types in `/lib/types/zoho.ts`
- React hooks in `/hooks/use-zoho-mcp.ts`
- Fallback to direct API when MCP unavailable

### Authentication
- Supabase Auth (to be implemented)
- Role-based access control
- Protected route patterns

### PWA Features
- Service worker for offline functionality
- Push notification capability
- IndexedDB for offline data storage

## Development Workflow
- 6-day sprint cycles
- Feature branches with descriptive names
- Type checking with `npm run type-check`
- Build validation before deployment
- Vercel deployment pipeline