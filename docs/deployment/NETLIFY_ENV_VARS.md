# Netlify Environment Variables - CircleTel

**Date**: 2025-10-20
**Status**: ✅ READY - Complete list with NEW Supabase key format

---

## Required Environment Variables

Copy and paste these into Netlify Dashboard (`Site settings` → `Environment variables`):

### Supabase (Critical - NEW Format)
```
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7
SUPABASE_SERVICE_ROLE_KEY=sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG
SUPABASE_DB_PASSWORD=3BVHkEN4AD4sQQRz
```

### Google Maps (Required for coverage checker)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC-kOFKZqhhmLXgEjXV7upYs_l1s_h3VzU
```

### Email Service (Resend)
```
RESEND_API_KEY=re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM
RESEND_FROM_EMAIL=orders@circletel.co.za
RESEND_REPLY_TO_EMAIL=support@circletel.co.za
```

### Application URLs
```
NEXT_PUBLIC_APP_URL=https://circletel-staging.netlify.app
NEXT_PUBLIC_APP_ENV=production
```

### Payment Gateway (Netcash - Sandbox)
```
NEXT_PUBLIC_NETCASH_SERVICE_KEY=7928c6de-219f-4b75-9408-ea0e53be8c87
NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY=3143ee79-0c96-4909-968e-5a716fd19a65
NETCASH_MERCHANT_ID=52340889417
NETCASH_WEBHOOK_SECRET=6148290802cdc682c39e4a76b4effddc56ed431d25257d8bc692f05b698bea74
NETCASH_PAYMENT_URL=https://sandbox.netcash.co.za/paynow/process
```

### Email Notifications
```
CIRCLETEL_DOMAIN=notifications.circletelsa.co.za
LEGAL_EMAIL=legal@notifications.circletelsa.co.za
SALES_EMAIL=sales@notifications.circletelsa.co.za
PARTNERS_EMAIL=partners@notifications.circletelsa.co.za
SUPPORT_EMAIL=support@notifications.circletelsa.co.za
UNJANI_TEAM_EMAILS=unjani-team@notifications.circletelsa.co.za,rollout@notifications.circletelsa.co.za
UNJANI_SUPPORT_EMAIL=unjaniclinic@circletel.co.za
```

### JWT Configuration
```
JWT_KEY_ID=75474cb4-8353-4a20-9375-9ce97b8aac64
JWT_DISCOVERY_URL=https://agyjovdugmtopasyvlng.supabase.co/auth/v1/.well-known/jwks.json
JWT_PUBLIC_KEY_X=r9zbtOFwGqadhcuoNngj1Y5eYrTJtSSBbtoFs3DTZu4
JWT_PUBLIC_KEY_Y=G-zzCFbnrq_uICB33nnJmRXloLqnrFQwCc2Nf5VU3V8
JWT_ALGORITHM=ES256
JWT_CURVE=P-256
JWT_KEY_TYPE=EC
```

### Build Configuration
```
NODE_ENV=production
NX_DAEMON=false
```

### MTN Coverage (Optional - for testing)
```
MTN_TEST_MODE=true
MTN_SESSION=eyJjb29raWVzIjpbeyJuYW1lIjoiX0dSRUNBUFRDSEEiLCJ2YWx1ZSI6IjA5QUc3Ynp2SGZZc3N5aDI1QTY4M0t3dWJaMTR4QVdNcTlsR0F1dk5WX2w4WFNxV1JHTUxRNTdYS0FLSHdZUlJLSDFKSzhPZm5iSDBPXzB4amF1NEQ5V1FFIiwiZG9tYWluIjoid3d3Lmdvb2dsZS5jb20iLCJwYXRoIjoiL3JlY2FwdGNoYSIsImV4cGlyZXMiOjE3NzYyNDc1OTguMTM2OTg4LCJodHRwT25seSI6dHJ1ZSwic2VjdXJlIjp0cnVlLCJzYW1lU2l0ZSI6Ik5vbmUifSx7Im5hbWUiOiJKU0VTU0lPTklEIiwidmFsdWUiOiJDOTdBNUFDOTlBMzI3NUQ3QkMyMzRFMUM1QTQzMzAzRCIsImRvbWFpbiI6InNzby5tdG5idXNpbmVzcy5jby56YSIsInBhdGgiOiIvIiwiZXhwaXJlcyI6LTEsImh0dHBPbmx5Ijp0cnVlLCJzZWN1cmUiOnRydWUsInNhbWVTaXRlIjoiTGF4In0seyJuYW1lIjoiQ0FTVEdDIiwidmFsdWUiOiJUR1QtNzAwLVdXZkNoRTdBU1IwM1ZGZWN6dUZGNHZjNmh1dGd0Z3ZBTTZvUUtVRDFYZGVEN1gyU0llLXNvaGNoN0FlIiwiZG9tYWluIjoic3NvLm10bmJ1c2luZXNzLmNvLnphIiwicGF0aCI6Ii8iLCJleHBpcmVzIjotMSwiaHR0cE9ubHkiOmZhbHNlLCJzZWN1cmUiOnRydWUsInNhbWVTaXRlIjoiTGF4In0seyJuYW1lIjoiSlNFU1NJT05JRCIsInZhbHVlIjoiODcyOEYwQ0I0MEQxODQzNjhDNDk5NDBGMTY5OTA0QkQiLCJkb21haW4iOiJhc3AtZmVhc2liaWxpdHkubXRuYnVzaW5lc3MuY28uemEiLCJwYXRoIjoiLyIsImV4cGlyZXMiOi0xLCJodHRwT25seSI6dHJ1ZSwic2VjdXJlIjp0cnVlLCJzYW1lU2l0ZSI6IkxheCJ9XSwic2Vzc2lvbklkIjoiQzk3QTVBQzk5QTMyNzVEN0JDMjM0RTFDNUE0MzMwM0QiLCJleHBpcmVzQXQiOiIyMDI1LTEwLTE3VDExOjA2OjU3LjA0OVoifQ==
```

### Zoho Integration (Optional)
```
ZOHO_MCP_URL=https://circletel-zoho-900485550.zohomcp.com/mcp/message
ZOHO_MCP_KEY=e2f4039d67d5fb236177fbce811a0ff0
ZOHO_ORGANIZATION_ID=882144792
```

### Google OAuth (Optional - if using Google sign-in)
```
GOOGLE_CLIENT_ID=686548425863-enjs9uf5tstcs04o5o5lhbdlo7kvdi9l.app
GOOGLE_CLIENT_SECRET=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
```

---

## How to Add to Netlify

### Via Dashboard (Easiest)
1. Go to: https://app.netlify.com/sites/YOUR-SITE/settings/deploys#environment
2. Scroll to "Environment variables"
3. Click "Add a variable"
4. Paste each `KEY=VALUE` pair above
5. Click "Save"

### Via Netlify CLI
```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://agyjovdugmtopasyvlng.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7"
netlify env:set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY "sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG"
netlify env:set SUPABASE_DB_PASSWORD "3BVHkEN4AD4sQQRz"
netlify env:set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY "AIzaSyC-kOFKZqhhmLXgEjXV7upYs_l1s_h3VzU"
netlify env:set RESEND_API_KEY "re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM"
# ... (continue for all variables)
```

---

## Verification After Adding

After adding all variables, verify with:
```bash
netlify env:list
```

You should see all variables listed above.

---

## Build Test

Once variables are added, trigger a deployment:
```bash
netlify deploy --prod
```

Or wait for automatic deployment from Git push.

---

**Created**: 2025-10-20
**Updated**: 2025-10-20 (NEW Supabase key format)
**Status**: ✅ COMPLETE - All environment variables documented
