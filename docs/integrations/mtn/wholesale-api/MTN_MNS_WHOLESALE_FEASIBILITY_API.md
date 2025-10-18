# MTN MNS Wholesale Feasibility API Documentation

**API Version:** 4.0.0
**OpenAPI Specification:** 3.0.0
**Last Updated:** October 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URLs](#base-urls)
4. [API Endpoints](#api-endpoints)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Integration Guide](#integration-guide)

---

## Overview

The MTN MNS Wholesale Feasibility API enables wholesale customers to perform feasibility checks for MTN wholesale products at specific geographic locations. This API supports bulk feasibility queries for multiple locations and products simultaneously.

### Key Features
- ✅ Bulk feasibility checks for multiple locations
- ✅ Multiple product support in single request
- ✅ Coordinate-based location queries (latitude/longitude)
- ✅ Product capacity information
- ✅ Regional product availability
- ✅ RESTful API with JSON responses

### Contact Information
- **Primary Contact:** jay.maduray@mtn.com
- **License:** BSD-3-Clause
- **License URL:** https://opensource.org/licenses/BSD-3-Clause

---

## Authentication

### API Key Authentication

The API uses API Key authentication via HTTP headers.

**Header Name:** `X-API-KEY`
**Authentication Type:** API Key (in header)

#### Your API Key
```
bdaacbcae8ab77672e545649df54d0df
```

#### Example Request with Authentication
```bash
curl -X GET "https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns" \
  -H "X-API-KEY: bdaacbcae8ab77672e545649df54d0df" \
  -H "Content-Type: application/json"
```

---

## Base URLs

### Testing Environment
**URL:** `https://asp-feasibility.mtnbusiness.co.za`
**Note:** Limited concurrency - for testing purposes only

### Production Environment (Recommended)
**URL:** `https://ftool.mtnbusiness.co.za`
**Note:** Use this server for production workloads

---

## API Endpoints

### 1. Get MNS Wholesale Product List

Retrieve the list of available MTN MNS Wholesale products.

#### Endpoint
```
GET /api/v1/feasibility/product/wholesale/mns
```

#### Description
Returns a list of MNS Wholesale product names that can be used in the feasibility check API.

#### Headers
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `X-API-KEY` | string | Yes | Your API authentication key |

#### Response (200 OK)
```json
{
  "error_code": "200",
  "error_message": "operation successful.",
  "results": [
    "Wholesale Business Broadband",
    "Wholesale Cloud Connect"
  ]
}
```

#### Response Schema
| Field | Type | Description |
|-------|------|-------------|
| `error_code` | string | HTTP status code |
| `error_message` | string | Operation result message |
| `results` | array[string] | List of available product names |

#### Error Responses
- **401 Unauthorized:** Invalid or missing API key
- **429 Too Many Requests:** Rate limit exceeded

---

### 2. Perform MNS Wholesale Feasibility Check

Execute a bulk feasibility check for multiple locations and products.

#### Endpoint
```
POST /api/v1/feasibility/product/wholesale/mns
```

#### Description
Perform feasibility checks for one or more locations against specified MNS wholesale products. Returns detailed feasibility information including product capacity and regional availability.

#### Headers
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `X-API-KEY` | string | Yes | Your API authentication key |
| `Content-Type` | string | Yes | Must be `application/json` |

#### Request Body

**Required Fields:**
- `inputs` - Array of location objects
- `product_names` - Array of product names to check
- `requestor` - Email address of the requestor

**Request Schema:**
```json
{
  "inputs": [
    {
      "latitude": "string",
      "longitude": "string",
      "customer_name": "string"
    }
  ],
  "product_names": [
    "string"
  ],
  "requestor": "string"
}
```

#### Request Body Parameters

##### `inputs` (required)
Array of location objects to check for feasibility.

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `latitude` | string | Yes | Geographic latitude coordinate | "-33.337222" |
| `longitude` | string | Yes | Geographic longitude coordinate | "18.1975" |
| `customer_name` | string | Yes | Name of the customer/location | "Wholesale Customer Pty LTD" |

##### `product_names` (required)
Array of product names to check. Use the product names from the GET endpoint.

**Type:** array[string]
**Example:** `["Wholesale Cloud Connect", "Wholesale Business Broadband"]`

##### `requestor` (required)
Email address of the person making the feasibility request.

**Type:** string
**Format:** email
**Example:** `"wholesale@mtn.com"`

#### Response (200 OK)
```json
{
  "error_code": "200",
  "error_message": "operation successful.",
  "outputs": [
    {
      "customer_name": "Wholesale Customer Pty LTD",
      "latitude": "-26.171060",
      "longitude": "27.954887",
      "product_results": [
        {
          "product_capacity": "10",
          "product_feasible": "yes",
          "product_name": "Wholesale Cloud Connect",
          "product_notes": "None",
          "product_region": "GAUTENG SOUTH"
        }
      ],
      "response_time_seconds": "2.66"
    }
  ]
}
```

#### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `error_code` | string | HTTP status code |
| `error_message` | string | Operation result message |
| `outputs` | array | Array of feasibility results for each location |

##### `outputs` Array Items

| Field | Type | Description |
|-------|------|-------------|
| `customer_name` | string | Customer/location name from request |
| `latitude` | string | Geographic latitude |
| `longitude` | string | Geographic longitude |
| `product_results` | array | Feasibility results for each product |
| `response_time_seconds` | string | Query execution time |

##### `product_results` Array Items

| Field | Type | Description | Possible Values |
|-------|------|-------------|-----------------|
| `product_capacity` | string | Available capacity/bandwidth | "10", "100", etc. |
| `product_feasible` | string | Feasibility status | "yes", "no" |
| `product_name` | string | Product name | From product list |
| `product_notes` | string | Additional information | "None" or detailed notes |
| `product_region` | string | MTN service region | "GAUTENG SOUTH", etc. |

#### Error Responses

##### 400 Bad Request
Invalid request format or missing required parameters.

```json
{
  "error_code": "400",
  "error_message": "operation failed: missing parameter"
}
```

##### 401 Unauthorized
Invalid or missing API key.

```json
{
  "error_code": "401",
  "error_message": "operation failed: unauthorized."
}
```

##### 429 Too Many Requests
Rate limit exceeded.

```html
<html>
  <h2>You have exceeded the maximum number of requests per minute allowed... Try again later.</h2>
</html>
```

##### 500 Internal Server Error
Database or server error.

```json
{
  "error_code": "500",
  "error_message": "operation failed: database error."
}
```

---

## Request/Response Examples

### Example 1: Check Single Location for One Product

#### Request
```bash
curl -X POST "https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns" \
  -H "X-API-KEY: bdaacbcae8ab77672e545649df54d0df" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": [
      {
        "latitude": "-33.337222",
        "longitude": "18.1975",
        "customer_name": "CircleTel Test Site"
      }
    ],
    "product_names": ["Wholesale Cloud Connect"],
    "requestor": "Lindokuhle.mdake@circletel.co.za"
  }'
```

#### Response
```json
{
  "error_code": "200",
  "error_message": "operation successful.",
  "outputs": [
    {
      "customer_name": "CircleTel Test Site",
      "latitude": "-33.337222",
      "longitude": "18.1975",
      "product_results": [
        {
          "product_capacity": "10",
          "product_feasible": "yes",
          "product_name": "Wholesale Cloud Connect",
          "product_notes": "None",
          "product_region": "WESTERN CAPE"
        }
      ],
      "response_time_seconds": "1.23"
    }
  ]
}
```

---

### Example 2: Bulk Check Multiple Locations and Products

#### Request
```bash
curl -X POST "https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns" \
  -H "X-API-KEY: bdaacbcae8ab77672e545649df54d0df" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": [
      {
        "latitude": "-26.171060",
        "longitude": "27.954887",
        "customer_name": "Johannesburg Office"
      },
      {
        "latitude": "-33.925839",
        "longitude": "18.423218",
        "customer_name": "Cape Town Office"
      },
      {
        "latitude": "-29.858680",
        "longitude": "31.021840",
        "customer_name": "Durban Office"
      }
    ],
    "product_names": [
      "Wholesale Business Broadband",
      "Wholesale Cloud Connect"
    ],
    "requestor": "Lindokuhle.mdake@circletel.co.za"
  }'
```

#### Response
```json
{
  "error_code": "200",
  "error_message": "operation successful.",
  "outputs": [
    {
      "customer_name": "Johannesburg Office",
      "latitude": "-26.171060",
      "longitude": "27.954887",
      "product_results": [
        {
          "product_capacity": "100",
          "product_feasible": "yes",
          "product_name": "Wholesale Business Broadband",
          "product_notes": "None",
          "product_region": "GAUTENG SOUTH"
        },
        {
          "product_capacity": "10",
          "product_feasible": "yes",
          "product_name": "Wholesale Cloud Connect",
          "product_notes": "None",
          "product_region": "GAUTENG SOUTH"
        }
      ],
      "response_time_seconds": "2.45"
    },
    {
      "customer_name": "Cape Town Office",
      "latitude": "-33.925839",
      "longitude": "18.423218",
      "product_results": [
        {
          "product_capacity": "50",
          "product_feasible": "yes",
          "product_name": "Wholesale Business Broadband",
          "product_notes": "None",
          "product_region": "WESTERN CAPE"
        },
        {
          "product_capacity": "10",
          "product_feasible": "yes",
          "product_name": "Wholesale Cloud Connect",
          "product_notes": "None",
          "product_region": "WESTERN CAPE"
        }
      ],
      "response_time_seconds": "2.12"
    },
    {
      "customer_name": "Durban Office",
      "latitude": "-29.858680",
      "longitude": "31.021840",
      "product_results": [
        {
          "product_capacity": "50",
          "product_feasible": "yes",
          "product_name": "Wholesale Business Broadband",
          "product_notes": "None",
          "product_region": "KWAZULU-NATAL"
        },
        {
          "product_capacity": "5",
          "product_feasible": "no",
          "product_name": "Wholesale Cloud Connect",
          "product_notes": "Limited capacity in region",
          "product_region": "KWAZULU-NATAL"
        }
      ],
      "response_time_seconds": "1.98"
    }
  ]
}
```

---

### Example 3: JavaScript/Node.js Integration

```javascript
const axios = require('axios');

const MTN_API_KEY = 'bdaacbcae8ab77672e545649df54d0df';
const MTN_BASE_URL = 'https://ftool.mtnbusiness.co.za';

async function checkFeasibility(locations, products, requestor) {
  try {
    const response = await axios.post(
      `${MTN_BASE_URL}/api/v1/feasibility/product/wholesale/mns`,
      {
        inputs: locations,
        product_names: products,
        requestor: requestor
      },
      {
        headers: {
          'X-API-KEY': MTN_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
    throw error;
  }
}

// Usage example
const locations = [
  {
    latitude: '-26.171060',
    longitude: '27.954887',
    customer_name: 'Test Location'
  }
];

const products = ['Wholesale Business Broadband'];

checkFeasibility(locations, products, 'your-email@circletel.co.za')
  .then(result => console.log('Feasibility Result:', JSON.stringify(result, null, 2)))
  .catch(error => console.error('Failed:', error));
```

---

### Example 4: Python Integration

```python
import requests
import json

MTN_API_KEY = 'bdaacbcae8ab77672e545649df54d0df'
MTN_BASE_URL = 'https://ftool.mtnbusiness.co.za'

def check_feasibility(locations, products, requestor):
    """
    Check MTN wholesale product feasibility for given locations.

    Args:
        locations: List of dicts with latitude, longitude, customer_name
        products: List of product names
        requestor: Email address of requestor

    Returns:
        API response dict
    """
    url = f'{MTN_BASE_URL}/api/v1/feasibility/product/wholesale/mns'

    headers = {
        'X-API-KEY': MTN_API_KEY,
        'Content-Type': 'application/json'
    }

    payload = {
        'inputs': locations,
        'product_names': products,
        'requestor': requestor
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f'HTTP Error: {e.response.status_code} - {e.response.text}')
        raise
    except requests.exceptions.RequestException as e:
        print(f'Request Error: {e}')
        raise

# Usage example
if __name__ == '__main__':
    locations = [
        {
            'latitude': '-26.171060',
            'longitude': '27.954887',
            'customer_name': 'Test Location'
        }
    ]

    products = ['Wholesale Business Broadband']

    result = check_feasibility(locations, products, 'your-email@circletel.co.za')
    print(json.dumps(result, indent=2))
```

---

## Error Handling

### Error Response Structure

All error responses follow a consistent structure:

```json
{
  "error_code": "string",
  "error_message": "string"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request format or missing parameters |
| 401 | Unauthorized | Invalid or missing API key |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Database or server error |

### Common Error Scenarios

#### Missing Required Parameters
**HTTP 400**
```json
{
  "error_code": "400",
  "error_message": "operation failed: missing parameter"
}
```

**Solution:** Ensure all required fields (`inputs`, `product_names`, `requestor`) are present in the request.

#### Invalid API Key
**HTTP 401**
```json
{
  "error_code": "401",
  "error_message": "operation failed: unauthorized."
}
```

**Solution:** Verify that the `X-API-KEY` header contains the correct API key.

#### Rate Limit Exceeded
**HTTP 429**
```html
<html>
  <h2>You have exceeded the maximum number of requests per minute allowed... Try again later.</h2>
</html>
```

**Solution:** Implement exponential backoff and retry logic. Wait before retrying the request.

#### Server Error
**HTTP 500**
```json
{
  "error_code": "500",
  "error_message": "operation failed: database error."
}
```

**Solution:** Retry the request after a short delay. If the error persists, contact MTN support.

---

## Rate Limiting

### Rate Limit Policy
The API implements rate limiting to ensure fair usage and system stability.

**Limit:** Maximum number of requests per minute (exact limit not specified)
**Response:** HTTP 429 when limit is exceeded

### Best Practices
1. **Implement Retry Logic:** Use exponential backoff when receiving 429 errors
2. **Batch Requests:** Combine multiple location checks into single requests
3. **Cache Results:** Store feasibility results to reduce API calls
4. **Monitor Usage:** Track your API usage to stay within limits

### Example Rate Limit Handler (JavaScript)

```javascript
async function apiCallWithRetry(apiFunction, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      if (error.response && error.response.status === 429) {
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw new Error('Max retries exceeded for rate limit');
        }
      } else {
        throw error;
      }
    }
  }
}

