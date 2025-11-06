import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CMS Demo | CircleTel',
  description: 'Demo pages showcasing Sanity CMS content',
}

export default function CMSDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">
              Sanity CMS Demo
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Visual showcase of all content types managed through Sanity CMS
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Pages */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-circleTel-darkNeutral ml-4">
                CMS Pages
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Static content pages managed through Sanity CMS with rich text content and SEO metadata.
            </p>
            <div className="space-y-2">
              <Link
                href="/cms-pages"
                className="block text-circleTel-orange hover:text-orange-600 underline"
              >
                View All Pages
              </Link>
              <Link
                href="/cms-pages/cloud-hosting-solutions"
                className="block text-sm text-gray-600 hover:text-gray-800"
              >
                → Cloud Hosting Solutions
              </Link>
              <Link
                href="/cms-pages/about-circletel"
                className="block text-sm text-gray-600 hover:text-gray-800"
              >
                → About CircleTel
              </Link>
            </div>
          </div>

          {/* Blog Posts */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-circleTel-darkNeutral ml-4">
                Blog Posts
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              News articles and blog posts with author information, publishing dates, and rich content.
            </p>
            <div className="space-y-2">
              <Link
                href="/cms-blog"
                className="block text-circleTel-orange hover:text-orange-600 underline"
              >
                View All Blog Posts
              </Link>
              <Link
                href="/cms-blog/new-1gbps-fibre-launch"
                className="block text-sm text-gray-600 hover:text-gray-800"
              >
                → 1Gbps Fibre Launch
              </Link>
              <Link
                href="/cms-blog/choosing-right-internet-package"
                className="block text-sm text-gray-600 hover:text-gray-800"
              >
                → Internet Package Guide
              </Link>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-circleTel-darkNeutral ml-4">
                Products
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Internet packages and services with pricing, features, and technical specifications.
            </p>
            <Link
              href="/cms-products"
              className="block text-circleTel-orange hover:text-orange-600 underline"
            >
              View All Products
            </Link>
          </div>

          {/* Sanity Studio */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-circleTel-darkNeutral ml-4">
                Sanity Studio
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Content management interface for creating and editing all content types.
            </p>
            <a
              href="http://localhost:3333"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-circleTel-orange hover:text-orange-600 underline"
            >
              Open Sanity Studio →
            </a>
          </div>

          {/* Development Info */}
          <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-circleTel-darkNeutral ml-4">
                Technical Implementation
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Content Management:</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Sanity CMS with real-time editing</li>
                  <li>• Portable text for rich content</li>
                  <li>• Image optimization and CDN</li>
                  <li>• SEO metadata management</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Next.js Integration:</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Server-side rendering (SSR)</li>
                  <li>• Dynamic routing with slugs</li>
                  <li>• Type-safe GROQ queries</li>
                  <li>• Responsive design with Tailwind</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}