# Payment Provider Health Monitoring

**Status**: ✅ Production Ready
**Date**: November 6, 2025
**Version**: 1.0

---

## Overview

The Payment Provider Health Monitoring system provides **real-time visibility** into the status and performance of all payment gateways integrated with CircleTel. This enables proactive monitoring, rapid issue detection, and informed operational decisions.

### Key Features

- ✅ **Real-time Health Checks**: Instant status for all payment providers
- ✅ **Multi-Provider Support**: Monitor NetCash, ZOHO Billing, PayFast, PayGate simultaneously
- ✅ **Performance Metrics**: Response time tracking per provider
- ✅ **Configuration Validation**: Automatic detection of missing environment variables
- ✅ **Provider Capabilities**: View supported features for each gateway
- ✅ **Auto-refresh Dashboard**: Configurable auto-refresh (10s - 5min intervals)
- ✅ **Admin Interface**: Beautiful, responsive monitoring dashboard
- ✅ **API Endpoint**: RESTful API for programmatic health checks
- ✅ **CORS Support**: Cross-origin requests enabled

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────┐
│     Admin Monitoring Dashboard                  │
│     /admin/payments/monitoring                  │
│     (React + Auto-refresh)                      │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTP GET
                 ▼
┌─────────────────────────────────────────────────┐
│     Health Check API Endpoint                   │
│     /api/payments/health                        │
│     (Next.js Route Handler)                     │
└────────────────┬────────────────────────────────┘
                 │
                 │ Factory Pattern
                 ▼
┌─────────────────────────────────────────────────┐
│     PaymentProviderFactory                      │
│     healthCheckAll()                            │
│     getProviderCapabilities()                   │
└────────────────┬────────────────────────────────┘
                 │
                 │ Provider Abstraction
                 ▼
┌─────────────────────────────────────────────────┐
│   Payment Providers (IPaymentProvider)          │
│   • NetCash     • ZOHO Billing                  │
│   • PayFast     • PayGate                       │
└─────────────────────────────────────────────────┘
```

### Health Check Process

1. **Admin requests health check** via dashboard or API call
2. **API endpoint** receives request with optional parameters (`provider`, `detailed`)
3. **Factory method** queries all providers or specific provider
4. **Each provider** reports:
   - Configuration status (environment variables present)
   - Availability status (provider module loaded)
   - Health status (configured && available)
   - Response time (milliseconds)
5. **Endpoint** aggregates results and returns JSON response
6. **Dashboard** displays visual status with color-coded badges

---

## API Reference

### GET /api/payments/health

Health check endpoint for payment providers.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | No | Specific provider to check (`netcash`, `zoho_billing`, `payfast`, `paygate`) |
| `detailed` | boolean | No | Include provider capabilities (default: `false`) |

#### Response Format

**Success Response (200 OK)**:

```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2025-11-06T01:50:00.000Z",
  "response_time_ms": 145,
  "providers": [
    {
      "provider": "netcash",
      "healthy": true,
      "configured": true,
      "available": true,
      "response_time_ms": 150,
      "capabilities": {  // Only when detailed=true
        "supports_cards": true,
        "supports_eft": true,
        "supports_instant_eft": true,
        "supports_recurring": true,
        "supports_refunds": true,
        "supported_currencies": ["ZAR"],
        "max_amount": null,
        "min_amount": 1.0
      }
    }
  ],
  "summary": {
    "total_providers": 4,
    "healthy_providers": 1,
    "unhealthy_providers": 3,
    "configured_providers": 1,
    "unconfigured_providers": 3
  }
}
```

**Error Response (500 Internal Server Error)**:

```json
{
  "status": "error",
  "timestamp": "2025-11-06T01:50:00.000Z",
  "error": "Health check failed",
  "message": "Database connection failed"
}
```

**Not Found Response (404 Not Found)** - Invalid provider:

```json
{
  "error": "Provider not found",
  "message": "Payment provider 'unknown' is not available",
  "available_providers": ["netcash", "zoho_billing", "payfast", "paygate"]
}
```

#### Status Codes

- `healthy`: All configured providers are healthy
- `degraded`: At least one provider is healthy, but some are unhealthy
- `unhealthy`: No providers are healthy
- `error`: Health check failed to execute

---

## Usage Examples

### cURL Examples

**1. Check all providers (basic)**:
```bash
curl http://localhost:3000/api/payments/health
```

**2. Check all providers (with capabilities)**:
```bash
curl http://localhost:3000/api/payments/health?detailed=true
```

**3. Check specific provider**:
```bash
curl http://localhost:3000/api/payments/health?provider=netcash
```

**4. Check specific provider (with capabilities)**:
```bash
curl http://localhost:3000/api/payments/health?provider=netcash&detailed=true
```

### JavaScript/TypeScript Examples

**1. Fetch all providers**:
```typescript
const response = await fetch('/api/payments/health');
const healthData = await response.json();