// Usage
await apiCallWithRetry(() => checkFeasibility(locations, products, requestor));
```

---

## Integration Guide

### Step 1: Obtain API Credentials
- **API Key:** `bdaacbcae8ab77672e545649df54d0df`
- **Contact:** jay.maduray@mtn.com for additional access or issues

### Step 2: Choose Environment
- **Testing:** `https://asp-feasibility.mtnbusiness.co.za` (limited concurrency)
- **Production:** `https://ftool.mtnbusiness.co.za` (recommended)

### Step 3: Get Available Products
Call the GET endpoint to retrieve the current list of wholesale products:

```bash
curl -X GET "https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns" \
  -H "X-API-KEY: bdaacbcae8ab77672e545649df54d0df"
```

### Step 4: Prepare Location Data
Gather the geographic coordinates for your target locations:
- **Latitude:** Decimal format (e.g., "-26.171060")
- **Longitude:** Decimal format (e.g., "27.954887")
- **Customer Name:** Descriptive location name

### Step 5: Make Feasibility Requests
Submit feasibility checks with your location data and desired products.

### Step 6: Process Results
Parse the API response to extract:
- Feasibility status (`product_feasible`: "yes" or "no")
- Available capacity (`product_capacity`)
- Regional information (`product_region`)
- Additional notes (`product_notes`)

