# WhatsApp Business API Setup Guide

> **Last Updated**: 2026-02-27
> **Status**: Configuration Required
> **Integration Type**: Meta Cloud API v21.0

---

## Overview

This guide walks through obtaining WhatsApp Business API credentials from Meta Developer Portal. CircleTel uses WhatsApp for:

- **Invoice Payment Notifications** - Automated Pay Now links
- **Payment Reminders** - Overdue invoice alerts
- **Debit Order Failures** - Fallback payment requests
- **Payment Confirmations** - Receipt notifications
- **Service Activations** - Welcome messages

### Current Setup

| Item | Value |
|------|-------|
| WhatsApp Number | +27 82 487 3900 |
| Business Name | Circle Tel SA |
| Partner | Zoho Corporation (Full control) |
| ZOHO One | Active (keeping ZOHO Desk integration) |

### Why Developer Portal?

The WhatsApp Business Account is managed through Zoho Corporation as a partner, so system users cannot be created directly in Meta Business Suite. We use Meta Developer Portal to get API tokens instead, which keeps the ZOHO Desk integration intact while enabling programmatic messaging.

---

## Prerequisites

- [ ] Admin access to Meta Business Suite
- [ ] Access to Meta Developer Portal (developers.facebook.com)
- [ ] Vercel project admin access (for environment variables)
- [ ] Personal WhatsApp number for testing (must be in verified list)

---

## Step 1: Access Meta Developer Portal

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Log in with your Facebook account (must have admin access to Circle Tel SA business)
3. Click **My Apps** in the top navigation

---

## Step 2: Create or Select App

### Option A: Use Existing App

1. Look for an existing app named "CircleTel" or "Circle Tel SA"
2. Click on it to open the dashboard
3. Skip to Step 3

### Option B: Create New App

1. Click **Create App**
2. Select **Business** as the app type
3. Fill in:
   - **App Name**: `CircleTel WhatsApp`
   - **Contact Email**: `dev@circletel.co.za`
   - **Business Account**: Select "Circle Tel SA"
4. Click **Create App**

---

## Step 3: Add WhatsApp Product

1. In your app dashboard, scroll to **Add Products to Your App**
2. Find **WhatsApp** and click **Set Up**
3. Complete the setup flow:
   - Select your WhatsApp Business Account (Circle Tel SA)
   - Link your phone number (+27 82 487 3900)

---

## Step 4: Get Phone Number ID

1. Go to **WhatsApp** > **API Setup** in the left sidebar
2. Under **Step 1: Select phone numbers**, your number should be listed
3. Copy the **Phone Number ID** (format: `123456789012345`)

```
📝 Record this value:
WHATSAPP_PHONE_NUMBER_ID = ___________________________
```

---

## Step 5: Generate Access Token

### Temporary Token (24 hours - for testing)

1. In **API Setup**, scroll to **Step 5: Send messages with the API**
2. Click **Generate new token** or copy the temporary token shown
3. This token expires in 24 hours

### Permanent Token (for production)

Meta doesn't provide permanent tokens directly. You need to:

