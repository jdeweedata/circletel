import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'System Status | CircleTel',
  description:
    'Real-time system status and incident updates for CircleTel services',
  openGraph: {
    title: 'CircleTel System Status',
    description: 'Check the current status of CircleTel services',
  },
}

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-ui-bg">
      {/* Header */}
      <header className="bg-white border-b border-ui-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.svg"
                alt="CircleTel"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-lg font-semibold text-ui-text-primary">
                CircleTel
              </span>
            </Link>
            <span className="text-sm text-ui-text-muted">System Status</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-ui-border mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-ui-text-muted">
              &copy; {new Date().getFullYear()} CircleTel. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-ui-text-muted hover:text-ui-text-primary"
              >
                Home
              </Link>
              <Link
                href="/contact"
                className="text-sm text-ui-text-muted hover:text-ui-text-primary"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
