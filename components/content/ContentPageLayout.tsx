// components/content/ContentPageLayout.tsx
import Link from 'next/link';
import { PiArrowLeftBold } from 'react-icons/pi';
import { ReactNode } from 'react';

interface ContentPageLayoutProps {
  /** Page title displayed in header */
  title: string;
  /** Last updated date */
  lastUpdated?: string;
  /** Page content (sidebar + body) */
  children: ReactNode;
}

export function ContentPageLayout({
  title,
  lastUpdated,
  children,
}: ContentPageLayoutProps) {
  return (
    <>
      {/* Orange Header */}
      <section className="bg-gradient-to-br from-circleTel-orange via-circleTel-orange to-orange-500 text-white">
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            {/* Breadcrumb */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-8"
            >
              <PiArrowLeftBold className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading">
              {title}
            </h1>

            {lastUpdated && (
              <p className="mt-4 text-white/70 text-sm">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>

          {/* Curved bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-50 rounded-t-[2rem]" />
        </div>
      </section>

      {/* Main Content - Two Column Layout */}
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
