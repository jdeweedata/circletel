# MTN MNS Wholesale Feasibility API Integration

## Overview
The MTN MNS (Managed Network Services) Wholesale Feasibility API provides coverage and service availability information for wholesale customers. This document details the API endpoints, authentication, request/response formats, and integration patterns.

## API Details

### Base URL
```
https://ftool.mtnbusiness.co.za
```

### Authentication
- **Method**: API Key authentication via header
- **Header Name**: `X-API-Key`
- **API Key**: `bdaacbcae8ab77672e545649df54d0df`

### Headers
All requests should include:
```
X-API-Key: bdaacbcae8ab77672e545649df54d0df
Accept: application/json
Content-Type: application/json (for POST requests)
```

## Endpoints

### 1. Get Available Products
Retrieves the list of MTN products available for feasibility checking.

**Endpoint**: `GET /api/v1/feasibility/product/wholesale/mns`

**Request Example**:
```bash
curl -X GET \
  'https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns' \
  -H 'X-API-Key: bdaacbcae8ab77672e545649df54d0df' \
  -H 'Accept: application/json'
```

**Response Example**:
```json
[
  {
    "id": "5g-fwa-100",
    "name": "MTN 5G FWA 100Mbps",
    "description": "5G Fixed Wireless Access - 100Mbps"
  },
  {
    "id": "lte-fwa-50",
    "name": "MTN LTE FWA 50Mbps",
    "description": "LTE Fixed Wireless Access - 50Mbps"
  }
]
```

**Response Schema**:
```typescript
interface MTNProduct {
  id: string;              // Unique product identifier
  name: string;            // Product display name
  description?: string;    // Optional product description
}
```

### 2. Check Feasibility
Checks if a specific MTN product is available at a given location.

**Endpoint**: `POST /api/v1/feasibility/product/wholesale/mns`

**Request Body**:
```json
{
  "latitude": -26.204100,
  "longitude": 28.047300,
  "productId": "5g-fwa-100"
}
```

**Request Schema**:
```typescript
interface FeasibilityRequest {
  latitude: number;    // Location latitude (-90 to 90)
  longitude: number;   // Location longitude (-180 to 180)
  productId: string;   // Product ID from GET endpoint
}
```

**Request Example**:
```bash
curl -X POST \
  'https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns' \
  -H 'X-API-Key: bdaacbcae8ab77672e545649df54d0df' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "latitude": -26.204100,
    "longitude": 28.047300,
    "productId": "5g-fwa-100"
  }'
```

**Response Example (Feasible)**:
```json
{
  "feasible": true,
  "available": true,
  "message": "Service available at this location"
}
```

**Response Example (Not Feasible)**:
```json
{
  "feasible": false,
  "available": false,
  "message": "Service not available in this area",
  "reason": "Outside coverage area"
}
```

**Response Schema**:
```typescript
interface FeasibilityResponse {
  feasible: boolean;      // Whether service is available
  available?: boolean;    // Alternative availability flag
  message?: string;       // Human-readable status message
  reason?: string;        // Reason if not available
}
```

## Error Responses

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (API key lacks permissions)
- `404` - Not Found (invalid endpoint)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error
- `503` - Service Unavailable

### Error Response Format
```json
{
  "error": true,
  "message": "Invalid coordinates provided",
  "code": "INVALID_COORDINATES"
}
```

## Integration Patterns

### 1. Basic Integration (Single Check)
```typescript
async function checkMTNFeasibility(
  latitude: number,
  longitude: number,
  productId: string
): Promise<boolean> {
  const response = await fetch(
    'https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns',
    {
      method: 'POST',
      headers: {
        'X-API-Key': 'bdaacbcae8ab77672e545649df54d0df',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude, productId }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.feasible || data.available || false;
}
```

### 2. With Retry Logic
```typescript
async function checkMTNFeasibilityWithRetry(
  latitude: number,
  longitude: number,
  productId: string,
  maxRetries: number = 3
): Promise<FeasibilityResponse> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        'https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns',
        {
          method: 'POST',
          headers: {
            'X-API-Key': 'bdaacbcae8ab77672e545649df54d0df',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ latitude, longitude, productId }),
        }
      );

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429) {
        // Rate limited - exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
        continue;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError!;
}
```

