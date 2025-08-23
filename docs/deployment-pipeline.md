# CircleTel Development & Deployment Pipeline

Your complete three-tier deployment structure is now operational! 🎉

## Architecture Overview

```
Local Development → Staging (dev branch) → Production (main branch)
        ↓                    ↓                      ↓
   Local Supabase     Staging Supabase      Production Supabase
                      (agyjovdugmtopasyvlng)  (mnuttdoooolucscjehwi)
```

## Active Deployments

- **Production**: `circletel.vercel.app` (main branch)
- **Staging**: `circletel-stagging-ewqg4309n-jdewee-livecoms-projects.vercel.app` (dev branch)
- **Feature Previews**: Auto-generated for each feature branch

## Safe Development Workflow

Now you can safely add features without any risk to production:

### 1. **Start a New Feature**
```bash
# Always start from dev
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/new-feature-name

# Work on your feature locally
npm run dev
```

### 2. **Test in Staging**
```bash
# Push your feature branch
git push -u origin feature/new-feature-name
# Creates preview: circletel-stagging-git-feature-xxx.vercel.app

# After testing, merge to dev
git checkout dev
git merge feature/new-feature-name
git push origin dev
# Deploys to staging environment
```

### 3. **Deploy to Production**
```bash
# After staging validation
git checkout main
git pull origin main
git merge dev
git push origin main
# Deploys to production
```

## Environment Configuration

### Supabase Projects

| Environment | Project ID | URL | Database |
|------------|------------|-----|----------|
| Production | mnuttdoooolucscjehwi | https://mnuttdoooolucscjehwi.supabase.co | Production DB |
| Staging | agyjovdugmtopasyvlng | https://agyjovdugmtopasyvlng.supabase.co | Staging DB |
| Local | agyjovdugmtopasyvlng | http://127.0.0.1:54321 | Local Supabase |

### Environment Variables

**Production (.env.production):**
```env
VITE_SUPABASE_URL=https://mnuttdoooolucscjehwi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udXR0ZG9vb29sdWNzY2plaHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NDE3NTQsImV4cCI6MjA2MDAxNzc1NH0.Jped-RY63pMIXL3gLb9acw3pV2MTxfHGp4INHy8qMwU
VITE_ENV=production
```

**Staging (.env.staging):**
```env
VITE_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFneWpvdmR1Z210b3Bhc3l2bG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjg0MzYsImV4cCI6MjA1NzY0NDQzNn0.tEGMZGJLGJetMDf-0aCL9gfPelj347LMNpWrt4HOLXU
VITE_ENV=staging
```

**Local Development (.env.local):**
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENV=development
```

## What You Can Do Now

### Safe to Experiment With:
- ✅ Add new features in feature branches
- ✅ Test database changes in staging
- ✅ Try risky experiments in dev branch
- ✅ Test integrations with external APIs
- ✅ Refactor code without production risk

### Your Safety Net:
- Staging database is completely separate from production
- Every change goes through staging first
- Easy rollback if anything goes wrong
- Preview deployments for every branch

## Quick Reference

| Environment | Branch | URL | Supabase Project |
|------------|--------|-----|------------------|
| Production | main | circletel.vercel.app | mnuttdoooolucscjehwi |
| Staging | dev | circletel-stagging-*.vercel.app | agyjovdugmtopasyvlng |
| Local | feature/* | localhost:5173 | agyjovdugmtopasyvlng |

## Vercel Configuration

### Projects
- **Production**: `circletel` (main Vercel project)
- **Staging**: `circletel-stagging` (staging Vercel project)

### Environment Variables in Vercel
Both projects have their respective Supabase credentials configured as environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENV`

## Recommended Next Steps

1. **Test the staging environment** - Visit your staging URL and verify it's using the staging database
2. **Create your first feature branch** and watch the automated deployment
3. **Set up branch protection** on GitHub for main branch (require PR reviews)
4. **Add a staging banner** to visually distinguish staging from production:

```tsx
// In your app layout or header
{import.meta.env.VITE_SUPABASE_URL?.includes('agyjovdugmtopasyvlng') && (
  <div className="bg-yellow-500 text-black text-center py-1">
    STAGING ENVIRONMENT
  </div>
)}
```

## Troubleshooting

### Common Issues
1. **Deployment fails**: Check vercel.json syntax
2. **Environment variables not loading**: Verify they're set in Vercel dashboard
3. **Database connection issues**: Confirm Supabase project URLs are correct

### Useful Commands
```bash
# Check deployment status
vercel ls

# Deploy to staging
vercel --prod=false

# View deployment logs
vercel logs [deployment-url]

# Check environment variables
vercel env ls
```

---

Your development workflow is now professional-grade with zero risk to your production environment! 🚀