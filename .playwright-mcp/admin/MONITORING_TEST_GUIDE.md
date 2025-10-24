# API Monitoring Dashboard - Playwright MCP Test Guide

## Quick Start

### 1. Start Dev Server
```bash
npm run dev
```

Wait for: `Ready on http://localhost:3000`

### 2. Run Playwright MCP Tests

Use the Playwright MCP browser tools to test the monitoring dashboard interactively.

---

## Manual Test Steps (Using Playwright MCP)

### Step 1: Navigate to Admin Login
```
Navigate to: http://localhost:3000/admin/login
```

### Step 2: Login as Admin
```
Fill email: admin@circletel.co.za
Fill password: [your admin password]
Click: Login button
```

### Step 3: Navigate to Monitoring Dashboard
```
Navigate to: http://localhost:3000/admin/coverage/monitoring
```

### Step 4: Verify Page Load
**Expected**:
- Page title: "API Monitoring"
- Description: "Real-time coverage API performance metrics"
- 4 metric cards visible
- Tabs: Performance, Cache, Layers, Actions

### Step 5: Check Overview Cards
**Verify**:
- System Status badge (HEALTHY/DEGRADED/UNHEALTHY)
- Success Rate percentage
- Avg Response Time in ms
- Cache Hit Rate percentage

### Step 6: Test Time Window Selector
**Actions**:
1. Click time window dropdown
2. Select "Last 5 minutes"
3. Wait for data refresh
4. Select "Last 24 hours"

**Expected**: Metrics update accordingly

### Step 7: Test Auto-Refresh Toggle
**Actions**:
1. Click "Auto" button
2. Should change to "Manual"
3. Click again to toggle back

**Expected**: Button text toggles between Auto/Manual

### Step 8: Test Performance Tab
**Actions**:
1. Click "Performance" tab

**Verify**:
- Response Time Distribution card
- Average, Median, P95, P99 metrics
- Error Breakdown section
- Rate Limiting statistics

### Step 9: Test Cache Tab
**Actions**:
1. Click "Cache" tab

**Verify**:
- MTN Coverage Cache (30-minute TTL)
- Hit Ratio, Cache Hits, Cache Misses
- Aggregation Cache (5-minute TTL)
- Cached Entries count

### Step 10: Test Layers Tab
**Actions**:
1. Click "Layers" tab

**Verify**:
- MTN WMS Layer Performance
- Per-layer statistics
- Success rates per layer
- Average response times

### Step 11: Test Actions Tab
**Actions**:
1. Click "Actions" tab

**Verify**:
- Management Actions section
- Reset Metrics button
- Clear All Caches button
- Export Metrics (CSV) button
- Optimization Status showing 4 active optimizations

### Step 12: Test Export CSV
**Actions**:
1. Go to Actions tab
2. Click "Export Metrics (CSV)"

**Expected**: CSV file downloads

### Step 13: Test Refresh Button
**Actions**:
1. Click "Refresh" button in header

**Expected**: Loading indicator, then updated data

---

## API Endpoint Tests

### Test 1: GET Monitoring Data (JSON)
```
URL: http://localhost:3000/api/admin/coverage/monitoring?window=3600000
Method: GET
Expected: 200 OK with JSON data
```

**Response Structure**:
```json
{
  "timestamp": "2025-10-24T...",
  "timeWindow": 3600000,
  "mtn": {
    "health": { "status": "healthy", ... },
    "performance": { ... },
    "rateLimiting": { ... }
  },
  "cache": { ... },
  "aggregation": { ... },
  "summary": { ... }
}
```

### Test 2: GET Monitoring Data (CSV)
```
URL: http://localhost:3000/api/admin/coverage/monitoring?window=3600000&format=csv
Method: GET
Expected: 200 OK with CSV file download
```

### Test 3: Reset Metrics
```
URL: http://localhost:3000/api/admin/coverage/monitoring
Method: POST
Body: { "action": "reset_metrics" }
Expected: 200 OK with success message
```

### Test 4: Clear Cache
```
URL: http://localhost:3000/api/admin/coverage/monitoring
Method: POST
Body: { "action": "clear_cache" }
Expected: 200 OK with success message
```

---

## Playwright MCP Commands

### Navigate
```typescript
await page.goto('http://localhost:3000/admin/coverage/monitoring');
```

### Take Snapshot
```typescript
await page.screenshot({ path: 'monitoring-dashboard.png', fullPage: true });
```

### Check Element Visibility
```typescript
await page.waitForSelector('text=API Monitoring');
await page.locator('text=System Status').isVisible();
```

### Click Elements
```typescript
await page.click('text=Cache');
await page.click('button:has-text("Refresh")');
```

### Fill Forms
```typescript
await page.fill('input[type="email"]', 'admin@circletel.co.za');
```

### Get Text Content
```typescript
const successRate = await page.locator('text=Success Rate').textContent();
```

---

## Expected Metrics (After Coverage API Calls)

If you've run coverage checks, you should see:

- **Total Requests**: > 0
- **Success Rate**: 85-100%
- **Avg Response Time**: 2000-5000ms
- **Cache Hit Rate**: 40-70%
- **System Status**: HEALTHY (green badge)

If no coverage API calls have been made:
- Most metrics will show 0 or "No data available"
- This is expected behavior

---

## Troubleshooting

### Issue: "No data available"
**Solution**: Make a coverage check first
```
Navigate to: http://localhost:3000/order/coverage
Enter an address and check coverage
Then return to monitoring dashboard
```

### Issue: 401 Unauthorized
**Solution**: Ensure you're logged in as admin

### Issue: Metrics not updating
**Solution**: 
1. Check auto-refresh is enabled
2. Click manual refresh button
3. Change time window to force reload

### Issue: TypeScript errors in API route
**Solution**: The `createClient()` await issue - check if server is using correct Supabase client initialization

---

## Automated Test Execution

Run the full E2E test suite:
```bash
npx playwright test tests/e2e/admin-api-monitoring.spec.ts
```

Run with UI mode:
```bash
npx playwright test tests/e2e/admin-api-monitoring.spec.ts --ui
```

Run specific test:
```bash
npx playwright test tests/e2e/admin-api-monitoring.spec.ts -g "should load monitoring dashboard"
```

---

## Success Criteria

✅ All 4 overview cards display metrics  
✅ All 4 tabs are functional  
✅ Time window selector works  
✅ Auto-refresh toggles correctly  
✅ Export CSV downloads file  
✅ Management actions execute  
✅ API endpoints return 200 status  
✅ Optimization status shows 4 active features  

---

## Next Steps

1. Generate test coverage by making coverage API calls
2. Run full Playwright test suite
3. Take screenshots for documentation
4. Set up CI/CD integration for automated testing
