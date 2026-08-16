import { NextRequest } from 'next/server';
import { POST as installOrderPost } from '../route';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const body = await request.json().catch(() => ({}));
  const forwarded = new NextRequest(request.url.replace(/\/schedule$/, ''), {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ ...body, action: 'schedule' }),
  });
  return installOrderPost(forwarded, context);
}
