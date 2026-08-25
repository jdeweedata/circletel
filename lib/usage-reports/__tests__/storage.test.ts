import type { SupabaseClient } from '@supabase/supabase-js';
import {
  deleteReportArtifact,
  signedReportUrl,
  uploadReportArtifact,
} from '../storage';

function storageClient(overrides: Record<string, jest.Mock> = {}) {
  const bucket = {
    upload: jest.fn().mockResolvedValue({
      data: { path: 'jobs/job-1/report.zip' },
      error: null,
    }),
    createSignedUrl: jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.test/signed' },
      error: null,
    }),
    remove: jest.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
  const from = jest.fn().mockReturnValue(bucket);

  return {
    client: { storage: { from } } as unknown as SupabaseClient,
    bucket,
    from,
  };
}

describe('site usage report storage', () => {
  it('uploads bytes to the private report bucket', async () => {
    const { client, bucket, from } = storageClient();
    const bytes = Buffer.from('report');

    const path = await uploadReportArtifact(
      client,
      'jobs/job-1/report.zip',
      bytes,
      'application/zip'
    );

    expect(from).toHaveBeenCalledWith('site-usage-reports');
    expect(bucket.upload).toHaveBeenCalledWith('jobs/job-1/report.zip', bytes, {
      contentType: 'application/zip',
      upsert: false,
    });
    expect(path).toBe('jobs/job-1/report.zip');
  });

  it('creates a signed URL with the requested lifetime', async () => {
    const { client, bucket } = storageClient();

    const url = await signedReportUrl(client, 'jobs/job-1/report.zip', 900);

    expect(bucket.createSignedUrl).toHaveBeenCalledWith(
      'jobs/job-1/report.zip',
      900
    );
    expect(url).toBe('https://storage.test/signed');
  });

  it('deletes the requested report artifact', async () => {
    const { client, bucket } = storageClient();

    await deleteReportArtifact(client, 'jobs/job-1/report.zip');

    expect(bucket.remove).toHaveBeenCalledWith(['jobs/job-1/report.zip']);
  });

  it('surfaces storage errors without losing their context', async () => {
    const { client } = storageClient({
      remove: jest.fn().mockResolvedValue({
        error: { message: 'storage unavailable' },
      }),
    });

    await expect(
      deleteReportArtifact(client, 'jobs/job-1/report.zip')
    ).rejects.toThrow('Failed to delete report artifact: storage unavailable');
  });
});
