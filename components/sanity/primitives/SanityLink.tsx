// components/sanity/primitives/SanityLink.tsx
import Link from 'next/link'
import { ReactNode } from 'react'

interface SanityLinkData {
  linkType: 'internal' | 'external'
  internalLink?: {
    _type: string
    slug?: { current: string }
  }
  externalUrl?: string
  label?: string
  openInNewTab?: boolean
  utmSource?: string
}

interface SanityLinkProps {
  link: SanityLinkData
  children?: ReactNode
  className?: string
}

// Map document types to URL paths
const typeToPath: Record<string, string> = {
  page: '',
  productPage: '/products',
  post: '/blog',
  resource: '/resources',
}

function resolveInternalUrl(link: SanityLinkData): string {
  if (!link.internalLink?.slug?.current) {
    return '/'
  }

  const basePath = typeToPath[link.internalLink._type] || ''
  return `${basePath}/${link.internalLink.slug.current}`
}

function appendUtm(url: string, utmSource?: string): string {
  if (!utmSource) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}utm_source=${encodeURIComponent(utmSource)}`
}

export function SanityLink({ link, children, className }: SanityLinkProps) {
  if (!link) return null

  const isExternal = link.linkType === 'external'
  const label = children || link.label || ''

  if (isExternal && link.externalUrl) {
    const href = appendUtm(link.externalUrl, link.utmSource)
    return (
      <a
        href={href}
        className={className}
        target={link.openInNewTab ? '_blank' : undefined}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
      >
        {label}
      </a>
    )
  }

  const href = appendUtm(resolveInternalUrl(link), link.utmSource)
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  )
}
