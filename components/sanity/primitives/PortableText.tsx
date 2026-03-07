// components/sanity/primitives/PortableText.tsx
import {
  PortableText as BasePortableText,
  PortableTextComponents,
  PortableTextBlock,
} from '@portabletext/react'
import { SanityImage } from './SanityImage'
import { SanityLink } from './SanityLink'

interface PortableTextProps {
  value: PortableTextBlock[]
  className?: string
}

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => (
      <figure className="my-6">
        <SanityImage
          image={value}
          className="rounded-lg"
          width={800}
        />
        {value.caption && (
          <figcaption className="mt-2 text-sm text-gray-500 text-center">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const isExternal = value?.href?.startsWith('http')
      return (
        <a
          href={value?.href}
          className="text-circleTel-orange hover:underline"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      )
    },
    internalLink: ({ children, value }) => (
      <SanityLink link={value} className="text-circleTel-orange hover:underline">
        {children}
      </SanityLink>
    ),
  },
  block: {
    h2: ({ children }) => (
      <h2 className="text-2xl font-heading font-bold mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-heading font-semibold mt-6 mb-3">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-heading font-medium mt-4 mb-2">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-circleTel-orange pl-4 my-6 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
    ),
  },
}

export function PortableText({ value, className }: PortableTextProps) {
  if (!value) return null

  return (
    <div className={className}>
      <BasePortableText value={value} components={components} />
    </div>
  )
}
