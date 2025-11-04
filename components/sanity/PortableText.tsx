import { PortableText as PortableTextReact } from '@portabletext/react'
import { urlFor } from '@/lib/sanity/client'

const components = {
  types: {
    image: ({ value }: { value: any }) => (
      <div className="my-8">
        <img
          src={urlFor(value).width(800).height(400).fit('crop').url()}
          alt={value.alt || ''}
          className="rounded-lg shadow-lg w-full"
        />
        {value.alt && (
          <p className="text-sm text-gray-600 mt-2 text-center">{value.alt}</p>
        )}
      </div>
    ),
  },
  marks: {
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-bold text-circleTel-darkNeutral">{children}</strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    link: ({ children, value }: { children: React.ReactNode; value: any }) => (
      <a
        href={value.href}
        className="text-circleTel-orange hover:text-orange-600 underline"
        target={value.blank ? '_blank' : '_self'}
        rel={value.blank ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
  },
  block: {
    normal: ({ children }: { children: React.ReactNode }) => (
      <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>
    ),
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-4xl font-bold mb-6 text-circleTel-darkNeutral">{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-3xl font-bold mb-4 text-circleTel-darkNeutral">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-2xl font-semibold mb-3 text-circleTel-darkNeutral">{children}</h3>
    ),
    h4: ({ children }: { children: React.ReactNode }) => (
      <h4 className="text-xl font-semibold mb-2 text-circleTel-darkNeutral">{children}</h4>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-circleTel-orange pl-4 my-6 italic text-gray-600">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-inside mb-4 ml-4 space-y-2">{children}</ul>
    ),
    number: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-inside mb-4 ml-4 space-y-2">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children: React.ReactNode }) => (
      <li className="text-gray-700">{children}</li>
    ),
    number: ({ children }: { children: React.ReactNode }) => (
      <li className="text-gray-700">{children}</li>
    ),
  },
}

interface PortableTextProps {
  content: any[]
  className?: string
}

export function PortableText({ content, className = '' }: PortableTextProps) {
  if (!content || !Array.isArray(content)) {
    return null
  }

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <PortableTextReact value={content} components={components} />
    </div>
  )
}