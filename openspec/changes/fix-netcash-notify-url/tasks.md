## 1. NetCash Provider — Add m5 to form data

- [ ] 1.1 Add `m5?: string` field to `NetCashFormData` interface in `lib/payments/providers/netcash/netcash-provider.ts` (after line 45)
- [ ] 1.2 Add `m5: params.notifyUrl || this.notifyUrl` to the form data object in `initiate()` method (after line 183)
- [ ] 1.3 Fix default `notifyUrl` in constructor from `/api/payments/webhook` to `/api/payment/netcash/webhook` (line 121)

## 2. Initiate Route — Return form data for POST submission

- [ ] 2.1 Change `/api/payment/netcash/initiate/route.ts` response to return `{ paymentUrl, formData }` separately instead of building a combined GET URL (lines 115-120)
- [ ] 2.2 Remove the `URLSearchParams` GET URL construction block

## 3. Checkout Page — POST form submission

- [ ] 3.1 Replace `window.location.href = paymentUrl` in `app/order/checkout/page.tsx` with a hidden form POST: create a `<form>` element, set `method="POST"` and `action=paymentUrl`, add hidden inputs for each `formData` field, and submit
- [ ] 3.2 Add a loading state or overlay while the form submits to NetCash

## 4. Verification

- [ ] 4.1 Run `npm run type-check:memory` and fix any type errors
- [ ] 4.2 Verify no other callers of `/api/payment/netcash/initiate` are broken by the response shape change (grep for the endpoint path)
- [ ] 4.3 Test end-to-end: place a test order, confirm the POST form submits to NetCash with `m5` present, and verify the webhook receives a callback after payment
