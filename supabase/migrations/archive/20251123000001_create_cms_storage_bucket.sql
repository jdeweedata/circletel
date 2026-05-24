-- Create Supabase Storage bucket for CMS media files
-- Following CircleTel storage pattern (partner_compliance_storage.sql)

-- Insert bucket configuration
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  true,  -- Public bucket for published images
  10485760,  -- 10MB file size limit
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
)
on conflict (id) do nothing;

-- RLS Policies for Storage Bucket

-- Allow authenticated users with cms:create permission to upload
create policy "CMS users can upload media files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'cms-media'
  and user_has_permission(auth.uid(), 'cms:create')
);

-- Allow authenticated users with cms:view to view media
create policy "CMS users can view media files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'cms-media'
  and user_has_permission(auth.uid(), 'cms:view')
);

-- Allow public viewing of published media (for published pages)
create policy "Public can view published media"
on storage.objects for select
to public
using (
  bucket_id = 'cms-media'
);

-- Allow users to update their own uploads or users with cms:edit
create policy "Users can update own media or with cms:edit"
on storage.objects for update
to authenticated
using (
  bucket_id = 'cms-media'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or user_has_permission(auth.uid(), 'cms:edit')
  )
);

-- Allow users with cms:delete to delete media
create policy "Users with cms:delete can delete media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'cms-media'
  and user_has_permission(auth.uid(), 'cms:delete')
);

-- Create helper function for organizing uploads by user and date
create or replace function get_cms_media_path(file_extension text)
returns text
language plpgsql
security definer
as $$
declare
  user_id_str text;
  date_path text;
begin
  -- Get current user ID
  user_id_str := auth.uid()::text;

  -- Create date-based folder structure: YYYY/MM/
  date_path := to_char(now(), 'YYYY/MM');

  -- Return path: user_id/YYYY/MM/filename.ext
  return user_id_str || '/' || date_path || '/' || gen_random_uuid()::text || file_extension;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function get_cms_media_path(text) to authenticated;

-- Add comment for documentation
comment on function get_cms_media_path is 'Generates organized storage path for CMS media uploads: user_id/YYYY/MM/uuid.ext';
