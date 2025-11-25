-- Enable RLS
alter table if exists pages enable row level security;
alter table if exists media_library enable row level security;

-- Create pages table
create table if not exists pages (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  content_type text not null, -- 'landing', 'blog', 'product', 'case_study', 'announcement'
  status text default 'draft', -- 'draft', 'in_review', 'scheduled', 'published', 'archived'
  content jsonb not null,
  content_history jsonb default '[]'::jsonb, -- Version history
  seo_metadata jsonb,
  featured_image text, -- Supabase Storage URL
  author_id uuid references auth.users(id),
  scheduled_at timestamp with time zone, -- For scheduled publishing
  published_at timestamp with time zone,
  thought_signature text, -- Gemini 3 reasoning context (CRITICAL for follow-up edits)
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for pages
create index if not exists pages_status_idx on pages(status);
create index if not exists pages_author_idx on pages(author_id);
create index if not exists pages_slug_idx on pages(slug);
create index if not exists pages_content_type_idx on pages(content_type);
create index if not exists pages_published_at_idx on pages(published_at);

-- Create media_library table
create table if not exists media_library (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  storage_path text not null,
  public_url text not null,
  file_type text, -- 'image/png', 'image/jpeg', 'image/webp'
  size_bytes integer,
  width integer,
  height integer,
  alt_text text,
  tags text[],
  uploaded_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- Indexes for media_library
create index if not exists media_library_uploaded_by_idx on media_library(uploaded_by);
create index if not exists media_library_created_at_idx on media_library(created_at desc);

-- Create AI generation usage tracking table
create table if not exists cms_ai_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  generation_type text not null, -- 'content', 'image'
  tokens_used integer,
  cost_estimate numeric(10, 4),
  created_at timestamp with time zone default now()
);

-- Index for usage tracking
create index if not exists cms_ai_usage_user_idx on cms_ai_usage(user_id, created_at desc);

-- RLS Policies (Integrated with CircleTel RBAC)

-- Pages Policies
drop policy if exists "Users with cms:view can view all pages" on pages;
create policy "Users with cms:view can view all pages"
  on pages for select
  using (
    -- Users can view their own drafts
    auth.uid() = author_id
    -- Or published pages (public)
    or status = 'published'
    -- Or users with cms:view permission
    or user_has_permission(auth.uid(), 'cms:view')
  );

drop policy if exists "Users with cms:create can insert pages" on pages;
create policy "Users with cms:create can insert pages"
  on pages for insert
  with check (
    user_has_permission(auth.uid(), 'cms:create')
    and auth.uid() = author_id
  );

drop policy if exists "Users with cms:edit can update pages" on pages;
create policy "Users with cms:edit can update pages"
  on pages for update
  using (
    -- Authors can update their own pages
    (auth.uid() = author_id and user_has_permission(auth.uid(), 'cms:edit'))
    -- Or users with cms:publish can update any page
    or user_has_permission(auth.uid(), 'cms:publish')
  );

drop policy if exists "Users with cms:delete can delete pages" on pages;
create policy "Users with cms:delete can delete pages"
  on pages for delete
  using (
    user_has_permission(auth.uid(), 'cms:delete')
  );

-- Media Library Policies
drop policy if exists "Users with cms:view can view media" on media_library;
create policy "Users with cms:view can view media"
  on media_library for select
  using (
    user_has_permission(auth.uid(), 'cms:view')
  );

drop policy if exists "Users with cms:create can upload media" on media_library;
create policy "Users with cms:create can upload media"
  on media_library for insert
  with check (
    user_has_permission(auth.uid(), 'cms:create')
    and auth.uid() = uploaded_by
  );

drop policy if exists "Users can update own media or with cms:edit" on media_library;
create policy "Users can update own media or with cms:edit"
  on media_library for update
  using (
    auth.uid() = uploaded_by
    or user_has_permission(auth.uid(), 'cms:edit')
  );

drop policy if exists "Users with cms:delete can delete media" on media_library;
create policy "Users with cms:delete can delete media"
  on media_library for delete
  using (
    user_has_permission(auth.uid(), 'cms:delete')
  );

-- AI Usage Tracking Policies
alter table cms_ai_usage enable row level security;

drop policy if exists "Users can view own usage" on cms_ai_usage;
create policy "Users can view own usage"
  on cms_ai_usage for select
  using (
    auth.uid() = user_id
    or user_has_permission(auth.uid(), 'cms:view')
  );

drop policy if exists "System can insert usage records" on cms_ai_usage;
create policy "System can insert usage records"
  on cms_ai_usage for insert
  with check (
    auth.uid() = user_id
  );

-- ==================================================
-- Supabase Storage Configuration
-- ==================================================

-- Create cms-media bucket
insert into storage.buckets (id, name, public)
values ('cms-media', 'cms-media', true)
on conflict (id) do nothing;

-- Storage Policies for cms-media bucket
drop policy if exists "Authenticated users can upload media" on storage.objects;
create policy "Authenticated users can upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'cms-media'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Public can view media" on storage.objects;
create policy "Public can view media"
  on storage.objects for select
  using (
    bucket_id = 'cms-media'
  );

drop policy if exists "Users can update own media files" on storage.objects;
create policy "Users can update own media files"
  on storage.objects for update
  using (
    bucket_id = 'cms-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own media files" on storage.objects;
create policy "Users can delete own media files"
  on storage.objects for delete
  using (
    bucket_id = 'cms-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