if (healthData.status === 'healthy') {
  console.log('All systems operational');
} else if (healthData.status === 'degraded') {
  console.warn('Some providers are experiencing issues');
} else {
  console.error('Payment system is down');
}
```

**2. Fetch with capabilities**:
```typescript
const response = await fetch('/api/payments/health?detailed=true');
const healthData = await response.json();

healthData.providers.forEach(provider => {
  console.log(`${provider.provider}:`, {
    healthy: provider.healthy,
    capabilities: provider.capabilities
  });
});
```

**3. Monitor specific provider**:
```typescript
const checkNetCash = async () => {
  const response = await fetch('/api/payments/health?provider=netcash&detailed=true');
  const data = await response.json();

  if (!data.providers[0].healthy) {
    // Send alert
    await sendSlackAlert('NetCash provider is down!');
  }

  return data;
};
```

**4. Auto-refresh monitoring**:
```typescript
const monitorPayments = () => {
  setInterval(async () => {
    const response = await fetch('/api/payments/health');
    const healthData = await response.json();

    updateDashboard(healthData);

    if (healthData.status === 'unhealthy') {
      triggerAlert('Payment system critical');
    }
  }, 30000); // Check every 30 seconds
};
```

---

## Admin Dashboard

### Access

**URL**: `https://www.circletel.co.za/admin/payments/monitoring`
**Permission**: Admin users only (requires authentication)

### Features

#### 1. Overall System Status Card

Displays the overall health status with color-coded indicator:

- 🟢 **Green (Healthy)**: All providers operational
- 🟡 **Yellow (Degraded)**: Some providers down
- 🔴 **Red (Unhealthy)**: All providers down

**Metrics**:
- Total Providers
- Healthy Providers
- Unhealthy Providers
- Response Time

#### 2. Auto-refresh Controls

Configurable auto-refresh with intervals:
- 10 seconds (rapid monitoring)
- 30 seconds (default)
- 1 minute (normal monitoring)
- 5 minutes (low-frequency monitoring)

**Toggle**: Enable/disable auto-refresh with visual ON/OFF button

#### 3. Provider Cards

Each provider displays:

**Status Badges**:
- ✅ Healthy (green)
- ❌ Unhealthy (red)
- ⚙️ Not Configured (gray)

**Status Indicators**:
- Configured: Environment variables present
- Available: Provider module loaded
- Response Time: Health check latency (ms)

**Capabilities** (if detailed mode):
- 💳 Cards
- 🏦 EFT
- ⚡ Instant EFT
- 🔄 Recurring Payments
- ↩️ Refunds

**Configuration**:
- Supported Currencies
- Amount Range (min - max)

**Warnings**:
- Configuration alerts for unconfigured providers

#### 4. Refresh Controls

- **Manual Refresh**: Click "Refresh" button for instant update
- **Auto-refresh**: Toggle auto-refresh with configurable intervals
- **Last Refresh**: Display timestamp of last health check

---

## Configuration

### Required Environment Variables

Each payment provider requires specific environment variables:

#### NetCash
```env
NETCASH_SERVICE_KEY=your-service-key
NETCASH_MERCHANT_ID=your-merchant-id
NETCASH_PCI_VAULT_KEY=your-pci-vault-key
NETCASH_WEBHOOK_SECRET=your-webhook-secret
```

#### ZOHO Billing
```env
ZOHO_CLIENT_ID=your-client-id
ZOHO_CLIENT_SECRET=your-client-secret
ZOHO_REFRESH_TOKEN=your-refresh-token
ZOHO_ORGANIZATION_ID=your-org-id
```

#### PayFast
```env
PAYFAST_MERCHANT_ID=your-merchant-id
PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-passphrase
```

#### PayGate
```env
PAYGATE_MERCHANT_ID=your-merchant-id
PAYGATE_MERCHANT_KEY=your-merchant-key
```

### Health Check Behavior

