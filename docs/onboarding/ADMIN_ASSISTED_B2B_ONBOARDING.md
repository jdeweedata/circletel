# Admin-Assisted B2B Onboarding

Last updated: 2026-06-30

## Admin Entry Points

- Manual intake: `/admin/b2b/manual-intake`
- Onboarding pipeline: `/admin/unjani/onboarding`
- Document vetting: `/admin/b2b/vetting`

Manual intake can create a new `customers` business record or update an existing B2B customer. It captures business details, site/contact details, the active billable service, and optional debit-order banking details received by email.

## Document Intake

Admin document upload now stores email provenance:

- `segment`
- email sender
- email subject
- email received timestamp
- uploading admin email

The provenance is stored on `kyc_documents.metadata`. When the upload creates a manual onboarding shell, the same provenance is also stored in `onboarding_submissions.submission_data.email_provenance`.

## Service Order Signoff

Issuing a Service Order from admin now:

- generates and stores the PDF in the `kyc-documents` storage bucket
- records `service_order_pdf_path`, `service_order_issued_at`, and `service_order_pdf_sha256`
- creates a purpose-scoped `onboarding_tokens` row with `purpose = 'service_order_signoff'`
- emails the customer a signoff link at `/service-order/{token}`
- attaches the generated Service Order PDF to the email

Customer acceptance is recorded by `POST /api/service-order/accept` in `onboarding_submissions.submission_data.service_order_acceptance`. The accepted PDF is regenerated with acceptance evidence after signoff.

## Billing-Ready Gate

`maybeMarkBillingReady` now requires all of the following:

- latest onboarding submission has `document_vetting_status = 'approved'`
- Service Order PDF path exists
- Service Order acceptance evidence exists
- customer has an active service
- active debit-order payment method has both `account_number` and `branch_code`

Pending Netcash mandate status does not block billing-ready if the customer has accepted the Service Order debit-order mandate.
