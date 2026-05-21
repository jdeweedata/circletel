# Vox LTE Order Journey

Competitor reference diagram — Vox v2 shop LTE purchase flow (fibre-not-available fallback path).

```mermaid
flowchart TD
    A[Home / Vox Shop entry<br/>/vox/v2/] --> B[Address / availability check]

    B --> C{Is fibre available?}

    C -- No --> D[Fibre not yet available<br/>/vox/v2/connectivity/lte#fibre-no-available]
    C -- Yes --> C1[Fibre package journey<br/>Not covered in this test]

    D --> E[Show alternative services<br/>LTE & 5G | Satellite | Wireless]

    E --> F[Customer selects LTE package<br/>Telkom LTE 12.5 GB / 12.5 GB<br/>R125.01 pm]

    F --> G[Enhancements / upsell page<br/>/vox/v2/connectivity/lte/enhancements]

    G --> H{Add optional extras?}

    H -- Router --> H1[Compatible routers<br/>ZTE U10 Pro / K12 / G5TS]
    H -- Mesh Wi-Fi --> H2[Home Mesh Wi-Fi add-ons]
    H -- Internet Security --> H3[Norton add-ons]
    H -- Voice --> H4[Uncapped Voice over LTE]
    H -- Skip add-ons --> I[Continue]

    H1 --> I
    H2 --> I
    H3 --> I
    H4 --> I

    I --> J[Order summary<br/>/vox/v2/order/summary]

    J --> K[Review cart<br/>Monthly: R125.01 pm<br/>Once-off: R149.01 order processing fee]

    K --> L[Click Check out]

    L --> M[Checkout login<br/>/vox/v2/checkout/login]

    M --> N[Enter mobile number<br/>OTP / mobile authentication step]

    N --> O[Account details<br/>/vox/v2/checkout/account-details]

    O --> P[Enter customer details<br/>Name<br/>Surname<br/>Email address]

    P --> Q{Purchasing for business?}

    Q -- Yes --> Q1[Business purchase branch<br/>Additional business identity context]
    Q -- No --> R[Personal identity details]

    Q1 --> R

    R --> S[Verify identity<br/>/vox/v2/checkout/personal-details]

    S --> T[Select ID Type]

    T --> U{ID Type selected}

    U -- South African ID Number --> U1[Enter SA ID Number]
    U -- Company Number --> U2[Enter Company Number]
    U -- Trust --> U3[Enter Trust details]
    U -- Government Department --> U4[Enter Government Department details]
    U -- Non-Profit Reg Number --> U5[Enter NPO Registration Number]
    U -- Passport / Other --> U6[Enter Passport / Other ID]

    U1 --> V{ID Number provided?}
    U2 --> V
    U3 --> V
    U4 --> V
    U5 --> V
    U6 --> V

    V -- No --> V1[Show validation error<br/>The ID Number field is required]
    V1 --> S

    V -- Yes --> W[Address step<br/>Expected next checkout route]

    W --> X[Payment step<br/>Expected next checkout route]

    X --> Y[Submit order]

    Y --> Z[Order confirmation]
```
