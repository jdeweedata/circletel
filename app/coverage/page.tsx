import { redirect } from 'next/navigation';

/**
 * Coverage Page Redirect
 * Redirects /coverage to the homepage coverage checker
 */
export default function CoveragePage() {
  redirect('/');
}
