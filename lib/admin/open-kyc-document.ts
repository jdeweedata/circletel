/**
 * Open a private `kyc-documents` storage path in a new tab via signed URL.
 * Used for Service Order PDFs, KYC docs, etc.
 */
export async function openKycDocument(path: string): Promise<void> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';
  const response = await fetch(
    `/api/admin/kyc/document-url?path=${encodeURIComponent(path)}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'same-origin',
    }
  );
  const data = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    url?: string;
    error?: string;
  };
  if (!response.ok || !data.url) {
    throw new Error(data.error || 'Failed to open document');
  }
  window.open(data.url, '_blank', 'noopener,noreferrer');
}
