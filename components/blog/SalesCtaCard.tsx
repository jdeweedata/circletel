import Link from 'next/link'

export function SalesCtaCard() {
  return (
    <div className="p-6 border border-neutral-200 rounded-lg bg-white space-y-4">
      <div>
        <h3 className="text-base font-bold text-neutral-900 mb-2">Get connected</h3>
        <p className="text-sm text-neutral-600">
          Ready to upgrade your internet? Check your coverage and find the perfect plan.
        </p>
      </div>

      <Link
        href="/"
        className="block px-4 py-2.5 bg-[#F5831F] text-white text-sm font-semibold rounded-lg hover:bg-[#E87A1E] transition text-center"
      >
        Check your coverage
      </Link>

      <Link
        href="/packages"
        className="block px-4 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:border-[#F5831F] hover:text-[#F5831F] transition text-center"
      >
        View packages
      </Link>
    </div>
  )
}
