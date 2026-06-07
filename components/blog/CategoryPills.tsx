import Link from 'next/link'
import { categoryLabel } from '@/lib/blog/categories'

interface CategoryPillsProps {
  categories: string[]
  active?: string
}

export function CategoryPills({ categories, active }: CategoryPillsProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {/* "All" pill */}
      <Link
        href="/blog"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
          !active
            ? 'bg-[#F5831F] text-white'
            : 'border border-neutral-200 text-neutral-700 hover:text-[#F5831F] hover:border-[#F5831F]'
        }`}
      >
        All
      </Link>

      {/* Category pills */}
      {categories.map((cat) => (
        <Link
          key={cat}
          href={`/blog?category=${encodeURIComponent(cat)}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            active === cat
              ? 'bg-[#F5831F] text-white'
              : 'border border-neutral-200 text-neutral-700 hover:text-[#F5831F] hover:border-[#F5831F]'
          }`}
        >
          {categoryLabel(cat)}
        </Link>
      ))}
    </div>
  )
}
