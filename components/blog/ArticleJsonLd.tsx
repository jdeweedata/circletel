import { BlogPost } from '@/lib/data/cms-blog'

interface ArticleJsonLdProps {
  post: BlogPost
  url: string
}

export function ArticleJsonLd({ post, url }: ArticleJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.metaDescription,
    image: post.featuredImageHeroUrl ? [post.featuredImageHeroUrl] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.authorName || 'CircleTel',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CircleTel',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.circletel.co.za/images/circletel-logo-2026.png',
        width: 250,
        height: 60,
      },
    },
    url,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
