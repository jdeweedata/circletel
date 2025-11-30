import { redirect } from 'next/navigation';

/**
 * Coverage Page Redirect
 * Redirects /coverage to /order/coverage
 */
export default function CoveragePage() {
  redirect('/order/coverage');
}
