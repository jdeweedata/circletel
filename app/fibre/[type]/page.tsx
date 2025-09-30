import { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ServicePageContent } from '@/components/products/ServicePageContent'

interface FibrePageProps {
  params: Promise<{
    type: string
  }>
}

export async function generateMetadata({ params }: FibrePageProps): Promise<Metadata> {
  const { type } = await params

  const title = type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    title: `${title} Fibre | CircleTel`,
    description: `Get blazing-fast ${title.toLowerCase()} fibre internet from CircleTel.`,
  }
}

export default async function FibrePage({ params }: FibrePageProps) {
  const { type } = await params

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Afrihost-Style Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white px-4 py-16 md:py-20">
          {/* Curved bottom edge */}
          <div className="absolute inset-x-0 bottom-0 h-24">
            <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path d="M0,0 Q360,100 720,50 T1440,0 L1440,100 L0,100 Z" fill="#f9fafb" />
            </svg>
          </div>

          {/* Pink curved accent - top left */}
          <div className="absolute top-0 left-0 w-96 h-96 -translate-x-32 -translate-y-32">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path d="M0,100 Q50,50 100,100 T200,100 L200,0 L0,0 Z" fill="#ec4899" opacity="0.3"/>
            </svg>
          </div>

          {/* Decorative patterns */}
          <div className="absolute top-6 right-10 w-32 h-32 opacity-20">
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
              ))}
            </div>
          </div>

          {/* Diagonal lines */}
          <div className="absolute bottom-20 right-20 w-40 h-40 opacity-10">
            <div style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                white,
                white 3px,
                transparent 3px,
                transparent 8px
              )`
            }} className="w-full h-full"></div>
          </div>

          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight capitalize">
                {type.replace(/-/g, ' ')} Fibre.
              </h1>
              <p className="text-xl md:text-2xl text-white/95 max-w-2xl">
                Experience ultra-fast, reliable fibre internet with flexible packages to suit your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Content from Strapi */}
      <ServicePageContent slug={type} category="fibre" />

      <Footer />
    </div>
  )
}