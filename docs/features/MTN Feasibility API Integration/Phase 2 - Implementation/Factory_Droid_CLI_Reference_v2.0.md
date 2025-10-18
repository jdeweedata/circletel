# Factory Droid CLI - Quick Command Reference
## MTN Feasibility Integration

**Project:** Circle Tel  
**Feature:** MTN Feasibility API Integration  
**Version:** 2.0  

---

## 🚀 GETTING STARTED

### Install Factory CLI

```bash
# Install globally
npm install -g @factory-ai/cli

# Verify installation
factory --version

# Initialize in your project
cd /path/to/circle-tel
factory init
```

### Configure Project

```bash
# Create .factory directory
mkdir -p .factory/droids .factory/workflows

# Copy configuration from implementation plan
# (See Phase_2_Implementation_Plan_v2.0.md Section 2.2)
```

---

## 📁 DIRECTORY SCAFFOLDING COMMANDS

### Create All Directories (Safe Mode)

```bash
# Dry run first (see what will be created)
factory run create-dirs --dry-run

# Output shows:
# ✓ Will create: lib/feasibility/
# ✓ Will create: lib/feasibility/transformers/
# ✓ Will create: lib/feasibility/__tests__/
# ... (all directories)

# Execute if satisfied
factory run create-dirs --execute
```

### Manual Directory Creation (Alternative)

```bash
# If Factory CLI not available, use standard mkdir
mkdir -p lib/feasibility/transformers
mkdir -p lib/feasibility/__tests__
mkdir -p app/api/v1/feasibility/check
mkdir -p app/api/v1/feasibility/cache
mkdir -p app/api/v1/admin/network-providers/\[id\]/test
mkdir -p app/api/v1/admin/network-providers/\[id\]/health
mkdir -p app/admin/network-providers/\[id\]
mkdir -p app/admin/network-providers/components
mkdir -p components/feasibility
mkdir -p supabase/migrations
```

---

## 🗄️ DATABASE COMMANDS

### Generate Migration

```bash
factory generate migration \
  --name "add_feasibility_system" \
  --template supabase \
  --spec /mnt/user-data/outputs/Feature_Addition_Spec_MTN_Feasibility_v1.0.md \
  --output supabase/migrations/20251015_add_feasibility_system.sql
```

### Apply Migration

```bash
# Staging
npx supabase db push --project-ref <staging_ref>

# Production (after testing)
npx supabase db push --project-ref <prod_ref>
```

### Verify Database

```bash
# Check extensions
psql $SUPABASE_DB_URL -c \
  "SELECT extname, extversion FROM pg_extension WHERE extname IN ('cube', 'earthdistance', 'postgis');"

# Test spatial functions
psql $SUPABASE_DB_URL -c \
  "SELECT earth_distance(ll_to_earth(-26.2041, 28.0473), ll_to_earth(-26.2050, 28.0480));"
```

---

## 📝 CODE GENERATION COMMANDS

### Generate TypeScript Types

```bash
factory generate types \
  --from-spec /mnt/user-data/outputs/Feature_Addition_Spec_MTN_Feasibility_v1.0.md \
  --output lib/feasibility/types.ts \
  --strict

# Verify types compile
npx tsc --noEmit lib/feasibility/types.ts
```

### Generate Module (Generic)

```bash
# Encryption module
factory generate module \
  --name encryption \
  --template security \
  --output lib/feasibility/encryption.ts \
  --tests

# Rate limiter module
factory generate module \
  --name rate-limiter \
  --template middleware \
  --output lib/feasibility/rate-limiter.ts \
  --tests

# Logger module
factory generate module \
  --name logger \
  --template logging \
  --output lib/feasibility/logger.ts

# Cache manager
factory generate module \
  --name cache-manager \
  --template data-access \
  --output lib/feasibility/cache-manager.ts \
  --tests

# MTN transformer
factory generate module \
  --name mtn-transformer \
  --template api-client \
  --output lib/feasibility/transformers/mtn.ts \
  --tests

# Provider client registry
factory generate module \
  --name provider-client \
  --template registry \
  --output lib/feasibility/provider-client.ts

# Main checker
factory generate module \
  --name checker \
  --template orchestrator \
  --output lib/feasibility/checker.ts \
  --tests
```

