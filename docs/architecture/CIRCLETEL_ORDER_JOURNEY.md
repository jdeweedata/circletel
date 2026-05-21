# CircleTel Order Journey

Consumer order flow — from coverage check to payment confirmation.

## Entry Points

| Entry | Route | Redirects To |
|-------|-------|-------------|
| Homepage hero | `/` (coverage section) | `/packages/[leadId]?type=residential` |
| Coverage page (legacy) | `/order/coverage` | `/` (server redirect) |
| Product pages | Various `/products/*` | Homepage coverage check |
| 5G Deals | `/5g-deals` | Coverage check |

## Flow Diagram

```mermaid
flowchart TD
    A[Homepage<br/>/] --> B[Enter address<br/>Google Places autocomplete]

    B --> B1[Geocode address<br/>GET /api/geocode]
    B1 --> B2[Create coverage lead<br/>POST /api/coverage/lead]
    B2 --> B3[Load personalized packages<br/>GET /api/coverage/packages?leadId=xxx]

    B3 --> C{Coverage available?}

    C -- No --> D[No Coverage dialog<br/>Lead capture form]
    D --> D1[Submit interest<br/>POST /api/coverage/lead-capture]
    D1 --> D2[Thank you — we'll notify you]

    C -- Yes --> E[Package selection page<br/>/packages/leadId?type=residential]

    E --> F[Service type toggle<br/>Fibre | LTE | 5G | Wireless]

    F --> G[Browse available packages<br/>EnhancedPackageCard / CompactPackageCard]

    G --> G1[View package details<br/>PackageDetailSidebar]

    G1 --> H{Select add-ons?}

    H -- Entertainment bundle --> H1[Select streaming bundle<br/>e.g. Netflix, Showmax]
    H -- Router/Hardware --> H2[Select hardware add-on]
    H -- Skip add-ons --> I[Continue to checkout]

    H1 --> I
    H2 --> I

    I --> J{User authenticated?}

    J -- No --> K[Checkout — Account step<br/>/order/checkout]
    J -- Yes --> L[Checkout — Confirm step<br/>/order/checkout]

    K --> K1{Auth method}

    K1 -- Phone OTP --> K2[Enter phone number<br/>PhoneOTPSection]
    K1 -- Email/Password --> K3[Sign up or sign in<br/>AccountSection]
    K1 -- Google OAuth --> K4[Google sign-in<br/>redirects to Google]

    K2 --> K5[Verify OTP code]
    K5 --> L

    K3 --> L

    K4 --> K6[OAuth callback<br/>restore checkout state from sessionStorage]
    K6 --> L

    L --> L1[Service address section<br/>ServiceAddressSection]
    L1 --> L2[Select property type<br/>House / Apartment / Business / Estate]

    L2 --> L3{Wireless/Mobile package?}

    L3 -- Yes --> L4{Delivery address same<br/>as service address?}
    L3 -- No --> L5[Continue]

    L4 -- No --> L6[Enter separate delivery address]
    L4 -- Yes --> L5

    L6 --> L5

    L5 --> L7[Review order summary<br/>OrderSummarySidebar]
    L7 --> L8[Package + add-ons + VAT breakdown]

    L8 --> L9{Missing profile info?<br/>e.g. Google OAuth user}

    L9 -- Yes --> L10[Complete profile<br/>First name, last name, phone]
    L9 -- No --> M[Accept Terms & Conditions]

    L10 --> M

    M --> N[Place Order button]

    N --> N1[Create order<br/>POST /api/orders/create]
    N1 --> N2[Initiate R1.00 validation charge<br/>POST /api/payment/netcash/initiate]
    N2 --> N3[Redirect to NetCash Pay Now<br/>hidden form POST to paymentUrl]

    N3 --> O[NetCash payment gateway<br/>20+ payment methods]

    O --> P{Payment result}

    P -- Success --> Q[Payment callback<br/>/payment/callback?payment_method=success]
    P -- Cancelled --> R[Payment callback<br/>/payment/callback?payment_method=cancelled]
    P -- Error --> S[Payment callback<br/>/payment/callback?payment_method=error]

    Q --> Q1{User authenticated?}
    Q1 -- Yes --> Q2[Auto-redirect to dashboard<br/>/dashboard/billing<br/>5s countdown]
    Q1 -- No --> Q3[Show success + manual link]

    R --> R1[Show retry option<br/>link back to /payments/orderId]

    S --> S1[Show error + retry option]

    style A fill:#E87A1E,color:#fff
    style E fill:#1B2A4A,color:#fff
    style L fill:#1B2A4A,color:#fff
    style O fill:#4CAF50,color:#fff
    style Q fill:#4CAF50,color:#fff
    style D fill:#ef4444,color:#fff
    style R fill:#f59e0b,color:#fff
    style S fill:#ef4444,color:#fff
```

## Key Components

| Step | Component | Location |
|------|-----------|----------|
| Coverage check | `CoverageChecker` | `components/coverage/CoverageChecker.tsx` |
| Package selection | `PackagesContent` | `app/packages/[leadId]/page.tsx` |
| Service toggle | `ServiceToggle` | `components/ui/service-toggle.tsx` |
| Add-ons | `AddonsSelection` | `components/order/AddonsSelection.tsx` |
| Progress bar | `CheckoutProgressBar` | `components/order/CheckoutProgressBar.tsx` |
| Account auth | `AccountSection` | `components/order/checkout/AccountSection.tsx` |
| Phone OTP | `PhoneOTPSection` | `components/order/checkout/PhoneOTPSection.tsx` |
| Service address | `ServiceAddressSection` | `components/order/checkout/ServiceAddressSection.tsx` |
| Order summary | `OrderSummarySidebar` | `components/order/checkout/OrderSummarySidebar.tsx` |
| Payment callback | `PaymentCallbackPage` | `app/payment/callback/page.tsx` |

## Progress Bar Stages

| Stage | Label | Route |
|-------|-------|-------|
| `packages` | Choose Plan | `/packages/[leadId]` |
| `account` | Sign In | `/order/checkout` (account step) |
| `checkout` | Confirm & Pay | `/order/checkout` (confirm step) |

## State Management

Order state persisted via `OrderContext` (Zustand + localStorage). Survives page navigation and OAuth redirects. Google OAuth checkout state (service address, property type) saved to `sessionStorage` before redirect and restored on return.
