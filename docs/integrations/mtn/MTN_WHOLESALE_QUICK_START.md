# MTN Wholesale API - Quick Start Guide

## 5-Minute Setup

### 1. Access the Test Page
Navigate to: `http://localhost:3006/test/mtn-wholesale`

### 2. Select a Product
- Wait for products to load (happens automatically)
- Select an MTN product from the dropdown
- If products don't load, click "Refresh Products"

### 3. Test a Single Location

#### Option A: Using the Map
1. Click anywhere on the Google Map
2. A marker will appear showing your selected location
3. The coordinates will auto-fill in the input fields
4. Click "Check Feasibility"

#### Option B: Manual Entry
1. Enter latitude (e.g., `-26.204100`)
2. Enter longitude (e.g., `28.047300`)
3. Optionally add an address label (e.g., "Sandton")
4. Click "Check Feasibility"

### 4. Test Multiple Locations
1. Switch to the "Bulk Check" tab
2. Enter locations in the text area (one per line):
   ```
   -26.204100, 28.047300, Sandton
   -26.107361, 28.056667, Pretoria
   -33.925839, 18.423218, Cape Town
   ```
3. Click "Check All Locations"
4. View results for all locations in the table

### 5. Understand the Results

#### Result Badges
- 🟢 **Green "Feasible"**: MTN service is available at this location
- 🔴 **Red "Not Feasible"**: MTN service is NOT available at this location

#### Result Table Columns
- **Location**: Address or coordinates
- **Coordinates**: Exact latitude/longitude tested
- **Product**: MTN product name
- **Status**: Feasibility badge
- **Message**: Detailed API response message
- **Response Time**: API request duration in milliseconds

#### Summary Statistics
Below the results table:
- **Feasible Count**: Total locations with service
- **Not Feasible Count**: Total locations without service
- **Avg Response Time**: Average API response time

## Quick Test Coordinates

Copy and paste these into the bulk check:

```
-26.107361, 28.056667, Sandton Johannesburg
-25.747868, 28.229271, Pretoria CBD
-33.925839, 18.423218, Cape Town CBD
-26.204100, 28.047300, Johannesburg CBD
-29.858680, 30.393530, Durban
```

## Troubleshooting

### Products Won't Load
**Solution**: Click "Refresh Products" button

### Map Not Showing
**Solution**: Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`

### "Please provide coordinates" Error
**Solution**: Click on the map OR enter latitude/longitude manually

### All Results Show "Not Feasible"
**Solution**: Try coordinates in major South African cities (Johannesburg, Cape Town, Pretoria)

## API Configuration

The test page uses these settings:
- **API URL**: `https://ftool.mtnbusiness.co.za`
- **API Key**: `bdaacbcae8ab77672e545649df54d0df`
- **Endpoints**:
  - GET `/api/v1/feasibility/product/wholesale/mns` (products)
  - POST `/api/v1/feasibility/product/wholesale/mns` (feasibility)

## Next Steps

### For Developers
1. Review the full API documentation: [MTN_WHOLESALE_API.md](./MTN_WHOLESALE_API.md)
2. Check the source code: `app/test/mtn-wholesale/page.tsx`
3. Explore integration patterns for your own code

### For Integration
1. Create a client class: `lib/coverage/mtn/mns-wholesale-client.ts`
2. Add to coverage aggregation: `lib/coverage/aggregation-service.ts`
3. Test with your existing coverage checker

### For Testing
1. Use the bulk check feature to test multiple locations
2. Export results (feature coming soon)
3. Compare with MTN's official coverage maps

## Example Integration Code

```typescript
// Simple integration example
async function checkMTNCoverage(lat: number, lng: number) {
  const response = await fetch(
    'https://ftool.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns',
    {
      method: 'POST',
      headers: {
        'X-API-Key': 'bdaacbcae8ab77672e545649df54d0df',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        productId: 'your-product-id', // Get from products endpoint
      }),
    }
  );

  const data = await response.json();
  return data.feasible || data.available;
}
```

## Support

Need help?
- Read the full documentation: [MTN_WHOLESALE_API.md](./MTN_WHOLESALE_API.md)
- Check the test page README: [Test Page Documentation](../../../app/test/mtn-wholesale/README.md)
- Contact the development team

## Pro Tips

1. **Use the map**: It's faster than typing coordinates
2. **Save common locations**: Keep a file of frequently tested coordinates
3. **Monitor response times**: Slow responses might indicate API issues
4. **Test in batches**: Use bulk check for efficiency
5. **Label your tests**: Add addresses to identify results easily

---

**Last Updated**: 2025-10-15
**Version**: 1.0