---

## 🧪 TEST GENERATION COMMANDS

### Generate Unit Tests

```bash
# For a single file
factory generate tests \
  --for lib/feasibility/encryption.ts \
  --framework jest \
  --output lib/feasibility/__tests__/encryption.test.ts \
  --coverage 80

# For all files in a directory
factory generate tests \
  --for lib/feasibility/*.ts \
  --framework jest \
  --coverage 80

# For specific patterns
factory generate tests \
  --for "lib/feasibility/{encryption,rate-limiter,logger}.ts" \
  --framework jest \
  --coverage 80
```

### Generate Integration Tests

```bash
factory generate tests \
  --for lib/feasibility/checker.ts \
  --type integration \
  --framework jest \
  --with-database
```

### Generate E2E Tests

```bash
factory generate tests \
  --for "app/admin/network-providers/**/*.tsx" \
  --type e2e \
  --framework playwright
```

---

## 🔌 API ROUTE GENERATION

### Generate Next.js API Routes

```bash
# Public feasibility check endpoint
factory generate api-route \
  --method POST \
  --path /api/v1/feasibility/check \
  --handler lib/feasibility/checker.ts:checkAllProviders \
  --rate-limit 20 \
  --output app/api/v1/feasibility/check/route.ts

# Admin: List providers
factory generate api-route \
  --method GET \
  --path /api/v1/admin/network-providers \
  --auth required \
  --role admin \
  --output app/api/v1/admin/network-providers/route.ts

# Admin: Create provider
factory generate api-route \
  --method POST \
  --path /api/v1/admin/network-providers \
  --auth required \
  --role admin \
  --output app/api/v1/admin/network-providers/route.ts

# Admin: Test provider
factory generate api-route \
  --method POST \
  --path /api/v1/admin/network-providers/[id]/test \
  --auth required \
  --role admin \
  --output app/api/v1/admin/network-providers/[id]/test/route.ts
```

---

## 🎨 COMPONENT GENERATION

### Generate React Components

```bash
# Provider dashboard
factory generate component \
  --name ProviderDashboard \
  --type page \
  --framework nextjs \
  --with-api /api/v1/admin/network-providers \
  --output app/admin/network-providers/page.tsx

# Provider card
factory generate component \
  --name ProviderCard \
  --type component \
  --framework nextjs \
  --props "provider:NetworkProvider,onTest:Function,onEdit:Function,onToggle:Function" \
  --output app/admin/network-providers/components/ProviderCard.tsx

# Provider form
factory generate component \
  --name ProviderForm \
  --type form \
  --framework nextjs \
  --with-validation zod \
  --output app/admin/network-providers/components/ProviderForm.tsx

# API test console
factory generate component \
  --name APITestConsole \
  --type component \
  --framework nextjs \
  --output app/admin/network-providers/components/APITestConsole.tsx

# Feasibility checker (public)
factory generate component \
  --name FeasibilityChecker \
  --type component \
  --framework nextjs \
  --with-api /api/v1/feasibility/check \
  --output components/feasibility/FeasibilityChecker.tsx

# Address input
factory generate component \
  --name AddressInput \
  --type input \
  --framework nextjs \
  --with-autocomplete \
  --output components/feasibility/AddressInput.tsx

# Product list
factory generate component \
  --name ProductList \
  --type component \
  --framework nextjs \
  --output components/feasibility/ProductList.tsx
```

---

## 🔍 CODE REVIEW & VALIDATION

### Lint & Format

```bash
# Run ESLint
factory lint --fix lib/feasibility/

# Run Prettier
factory format lib/feasibility/

# TypeScript check
factory type-check lib/feasibility/
```

### Run Tests

```bash
# Run all tests
factory test

# Run specific test suite
factory test lib/feasibility/__tests__/

# Run with coverage
factory test --coverage --threshold 80
```

### Security Audit

```bash
# Check for vulnerabilities
factory audit:security

# Check dependencies
factory audit:dependencies

# Check for secrets in code
factory audit:secrets
```

---

