# Interstellio Diagnostics Webhook Setup Guide

## Overview

This guide explains how to register the CircleTel Diagnostics webhook endpoint in the Interstellio (NebularStack) dashboard to receive real-time subscriber events.

## Webhook Endpoint

**Production URL:**
```
https://www.circletel.co.za/api/webhooks/interstellio/diagnostics
```

**Staging URL:**
```
https://circletel-staging.vercel.app/api/webhooks/interstellio/diagnostics
```

## Required Event Subscriptions

Register the following three event triggers:

| Event Trigger | Description | When Fired |
|--------------|-------------|------------|
| `subscriber-authenticated` | PPPoE/RADIUS authentication event | When subscriber authenticates via RADIUS |
| `subscriber-nas-updated` | NAS/BNG information updated | When session NAS details change |
| `subscriber-session-start` | New PPPoE session started | When subscriber establishes new connection |

## Configuration Steps

### Step 1: Access Interstellio Dashboard

1. Log in to **https://console.interstellio.io** (or your self-hosted NebularStack instance)
2. Navigate to **Settings** > **Webhooks** (or **Integrations** > **Webhooks**)

### Step 2: Create New Webhook

1. Click **Add Webhook** or **Create Webhook**
2. Configure the following fields:

| Field | Value |
|-------|-------|
| **Name** | CircleTel Diagnostics |
| **URL** | `https://www.circletel.co.za/api/webhooks/interstellio/diagnostics` |
| **Method** | POST |
| **Content-Type** | application/json |
| **Active** | Yes |

### Step 3: Select Event Triggers

Enable the following events:
- [x] `subscriber-authenticated`
- [x] `subscriber-nas-updated`
- [x] `subscriber-session-start`

### Step 4: Configure Signature (Optional but Recommended)

If Interstellio supports webhook signatures:

1. Enable **Webhook Signing**
2. Copy the generated secret
3. Add to CircleTel environment variables as `INTERSTELLIO_WEBHOOK_SECRET`

**Signature Headers Supported:**
- `X-Interstellio-Signature` (preferred)
- `X-Webhook-Signature` (fallback)

**Signature Algorithm:** HMAC-SHA256

### Step 5: Save and Test

1. Click **Save** or **Create**
2. Use the **Test Webhook** button if available
3. Check CircleTel logs for successful webhook receipt

## Expected Webhook Payload Format

```json
{
  "trigger": "subscriber-session-start",
  "timestamp": "2025-12-20T10:30:00+02:00",
  "subscriber": {
    "id": "23ffee86-dbe9-11f0-9102-61ef2f83e8d9",
    "username": "customer@circletel.co.za",
    "calling_station_id": "100.125.57.136",
    "last_known_nas_ip4": "41.198.130.3"
  },
  "context": {
    "session_id": "4d81f126-dcd1-11f0-9e13-a59eec990c99",
    "nas_identifier": "bras-jhb-01"
  }
}
```

## Environment Variables Required

Add to your Vercel/production environment:

```env
# Optional - only if Interstellio signs webhooks
INTERSTELLIO_WEBHOOK_SECRET=your-secret-here
```

## Verification Checklist

After setup, verify:

- [ ] Webhook registered in Interstellio dashboard
- [ ] All 3 event triggers enabled
- [ ] URL points to production/staging correctly
- [ ] Test webhook received (check Vercel logs)
- [ ] `INTERSTELLIO_WEBHOOK_SECRET` set (if using signatures)

## Troubleshooting

### Webhook Not Received

1. Check Vercel function logs: `npx vercel logs --filter "/api/webhooks/interstellio/diagnostics"`
2. Verify URL is accessible from external networks
3. Check Interstellio webhook delivery logs for errors

### 401 Unauthorized Errors

If signature verification is enabled:
1. Ensure `INTERSTELLIO_WEBHOOK_SECRET` matches Interstellio's signing secret
2. Check signature header name matches expected format

### 400 Bad Request Errors

1. Verify payload includes `subscriber.id` and `trigger` fields
2. Check JSON is valid

### Rate Limiting (429)

The endpoint has built-in rate limiting (30 events/minute per subscriber). If you see 429 errors:
1. This is normal during high activity periods
2. Events will resume after 1 minute

## Contact

For Interstellio dashboard access or API questions:
- **Interstellio Support**: support@interstellio.io
- **Documentation**: https://docs.interstellio.io/

---

**Document Version:** 1.0
**Created:** 2025-12-20
**Author:** CircleTel Development Team
