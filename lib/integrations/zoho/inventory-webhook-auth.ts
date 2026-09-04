import crypto from 'crypto';

export function zohoInventoryWebhookSignature(headers: {
  get(name: string): string | null;
}): string | null {
  return (
    headers.get('x-zoho-webhook-signature') ||
    headers.get('x-zoho-signature')
  );
}

function signaturesMatch(received: string, expectedHex: string): boolean {
  try {
    const a = Buffer.from(received);
    const b = Buffer.from(expectedHex);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function authorizeZohoInventoryWebhook(input: {
  payload: string;
  signature: string | null;
  secret: string | null | undefined;
}): 'ok' | 'unauthorized' {
  const secret = input.secret?.trim() || '';
  const signature = input.signature?.trim() || '';
  if (!secret || !signature) return 'unauthorized';

  const expectedHex = crypto.createHmac('sha256', secret).update(input.payload).digest('hex');
  return signaturesMatch(signature, expectedHex) ? 'ok' : 'unauthorized';
}
