-- Store server-side OCR enrichment for sensitive KYC/onboarding documents.
-- The original document remains in the private kyc-documents bucket; this table
-- only stores extracted text/structure for admin review.

create table if not exists public.kyc_document_ocr_results (
  id uuid primary key default gen_random_uuid(),
  kyc_document_id uuid not null references public.kyc_documents(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed', 'skipped')),
  model text,
  markdown text,
  pages jsonb,
  blocks jsonb,
  confidence jsonb,
  usage_info jsonb,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kyc_document_ocr_results_document_unique unique (kyc_document_id)
);

create index if not exists idx_kyc_document_ocr_results_document
  on public.kyc_document_ocr_results(kyc_document_id);

create index if not exists idx_kyc_document_ocr_results_status
  on public.kyc_document_ocr_results(status);

drop trigger if exists update_kyc_document_ocr_results_updated_at
  on public.kyc_document_ocr_results;

create trigger update_kyc_document_ocr_results_updated_at
  before update on public.kyc_document_ocr_results
  for each row execute function public.update_updated_at_column();

alter table public.kyc_document_ocr_results enable row level security;

revoke all on table public.kyc_document_ocr_results from anon;
revoke all on table public.kyc_document_ocr_results from authenticated;

grant select on table public.kyc_document_ocr_results to authenticated;
grant select, insert, update, delete on table public.kyc_document_ocr_results to service_role;

create policy "Admins can read kyc document OCR results"
  on public.kyc_document_ocr_results
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users
      where admin_users.id = (select auth.uid())
        and coalesce(admin_users.is_active, true) = true
    )
  );

create policy "Service role can manage kyc document OCR results"
  on public.kyc_document_ocr_results
  for all
  to service_role
  using (true)
  with check (true);