**Configured Provider**:
- All required environment variables present
- `healthy: true`, `configured: true`

**Unconfigured Provider**:
- Missing one or more environment variables
- `healthy: false`, `configured: false`
- Displays "Not Configured" badge in dashboard

---

## Monitoring Best Practices

### 1. Production Monitoring

**Recommended Setup**:
- Auto-refresh: 30 seconds
- Monitor dashboard 24/7 on operations screen
- Set up alerting for status changes

**Alert Rules**:
```typescript
if (healthData.status === 'unhealthy') {
  // CRITICAL: All providers down
  sendPagerDutyAlert('critical', 'All payment providers offline');
  sendSlackAlert('#ops-critical', 'Payment system DOWN');
}

if (healthData.status === 'degraded') {
  // WARNING: Some providers down
  sendSlackAlert('#ops-warning', `${unhealthy_count} providers offline`);
}

if (healthData.summary.healthy_providers === 0) {
  // CRITICAL: No payment options available
  disableOrderCheckout();
  displayMaintenanceMessage();
}
```

### 2. Development Monitoring

**Recommended Setup**:
- Auto-refresh: 1 minute (less frequent)
- Check before deploying changes
- Verify provider configuration

### 3. Response Time Monitoring

**Thresholds**:
- ✅ **Good**: < 200ms
- ⚠️ **Warning**: 200ms - 500ms
- 🔴 **Critical**: > 500ms

**Action**:
```typescript
healthData.providers.forEach(provider => {
  if (provider.response_time_ms > 500) {
    console.warn(`${provider.provider} slow response: ${provider.response_time_ms}ms`);
  }
});
```

### 4. Failover Strategy

Use health checks to implement automatic failover:

```typescript
const getHealthyProvider = async () => {
  const response = await fetch('/api/payments/health');
  const healthData = await response.json();

  // Find first healthy provider
  const healthy = healthData.providers.find(p => p.healthy);

  if (!healthy) {
    throw new Error('No healthy payment providers available');
  }

  return healthy.provider;
};

// Use in payment initiation
const provider = await getHealthyProvider();
const paymentService = getPaymentProvider(provider);
```

---

## Integration Examples

### 1. Slack Alerting

```typescript
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

const monitorPaymentHealth = async () => {
  const response = await fetch('/api/payments/health');
  const healthData = await response.json();

  if (healthData.status === 'unhealthy') {
    await slack.chat.postMessage({
      channel: '#ops-alerts',
      text: '🚨 CRITICAL: All payment providers are offline!',
      attachments: [{
        color: 'danger',
        fields: healthData.providers.map(p => ({
          title: p.provider,
          value: p.healthy ? '✅ Healthy' : '❌ Unhealthy',
          short: true
        }))
      }]
    });
  }
};
```

### 2. PagerDuty Incident Creation

```typescript
import { event } from '@pagerduty/pdjs';

const triggerPaymentIncident = async (healthData) => {
  if (healthData.status === 'unhealthy') {
    await event({
      routing_key: process.env.PAGERDUTY_ROUTING_KEY,
      event_action: 'trigger',
      payload: {
        summary: 'Payment system completely offline',
        severity: 'critical',
        source: 'payment-health-monitor',
        custom_details: {
          unhealthy_providers: healthData.summary.unhealthy_providers,
          providers: healthData.providers
        }
      }
    });
  }
};
```

### 3. Prometheus Metrics Export

```typescript
import client from 'prom-client';

const healthGauge = new client.Gauge({
  name: 'payment_provider_healthy',
  help: 'Payment provider health status (1 = healthy, 0 = unhealthy)',
  labelNames: ['provider']
});

const responseTimeGauge = new client.Gauge({
  name: 'payment_provider_response_time_ms',
  help: 'Payment provider health check response time in milliseconds',
  labelNames: ['provider']
});

const updateMetrics = async () => {
  const response = await fetch('/api/payments/health');
  const healthData = await response.json();

  healthData.providers.forEach(provider => {
    healthGauge.set({ provider: provider.provider }, provider.healthy ? 1 : 0);
    responseTimeGauge.set({ provider: provider.provider }, provider.response_time_ms);
  });
};

// Update every 15 seconds
setInterval(updateMetrics, 15000);
```

### 4. Grafana Dashboard

Create a Grafana dashboard using Prometheus metrics:

**Panel 1: Provider Health Status**
```promql
payment_provider_healthy{provider=~".*"}
```

