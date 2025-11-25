import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

/**
 * Custom 404 Page for CMS Routes
 *
 * Displayed when:
 * - Page slug doesn't exist
 * - Page is not published
 * - Database error occurs
 */

export default function CMSNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-circleTel-lightNeutral to-white px-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <FileQuestion className="w-24 h-24 mx-auto text-circleTel-orange" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          The page you're looking for doesn't exist or is no longer available.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-4 bg-circleTel-orange text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
          >
            Go to Homepage
          </Link>

          <Link
            href="/packages"
            className="px-8 py-4 border-2 border-circleTel-orange text-circleTel-orange rounded-lg font-bold text-lg hover:bg-circleTel-orange hover:text-white transition-colors"
          >
            View Packages
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/packages" className="text-circleTel-orange hover:underline">
              Internet Packages
            </Link>
            <Link href="/coverage" className="text-circleTel-orange hover:underline">
              Coverage Check
            </Link>
            <Link href="/about" className="text-circleTel-orange hover:underline">
              About Us
            </Link>
            <Link href="/contact" className="text-circleTel-orange hover:underline">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
