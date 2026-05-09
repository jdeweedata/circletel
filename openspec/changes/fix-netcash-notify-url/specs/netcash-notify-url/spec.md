## ADDED Requirements

### Requirement: NetCash form data includes notify URL
The system SHALL include the `m5` parameter (server-to-server notification URL) in every NetCash Pay Now form submission. The value MUST be a publicly reachable HTTPS URL pointing to the webhook handler.

#### Scenario: Payment initiation includes m5 parameter
- **WHEN** a payment is initiated via the NetCash provider
- **THEN** the form data object MUST contain an `m5` field set to the webhook URL (e.g., `https://www.circletel.co.za/api/payment/netcash/webhook`)

#### Scenario: Explicit notifyUrl parameter takes precedence
- **WHEN** a payment is initiated with an explicit `notifyUrl` in the initiation params
- **THEN** the `m5` field MUST use the explicitly provided `notifyUrl` instead of the provider's default

#### Scenario: Provider default notifyUrl is correct
- **WHEN** no explicit `notifyUrl` is provided in the initiation params
- **THEN** the `m5` field MUST use the provider's default notify URL constructed from `NEXT_PUBLIC_BASE_URL` + `/api/payment/netcash/webhook`

### Requirement: Payment form submitted via POST
The system SHALL submit payment data to NetCash via an HTML form POST, not a GET redirect with query parameters.

#### Scenario: Initiate API returns form data and payment URL separately
- **WHEN** the `/api/payment/netcash/initiate` endpoint returns successfully
- **THEN** the response MUST contain `paymentUrl` (the gateway base URL) and `formData` (key-value pairs) as separate fields

#### Scenario: Checkout page submits POST form to NetCash
- **WHEN** the checkout page receives the payment initiation response
- **THEN** it MUST create a hidden HTML form with `method="POST"` and `action` set to `paymentUrl`, populate hidden inputs from `formData`, and submit the form programmatically

#### Scenario: Credentials not exposed in URL
- **WHEN** a payment is submitted to NetCash
- **THEN** the service key (`m1`), PCI vault key (`m2`), and all other form parameters MUST NOT appear in the browser URL bar, browser history, or server access logs as query parameters

### Requirement: NetCashFormData interface includes m5
The `NetCashFormData` TypeScript interface SHALL declare `m5` as an optional string field for the server notification URL.

#### Scenario: Type-safe m5 field
- **WHEN** building a `NetCashFormData` object with an `m5` value
- **THEN** TypeScript MUST accept the assignment without requiring the index signature fallback
