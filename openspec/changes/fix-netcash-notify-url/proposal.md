## Why

Customer payments via NetCash Pay Now are stuck in "Created" status and never transition to "Completed" because the server-to-server notification URL (`m5` parameter) is missing from the payment form data. Without `m5`, NetCash has no endpoint to POST payment confirmation to, so CircleTel never learns that a payment succeeded — even when the customer completes payment on NetCash's side. This is a revenue-blocking bug affecting every new consumer order.

## What Changes

- **Add `m5` (notify URL) to NetCash form data**: The `notifyUrl` is already loaded from environment variables and passed through the provider abstraction, but never included in the `NetCashFormData` object sent to NetCash's gateway.
- **Switch from GET redirect to POST form submission**: The current implementation builds a GET URL with query parameters. NetCash Pay Now recommends POST form submission for reliability and to avoid URL length limits with many parameters.
- **Add webhook endpoint validation**: Verify the webhook endpoint (`/api/payment/netcash/webhook`) is reachable from external IPs and correctly processes the NetCash callback format.

## Capabilities

### New Capabilities

- `netcash-notify-url`: Fix payment notification flow by including `m5` parameter in NetCash Pay Now form data and switching to POST-based form submission.

### Modified Capabilities

_(none — no existing spec-level requirements are changing)_

## Impact

- **Code**: `lib/payments/providers/netcash/netcash-provider.ts` (add `m5` to form data), `app/api/payment/netcash/initiate/route.ts` (return form data for POST instead of GET URL), `app/order/checkout/page.tsx` (submit via hidden form POST instead of `window.location.href`)
- **APIs**: `/api/payment/netcash/initiate` response shape changes (returns `formData` + `paymentUrl` separately instead of a combined GET URL)
- **Dependencies**: No new dependencies
- **Systems**: NetCash Pay Now webhook must be able to reach `https://www.circletel.co.za/api/payment/netcash/webhook` — verify no firewall/middleware blocking
