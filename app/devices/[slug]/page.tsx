import { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ServicePageContent } from '@/components/products/ServicePageContent'
import { notFound } from 'next/navigation'

interface DevicePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: DevicePageProps): Promise<Metadata> {
  const { slug } = await params

  // Format slug for display
  const title = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    title: `${title} | CircleTel`,
    description: `Browse our ${title.toLowerCase()} products and packages.`,
  }
}

export default async function DevicePage({ params }: DevicePageProps) {
  const { slug } = await params

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Afrihost-Style Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative bg-gradient-to-br from-cyan-600 via-cyan-500 to-teal-600 text-white px-4 py-16 md:py-20">
          {/* Curved bottom edge */}
          <div className="absolute inset-x-0 bottom-0 h-24">
            <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path d="M0,0 Q360,100 720,50 T1440,0 L1440,100 L0,100 Z" fill="#f9fafb" />
            </svg>
          </div>

          {/* Orange curved accent - top right */}
          <div className="absolute top-0 right-0 w-96 h-96 translate-x-32 -translate-y-32">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path d="M200,100 Q150,50 100,100 T0,100 L0,0 L200,0 Z" fill="#F5831F" opacity="0.3"/>
            </svg>
          </div>

          {/* Decorative patterns */}
          <div className="absolute top-10 left-10 w-32 h-32 opacity-20">
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
              ))}
            </div>
          </div>

          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight capitalize">
                {slug.replace(/-/g, ' ')}.
              </h1>
              <p className="text-xl md:text-2xl text-white/95 max-w-2xl">
                Browse our range of products and find the perfect fit for your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Content from Strapi */}
      <ServicePageContent slug={slug} category="devices" />

      <Footer />
    </div>
  )
}