### Step 7: Implement Error Handling
- Handle HTTP error codes appropriately
- Implement retry logic for rate limiting (429)
- Log errors for debugging and monitoring

### Step 8: Cache and Optimize
- Cache feasibility results to reduce API calls
- Batch multiple location checks in single requests
- Monitor response times and optimize as needed

---

## CircleTel Integration Notes

### Current Integration Points
- Coverage checker at `/app/api/coverage/mtn/check`
- Product matching in `/lib/coverage/product-matcher.ts`
- MTN WMS client in `/lib/coverage/mtn/wms-client.ts`

### Recommended Usage
1. **Coverage Checker:** Use this API to verify availability before offering products
2. **Product Catalog:** Sync available products with CircleTel's product database
3. **Regional Mapping:** Map MTN regions to CircleTel service areas
4. **Capacity Planning:** Track product capacity for better customer experience

### Implementation Checklist
- [ ] Update environment variables with API credentials
- [ ] Implement API client wrapper in `/lib/coverage/mtn/`
- [ ] Add error handling and retry logic
- [ ] Cache feasibility results (5-15 minute TTL)
- [ ] Monitor API usage and response times
- [ ] Create admin interface for API status monitoring

---

## API Specification (OpenAPI 3.0)

### Full OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  description: MTN
  version: 4.0.0
  title: TES-Feasibility-API
  contact:
    email: jay.maduray@mtn.com
  license:
    name: BSD-3-Clause
    url: https://opensource.org/licenses/BSD-3-Clause

