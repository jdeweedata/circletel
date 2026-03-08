import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

/**
 * Disable Sanity Draft Mode
 *
 * Call this to exit preview mode and see published content only.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const redirectTo = searchParams.get('redirect') || '/';

  const draft = await draftMode();
  draft.disable();

  redirect(redirectTo);
}
