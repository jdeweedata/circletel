# Netlify Environment Variables Setup Script
# This script adds all required environment variables to your Netlify project
# Run after: netlify link --id af81b4b6-db92-4c6f-a838-aa0b06c07d3c

Write-Host "Adding environment variables to Netlify..." -ForegroundColor Cyan

# Supabase (Critical)
Write-Host "`n[1/50] Supabase Configuration..." -ForegroundColor Yellow
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://agyjovdugmtopasyvlng.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7"
netlify env:set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY "sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG"
netlify env:set SUPABASE_DB_PASSWORD "3BVHkEN4AD4sQQRz"

# Google Maps
Write-Host "`n[6/50] Google Maps..." -ForegroundColor Yellow
netlify env:set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY "AIzaSyC-kOFKZqhhmLXgEjXV7upYs_l1s_h3VzU"

# Email Service (Resend)
Write-Host "`n[7/50] Resend Email..." -ForegroundColor Yellow
netlify env:set RESEND_API_KEY "re_QhMu7F2n_JycLfeqNt8RNA692iWYcT6tM"
netlify env:set RESEND_FROM_EMAIL "orders@circletel.co.za"
netlify env:set RESEND_REPLY_TO_EMAIL "support@circletel.co.za"

# Application URLs
Write-Host "`n[10/50] Application URLs..." -ForegroundColor Yellow
netlify env:set NEXT_PUBLIC_APP_URL "https://circletel-staging.netlify.app"
netlify env:set NEXT_PUBLIC_APP_ENV "production"

# Payment Gateway (Netcash)
Write-Host "`n[12/50] Netcash Payment Gateway..." -ForegroundColor Yellow
netlify env:set NEXT_PUBLIC_NETCASH_SERVICE_KEY "7928c6de-219f-4b75-9408-ea0e53be8c87"
netlify env:set NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY "3143ee79-0c96-4909-968e-5a716fd19a65"
netlify env:set NETCASH_MERCHANT_ID "52340889417"
netlify env:set NETCASH_WEBHOOK_SECRET "6148290802cdc682c39e4a76b4effddc56ed431d25257d8bc692f05b698bea74"
netlify env:set NETCASH_PAYMENT_URL "https://sandbox.netcash.co.za/paynow/process"
netlify env:set NEXT_PUBLIC_PAYMENT_SUCCESS_URL "https://circletel-staging.netlify.app/order/confirmation"
netlify env:set NEXT_PUBLIC_PAYMENT_CANCEL_URL "https://circletel-staging.netlify.app/order/payment"

# Email Notifications
Write-Host "`n[19/50] Email Notifications..." -ForegroundColor Yellow
netlify env:set CIRCLETEL_DOMAIN "notifications.circletelsa.co.za"
netlify env:set LEGAL_EMAIL "legal@notifications.circletelsa.co.za"
netlify env:set SALES_EMAIL "sales@notifications.circletelsa.co.za"
netlify env:set PARTNERS_EMAIL "partners@notifications.circletelsa.co.za"
netlify env:set SUPPORT_EMAIL "support@notifications.circletelsa.co.za"
netlify env:set UNJANI_TEAM_EMAILS "unjani-team@notifications.circletelsa.co.za,rollout@notifications.circletelsa.co.za"
netlify env:set UNJANI_SUPPORT_EMAIL "unjaniclinic@circletel.co.za"

# JWT Configuration
Write-Host "`n[26/50] JWT Configuration..." -ForegroundColor Yellow
netlify env:set JWT_KEY_ID "75474cb4-8353-4a20-9375-9ce97b8aac64"
netlify env:set JWT_DISCOVERY_URL "https://agyjovdugmtopasyvlng.supabase.co/auth/v1/.well-known/jwks.json"
netlify env:set JWT_PUBLIC_KEY_X "r9zbtOFwGqadhcuoNngj1Y5eYrTJtSSBbtoFs3DTZu4"
netlify env:set JWT_PUBLIC_KEY_Y "G-zzCFbnrq_uICB33nnJmRXloLqnrFQwCc2Nf5VU3V8"
netlify env:set JWT_ALGORITHM "ES256"
netlify env:set JWT_CURVE "P-256"
netlify env:set JWT_KEY_TYPE "EC"

# Build Configuration
Write-Host "`n[33/50] Build Configuration..." -ForegroundColor Yellow
netlify env:set NODE_ENV "production"
netlify env:set NX_DAEMON "false"