servers:
  - url: https://ftool.mtnbusiness.co.za

tags:
  - name: MTN MNS
    description: API for performing Feasibilities

security:
  - ApiKeyAuth: []

paths:
  /api/v1/feasibility/product/wholesale/mns:
    get:
      tags:
        - Feasibility Study: MNS Wholesale Product Listing
      summary: Retrieve list of MNS Wholesale products
      responses:
        '200':
          description: Operation successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MNSWholesaleProductError200'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FeasibilityError401'
        '429':
          description: Too Many Requests
          content:
            text/html:
              schema:
                $ref: '#/components/schemas/FeasibilityError429'

    post:
      tags:
        - Feasibility Study: MNS Wholesale Products
      summary: Perform bulk MNS wholesale product feasibility
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/MNSWholesaleFeasibilityRequestBody'
      responses:
        '200':
          description: Operation successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MNSWholesaleFeasibilityError200'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WholesaleFeasibilityError400'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FeasibilityError401'
        '429':
          description: Too Many Requests
          content:
            text/html:
              schema:
                $ref: '#/components/schemas/FeasibilityError429'
        '500':
          description: Internal Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TechFeasibilityError500'

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-KEY

  schemas:
    # Error schemas omitted for brevity - see full spec above
```

---

## Support & Contact

### Technical Support
- **Primary Contact:** jay.maduray@mtn.com
- **CircleTel Contact:** Lindokuhle.mdake@circletel.co.za

### Documentation
- **OpenAPI Version:** 3.0.0
- **API Version:** 4.0.0
- **Last Updated:** October 2025

### Related Resources
- [MTN Business Portal](https://portal.mtnbusiness.co.za/)
- [Privacy Policy](https://www.mtnbusiness.com/en/Pages/privacy-policy.aspx)
- [Terms and Conditions](https://asp-feasibility.mtnbusiness.co.za/terms)

---

**© 2025 CircleTel (Pty) Ltd. | MTN Business Wholesale API Documentation**