### 3. Bulk Checking
```typescript
async function bulkCheckFeasibility(
  locations: Array<{ lat: number; lng: number }>,
  productId: string,
  concurrency: number = 3
): Promise<FeasibilityResult[]> {
  const results: FeasibilityResult[] = [];

  // Process in batches to avoid rate limiting
  for (let i = 0; i < locations.length; i += concurrency) {
    const batch = locations.slice(i, i + concurrency);
    const promises = batch.map(loc =>
      checkMTNFeasibility(loc.lat, loc.lng, productId)
    );
    const batchResults = await Promise.allSettled(promises);
    results.push(...batchResults);
  }

  return results;
}
```

## Rate Limiting

### Current Limits
- **Not officially documented** - Monitor `429` responses
- **Recommended**: Max 10 requests per second
- **Bulk Operations**: Use concurrency control (3-5 concurrent requests)

### Best Practices
1. Implement exponential backoff for retries
2. Cache results for frequently checked locations
3. Use batch processing with controlled concurrency
4. Monitor response times and adjust accordingly

## Caching Strategy

### Recommended Cache TTL
- **Products List**: 1 hour (rarely changes)
- **Feasibility Results**: 24 hours (coverage changes infrequently)
- **Error Responses**: 5 minutes (temporary issues)

### Implementation Example
```typescript
const cache = new Map<string, { data: any; expires: number }>();

function getCacheKey(lat: number, lng: number, productId: string): string {
  return `${lat.toFixed(6)}_${lng.toFixed(6)}_${productId}`;
}

async function getCachedFeasibility(
  latitude: number,
  longitude: number,
  productId: string
): Promise<FeasibilityResponse> {
  const key = getCacheKey(latitude, longitude, productId);
  const cached = cache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const data = await checkMTNFeasibility(latitude, longitude, productId);
  cache.set(key, {
    data,
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });

  return data;
}
```

## Testing

### Test Page
A comprehensive test interface is available at:
```
/test/mtn-wholesale
```

Features:
- Interactive map for coordinate selection
- Product dropdown with live API data
- Single and bulk location testing
- Response time monitoring
- Results visualization

### Manual Testing with cURL
```bash
# Get products
curl -X GET \
  'https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns' \
  -H 'X-API-Key: bdaacbcae8ab77672e545649df54d0df'

# Check feasibility (Sandton)
curl -X POST \
  'https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns' \
  -H 'X-API-Key: bdaacbcae8ab77672e545649df54d0df' \
  -H 'Content-Type: application/json' \
  -d '{
    "latitude": -26.107361,
    "longitude": 28.056667,
    "productId": "5g-fwa-100"
  }'
```

### Test Coordinates
Use these known locations for testing:

| Location | Latitude | Longitude | Expected |
|----------|----------|-----------|----------|
| Sandton, JHB | -26.107361 | 28.056667 | Feasible |
| Pretoria CBD | -25.747868 | 28.229271 | Feasible |
| Cape Town CBD | -33.925839 | 18.423218 | Feasible |
| Rural KZN | -29.858680 | 31.021840 | Not Feasible |

## Integration with CircleTel System

### Coverage Checker Integration
```typescript
// Add to lib/coverage/mtn/mns-wholesale-client.ts
export class MTNWholesaleClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = 'bdaacbcae8ab77672e545649df54d0df';
    this.baseUrl = 'https://ftool.mtnbusiness.co.za';
  }

  async getProducts(): Promise<MTNProduct[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/feasibility/product/wholesale/mns`,
      {
        headers: {
          'X-API-Key': this.apiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return await response.json();
  }

  async checkFeasibility(
    latitude: number,
    longitude: number,
    productId: string
  ): Promise<FeasibilityResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/feasibility/product/wholesale/mns`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude, productId }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check feasibility: ${response.statusText}`);
    }

    return await response.json();
  }
}
```

### Package Recommendation Integration
```typescript
// Add to lib/coverage/product-matcher.ts
import { MTNWholesaleClient } from './mtn/mns-wholesale-client';

