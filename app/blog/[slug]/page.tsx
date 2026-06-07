import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, getPostSlugs } from '@/lib/data/cms-blog'

export const revalidate = 300

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post not found | CircleTel' }
  const description = post.metaDescription ?? post.excerpt ?? undefined
  return {
    title: `${post.metaTitle ?? post.title} | CircleTel`,
    description,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description,
      images: post.featuredImageHeroUrl ? [{ url: post.featuredImageHeroUrl }] : undefined,
      type: 'article',
    },
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#1B2A4A]">{post.title}</h1>
      <p className="text-sm text-gray-400 mt-2">{[post.authorName, formatDate(post.publishedAt)].filter(Boolean).join(' · ')}</p>
      {post.featuredImageHeroUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.featuredImageHeroUrl} alt={post.featuredImageAlt ?? post.title} className="w-full rounded-lg mt-6 object-cover" />
      )}
      {post.contentHtml ? (
        <div className="prose max-w-none mt-8" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      ) : (
        post.excerpt && <p className="mt-8 text-gray-700">{post.excerpt}</p>
      )}
    </main>
  )
}
