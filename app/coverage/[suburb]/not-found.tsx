import Link from 'next/link';

export default function CoverageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Coverage area not found
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          Check your address directly to see available internet services in your area.
        </p>
        <Link
          href="/order/coverage"
          className="inline-block px-8 py-4 bg-circleTel-orange text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
        >
          Check Your Address
        </Link>
      </div>
    </div>
  );
}
