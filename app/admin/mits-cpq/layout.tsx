/**
 * MITS CPQ layout — no second full-page shell.
 * AdminLayoutClient already provides min-h-screen, gray-50, and content padding.
 */
export default function MITSCPQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
