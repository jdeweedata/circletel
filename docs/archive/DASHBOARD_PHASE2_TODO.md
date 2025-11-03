# Dashboard Phase 2 - UI Update Required

## Current Status
✅ **Backend Working:** API endpoints fetch real data  
✅ **Database Working:** Customer data exists and is linked  
✅ **Data Fetching Working:** Frontend successfully retrieves data  
❌ **UI Display:** Still showing placeholder/mock data

## The Problem
The `DashboardContent` component (lines 161-312 in `app/dashboard/page.tsx`) receives real data via props but doesn't use it. It displays hardcoded placeholder content instead:

- "Premium Family" instead of real package name
- "$15/mo" instead of real price in ZAR
- "Lagos, Nigeria" instead of South African location
- Fake card numbers and data usage

## What Needs to Be Done

### Option 1: Quick Fix (Recommended for MVP)
Replace the entire `DashboardContent` component with a simple version that displays real data:

```tsx
function DashboardContent({ data }: { data: DashboardData }) {
  const displayName = [data.customer.firstName, data.customer.lastName]
    .filter(Boolean).join(' ') || data.customer.email;
  const primaryService = data.services[0];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {displayName}!</h1>
        <p className="text-orange-100">Here's your account overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Active Services" value={data.stats.activeServices} />
        <StatsCard title="Total Orders" value={data.stats.totalOrders} />
        <StatsCard title="Account Balance" value={`R${data.stats.accountBalance.toFixed(2)}`} />
        <StatsCard title="Pending Orders" value={data.stats.pendingOrders} />
      </div>

      {/* Service Card */}
      {primaryService && (
        <Card>
          <CardHeader>
            <CardTitle>Your Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{primaryService.package_name}</h3>
                <p className="text-sm text-gray-600">{primaryService.service_type}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Speed</p>
                  <p className="font-medium">{primaryService.speed_down}/{primaryService.speed_up} Mbps</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly</p>
                  <p className="font-medium">R{primaryService.monthly_price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge>{primaryService.status}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Card */}
      {data.billing && (
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="font-medium">R{data.billing.account_balance.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Billing</p>
                <p className="font-medium">
                  {data.billing.next_billing_date 
                    ? new Date(data.billing.next_billing_date).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Option 2: Full UI Redesign (Phase 2)
Keep the current fancy UI but replace all hardcoded values with real data from the `data` prop. This requires:
1. Updating every hardcoded string
2. Adding CircleTel branding (orange colors)
3. Removing "Share" references
4. Changing currency from $ to R
5. Updating location to South Africa

## Estimated Time
- **Option 1 (Quick Fix):** 2 hours
- **Option 2 (Full Redesign):** 8-12 hours

## Recommendation
Implement Option 1 now to get a functional dashboard with real data, then do Option 2 as part of Phase 2 UI polish.
