import Link from 'next/link'
import type { Metadata } from 'next'
import { getPublishedPosts } from '@/lib/data/cms-blog'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Blog | CircleTel',
  description: 'News, guides and updates from CircleTel.',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts()

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[#1B2A4A] mb-8">Blog</h1>
      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet. Check back soon.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="group block rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition">
              {p.featuredImageThumbUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.featuredImageThumbUrl} alt={p.featuredImageAlt ?? p.title} className="w-full h-44 object-cover" />
              )}
              <div className="p-4">
                <h2 className="font-semibold text-lg text-[#1B2A4A] group-hover:text-[#F5831F] transition">{p.title}</h2>
                {p.excerpt && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{p.excerpt}</p>}
                <p className="text-xs text-gray-400 mt-3">{[p.authorName, formatDate(p.publishedAt)].filter(Boolean).join(' · ')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
