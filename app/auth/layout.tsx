/**
 * Auth Layout
 *
 * Separate layout for authentication pages that excludes CustomerAuthProvider
 * to prevent competing Supabase client instances during password reset and
 * email verification flows.
 *
 * Pages under /auth/* will NOT have access to CustomerAuthProvider context,
 * which is intentional to avoid session conflicts during auth operations.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
