# CircleTel Environment Variables Guide

**Last Updated**: 2025-11-02
**Purpose**: Complete reference for environment variables across staging and production environments

---

## Overview

CircleTel uses different environment variables for staging and production to ensure proper isolation and testing. This guide documents all required and optional variables for each environment.

---

## Environment Configuration Matrix

| Variable | Staging | Production | Required | Notes |
|----------|---------|------------|----------|-------|
| `NEXT_PUBLIC_APP_ENV` | `staging` | `production` | ✅ | Environment identifier |
| `NEXT_PUBLIC_APP_URL` | `https://circletel-staging.vercel.app` | `https://circletel.co.za` | ✅ | Base URL for app |

---

## 1. Core Application Variables

### 1.1 Environment Identifiers

**Staging**:
```bash
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://circletel-staging.vercel.app
```

**Production**:
```bash
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://circletel.co.za
```

---

## 2. Database - Supabase

**Required**: ✅ Yes
**Same for both environments**: ✅ Yes

```bash
# Supabase Project: agyjovdugmtopasyvlng
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

**Notes**:
- Both staging and production use the same Supabase project
- Row Level Security (RLS) policies isolate data by environment
- Service role key should be kept secure (server-side only)

---

## 3. Payment Gateway - NetCash Pay Now

**Required**: ✅ Yes
**Different for environments**: ⚠️ Yes (use test keys in staging)

### Staging (Test Mode)
```bash
NETCASH_SERVICE_KEY=<test_service_key>
NETCASH_MERCHANT_ID=<test_merchant_id>
NETCASH_ACCOUNT_SERVICE_KEY=<test_account_key>
NETCASH_WEBHOOK_SECRET=<test_webhook_secret>
```

### Production
```bash
NETCASH_SERVICE_KEY=<production_service_key>
NETCASH_MERCHANT_ID=52340889417
NETCASH_ACCOUNT_SERVICE_KEY=<production_account_key>
NETCASH_WEBHOOK_SECRET=<production_webhook_secret>
```

**Important**:
- **DO NOT** use production NetCash keys in staging
- Test transactions in staging should use NetCash test environment
- Webhook URLs must be configured in NetCash dashboard

---

## 4. Google Maps API

**Required**: ✅ Yes
**Same for both environments**: ✅ Yes

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<api_key>
```

**Notes**:
- Used for address autocomplete and geocoding
- API key restrictions should allow both staging and production domains
- Monitor API usage in Google Cloud Console

---

## 5. Email Service - Resend

**Required**: ✅ Yes
**Same for both environments**: ⚠️ Can be same, but consider separate for testing

### Staging
```bash
RESEND_API_KEY=<staging_api_key>
RESEND_FROM_EMAIL=noreply@staging.notifications.circletelsa.co.za
```

### Production
```bash
RESEND_API_KEY=<production_api_key>
RESEND_FROM_EMAIL=noreply@notifications.circletelsa.co.za
```

**Notes**:
- Staging can use a different sender domain to avoid customer confusion
- Monitor email delivery rates in Resend dashboard

---

## 6. CMS - Strapi (Optional)

**Required**: ❌ No (optional marketing content)
**Same for both environments**: ✅ Yes

```bash
NEXT_PUBLIC_STRAPI_URL=https://glorious-bat-56764aaa7c.strapiapp.com
STRAPI_API_TOKEN=
```

**Notes**:
- Empty `STRAPI_API_TOKEN` means using public permissions
- Both environments can use the same Strapi instance
- Content is managed centrally for marketing pages

---

## 7. B2B Workflow - Didit KYC

**Required**: ⚠️ Yes (for B2B onboarding)
**Different for environments**: ✅ Yes

### Staging (Sandbox)
```bash
NEXT_PUBLIC_DIDIT_API_KEY=<sandbox_api_key>
NEXT_PUBLIC_DIDIT_ENVIRONMENT=sandbox
DIDIT_WEBHOOK_SECRET=<sandbox_webhook_secret>
```

### Production
```bash
NEXT_PUBLIC_DIDIT_API_KEY=<production_api_key>
NEXT_PUBLIC_DIDIT_ENVIRONMENT=production
DIDIT_WEBHOOK_SECRET=<production_webhook_secret>
```

**Important**:
- Sandbox uses test ID documents and doesn't perform real KYC
- Production performs actual FICA-compliant verification
- Webhook endpoints must be configured in Didit dashboard

---

## 8. B2B Workflow - Zoho CRM & Sign

**Required**: ⚠️ Yes (for B2B workflow)
**Different for environments**: ⚠️ OAuth tokens are environment-specific

### Both Environments (OAuth Credentials)
```bash
ZOHO_CLIENT_ID=<client_id>
ZOHO_CLIENT_SECRET=<client_secret>
ZOHO_REDIRECT_URI=https://circletel.co.za/api/zoho/callback
```

### Staging (OAuth Tokens)
```bash
ZOHO_REFRESH_TOKEN=<staging_refresh_token>
ZOHO_ACCESS_TOKEN=<staging_access_token>
ZOHO_WEBHOOK_SECRET=<staging_webhook_secret>
```

### Production (OAuth Tokens)
```bash
ZOHO_REFRESH_TOKEN=<production_refresh_token>
ZOHO_ACCESS_TOKEN=<production_access_token>
ZOHO_WEBHOOK_SECRET=<production_webhook_secret>
```