# MTN Coverage (Critical for coverage checker!)
Write-Host "`n[35/50] MTN Coverage API..." -ForegroundColor Yellow
netlify env:set MTN_TEST_MODE "true"
netlify env:set MTN_SESSION "eyJjb29raWVzIjpbeyJuYW1lIjoiX0dSRUNBUFRDSEEiLCJ2YWx1ZSI6IjA5QUc3Ynp2SGZZc3N5aDI1QTY4M0t3dWJaMTR4QVdNcTlsR0F1dk5WX2w4WFNxV1JHTUxRNTdYS0FLSHdZUlJLSDFKSzhPZm5iSDBPXzB4amF1NEQ5V1FFIiwiZG9tYWluIjoid3d3Lmdvb2dsZS5jb20iLCJwYXRoIjoiL3JlY2FwdGNoYSIsImV4cGlyZXMiOjE3NzYyNDc1OTguMTM2OTg4LCJodHRwT25seSI6dHJ1ZSwic2VjdXJlIjp0cnVlLCJzYW1lU2l0ZSI6Ik5vbmUifSx7Im5hbWUiOiJKU0VTU0lPTklEIiwidmFsdWUiOiJDOTdBNUFDOTlBMzI3NUQ3QkMyMzRFMUM1QTQzMzAzRCIsImRvbWFpbiI6InNzby5tdG5idXNpbmVzcy5jby56YSIsInBhdGgiOiIvIiwiZXhwaXJlcyI6LTEsImh0dHBPbmx5Ijp0cnVlLCJzZWN1cmUiOnRydWUsInNhbWVTaXRlIjoiTGF4In0seyJuYW1lIjoiQ0FTVEdDIiwidmFsdWUiOiJUR1QtNzAwLVdXZkNoRTdBU1IwM1ZGZWN6dUZGNHZjNmh1dGd0Z3ZBTTZvUUtVRDFYZGVEN1gyU0llLXNvaGNoN0FlIiwiZG9tYWluIjoic3NvLm10bmJ1c2luZXNzLmNvLnphIiwicGF0aCI6Ii8iLCJleHBpcmVzIjotMSwiaHR0cE9ubHkiOmZhbHNlLCJzZWN1cmUiOnRydWUsInNhbWVTaXRlIjoiTGF4In0seyJuYW1lIjoiSlNFU1NJT05JRCIsInZhbHVlIjoiODcyOEYwQ0I0MEQxODQzNjhDNDk5NDBGMTY5OTA0QkQiLCJkb21haW4iOiJhc3AtZmVhc2liaWxpdHkubXRuYnVzaW5lc3MuY28uemEiLCJwYXRoIjoiLyIsImV4cGlyZXMiOi0xLCJodHRwT25seSI6dHJ1ZSwic2VjdXJlIjp0cnVlLCJzYW1lU2l0ZSI6IkxheCJ9XSwic2Vzc2lvbklkIjoiQzk3QTVBQzk5QTMyNzVEN0JDMjM0RTFDNUE0MzMwM0QiLCJleHBpcmVzQXQiOiIyMDI1LTEwLTE3VDExOjA2OjU3LjA0OVoifQ=="

# Zoho Integration (Optional)
Write-Host "`n[37/50] Zoho CRM..." -ForegroundColor Yellow
netlify env:set ZOHO_MCP_URL "https://circletel-zoho-900485550.zohomcp.com/mcp/message"
netlify env:set ZOHO_MCP_KEY "e2f4039d67d5fb236177fbce811a0ff0"
netlify env:set ZOHO_ORGANIZATION_ID "882144792"

# Google OAuth (Optional)
Write-Host "`n[40/50] Google OAuth..." -ForegroundColor Yellow
netlify env:set GOOGLE_CLIENT_ID "686548425863-enjs9uf5tstcs04o5o5lhbdlo7kvdi9l.app"
netlify env:set GOOGLE_CLIENT_SECRET "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"

# Strapi CMS (Optional - fallback to demo mode if not set)
Write-Host "`n[42/50] Strapi CMS (Optional)..." -ForegroundColor Yellow
netlify env:set NEXT_PUBLIC_STRAPI_URL "http://localhost:1337"
netlify env:set STRAPI_API_TOKEN ""

# Additional Configuration (Optional - add manually if needed)
Write-Host "`n[44/50] Additional Configuration (skipped - add manually if needed)..." -ForegroundColor Yellow
# netlify env:set SUPABASE_ACCESS_TOKEN "<your-supabase-access-token>"
# netlify env:set GITHUB_PERSONAL_ACCESS_TOKEN "<your-github-pat>"

# Turbo Configuration
Write-Host "`n[46/50] Turbo Build Configuration..." -ForegroundColor Yellow
netlify env:set TURBO_CACHE "remote:rw"
netlify env:set TURBO_DOWNLOAD_LOCAL_ENABLED "true"
netlify env:set TURBO_REMOTE_ONLY "true"
netlify env:set TURBO_RUN_SUMMARY "true"

Write-Host "`n✅ All environment variables added successfully!" -ForegroundColor Green
Write-Host "Next step: Deploy with 'netlify deploy --prod'" -ForegroundColor Cyan