**Panel 2: Response Time Trends**
```promql
payment_provider_response_time_ms{provider=~".*"}
```

**Panel 3: Uptime Percentage**
```promql
avg_over_time(payment_provider_healthy{provider="netcash"}[24h]) * 100
```

---

## Testing

### Unit Tests

**Test File**: `__tests__/lib/payments/health-endpoint.test.ts`

**Coverage**:
- ✅ All providers health check
- ✅ Specific provider health check
- ✅ Detailed mode with capabilities
- ✅ Error handling
- ✅ Response format validation
- ✅ Summary calculations
- ✅ CORS headers
- ✅ 404 for unknown providers
- ✅ Mixed provider states

**Run Tests**:
```bash
npm run test:payment -- health-endpoint.test.ts
```

### Manual Testing

**1. Test all providers**:
```bash
curl http://localhost:3000/api/payments/health | jq
```

**2. Test specific provider**:
```bash
curl http://localhost:3000/api/payments/health?provider=netcash | jq
```

**3. Test detailed mode**:
```bash
curl http://localhost:3000/api/payments/health?detailed=true | jq
```

**4. Test admin dashboard**:
```
1. Navigate to http://localhost:3000/admin/payments/monitoring
2. Verify all provider cards display correctly
3. Test auto-refresh toggle
4. Test manual refresh button
5. Test different refresh intervals
```

---

## Troubleshooting

### Issue: Provider shows as "Not Configured"

**Cause**: Missing environment variables

**Solution**:
1. Check `.env` file for required variables
2. Verify environment variables are loaded: `echo $NETCASH_SERVICE_KEY`
3. Restart development server after adding variables
4. Verify provider configuration in code

### Issue: All providers show as "Unhealthy"

**Cause**: Factory method failure or environment issues

**Solution**:
1. Check browser console for errors
2. Verify API endpoint is accessible: `curl http://localhost:3000/api/payments/health`
3. Check server logs for errors
4. Verify no network issues blocking requests

### Issue: Dashboard not auto-refreshing

**Cause**: Auto-refresh disabled or interval too long

**Solution**:
1. Toggle auto-refresh ON
2. Select shorter interval (10s or 30s)
3. Check browser console for errors
4. Verify no React errors blocking updates

### Issue: Response time very high (> 1000ms)

**Cause**: Slow provider checks or network issues

**Solution**:
1. Check individual provider response times
2. Verify network connectivity
3. Check if providers are rate-limiting
4. Consider caching health check results

---

## Future Enhancements

### Planned Features

1. **Historical Tracking** (Q1 2026)
   - Store health check results in database
   - View uptime trends over time
   - Generate uptime reports

2. **Smart Alerting** (Q1 2026)
   - Configure alert thresholds per provider
   - Email/SMS notifications
   - Webhook integrations for custom alerts

3. **Provider Failover** (Q2 2026)
   - Automatic failover to healthy providers
   - Weighted routing based on health + performance
   - Circuit breaker pattern

4. **Advanced Metrics** (Q2 2026)
   - Transaction success rates
   - Error rate tracking
   - Cost per transaction

5. **SLA Monitoring** (Q3 2026)
   - Define SLA targets per provider
   - Track SLA compliance
   - Generate SLA reports

---

## Security Considerations

### API Security

- ✅ No authentication required for health checks (read-only)
- ✅ No sensitive data exposed (only status, no keys)
- ✅ Rate limiting recommended (future enhancement)
- ✅ CORS enabled for cross-origin access

### Dashboard Security

- ✅ Admin authentication required
- ✅ Role-based access control (RBAC)
- ✅ Session management

### Best Practices

1. **Don't expose** environment variables in health check responses
2. **Do monitor** for unusual patterns in health check requests
3. **Do implement** rate limiting for public health endpoints (future)
4. **Don't log** sensitive provider credentials in health check logs

---

## Support

**Documentation**:
- Integration Guide: `docs/integrations/NETCASH_ZOHO_INTEGRATION_COMPLETE.md`
- Test Suite: `docs/testing/PAYMENT_INTEGRATION_TESTS.md`
- Provider Abstraction: `lib/payments/providers/payment-provider.interface.ts`

**Contact**:
- Internal: #ops-payments Slack channel
- External: payments@circletel.co.za

---

**Last Updated**: November 6, 2025
**Version**: 1.0
**Maintained By**: Development Team
