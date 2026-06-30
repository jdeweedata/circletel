# Admin-Assisted B2B Onboarding

Last updated: 2026-06-30

## Admin Entry Points

- Manual onboarding: `/admin/b2b/manual-intake`
- Onboarding pipeline: `/admin/unjani/onboarding`
- Document vetting: `/admin/b2b/vetting`

Manual onboarding can create a new `customers` business record or update an existing B2B customer. It captures business details, site/contact details, the active billable service, and optional debit-order banking details received by email.

## Existing Customer Prefill

The manual onboarding screen includes an existing-customer lookup for business customers. Admins can search by business name, account number, email, phone, or registration number, then select a result to prepopulate the onboarding form from the customer record, latest onboarding submission, active service, and primary debit-order payment method.

Selecting a customer overwrites the form fields with the selected customer data. If the admin has already typed or changed any form values, the screen asks for confirmation before replacing those values.

For debit orders, prefill links the existing payment method and shows the last four digits where available, but it does not expose the stored full bank account number. If banking details need to change, the admin should enable debit-order capture and enter the new account details received from the customer.

## Client Onboarding Documents

Admin document upload now stores email provenance:

- `segment`
- email sender
- email subject
- email received timestamp
- uploading admin email

The provenance is stored on `kyc_documents.metadata`. When the upload creates a manual onboarding shell, the same provenance is also stored in `onboarding_submissions.submission_data.email_provenance`.

The same upload modal is available from manual onboarding after an existing customer has been selected or a new customer has been saved. The modal supports drag-and-drop or file picker upload, accepts multiple JPG, PNG, and PDF files up to 5MB each, lets the admin classify each queued file with its own document type, and uploads valid files sequentially through `/api/admin/b2b/upload-document`. Segment and email provenance apply to the client onboarding pack.

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
