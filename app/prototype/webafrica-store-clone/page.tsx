import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  PiCaretDownBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiCheckCircleBold,
  PiPackageBold,
  PiShieldCheckBold,
  PiTruckBold,
  PiWhatsappLogoBold,
} from 'react-icons/pi'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'Store Product Prototype | CircleTel',
  description:
    'A local CircleTel prototype of a competitor-inspired hardware product detail layout.',
  robots: {
    index: false,
    follow: false,
  },
}

const highlights = [
  'Google TV streaming device with 4K output',
  'Preloaded for Netflix, YouTube, Prime Video and DStv Stream',
  'Pairs with CircleTel fibre, wireless and home internet bundles',
]

const orderLines = [
  {
    label: 'Mecool KM7 Plus Google TV box',
    terms: 'Payment Terms: Once-off',
    amount: 'R1 299.00',
  },
  {
    label: 'Online store processing fee',
    terms: 'Payment Terms: Once-off',
    amount: 'R199.00',
  },
  {
    label: 'Hardware delivery fee',
    terms: 'Nationwide courier delivery',
    amount: 'FREE',
    free: true,
  },
]

const specs = [
  ['Model', 'KM7 Plus'],
  ['Operating system', 'Google TV / Android TV'],
  ['Video output', '4K Ultra HD via HDMI'],
  ['Connectivity', 'Dual-band WiFi, Bluetooth, Ethernet'],
  ['Storage', '16 GB internal storage'],
  ['Remote', 'Bluetooth voice remote with Google Assistant'],
  ['Best paired with', 'CircleTel fibre or fixed wireless internet'],
]

const faqs = [
  {
    question: 'How do I set my hardware up?',
    answer:
      'Plug the device into HDMI, connect power, pair the remote, and sign in with your Google account. CircleTel support can guide you over WhatsApp if you get stuck.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Prototype assumption: 2 to 5 business days in major centres, with courier tracking once the order is dispatched.',
  },
  {
    question: 'Is there a warranty on my product?',
    answer:
      'The layout reserves space for a 12-month hardware warranty message, matching the competitor page pattern.',
  },
  {
    question: 'What if I need support for my product?',
    answer:
      'The review version routes support emphasis to WhatsApp and CircleTel customer care rather than an app download funnel.',
  },
]

