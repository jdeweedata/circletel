'use client'

import { useState } from 'react'
import { useProductPackages } from '@/hooks/use-product-packages'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function PackagesAdminPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { data: packages, isLoading } = useProductPackages({
    filters: selectedCategory !== 'all' ? { category: { $eq: selectedCategory } } : undefined,
    populate: ['featuredImage', 'tiers'],
    sort: ['priority:desc', 'name:asc'],
  })

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'fibre', label: 'Fibre' },
    { value: 'wireless', label: 'Wireless' },
    { value: 'voip', label: 'VoIP' },
    { value: 'devices', label: 'Devices' },
    { value: 'hosting', label: 'Hosting' },
    { value: 'mobile', label: 'Mobile' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">Product Packages</h1>
          <p className="text-circleTel-secondaryNeutral mt-1">
            Manage pricing, packages, and product offerings
          </p>
        </div>
        <Link href="/admin/cms/packages/new">
          <Button className="bg-circleTel-orange hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Package
          </Button>
        </Link>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${selectedCategory === cat.value
                  ? 'bg-circleTel-orange text-white'
                  : 'bg-gray-100 text-circleTel-darkNeutral hover:bg-gray-200'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Packages List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
          </div>
        ) : packages && packages.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {packages.map((pkg) => (
              <div key={pkg.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Package Image */}
                  {pkg.featuredImage ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={pkg.featuredImage.url}
                        alt={pkg.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}

                  {/* Package Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-circleTel-darkNeutral">
                            {pkg.name}
                          </h3>
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${pkg.featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}
                          `}>
                            {pkg.featured ? 'Featured' : 'Standard'}
                          </span>
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${pkg.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          `}>
                            {pkg.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        <p className="text-sm text-circleTel-secondaryNeutral mt-1">
                          {pkg.shortDescription}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-circleTel-secondaryNeutral">
                          <span className="capitalize">{pkg.category}</span>
                          <span>•</span>
                          <span>{pkg.tiers?.length || 0} pricing tiers</span>
                          <span>•</span>
                          <span>Priority: {pkg.priority}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/admin/cms/packages/${pkg.slug}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/cms/packages/${pkg.slug}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Pricing Tiers Preview */}
                    {pkg.tiers && pkg.tiers.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {pkg.tiers.sort((a, b) => a.sortOrder - b.sortOrder).map((tier) => (
                          <div
                            key={tier.id}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <div className="text-sm font-medium text-circleTel-darkNeutral">
                              {tier.name}
                            </div>
                            <div className="text-lg font-bold text-circleTel-orange">
                              {tier.currency}{tier.price.toFixed(2)}
                              <span className="text-xs text-circleTel-secondaryNeutral ml-1">
                                /{tier.billingCycle}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-circleTel-darkNeutral mb-2">
              No packages yet
            </h3>
            <p className="text-circleTel-secondaryNeutral mb-6">
              Create your first product package to get started
            </p>
            <Link href="/admin/cms/packages/new">
              <Button className="bg-circleTel-orange hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Package
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {packages && packages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-circleTel-secondaryNeutral mb-1">Total Packages</div>
            <div className="text-2xl font-bold text-circleTel-darkNeutral">{packages.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-circleTel-secondaryNeutral mb-1">Featured</div>
            <div className="text-2xl font-bold text-circleTel-darkNeutral">
              {packages.filter(p => p.featured).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-circleTel-secondaryNeutral mb-1">In Stock</div>
            <div className="text-2xl font-bold text-circleTel-darkNeutral">
              {packages.filter(p => p.inStock).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-circleTel-secondaryNeutral mb-1">Total Tiers</div>
            <div className="text-2xl font-bold text-circleTel-darkNeutral">
              {packages.reduce((sum, p) => sum + (p.tiers?.length || 0), 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}