1. **Create a System User** in Business Settings:
   - Go to [business.facebook.com](https://business.facebook.com)
   - Navigate to **Settings** > **Users** > **System Users**
   - Click **Add** > **Admin** or **Employee**
   - Name: `CircleTel API`

2. **Assign WhatsApp Asset**:
   - Select your new system user
   - Click **Add Assets** > **Apps**
   - Select your WhatsApp app
   - Grant **Full Control**

3. **Generate Token**:
   - Click on the system user
   - Click **Generate New Token**
   - Select your app
   - Add permissions:
     - `whatsapp_business_management`
     - `whatsapp_business_messaging`
   - Click **Generate Token**
   - **Copy immediately** - it won't be shown again!

> **Note**: If you cannot create system users due to Zoho partnership, use the App token method below.

### Alternative: App Access Token

1. In your app dashboard, go to **Settings** > **Basic**
2. Note your **App ID** and **App Secret**
3. Exchange for a long-lived token via API:

```bash
curl -X GET "https://graph.facebook.com/oauth/access_token?grant_type=client_credentials&client_id={APP_ID}&client_secret={APP_SECRET}"
```

```
📝 Record this value:
WHATSAPP_ACCESS_TOKEN = ___________________________
```

---

## Step 6: Get Business Account ID

1. Go to **WhatsApp** > **API Setup**
2. Find **WhatsApp Business Account ID** in the overview section
3. Or go to **Business Settings** > **Accounts** > **WhatsApp Accounts**

```
📝 Record this value:
WHATSAPP_BUSINESS_ACCOUNT_ID = ___________________________
```

---

## Step 7: Configure Webhook

### Webhook URL

```
https://www.circletel.co.za/api/webhooks/whatsapp
```

### Generate Verify Token

Create a random string for webhook verification:

```bash
# Generate a secure random token
openssl rand -hex 32
```

Example output: `a7f8c9d2e1b0...` (64 characters)

```
📝 Record this value:
WHATSAPP_WEBHOOK_VERIFY_TOKEN = ___________________________
```

### Configure in Meta Developer Portal

1. Go to **WhatsApp** > **Configuration** in left sidebar
2. Under **Webhook**, click **Edit**
3. Enter:
   - **Callback URL**: `https://www.circletel.co.za/api/webhooks/whatsapp`
   - **Verify Token**: Your generated token
4. Click **Verify and Save**
5. Under **Webhook fields**, subscribe to:
   - `messages` - For incoming replies (optional)
   - `message_status` - **Required** - Delivery status updates

> **Important**: The webhook must be verified before it will receive events. Make sure the environment variables are set in Vercel first!

---

## Step 8: Add to Vercel

### Environment Variables

Add these to your Vercel project (Settings > Environment Variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `WHATSAPP_PHONE_NUMBER_ID` | Your phone number ID | `123456789012345` |
| `WHATSAPP_ACCESS_TOKEN` | Permanent access token | `EAAG...` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA ID | `987654321098765` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Random string | `a7f8c9d2e1b0...` |

### Add via Vercel CLI

```bash
vercel env add WHATSAPP_PHONE_NUMBER_ID production
vercel env add WHATSAPP_ACCESS_TOKEN production
vercel env add WHATSAPP_BUSINESS_ACCOUNT_ID production
vercel env add WHATSAPP_WEBHOOK_VERIFY_TOKEN production
```

### Redeploy

After adding environment variables, redeploy to apply:

```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

---

## Step 9: Create Message Templates

WhatsApp requires pre-approved templates for business-initiated messages. Submit these templates in Meta Business Suite.

### Template 1: Invoice Payment

| Field | Value |
|-------|-------|
| **Name** | `circletel_invoice_payment` |
| **Category** | `UTILITY` |
| **Language** | `en` |
| **Header** | `CircleTel Invoice` |
| **Body** | `Hi {{1}}, your invoice {{2}} for R{{3}} is ready. Pay securely: {{4}}` |
| **Footer** | `Reply STOP to opt out` |
| **Button** | `URL` - `Pay Now` - `{{1}}` (dynamic URL) |

### Template 2: Payment Reminder

| Field | Value |
|-------|-------|
| **Name** | `circletel_payment_reminder` |
| **Category** | `UTILITY` |
| **Language** | `en` |
| **Body** | `Hi {{1}}, a friendly reminder that invoice {{2}} (R{{3}}) is due on {{4}}. Pay now: {{5}}` |

### Template 3: Debit Order Failed

| Field | Value |
|-------|-------|
| **Name** | `circletel_debit_failed` |
| **Category** | `UTILITY` |
| **Language** | `en` |
| **Body** | `Hi {{1}}, your debit order for R{{2}} could not be processed. Please pay via Pay Now: {{3}}` |

### Template 4: Payment Received

| Field | Value |
|-------|-------|
| **Name** | `circletel_payment_received` |
| **Category** | `UTILITY` |
| **Language** | `en` |
| **Body** | `Hi {{1}}, we've received your payment of R{{2}} for invoice {{3}}. Thank you!` |

### Template 5: Service Activated

| Field | Value |
|-------|-------|
| **Name** | `circletel_service_activated` |
| **Category** | `UTILITY` |
| **Language** | `en` |
| **Body** | `Hi {{1}}, your {{2}} service is now active! Account: {{3}}. Support: 082 487 3900` |

### How to Submit Templates

1. Go to [business.facebook.com](https://business.facebook.com)
2. Navigate to **WhatsApp Manager** > **Message Templates**
3. Click **Create Template**
4. Fill in the fields as shown above
5. Click **Submit** for review

> **Note**: Template approval typically takes 24-48 hours. Use exact template names as the code expects these specific names.

---

## Step 10: Test the Integration

### 1. Add Your Number to Test List

Before sending to any number, it must be verified:

1. Go to **WhatsApp** > **API Setup**
2. Under **Step 2: Add a recipient phone number**
3. Add your personal WhatsApp number
4. Verify with the code sent via WhatsApp

### 2. Test via Admin Dashboard

1. Go to `https://www.circletel.co.za/admin/billing/whatsapp`
2. Select an invoice
3. Click **Send WhatsApp** or **Preview**
4. Send to your verified number

### 3. Test via cURL

```bash
curl -X POST "https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "27821234567",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": { "code": "en" }
    }
  }'
```

### 4. Check Webhook Status

After sending, check that delivery status is received:

```bash
# Check recent webhook logs (Vercel)
vercel logs --prod | grep "WhatsApp Webhook"
```

---

## Troubleshooting

### Token Expired (401 Error)

```
Error: (#190) Access token has expired
```

**Solution**: Generate a new permanent token following Step 5.

### Template Not Found (132001)

```
Error: Template circletel_invoice_payment does not exist
```

**Solution**:
- Check template name matches exactly (case-sensitive)
- Ensure template is approved in WhatsApp Manager
- Use `hello_world` for initial testing (pre-approved)

### Webhook Verification Failed

```
Error: Verification failed
```

**Solution**:
1. Verify `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in Vercel matches Meta config
2. Ensure the webhook URL is accessible (not blocked by firewall)
3. Redeploy if you just added the environment variable

### Phone Number Not Registered (131030)

```
Error: Phone number is not registered
```

**Solution**: The recipient number must:
- Have WhatsApp installed
- Be in international format (27...)
- Be added to test recipients if using test mode

### Rate Limits

Meta applies rate limits based on quality score:

| Tier | Messages/day |
|------|--------------|
| Unverified | 250 |
| Tier 1 | 1,000 |
| Tier 2 | 10,000 |
| Tier 3 | 100,000 |

Improve tier by maintaining high quality (low blocks/reports).

---

## Environment Variable Summary

Add these to Vercel and `.env.local`:

```env
# WhatsApp Business API (Meta Cloud API)
WHATSAPP_PHONE_NUMBER_ID=        # From WhatsApp → API Setup
WHATSAPP_ACCESS_TOKEN=           # Generated permanent token
WHATSAPP_BUSINESS_ACCOUNT_ID=    # WABA ID
WHATSAPP_WEBHOOK_VERIFY_TOKEN=   # Random string (generate yourself)

# Optional: Template names (defaults are in code)
WHATSAPP_TEMPLATE_INVOICE=circletel_invoice_payment
WHATSAPP_TEMPLATE_REMINDER=circletel_payment_reminder
WHATSAPP_TEMPLATE_DEBIT_FAILED=circletel_debit_failed
```

---

## Related Documentation

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)
- [Webhook Events](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- Internal: `lib/integrations/whatsapp/` - Service implementation
- Internal: `app/api/webhooks/whatsapp/route.ts` - Webhook handler
- Internal: `app/admin/billing/whatsapp/` - Admin dashboard

---

## Checklist

- [ ] Meta Developer Portal app created/selected
- [ ] WhatsApp product added to app
- [ ] Phone Number ID obtained
- [ ] Permanent access token generated
- [ ] Business Account ID obtained
- [ ] Webhook URL configured and verified
- [ ] Environment variables added to Vercel
- [ ] Application redeployed
- [ ] Templates submitted and approved
- [ ] Test message sent successfully
- [ ] Webhook receiving status updates

---

**Questions?** Contact the development team or check the WhatsApp service logs in Vercel.
