# Coverage API Monitoring Integration Guide

## Overview
Real-time monitoring dashboard for CircleTel coverage APIs with performance metrics, cache statistics, and health monitoring.

## Access
**URL**: `/admin/coverage/monitoring`  
**Permission**: Admin role required

## Features

### 1. Real-Time Metrics
- System health status
- Success rate tracking
- Response time percentiles (P50, P95, P99)
- Cache hit rates

### 2. Performance Monitoring
- MTN WMS API performance
- Layer-specific statistics
- Error breakdown by type
- Rate limiting stats

### 3. Cache Analytics
- MTN coverage cache (30-min TTL)
- Aggregation cache (5-min TTL)
- Hit/miss ratios
- Entry counts

### 4. Management Actions
- Reset metrics
- Clear caches
- Export CSV reports

## API Endpoints

### GET `/api/admin/coverage/monitoring`
Returns comprehensive monitoring data.

**Query Parameters**:
- `window` - Time window in ms (default: 3600000 = 1 hour)
- `format` - Response format: `json` or `csv`

### POST `/api/admin/coverage/monitoring`
Execute management actions.

**Actions**:
- `reset_metrics` - Clear all monitoring metrics
- `clear_cache` - Clear all coverage caches

## Integration Steps

1. **Add to Admin Navigation**
2. **Configure RBAC permissions**
3. **Set up alerts** (optional)
4. **Enable auto-refresh** (default: 30s)

## Metrics Explained

- **Success Rate**: % of successful API requests
- **Avg Response Time**: Mean API response time
- **Cache Hit Rate**: % of requests served from cache
- **P95/P99**: 95th/99th percentile response times

## Troubleshooting

- **No data**: Check if coverage API has been called
- **Low cache hit rate**: Normal for first requests
- **High response times**: Check MTN API status

## Related Documentation
- Performance Optimizations: `docs/performance/COVERAGE_PERFORMANCE_OPTIMIZATIONS.md`
- MTN Integration: `docs/MTN_PHASE2_COMPLETION.md`
