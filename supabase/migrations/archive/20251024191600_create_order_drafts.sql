-- Create order_drafts table to persist in-progress orders per user
create table if not exists public.order_drafts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_drafts_auth_user_idx on public.order_drafts(auth_user_id);
create unique index if not exists order_drafts_auth_user_uidx on public.order_drafts(auth_user_id);

-- Row Level Security
alter table public.order_drafts enable row level security;

-- Policies: user can manage only their draft
create policy "order_drafts_select_own" on public.order_drafts
  for select using (auth.uid() = auth_user_id);

create policy "order_drafts_insert_own" on public.order_drafts
  for insert with check (auth.uid() = auth_user_id);

create policy "order_drafts_update_own" on public.order_drafts
  for update using (auth.uid() = auth_user_id);

create policy "order_drafts_delete_own" on public.order_drafts
  for delete using (auth.uid() = auth_user_id);

-- Trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_order_drafts_updated_at
before update on public.order_drafts
for each row execute function public.set_updated_at();