## 📦 BUILD & DEPLOYMENT

### Build for Staging

```bash
# Build Next.js app
factory build --env staging

# Deploy to Vercel staging
factory deploy:staging
```

### Build for Production

```bash
# Build Next.js app
factory build --env production

# Deploy to Vercel production
factory deploy:production
```

### Database Migrations

```bash
# Generate migration diff
factory db:diff

# Apply migrations
factory db:migrate --env staging
factory db:migrate --env production

# Rollback last migration
factory db:rollback
```

---

## 🔧 UTILITY COMMANDS

### Generate Encryption Key

```bash
# Generate 32-byte hex key
factory generate:key --length 32 --format hex

# Output: FEASIBILITY_ENCRYPTION_KEY=abc123...
```

### Generate Seed Data

```bash
# Generate seed data for testing
factory generate:seed \
  --table network_providers \
  --count 3 \
  --output supabase/seed.sql
```

### Generate Documentation

```bash
# Generate API documentation
factory docs:generate --format swagger

# Generate component documentation
factory docs:generate --format storybook
```

---

## 🔄 WORKFLOW AUTOMATION

### Run Complete Workflow

```bash
# Complete implementation workflow for one layer
factory workflow run implement-layer \
  --layer business-logic \
  --spec /mnt/user-data/outputs/Feature_Addition_Spec_MTN_Feasibility_v1.0.md

# Stages:
# 1. Generate code
# 2. Generate tests
# 3. Run linting
# 4. Run tests
# 5. Type check
# 6. Git commit with standard message
```

### Custom Workflow Example

```yaml
# .factory/workflows/implement-feasibility.yml
name: Implement Feasibility Feature
description: Complete implementation workflow for MTN Feasibility integration

steps:
  - name: Validate Environment
    command: factory validate:env
    required_vars:
      - SUPABASE_DB_URL
      - MTN_API_KEY
      - FEASIBILITY_ENCRYPTION_KEY

  - name: Create Directories
    command: factory run create-dirs

  - name: Generate Database Migration
    command: factory generate migration --name add_feasibility_system

  - name: Generate TypeScript Types
    command: factory generate types --from-spec spec.md

  - name: Generate Business Logic
    command: factory generate module --batch business-logic.json

  - name: Generate API Routes
    command: factory generate api-route --batch api-routes.json

  - name: Generate Tests
    command: factory generate tests --for "lib/feasibility/**/*.ts"

  - name: Run Tests
    command: factory test --coverage 80

  - name: Security Audit
    command: factory audit:security

  - name: Build Application
    command: factory build --env staging

  - name: Deploy to Staging
    command: factory deploy:staging

checkpoints:
  - after_step: 5
    description: "Business logic complete"
    approval_required: true

  - after_step: 8
    description: "All tests passing"
    approval_required: true
```

**Run workflow:**
```bash
factory workflow run .factory/workflows/implement-feasibility.yml
```

---

## 🐛 DEBUGGING & TROUBLESHOOTING

### Verbose Mode

```bash
# Enable detailed logging
factory --verbose generate module --name test

# Enable debug mode
factory --debug test
```

### Dry Run Mode

```bash
# See what would be created without actually creating
factory --dry-run generate module --name test
```

### Check Factory Status

```bash
# Show project status
factory status

# Show pending tasks
factory tasks:list

# Show last command output
factory logs:last
```

---

## 📊 MONITORING & ANALYTICS

### Code Quality Metrics

```bash
# Get code quality report
factory metrics:quality

# Get test coverage report
factory metrics:coverage

# Get performance metrics
factory metrics:performance
```

### Deployment Status

```bash
# Check staging deployment status
factory status:staging

# Check production deployment status
factory status:production

# Check database migration status
factory db:status
```

---

## 🔐 SECURITY COMMANDS

### Credential Management

```bash
# Encrypt credentials before storing
factory encrypt:credentials \
  --input credentials.json \
  --output encrypted.txt \
  --key $FEASIBILITY_ENCRYPTION_KEY

# Decrypt credentials
factory decrypt:credentials \
  --input encrypted.txt \
  --output credentials.json \
  --key $FEASIBILITY_ENCRYPTION_KEY
```

