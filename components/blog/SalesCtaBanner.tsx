import Link from 'next/link'

export function SalesCtaBanner() {
  return (
    <section className="mt-12 py-8 px-6 bg-[#1B2A4A] rounded-lg text-center">
      <h2 className="text-2xl font-bold text-white mb-3">Ready to get connected?</h2>
      <p className="text-neutral-300 mb-6 max-w-md mx-auto">
        Explore our internet plans and check your coverage today.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-[#F5831F] text-white font-semibold rounded-lg hover:bg-[#E87A1E] transition"
      >
        Check your coverage
      </Link>
    </section>
  )
}
