import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-neutral-500 mb-6">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center">
          {idx > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-neutral-700 transition">
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-700">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