### Secrets Management

```bash
# Add secret to environment
factory secrets:add FEASIBILITY_ENCRYPTION_KEY <value>

# List all secrets (names only)
factory secrets:list

# Rotate secret
factory secrets:rotate FEASIBILITY_ENCRYPTION_KEY
```

---

## 🚨 EMERGENCY COMMANDS

### Rollback

```bash
# Rollback last deployment
factory rollback:latest

# Rollback to specific version
factory rollback --version v1.2.3

# Rollback database migration
factory db:rollback --steps 1
```

### Feature Flag Toggle

```bash
# Disable feature immediately
factory feature:toggle feasibility --off

# Enable feature for percentage of users
factory feature:toggle feasibility --on --percentage 10
```

---

## 📖 HELP & DOCUMENTATION

### Get Help

```bash
# General help
factory --help

# Command-specific help
factory generate --help
factory generate module --help

# View examples
factory examples generate module
```

### Update Factory CLI

```bash
# Check for updates
factory update:check

# Update to latest version
factory update

# Update to specific version
factory update --version 2.5.0
```

---

## 🎯 RECOMMENDED COMMAND SEQUENCE

### Day 1: Setup

```bash
# 1. Install & initialize
npm install -g @factory-ai/cli
factory init

# 2. Create directories
factory run create-dirs --execute

# 3. Generate migration
factory generate migration --name add_feasibility_system

# 4. Generate types
factory generate types --from-spec spec.md --output lib/feasibility/types.ts
```

### Week 1: Infrastructure

```bash
# Generate encryption module
factory generate module --name encryption --template security --output lib/feasibility/encryption.ts --tests

# Generate rate limiter
factory generate module --name rate-limiter --template middleware --output lib/feasibility/rate-limiter.ts --tests

# Generate logger
factory generate module --name logger --template logging --output lib/feasibility/logger.ts

# Run tests
factory test lib/feasibility/__tests__/
```

### Week 2: Business Logic

```bash
# Generate cache manager
factory generate module --name cache-manager --template data-access --output lib/feasibility/cache-manager.ts --tests

# Generate MTN transformer
factory generate module --name mtn-transformer --template api-client --output lib/feasibility/transformers/mtn.ts --tests

# Generate main checker
factory generate module --name checker --template orchestrator --output lib/feasibility/checker.ts --tests

# Run all tests
factory test --coverage 80
```

### Week 3-5: API & UI

```bash
# Generate API routes
factory generate api-route --batch api-routes.json

# Generate admin components
factory generate component --batch admin-components.json

# Generate public components
factory generate component --batch public-components.json

# Run E2E tests
factory test:e2e
```

### Week 6-7: Deploy

```bash
# Build & deploy staging
factory build --env staging
factory deploy:staging

# Run smoke tests
factory test:smoke --env staging

# Deploy production
factory build --env production
factory deploy:production

# Monitor
factory monitor --env production
```

---

## 💡 PRO TIPS

### Use Batch Files for Repetitive Tasks

Create `batch-generate-modules.json`:

```json
{
  "modules": [
    {
      "name": "encryption",
      "template": "security",
      "output": "lib/feasibility/encryption.ts",
      "tests": true
    },
    {
      "name": "rate-limiter",
      "template": "middleware",
      "output": "lib/feasibility/rate-limiter.ts",
      "tests": true
    }
  ]
}
```

Run: `factory generate module --batch batch-generate-modules.json`

### Create Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias fgen="factory generate"
alias ftest="factory test --coverage 80"
alias fdeploy-staging="factory build --env staging && factory deploy:staging"
alias fdeploy-prod="factory build --env production && factory deploy:production"
```

### Use Environment-Specific Configs

```bash
# .factory/config.staging.yml
# .factory/config.production.yml

# Run with specific config
factory --config .factory/config.staging.yml build
```

---

**END OF FACTORY DROID CLI REFERENCE**

**Total Commands:** 100+  
**Categories:** 12  
**Use Cases Covered:** Setup, Generation, Testing, Deployment, Monitoring, Security

**Quick Start:** Run `factory init` and follow the prompts!