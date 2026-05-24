import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  PiCaretDownBold,
  PiCheckCircleBold,
  PiPackageBold,
  PiShieldCheckBold,
  PiTruckBold,
  PiWhatsappLogoBold,
} from 'react-icons/pi'

import { getHardwareProductBySlug } from '@/lib/hardware-catalogue/queries'
import { getStockDisplay } from '@/lib/hardware-catalogue/types'
import { PriceDisplay } from '@/components/hardware/PriceDisplay'
import { StockBadge } from '@/components/hardware/StockBadge'
import { ServiceLinks } from '@/components/hardware/ServiceLinks'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getHardwareProductBySlug(slug)
  if (!product) return { title: 'Product Not Found | CircleTel' }

  return {
    title: `${product.name} | CircleTel`,
    description:
      product.description ||
      `${product.name} — available from CircleTel with ${product.warranty_months || 12} month warranty.`,
  }
}

export default async function HardwareProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getHardwareProductBySlug(slug)

  if (!product) notFound()

  const stock = getStockDisplay(product)

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1B2A4A]">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="bg-white">
          <div className="container mx-auto grid gap-12 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            {/* Left: Image + details */}
            <div>
              {product.category && (
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#AE5B16]">
                  {product.category}
                </p>
              )}
              <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-6xl">
                {product.name}
              </h1>

              {/* Product image */}
              <div className="mt-10 flex min-h-[400px] items-center justify-center rounded-[28px] bg-gradient-to-b from-white to-[#FDF2E9] p-8">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={680}
                    height={520}
                    priority
                    className="h-auto max-h-[390px] w-auto object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div className="text-center text-[#7C93AF]">
                    <div className="mb-4 text-8xl">📦</div>
                    <p className="text-lg font-semibold">Product image coming soon</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Pricing sidebar */}
            <aside className="self-start rounded-2xl bg-white p-6 shadow-xl ring-1 ring-[#E5E7EB] lg:sticky lg:top-32">
              <h2 className="text-2xl font-bold">Product Details</h2>
              <p className="mt-3 text-base font-semibold leading-7 text-[#31527B]">
                {product.description || `${product.name} — available from CircleTel.`}
              </p>

              <ul className="mt-5 space-y-3">
                {/* Stock */}
                <li className="flex gap-3 text-sm font-semibold">
                  <StockBadge stock={stock} />
                </li>

                {/* Warranty */}
                {product.warranty_months && (
                  <li className="flex gap-3 text-sm font-semibold text-[#31527B]">
                    <PiShieldCheckBold className="mt-0.5 h-5 w-5 flex-none text-[#E87A1E]" />
                    <span>{product.warranty_months} month manufacturer warranty</span>
                  </li>
                )}

                {/* Delivery */}
                <li className="flex gap-3 text-sm font-semibold text-[#31527B]">
                  <PiTruckBold className="mt-0.5 h-5 w-5 flex-none text-[#E87A1E]" />
                  <span>Free nationwide delivery</span>
                </li>
              </ul>

              {/* Price */}
              <div className="mt-7 border-y border-[#DDE7F3] py-6">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#31527B]">Price</span>
                  <PriceDisplay
                    retailPrice={product.retail_price}
                    size="lg"
                    showVatNote
                  />
                </div>
                {product.best_supplier_cost && (
                  <p className="mt-1 text-xs text-[#7C93AF]">
                    Supplier cost: R
                    {product.best_supplier_cost.toLocaleString('en-ZA', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    excl VAT
                  </p>
                )}
              </div>

              {/* CTA */}
              <Link
                href={`/quotes/request?product=${product.slug}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#E87A1E] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#C45A30] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E87A1E] focus-visible:ring-offset-2"
              >
                Enquire Now
              </Link>
            </aside>
          </div>
        </section>

        {/* Specifications */}
        {product.specifications &&
          Object.keys(product.specifications).length > 0 && (
            <section className="bg-white pb-12">
              <div className="container mx-auto px-4">
                <div className="overflow-hidden rounded-2xl border border-[#DDE7F3] bg-white shadow-sm">
                  <div className="border-b border-[#DDE7F3] bg-[#F9FAFB] px-7 py-4">
                    <h2 className="text-sm font-bold text-[#1B2A4A]">
                      Specifications
                    </h2>
                  </div>
                  <div className="grid gap-10 p-6 md:p-8">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {Object.entries(product.specifications).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex flex-col gap-1 rounded-lg bg-[#F9FAFB] p-3"
                          >
                            <dt className="text-xs font-bold uppercase text-[#AE5B16]">
                              {key.replace(/_/g, ' ')}
                            </dt>
                            <dd className="text-sm font-semibold text-[#31527B]">
                              {String(value)}
                            </dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </section>
          )}

        {/* Service Links + Terms */}
        <section className="bg-[#E8F3FF] py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Service Links */}
              {product.service_links.length > 0 && (
                <ServiceLinks serviceLinks={product.service_links} />
              )}

              {/* Terms */}
              {product.terms && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#1B2A4A]">
                    Terms & Conditions
                  </p>
                  <div className="space-y-2 text-sm font-semibold text-[#31527B]">
                    {product.terms.is_back_to_back && (
                      <p className="flex items-center gap-2 text-xs text-[#AE5B16]">
                        <PiCheckCircleBold className="h-4 w-4" />
                        Back-to-back with supplier terms
                      </p>
                    )}
                    {product.terms.warranty_period && (
                      <div className="flex gap-3 rounded-lg border border-[#C7DAF1] bg-white p-3">
                        <PiShieldCheckBold className="mt-0.5 h-5 w-5 flex-none text-[#E87A1E]" />
                        <span>{product.terms.warranty_period}</span>
                      </div>
                    )}
                    {product.terms.return_policy && (
                      <div className="flex gap-3 rounded-lg border border-[#C7DAF1] bg-white p-3">
                        <PiPackageBold className="mt-0.5 h-5 w-5 flex-none text-[#E87A1E]" />
                        <span>{product.terms.return_policy}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact CTA */}
            <div className="mt-12 grid items-center gap-6 rounded-2xl bg-white/70 p-6 ring-1 ring-[#C7DAF1] md:grid-cols-[1fr_auto_auto]">
              <div>
                <p className="text-lg font-bold text-[#1B2A4A]">
                  Need help choosing?
                </p>
                <p className="mt-1 text-sm font-semibold text-[#4B5563]">
                  Our team can help you find the right hardware for your needs.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1B2A4A] px-6 py-3 text-sm font-bold text-[#1B2A4A] transition hover:bg-[#1B2A4A] hover:text-white"
              >
                <PiPackageBold className="h-5 w-5" />
                Contact Sales
              </Link>
              <a
                href="https://wa.me/27824873900"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition hover:brightness-95"
              >
                <PiWhatsappLogoBold className="h-5 w-5" />
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Stock availability per branch */}
        {stock.branches.some((b) => b.count > 0) && (
          <section className="bg-[#1B2A4A] py-8 text-white">
            <div className="container mx-auto px-4">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white/60">
                Stock Availability by Branch
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {stock.branches.map((branch) => (
                  <div
                    key={branch.name}
                    className="rounded-lg bg-white/10 p-3 text-center"
                  >
                    <p className="text-xs font-semibold text-white/60">
                      {branch.label}
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {branch.has_stock ? branch.count : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
