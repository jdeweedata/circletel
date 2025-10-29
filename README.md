# CircleTel Digital Service Provider Platform

**Modern ISP and Managed IT Services Platform for South Africa**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (see `.nvmrc`)
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository with submodules
git clone --recurse-submodules https://github.com/jdeweedata/circletel-nextjs.git
cd circletel-nextjs

# If you already cloned without --recurse-submodules, initialize submodules:
git submodule update --init --recursive

# Install dependencies (main project)
npm install

# Install dependencies (Strapi CMS)
cd strapi-cms
npm install
cd ..

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up Strapi environment variables
cp strapi-cms/.env.example strapi-cms/.env
# Edit strapi-cms/.env with your CMS credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📚 Documentation

### Essential Reading
- **[ROADMAP.md](ROADMAP.md)** - Development roadmap and feature planning
- **[CLAUDE.md](CLAUDE.md)** - AI agent guidance and architecture overview
- **[AGENTS.md](AGENTS.md)** - Agent team configuration and workflows

### Admin Documentation
- [Admin Quick Start](docs/admin/ADMIN_QUICK_START.md) - Getting started with admin panel
- [Admin UI Review](docs/admin/ADMIN_UI_CONTENT_REVIEW.md) - Comprehensive UI analysis
- [Product Management](docs/admin/PRODUCT_MANAGEMENT_GUIDE.md) - Product CRUD guide
- [Improvements Log](docs/admin/IMPROVEMENTS_IMPLEMENTED.md) - Recent enhancements

### Development Guides
- [Roadmap Quick Reference](docs/ROADMAP_QUICK_REFERENCE.md) - Current priorities
- [Feature Proposal Template](docs/templates/FEATURE_PROPOSAL.md) - How to propose features
- [Session Summary](docs/SESSION_SUMMARY_2025-10-24.md) - Latest development session

### Technical Documentation
- [Architecture](docs/architecture/) - System architecture and design
- [Testing](docs/testing/) - Test reports and strategies
- [Migrations](docs/migrations/) - Database migration guides

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **PWA**: next-pwa with offline support

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + RBAC
- **API**: Next.js API Routes + Edge Functions
- **CMS**: Strapi (Headless)

### Integrations
- **Zoho**: CRM, Billing, Calendar (via MCP)
- **MTN**: Multi-provider coverage (WMS API)
- **Google Maps**: Coverage checking
- **Netcash**: Payment processing
- **Resend**: Transactional emails

---

## 📁 Project Structure

```
circletel-nextjs/
├── app/                    # Next.js 15 App Router
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   └── (public)/          # Public pages
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── docs/                  # Documentation
│   ├── admin/            # Admin guides
│   ├── architecture/     # Technical docs
│   ├── migrations/       # Database migrations
│   ├── templates/        # Document templates
│   └── testing/          # Test reports
├── lib/                   # Utilities and services
│   ├── auth/             # Authentication
│   ├── coverage/         # Coverage API
│   ├── rbac/             # Role-based access control
│   └── ...
├── supabase/             # Supabase configuration
│   ├── functions/        # Edge functions
│   └── migrations/       # SQL migrations
└── strapi-cms/           # Git submodule: circletel-strapi-cms
                          # (see https://github.com/jdeweedata/circletel-strapi-cms)
```

---

## 🎯 Features

### Customer Portal
- ✅ Coverage checking (multi-provider)
- ✅ Product browsing and comparison
- ✅ Online ordering and checkout
- ✅ Account management
- ✅ Billing and invoices

### Admin Dashboard
- ✅ Product management (CRUD)
- ✅ Order processing
- ✅ Customer management
- ✅ Analytics and reporting
- ✅ Coverage monitoring
- ✅ RBAC with 100+ permissions
- 🔄 Bulk operations (in progress)
- 🔄 Enhanced analytics (planned)

### Integrations
- ✅ MTN coverage (3 providers)
- ✅ Zoho CRM sync
- ✅ Netcash payments
- ✅ Google Maps API
- ✅ Strapi CMS

---

## 🧪 Testing

### Run Tests
```bash
# E2E tests with Playwright
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### Test Coverage
- E2E tests for critical flows
- Manual testing for admin features
- TypeScript compilation as validation

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Environment Variables
See `.env.example` for required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- And more...

---

## 📦 Working with Git Submodules

The Strapi CMS is maintained as a separate repository linked via git submodule.

### Common Submodule Commands

```bash
# Update submodule to latest commit
cd strapi-cms
git pull origin main
cd ..
git add strapi-cms
git commit -m "Update Strapi CMS submodule"

# Check submodule status
git submodule status

# Pull main repo and update all submodules
git pull
git submodule update --remote

# Clone project with submodules
git clone --recurse-submodules https://github.com/jdeweedata/circletel-nextjs.git

# If you forgot --recurse-submodules
git submodule update --init --recursive
```

### Strapi CMS Repository
- **Repository**: [circletel-strapi-cms](https://github.com/jdeweedata/circletel-strapi-cms)
- **Purpose**: Content management system for marketing pages, campaigns, and promotions
- **Deployment**: Separate from main Next.js app

---

## 🤝 Contributing

### Feature Requests
1. Copy [Feature Proposal Template](docs/templates/FEATURE_PROPOSAL.md)
2. Fill out all sections
3. Create GitHub issue with `roadmap` label
4. Team reviews weekly

### Development Workflow
1. Create feature branch from `main`
2. Make changes following [CLAUDE.md](CLAUDE.md) guidelines
3. Test thoroughly
4. Submit PR with clear description
5. Wait for review and approval

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Mobile-first responsive design
- WCAG 2.1 AA accessibility

---

## 📊 Project Status

### Current Phase
**Phase 2: Core Features** (In Progress)

### Priorities
1. Product edit page (HIGH)
2. Product table sync (HIGH)
3. Contextual help system (MEDIUM)

See [ROADMAP.md](ROADMAP.md) for full roadmap.

### Metrics
- **Products**: 17 active
- **Permissions**: 100+
- **Role Templates**: 17
- **Admin Modules**: 14

---

## 🔐 Security

- RBAC with granular permissions
- Supabase Row Level Security (RLS)
- API authentication required
- POPIA compliance built-in
- Secure payment processing

---

## 📞 Support

### Documentation
- [Admin Quick Start](docs/admin/ADMIN_QUICK_START.md)
- [CLAUDE.md](CLAUDE.md) - AI agent guidance
- [ROADMAP.md](ROADMAP.md) - Development roadmap

### Issues
Create a GitHub issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## 📝 License

Proprietary - CircleTel (Pty) Ltd

---

## 🎉 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**Last Updated**: October 24, 2025  
**Version**: 1.0  
**Status**: Active Development
