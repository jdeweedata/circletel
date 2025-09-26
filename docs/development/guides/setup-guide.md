# CircleTel Development Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the CircleTel development environment. The project is built with Next.js 15 and uses Supabase for backend services.

## Prerequisites

### System Requirements
- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: Version 2.30 or higher
- **VS Code**: Latest version (recommended) or any modern IDE

## Quick Start (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/circletel-nextjs.git
cd circletel-nextjs
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit the environment variables
nano .env.local  # or use your preferred editor
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Open in Browser
Navigate to `http://localhost:3000` to see your application running.

## Detailed Setup

### Environment Configuration

#### Required Environment Variables
```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Google Maps (for coverage checking)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

#### Development Environment Variables
```env
# Development settings
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development

# Debug settings (optional)
NEXT_PUBLIC_DEBUG=true
```

### Database Setup

#### Using Supabase (Recommended)
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy the project URL and anon key

2. **Run Migrations**
   ```bash
   # Apply database migrations
   npx supabase db push

   # Generate types (if using TypeScript)
   npx supabase gen types typescript --local > lib/supabase.ts
   ```

#### Local PostgreSQL Setup (Alternative)
1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql

   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib

   # Windows (using Chocolatey)
   choco install postgresql
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE circletel_dev;
   CREATE USER circletel_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE circletel_dev TO circletel_user;
   ```

3. **Update Connection String**
   ```env
   DATABASE_URL=postgresql://circletel_user:your_password@localhost:5432/circletel_dev
   ```

### Authentication Setup

#### Supabase Auth Configuration
1. **Enable Authentication Providers**
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable Email provider
   - Configure email templates

2. **Set up Email Templates**
   - Customize welcome, confirmation, and password reset emails
   - Add your company branding

#### Social Authentication (Optional)
- **Google OAuth**: Configure Google OAuth credentials
- **GitHub OAuth**: Configure GitHub OAuth app
- **Microsoft Azure**: Configure Azure AD app

### Payment Gateway Setup

#### PayFast Configuration (South Africa)
1. **Create PayFast Account**
   - Sign up at [payfast.co.za](https://payfast.co.za)
   - Get merchant ID and key

2. **Environment Variables**
   ```env
   PAYFAST_MERCHANT_ID=your_merchant_id
   PAYFAST_MERCHANT_KEY=your_merchant_key
   PAYFAST_PASSPHRASE=your_passphrase
   NEXT_PUBLIC_PAYFAST_TEST_MODE=true  # Set to false for production
   ```

#### Alternative Payment Providers
- **Stripe**: For international payments
- **PayPal**: For global reach
- **Yoco**: Another South African option

### External Services Setup

#### Google Maps API
1. **Get API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Maps JavaScript API and Places API
   - Create API key with appropriate restrictions

2. **Environment Configuration**
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

#### Email Service (Resend)
1. **Create Resend Account**
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain
   - Get API key

2. **Environment Configuration**
   ```env
   RESEND_API_KEY=your_resend_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

## Development Workflow

### Code Organization
```
📁 circletel-nextjs/
├── 📁 app/                    # Next.js app router pages
│   ├── 📁 auth/              # Authentication pages
│   ├── 📁 order/             # Order flow pages
│   ├── 📁 admin/             # Admin dashboard
│   └── 📁 api/               # API routes
├── 📁 components/            # Reusable components
│   ├── 📁 ui/                # Base UI components
│   ├── 📁 forms/             # Form components
│   └── 📁 features/          # Feature-specific components
├── 📁 lib/                   # Utilities and services
│   ├── 📁 services/          # Business logic
│   ├── 📁 types/             # TypeScript types
│   └── 📁 utils/             # Utility functions
└── 📁 docs/                  # Documentation
```

### Development Commands

#### Basic Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

#### Database Commands
```bash
# Generate Supabase types
npx supabase gen types typescript --local > lib/supabase.ts

# Run database migrations
npx supabase db push

# Start Supabase locally
npx supabase start

# Stop Supabase locally
npx supabase stop
```

#### Testing Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Code Style and Standards

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

#### ESLint Configuration
- Extends Next.js recommended configuration
- Includes TypeScript strict rules
- Custom rules for React best practices

#### TypeScript Configuration
- Strict mode enabled
- Path mapping configured
- Custom type definitions included

### Git Workflow

#### Branch Naming Convention
```
feature/        # New features (e.g., feature/order-system)
fix/            # Bug fixes (e.g., fix/login-validation)
refactor/       # Code refactoring (e.g., refactor/auth-components)
docs/           # Documentation updates (e.g., docs/setup-guide)
test/           # Testing related changes (e.g., test/order-flow)
```

#### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing changes
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add email verification flow
fix(order): resolve validation error on contact stage
docs: update API documentation for order endpoints
```

## Development Tools Setup

### VS Code Extensions (Recommended)
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript Hero**: TypeScript utilities
- **Auto Rename Tag**: HTML/JSX tag renaming
- **Bracket Pair Colorizer 2**: Bracket color coding
- **GitLens**: Git integration
- **Supabase**: Supabase dashboard integration

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Debugging

### Browser DevTools
1. Open browser developer tools (F12)
2. Check Console tab for JavaScript errors
3. Use Network tab to monitor API calls
4. Use Application tab to check localStorage/sessionStorage

### VS Code Debugging
1. Set breakpoints in your code
2. Use Debug panel (Ctrl+Shift+D)
3. Select "Next.js: debug server-side" or "Next.js: debug client-side"
4. Start debugging (F5)

### Common Issues and Solutions

#### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### Node Modules Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf .next
npm run type-check
```

#### Supabase Connection Issues
```bash
# Check Supabase status
npx supabase status

# Restart Supabase
npx supabase stop && npx supabase start
```

## Performance Optimization

### Development Performance
- Use React DevTools Profiler to identify slow components
- Monitor bundle size with `npm run build` (check output)
- Use `npm run dev` with Turbo mode for faster builds

### Production Optimization
- Implement code splitting for large components
- Use Next.js Image component for optimized images
- Implement proper caching headers
- Monitor Core Web Vitals

## Security Considerations

### Development Security
- Never commit API keys or secrets to version control
- Use environment variables for all sensitive data
- Enable HTTPS for local development when testing payments
- Regularly update dependencies for security patches

### Environment Variables Security
```bash
# Never include these in your code
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
RESEND_API_KEY=your_production_key
```

## Deployment Preparation

### Pre-deployment Checklist
- [ ] All tests pass
- [ ] TypeScript compilation successful
- [ ] Build completes without errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security headers configured
- [ ] Performance optimizations applied

### Environment Configuration
```env
# Production environment variables
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Getting Help

### Documentation
- Check the [Architecture Overview](../architecture/system-overview.md)
- Review [Feature Specifications](../features/)
- Read [Component Documentation](../components/)

### Community
- Join the development team chat
- Check existing GitHub issues
- Review pull request discussions

### Support Channels
1. **Documentation**: Check this setup guide first
2. **Code Review**: Ask questions during PR reviews
3. **Team Chat**: Use development team communication channels
4. **GitHub Issues**: Create issues for bugs or feature requests

---

## Related Documentation

- [System Architecture](../architecture/system-overview.md)
- [Contributing Guide](contributing-guide.md)
- [Code Review Checklist](code-review-checklist.md)
- [Testing Standards](../standards/testing-standards.md)

---

*This setup guide is maintained by the CircleTel development team and should be updated as the development environment evolves.*