export default function WebafricaStoreClonePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1B2A4A]">
      <Navbar />

      <main>
        <section className="bg-white">
          <div className="container mx-auto grid gap-12 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#AE5B16]">
                Streaming
              </p>
              <h1 className="max-w-2xl text-4xl font-bold leading-tight text-[#1B2A4A] md:text-6xl">
                Mecool KM7 Plus 4K Google TV Box
              </h1>

              <div className="mt-10 flex min-h-[420px] items-center justify-center rounded-[28px] bg-gradient-to-b from-white to-[#FDF2E9] p-8">
                <Image
                  src="/images/entertainment/mecool-km7plus.png"
                  alt="Mecool KM7 Plus Google TV box and remote"
                  width={680}
                  height={520}
                  priority
                  className="h-auto max-h-[390px] w-auto object-contain drop-shadow-2xl"
                />
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  aria-label="Previous product image"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1B2A4A] text-white transition hover:bg-[#0F1427] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E87A1E] focus-visible:ring-offset-2"
                >
                  <PiCaretLeftBold className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2" aria-label="Product image carousel position">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1B2A4A]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D7E3F2]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D7E3F2]" />
                </div>
                <button
                  type="button"
                  aria-label="Next product image"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1B2A4A] text-white transition hover:bg-[#0F1427] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E87A1E] focus-visible:ring-offset-2"
                >
                  <PiCaretRightBold className="h-5 w-5" />
                </button>
              </div>
            </div>

            <aside className="self-start rounded-2xl bg-white p-6 shadow-xl ring-1 ring-[#E5E7EB] lg:sticky lg:top-32">
              <h2 className="text-2xl font-bold text-[#1B2A4A]">Product highlights</h2>
              <p className="mt-3 text-base font-semibold leading-7 text-[#31527B]">
                Turn any HDMI screen into a streaming hub, then pair it with fast CircleTel
                connectivity for a cleaner home entertainment setup.
              </p>

              <ul className="mt-5 space-y-3">
                {highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3 text-sm font-semibold text-[#31527B]">
                    <PiCheckCircleBold className="mt-0.5 h-5 w-5 flex-none text-[#E87A1E]" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 divide-y divide-[#DDE7F3] border-y border-[#DDE7F3]">
                <div className="flex items-center justify-between py-4 text-sm font-bold">
                  <span className="flex items-center gap-2 text-[#31527B]">
                    <PiShieldCheckBold className="h-5 w-5 text-[#E87A1E]" />
                    12 month hardware warranty
                  </span>
                  <span className="text-[#E87A1E]">FREE</span>
                </div>
                {orderLines.map((line) => (
                  <div key={line.label} className="flex justify-between gap-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-[#31527B]">{line.label}</p>
                      <p className="mt-1 text-xs font-semibold text-[#6B7280]">{line.terms}</p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-bold ${
                        line.free ? 'text-[#E87A1E]' : 'text-[#1B2A4A]'
                      }`}
                    >
                      {line.amount}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between py-5">
                  <span className="text-base font-bold text-[#31527B]">Total</span>
                  <span className="text-xl font-bold text-[#1B2A4A]">R1 498.00</span>
                </div>
              </div>

              <Link
                href="/quotes/request"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#E87A1E] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#C45A30] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E87A1E] focus-visible:ring-offset-2"
              >
                Order Now
              </Link>
            </aside>
          </div>
        </section>

        <section className="bg-white pb-12">
          <div className="container mx-auto px-4">
            <div className="overflow-hidden rounded-2xl border border-[#DDE7F3] bg-white shadow-sm">
              <div className="flex border-b border-[#DDE7F3] bg-[#F9FAFB]">
                <button className="border-b-2 border-[#E87A1E] bg-white px-7 py-4 text-sm font-bold text-[#1B2A4A]">
                  Description
                </button>
                <button className="px-7 py-4 text-sm font-bold text-[#7C93AF]">
                  Features
                </button>
              </div>
              <div className="grid gap-10 p-6 md:p-8 lg:grid-cols-[1fr_380px]">
                <div className="space-y-5 text-base font-semibold leading-8 text-[#31527B]">
                  <p>
                    The KM7 Plus Google TV box gives households a compact way to stream
                    Netflix, YouTube, DStv Stream, Showmax and more without replacing the TV.
                  </p>
                  <p>
                    This clone keeps the competitor&apos;s clear shopping flow: product promise,
                    simple highlights, transparent fees, and a single action. Circletel can use
                    the pattern for entertainment bundles, routers, mesh WiFi or installation
                    add-ons.
                  </p>
                  <p>
                    For review, the order action points at the existing quote request route rather
                    than creating a new commerce flow.
                  </p>
                </div>

                <div className="rounded-xl bg-[#FDF2E9] p-5">
                  <h3 className="text-xl font-bold text-[#1B2A4A]">Specification</h3>
                  <dl className="mt-4 divide-y divide-orange-200/70">
                    {specs.map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[120px_1fr] gap-4 py-3 text-sm">
                        <dt className="font-bold text-[#AE5B16]">{label}</dt>
                        <dd className="font-semibold text-[#31527B]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#E8F3FF] py-16 md:py-24">
          <div className="pointer-events-none absolute left-[-90px] top-10 h-96 w-96 rounded-full border-[56px] border-[#BED7F5]/70" />
          <div className="pointer-events-none absolute right-[-120px] top-20 h-64 w-[560px] rotate-12 rounded-full bg-[#BED7F5]/60" />

          <div className="container relative mx-auto px-4">
            <h2 className="text-center text-4xl font-bold text-[#1B2A4A] md:text-5xl">
              Frequently Asked Questions
            </h2>

            <div className="mx-auto mt-10 max-w-5xl space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-xl border border-[#C7DAF1] bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-lg font-bold text-[#1B2A4A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E87A1E]">
                    {faq.question}
                    <PiCaretDownBold className="h-5 w-5 flex-none text-[#E87A1E] transition group-open:rotate-180" />
                  </summary>
                  <p className="border-t border-[#DDE7F3] px-6 py-5 text-sm font-semibold leading-7 text-[#4B5563]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>

            <div className="mt-16 grid items-center gap-6 rounded-2xl bg-white/70 p-6 ring-1 ring-[#C7DAF1] md:grid-cols-[1fr_auto_auto]">
              <div>
                <p className="text-lg font-bold text-[#1B2A4A]">
                  Review note: replace the competitor app band with support and sales paths.
                </p>
                <p className="mt-1 text-sm font-semibold text-[#4B5563]">
                  This keeps the page useful for CircleTel customers without adding a mobile app
                  promise.
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1B2A4A] px-6 py-3 text-sm font-bold text-[#1B2A4A] transition hover:bg-[#1B2A4A] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E87A1E] focus-visible:ring-offset-2"
              >
                <PiPackageBold className="h-5 w-5" />
                Contact Sales
              </Link>
              <a
                href="https://wa.me/27824873900?text=Hi%2C%20I%27m%20reviewing%20the%20store%20product%20layout"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
              >
                <PiWhatsappLogoBold className="h-5 w-5" />
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="bg-[#1B2A4A] py-8 text-white">
          <div className="container mx-auto flex flex-col gap-4 px-4 text-sm font-semibold md:flex-row md:items-center md:justify-between">
            <span className="flex items-center gap-2">
              <PiTruckBold className="h-5 w-5 text-[#E87A1E]" />
              Free delivery marker and warranty reassurance are retained from the reference layout.
            </span>
            <span className="text-white/70">Prototype route: /prototype/webafrica-store-clone</span>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
