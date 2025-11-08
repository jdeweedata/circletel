import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Exit Preview Mode Route Handler
 *
 * This route disables Next.js draft mode and redirects to the homepage.
 * Users can visit /api/exit-preview to exit preview mode.
 */
export async function GET() {
  const draft = await draftMode()
  draft.disable()

  redirect('/')
}