**Notes**:
- Refresh tokens must be generated per environment
- Access tokens are refreshed automatically by the app
- Webhook secrets should be unique per environment

---

## 9. B2B Workflow - ICASA RICA

**Required**: ⚠️ Yes (for service activation)
**Different for environments**: ✅ Yes

### Staging (Test Mode)
```bash
NEXT_PUBLIC_ICASA_API_KEY=<test_api_key>
NEXT_PUBLIC_ICASA_ENVIRONMENT=test
ICASA_CALLBACK_SECRET=<test_callback_secret>
```

### Production
```bash
NEXT_PUBLIC_ICASA_API_KEY=<production_api_key>
NEXT_PUBLIC_ICASA_ENVIRONMENT=production
ICASA_CALLBACK_SECRET=<production_callback_secret>
```

**Important**:
- Test environment does NOT submit to real ICASA database
- Production submissions are legally binding
- Store RICA tracking IDs for compliance

---

## 10. AI/Anthropic (Optional)

**Required**: ❌ No (optional agent features)
**Same for both environments**: ✅ Yes

```bash
ANTHROPIC_API_KEY=<api_key>
```

**Notes**:
- Used for Agent-OS features and AI-powered tools
- Can use the same key for both environments
- Monitor API usage in Anthropic console

---

## Configuration Checklist

### For Staging Deployment

- [ ] Set `NEXT_PUBLIC_APP_ENV=staging`
- [ ] Set `NEXT_PUBLIC_APP_URL=https://circletel-staging.vercel.app`
- [ ] Configure Supabase credentials
- [ ] Use **NetCash TEST** credentials
- [ ] Set `NEXT_PUBLIC_DIDIT_ENVIRONMENT=sandbox`
- [ ] Set `NEXT_PUBLIC_ICASA_ENVIRONMENT=test`
- [ ] Generate Zoho staging OAuth tokens
- [ ] Configure staging webhook URLs in external services
- [ ] Test email delivery with staging sender

### For Production Deployment

- [ ] Set `NEXT_PUBLIC_APP_ENV=production`
- [ ] Set `NEXT_PUBLIC_APP_URL=https://circletel.co.za`
- [ ] Configure Supabase credentials (same as staging)
- [ ] Use **NetCash PRODUCTION** credentials
- [ ] Set `NEXT_PUBLIC_DIDIT_ENVIRONMENT=production`
- [ ] Set `NEXT_PUBLIC_ICASA_ENVIRONMENT=production`
- [ ] Generate Zoho production OAuth tokens
- [ ] Configure production webhook URLs in external services
- [ ] Test email delivery with production sender
- [ ] Verify custom domain DNS settings

---

## Webhook URLs Reference

Configure these webhook URLs in external service dashboards:

### Staging
```
NetCash:   https://circletel-staging.vercel.app/api/payments/webhook
Didit:     https://circletel-staging.vercel.app/api/integrations/didit/webhook
Zoho CRM:  https://circletel-staging.vercel.app/api/integrations/zoho/crm/webhook
Zoho Sign: https://circletel-staging.vercel.app/api/integrations/zoho/sign/webhook
```

### Production
```
NetCash:   https://circletel.co.za/api/payments/webhook
Didit:     https://circletel.co.za/api/integrations/didit/webhook
Zoho CRM:  https://circletel.co.za/api/integrations/zoho/crm/webhook
Zoho Sign: https://circletel.co.za/api/integrations/zoho/sign/webhook
```

---

## Security Best Practices

1. **Never commit `.env` files to git**
   - Already in `.gitignore`
   - Use Vercel dashboard for environment variables

2. **Rotate webhook secrets regularly**
   - Change secrets every 90 days
   - Update in both Vercel and external service dashboards

3. **Use Vercel's environment variable encryption**
   - All variables encrypted at rest
   - Access logs available in Vercel dashboard

4. **Separate test and production credentials**
   - Use test keys in staging to avoid real charges
   - Never use production credentials in development

5. **Monitor API key usage**
   - Set up alerts for unusual activity
   - Review usage monthly in service dashboards

---

## Troubleshooting

### Environment Variable Not Loading

**Symptom**: `process.env.VARIABLE_NAME` returns `undefined`

**Solutions**:
1. Verify variable is set in Vercel dashboard
2. Check variable name matches exactly (case-sensitive)
3. Public variables must start with `NEXT_PUBLIC_`
4. Redeploy after adding new variables

### Webhook Not Received

**Symptom**: Webhook endpoint returns 200 but handler not executing

**Solutions**:
1. Verify webhook URL is correct in external service
2. Check webhook secret matches
3. Review Vercel function logs for errors
4. Ensure webhook endpoint is deployed (not in preview)

### OAuth Token Expired

**Symptom**: Zoho API calls return 401 Unauthorized

**Solutions**:
1. Refresh token may have expired
2. Generate new refresh token via OAuth flow
3. Update `ZOHO_REFRESH_TOKEN` in Vercel
4. Redeploy application

---

## Reference

- **Vercel Environment Variables**: https://vercel.com/docs/environment-variables
- **Next.js Environment Variables**: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- **Security Guide**: `docs/deployment/WEBHOOK_CONFIGURATION_GUIDE.md`
- **Full Deployment Checklist**: `docs/deployment/B2B_WORKFLOW_DEPLOYMENT_CHECKLIST.md`

---

**Maintained By**: Development Team + Claude Code
**Last Reviewed**: 2025-11-02
