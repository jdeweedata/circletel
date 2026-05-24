import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { ProductCard } from '@/components/hardware/ProductCard'
import { getHardwareProducts, getHardwareCategories } from '@/lib/hardware-catalogue/queries'

export const metadata: Metadata = {
  title: 'Hardware Products | CircleTel',
  description:
    'Browse networking hardware, streaming devices, routers, and accessories available from CircleTel.',
}

export default async function HardwareListingPage() {
  const [products, categories] = await Promise.all([
    getHardwareProducts({ status: 'published', page_size: 50 }),
    getHardwareCategories(),
  ])

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1B2A4A]">
      <Navbar />

      <main>
        {/* Header */}
        <section className="bg-white">
          <div className="container mx-auto px-4 py-16 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#AE5B16]">
              Hardware
            </p>
            <h1 className="text-4xl font-bold md:text-6xl">
              Networking & Streaming Hardware
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-[#31527B]">
              Quality hardware sourced from South Africa&apos;s top distributors.
              All products backed by manufacturer warranty and CircleTel support.
            </p>
          </div>
        </section>

        {/* Featured */}
        {products.data.filter((p) => p.is_featured).length > 0 && (
          <section className="bg-white pb-8">
            <div className="container mx-auto px-4">
              <h2 className="mb-6 text-2xl font-bold">Featured Products</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.data
                  .filter((p) => p.is_featured)
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* All Products */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
              {/* Category sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-32 space-y-6">
                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#7C93AF]">
                      Categories
                    </h3>
                    <nav className="space-y-1">
                      {categories.map((cat) => (
                        <a
                          key={cat}
                          href={`#${cat.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#31527B] transition hover:bg-[#FDF2E9] hover:text-[#AE5B16]"
                        >
                          {cat}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              </aside>

              {/* Product grid */}
              <div>
                {products.data.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="mb-4 text-6xl">📦</div>
                    <h2 className="text-2xl font-bold text-[#1B2A4A]">
                      No products yet
                    </h2>
                    <p className="mt-2 text-[#7C93AF]">
                      Check back soon for new hardware products.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {products.data.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination note */}
                {products.has_more && (
                  <div className="mt-8 text-center">
                    <p className="text-sm text-[#7C93AF]">
                      Showing {products.data.length} of {products.total}{' '}
                      products
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
