import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'site-usage-reports';

function storageError(action: string, error: { message: string }): Error {
  return new Error(`Failed to ${action} report artifact: ${error.message}`);
}

export async function uploadReportArtifact(
  supabase: SupabaseClient,
  path: string,
  bytes: Buffer,
  contentType: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw storageError('upload', error);
  }

  return data.path;
}

export async function signedReportUrl(
  supabase: SupabaseClient,
  path: string,
  expiresSec = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresSec);

  if (error) {
    throw storageError('sign', error);
  }

  return data.signedUrl;
}

export async function deleteReportArtifact(
  supabase: SupabaseClient,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    throw storageError('delete', error);
  }
}