export async function matchMTNWholesaleProducts(
  latitude: number,
  longitude: number
): Promise<Package[]> {
  const client = new MTNWholesaleClient();
  const products = await client.getProducts();
  const availablePackages: Package[] = [];

  for (const product of products) {
    const result = await client.checkFeasibility(
      latitude,
      longitude,
      product.id
    );

    if (result.feasible || result.available) {
      availablePackages.push({
        id: product.id,
        name: product.name,
        provider: 'MTN',
        type: 'wireless',
        description: product.description,
      });
    }
  }

  return availablePackages;
}
```

## Monitoring and Analytics

### Key Metrics to Track
1. **API Response Times**: Monitor average response times
2. **Success Rate**: Track feasible vs not feasible ratio
3. **Error Rate**: Monitor API errors and timeouts
4. **Coverage Accuracy**: Compare with ground truth data

### Implementation Example
```typescript
interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  feasibleResults: number;
  notFeasibleResults: number;
}

class MTNMetricsTracker {
  private metrics: APIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    feasibleResults: 0,
    notFeasibleResults: 0,
  };

  recordRequest(responseTime: number, success: boolean, feasible?: boolean) {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
      if (feasible !== undefined) {
        if (feasible) {
          this.metrics.feasibleResults++;
        } else {
          this.metrics.notFeasibleResults++;
        }
      }
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) +
        responseTime) /
      this.metrics.totalRequests;
  }

  getMetrics(): APIMetrics {
    return { ...this.metrics };
  }
}
```

## Security Considerations

### API Key Security
1. **Never commit API key to version control**
2. Store in environment variables
3. Use server-side API routes for production
4. Implement rate limiting on your API endpoints
5. Consider key rotation schedule

### Environment Variables
```env
# .env.local
MTN_WHOLESALE_API_KEY=bdaacbcae8ab77672e545649df54d0df
MTN_WHOLESALE_API_URL=https://ftool.mtnbusiness.co.za
```

### Server-Side API Route
```typescript
// app/api/coverage/mtn-wholesale/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MTNWholesaleClient } from '@/lib/coverage/mtn/mns-wholesale-client';

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, productId } = await request.json();

    const client = new MTNWholesaleClient();
    const result = await client.checkFeasibility(
      latitude,
      longitude,
      productId
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check feasibility' },
      { status: 500 }
    );
  }
}
```

## Troubleshooting

### Common Issues

#### 1. HTTP 401 Unauthorized
**Cause**: Invalid or missing API key
**Solution**: Verify API key in request headers

#### 2. HTTP 400 Bad Request
**Cause**: Invalid coordinates or missing productId
**Solution**: Validate input parameters before sending

#### 3. HTTP 429 Too Many Requests
**Cause**: Rate limiting
**Solution**: Implement exponential backoff and reduce request frequency

#### 4. Empty Product List
**Cause**: API endpoint change or temporary issue
**Solution**: Check API status and endpoint URL

### Debug Logging
```typescript
function logAPIRequest(
  method: string,
  url: string,
  body?: any,
  response?: any
) {
  console.log('[MTN API]', {
    timestamp: new Date().toISOString(),
    method,
    url,
    request: body,
    response,
  });
}
```

## Related Documentation
- [MTN Coverage Integration Guide](./MTN_INTEGRATION_SUMMARY.md)
- [Coverage System Architecture](../../architecture/COVERAGE_SYSTEM.md)
- [Test Page Documentation](../../../app/test/mtn-wholesale/README.md)
- [API Testing Guide](../../testing/API_TESTING.md)

## Change Log

### 2025-10-15
- Initial documentation created
- Added comprehensive API details
- Created test page at `/test/mtn-wholesale`
- Added integration patterns and examples

## Support
For API issues or questions:
- Technical Contact: MTN Business Support
- Internal: CircleTel Development Team
- Documentation: This file and related guides
