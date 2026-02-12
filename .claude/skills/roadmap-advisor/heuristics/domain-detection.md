# Domain Detection Heuristics

Map files, tables, and routes to business domains.

---

## File Path Patterns

```typescript
const DOMAIN_PATTERNS = {
  billing: {
    paths: [
      /lib\/billing\//,
      /app\/api\/(billing|invoice|payment)/,
      /components\/(billing|payment|checkout)/,
      /supabase\/migrations\/.*invoice/,
      /supabase\/migrations\/.*payment/,
    ],
    keywords: ['invoice', 'payment', 'billing', 'dunning', 'emandate', 'netcash', 'reconciliation']
  },

  customer: {
    paths: [
      /app\/(dashboard|customer)/,
      /lib\/customer\//,
      /components\/dashboard\//,
      /supabase\/migrations\/.*customer/,
    ],
    keywords: ['customer', 'dashboard', 'self-service', 'profile', 'account', 'usage']
  },

  network: {
    paths: [
      /lib\/network\//,
      /lib\/monitoring\//,
      /app\/api\/(network|health|uptime)/,
      /supabase\/migrations\/.*(network|health|uptime)/,
    ],
    keywords: ['network', 'uptime', 'health', 'monitoring', 'sla', 'diagnostic', 'speed']
  },

  coverage: {
    paths: [
      /lib\/coverage\//,
      /app\/api\/coverage\//,
      /components\/coverage\//,
      /supabase\/migrations\/.*coverage/,
    ],
    keywords: ['coverage', 'feasibility', 'mtn', 'vumatel', 'openserve', 'fwa']
  },

  operations: {
    paths: [
      /lib\/activation\//,
      /lib\/provisioning\//,
      /app\/api\/(activation|rica|provisioning)/,
      /components\/admin\/(field|technician)/,
    ],
    keywords: ['activation', 'rica', 'provisioning', 'technician', 'installation', 'dispatch']
  },

  partner: {
    paths: [
      /lib\/partners\//,
      /app\/partners\//,
      /app\/api\/partners\//,
      /components\/partners\//,
      /supabase\/migrations\/.*partner/,
    ],
    keywords: ['partner', 'reseller', 'commission', 'compliance', 'fica', 'cipc']
  },

  integration: {
    paths: [
      /lib\/(zoho|didit|interstellio|clickatell)\//,
      /app\/api\/webhooks\//,
      /app\/api\/integrations\//,
    ],
    keywords: ['zoho', 'crm', 'webhook', 'sync', 'integration', 'api']
  },

  analytics: {
    paths: [
      /lib\/analytics\//,
      /app\/api\/(analytics|reports)\//,
      /components\/admin\/(analytics|reports)\//,
    ],
    keywords: ['analytics', 'report', 'dashboard', 'metrics', 'kpi', 'forecast']
  },

  admin: {
    paths: [
      /app\/admin\//,
      /components\/admin\//,
      /lib\/admin\//,
      /supabase\/migrations\/.*admin/,
    ],
    keywords: ['admin', 'rbac', 'role', 'permission', 'audit']
  },

  cms: {
    paths: [
      /lib\/cms\//,
      /app\/admin\/cms\//,
      /components\/cms\//,
      /supabase\/migrations\/.*pb_/,
    ],
    keywords: ['cms', 'page', 'builder', 'content', 'media', 'template']
  }
};
```

---

## Table Domain Mapping

| Table Pattern | Domain |
|---------------|--------|
| `customer_invoices`, `payment_*`, `credit_notes` | billing |
| `customers`, `customer_services`, `customer_billing` | customer |
| `network_*`, `uptime_*`, `health_*` | network |
| `coverage_*`, `service_packages` | coverage |
| `activation_*`, `rica_*`, `installation_*` | operations |
| `partners`, `partner_*`, `commission_*` | partner |
| `zoho_*`, `didit_*`, `webhook_*` | integration |
| `analytics_*`, `report_*` | analytics |
| `admin_*`, `audit_*` | admin |
| `pb_*` | cms |

---

## Route Domain Mapping

| Route Pattern | Domain |
|---------------|--------|
| `/api/billing/*`, `/api/invoices/*`, `/api/payments/*` | billing |
| `/api/customer/*`, `/dashboard/*` | customer |
| `/api/network/*`, `/api/health/*` | network |
| `/api/coverage/*` | coverage |
| `/api/activation/*`, `/api/rica/*` | operations |
| `/api/partners/*` | partner |
| `/api/webhooks/*`, `/api/integrations/*` | integration |
| `/api/analytics/*`, `/api/reports/*` | analytics |
| `/api/admin/*` | admin |
| `/api/cms/*` | cms |

---

## Component Domain Mapping

| Component Path | Domain |
|----------------|--------|
| `components/checkout/*`, `components/payments/*` | billing |
| `components/dashboard/*` | customer |
| `components/coverage/*` | coverage |
| `components/partners/*` | partner |
| `components/admin/*` | admin (various subdomains) |
| `components/cms/*` | cms |

---

## Usage Example

```typescript
function detectDomain(filePath: string): string {
  for (const [domain, config] of Object.entries(DOMAIN_PATTERNS)) {
    for (const pattern of config.paths) {
      if (pattern.test(filePath)) {
        return domain;
      }
    }
  }
  return 'unknown';
}

function detectDomainFromContent(content: string): string[] {
  const matches: string[] = [];
  for (const [domain, config] of Object.entries(DOMAIN_PATTERNS)) {
    const keywordMatches = config.keywords.filter(kw =>
      content.toLowerCase().includes(kw)
    );
    if (keywordMatches.length >= 2) {
      matches.push(domain);
    }
  }
  return matches;
}
```

---

## Multi-Domain Files

Some files span multiple domains. Handle with primary + secondary:

| File | Primary | Secondary |
|------|---------|-----------|
| `lib/billing/paynow-billing-service.ts` | billing | integration |
| `app/api/webhooks/netcash/route.ts` | integration | billing |
| `components/admin/customers/page.tsx` | admin | customer |
| `lib/coverage/aggregation-service.ts` | coverage | integration |
