import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

/**
 * Sanity Preview Route Handler
 *
 * Enables Next.js draft mode for Sanity Presentation tool.
 * When enabled, pages will fetch draft (unpublished) content.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Get the redirect path from Sanity
  const redirectTo = searchParams.get('redirect') || '/';

  // Enable Next.js draft mode
  const draft = await draftMode();
  draft.enable();

  // Redirect to the page being previewed
  redirect(redirectTo);
}
