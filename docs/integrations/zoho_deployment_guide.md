# Zoho MCP Integration Deployment Guide

## Overview
This guide covers the deployment of the Zoho MCP (Model Context Protocol) integration for CircleTel's business automation workflows. The integration connects the CircleTel website to Zoho One applications including Desk, CRM, Books, Mail, and Cliq.

## Prerequisites
- Supabase CLI installed and authenticated
- Access to CircleTel Supabase project (`agyjovdugmtopasyvlng`)
- Zoho MCP server credentials:
  - **URL**: `https://circletel-zoho-900485550.zohomcp.com/mcp/message`
  - **API Key**: `e2f4039d67d5fb236177fbce811a0ff0`
  - **Organization ID**: `900485550`

## Step 1: Deploy the Edge Function

### Using Supabase CLI
```bash
# Set your access token (use the secret key provided)
export SUPABASE_ACCESS_TOKEN=sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG

# Deploy the zoho-integration function
supabase functions deploy zoho-integration --project-ref agyjovdugmtopasyvlng

# Verify deployment
supabase functions list --project-ref agyjovdugmtopasyvlng
```

### Alternative: Deploy via Supabase Dashboard
1. Go to Supabase Dashboard → Functions
2. Create new function named `zoho-integration`
3. Copy contents from `supabase/functions/zoho-integration/index.ts`
4. Also copy `supabase/functions/_shared/cors.ts` if not already present

## Step 2: Set Environment Variables

### In Supabase Dashboard
1. Go to Project Settings → Edge Functions
2. Add the following environment variables:

```env
ZOHO_MCP_URL=https://circletel-zoho-900485550.zohomcp.com/mcp/message
ZOHO_MCP_KEY=e2f4039d67d5fb236177fbce811a0ff0
ZOHO_ORG_ID=900485550
```

### Using Supabase CLI
```bash
supabase secrets set ZOHO_MCP_URL=https://circletel-zoho-900485550.zohomcp.com/mcp/message --project-ref agyjovdugmtopasyvlng
supabase secrets set ZOHO_MCP_KEY=e2f4039d67d5fb236177fbce811a0ff0 --project-ref agyjovdugmtopasyvlng
supabase secrets set ZOHO_ORG_ID=900485550 --project-ref agyjovdugmtopasyvlng
```

## Step 3: Test the Integration

### Test Support Ticket Creation
```bash
curl -X POST https://agyjovdugmtopasyvlng.supabase.co/functions/v1/zoho-integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "action": "create_support_ticket",
    "data": {
      "subject": "Test Ticket from API",
      "description": "Testing Zoho MCP integration",
      "email": "test@circletel.co.za",
      "phone": "+27123456789",
      "serviceType": "skyfibre",
      "priority": "Medium"
    }
  }'
```

### Test Lead Creation from Coverage Check
```bash
curl -X POST https://agyjovdugmtopasyvlng.supabase.co/functions/v1/zoho-integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "action": "coverage_check",
    "data": {
      "email": "prospect@example.com",
      "phone": "+27123456789",
      "address": "123 Test Street, Cape Town",
      "hasConcentration": true,
      "availableServices": ["SkyFibre", "IT Services"],
      "requestedServices": ["SkyFibre"]
    }
  }'
```

### Test Order Processing
```bash
curl -X POST https://agyjovdugmtopasyvlng.supabase.co/functions/v1/zoho-integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "action": "process_order",
    "data": {
      "customer": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+27123456789",
        "company": "Test Company"
      },
      "services": [
        {
          "name": "SkyFibre 100Mbps",
          "description": "High-speed wireless internet",
          "price": 899,
          "quantity": 1
        }
      ],
      "orderData": {
        "orderId": "CT-2024-001",
        "totalAmount": 899,
        "bundleType": "wireless",
        "customerTier": "Standard"
      },
      "billingInfo": {
        "paymentTerms": 30
      }
    }
  }'
```

## Step 4: Verify Integration Points

### Frontend Components Using Integration
1. **QuickActions Form** (`src/components/contact/QuickActions.tsx`) - Creates support tickets
2. **Coverage Check Modal** (`src/components/coverage/CoverageResultModal.tsx`) - Creates leads
3. **Contact Forms** - General ticket creation

### Service Layer
- **ZohoIntegrationService** (`src/services/zohoIntegration.ts`) - TypeScript service layer
- **React Hooks** (`src/hooks/useZohoIntegration.ts`) - React integration hooks

## Available Workflows

### 1. Support Ticket Creation
- **Trigger**: Contact forms, QuickActions
- **Creates**: Zoho Desk ticket with proper department routing
- **Features**: Priority-based notifications, custom fields, tagging

### 2. Coverage Check to Lead Conversion
- **Trigger**: Coverage check results
- **Creates**: Hot leads (coverage available) or future opportunity leads
- **Features**: Automatic lead scoring, service tagging

### 3. Order Processing Automation
- **Trigger**: Order placement
- **Creates**:
  - CRM contact/account
  - Zoho Books invoice with recurring billing
  - Onboarding ticket with 3-day SLA
  - Customer confirmation email
- **Features**: Parallel workflow execution, rollback on failure

### 4. Lead Management
- **Features**: Lead creation, conversion to customers, deal management
- **Integration**: Full CRM pipeline automation

### 5. Invoice Management
- **Features**: Invoice creation, recurring billing setup, payment tracking
- **Integration**: Zoho Books with custom fields

### 6. Notifications
- **Channels**: Zoho Cliq for team alerts, Zoho Mail for customer communications
- **Triggers**: High-priority tickets, order confirmations, system alerts

## Monitoring and Troubleshooting

### Check Function Logs
```bash
supabase functions logs zoho-integration --project-ref agyjovdugmtopasyvlng
```

### Common Issues
1. **CORS Errors**: Ensure `_shared/cors.ts` is deployed
2. **API Key Issues**: Verify environment variables are set correctly
3. **Zoho MCP Connection**: Test the MCP server URL directly
4. **Rate Limiting**: Monitor API usage in Zoho dashboard

### Success Indicators
- Support tickets appear in Zoho Desk
- Leads are created in Zoho CRM with proper tags
- Invoices are generated in Zoho Books
- Email notifications are sent via Zoho Mail
- Team alerts appear in Zoho Cliq

## Security Considerations
- API keys are stored as Supabase secrets (not in code)
- CORS headers properly configured for website domain
- Request validation in Edge Function
- Error handling prevents sensitive data exposure

## Future Enhancements
- Webhook integration for bidirectional sync
- Advanced reporting and analytics
- Customer portal integration
- Automated follow-up workflows
- Multi-language support

## Contact
For technical support with this integration, contact the development team or refer to the internal documentation at `/admin/docs`.