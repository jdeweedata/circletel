import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { services, getServiceBySlug } from '@/lib/data/services'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const page = getServiceBySlug(slug)

  if (!page) {
    return { title: 'Service Not Found' }
  }

  return {
    title: page.seo?.metaTitle || `${page.name} | CircleTel`,
    description: page.seo?.metaDescription || page.tagline || 'CircleTel Services',
  }
}

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }))
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const page = getServiceBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <BlockRenderer sections={page.blocks || []} />
      </main>
      <Footer />
    </div>
  )
}
