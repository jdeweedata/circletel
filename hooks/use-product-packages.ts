'use client'

import { useQuery } from '@tanstack/react-query'
import { strapiClient } from '@/lib/strapi-client'
import type {
  ProductPackage,
  StrapiCollectionResponse,
  StrapiQuery
} from '@/lib/types/strapi'

export function useProductPackages(query?: StrapiQuery) {
  return useQuery({
    queryKey: ['product-packages', query],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<ProductPackage>>(
        'product-packages',
        query
      )
      return response.data
    },
  })
}

export function useProductPackage(slug: string, query?: StrapiQuery) {
  return useQuery({
    queryKey: ['product-package', slug, query],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<ProductPackage>>(
        'product-packages',
        {
          ...query,
          filters: {
            slug: { $eq: slug },
          },
        }
      )
      return response.data?.[0]
    },
    enabled: !!slug,
  })
}

export function useFeaturedPackages(category?: string, limit = 6) {
  return useQuery({
    queryKey: ['product-packages', 'featured', category, limit],
    queryFn: async () => {
      const filters: any = {
        featured: { $eq: true },
        inStock: { $eq: true },
      }

      if (category && category !== 'all') {
        filters.category = { $eq: category }
      }

      const response = await strapiClient.get<StrapiCollectionResponse<ProductPackage>>(
        'product-packages',
        {
          filters,
          sort: ['priority:desc', 'createdAt:desc'],
          pagination: { pageSize: limit },
          populate: ['featuredImage', 'backgroundImage', 'tiers', 'technicalSpecs'],
        }
      )
      return response.data
    },
  })
}

export function usePackagesByCategory(category: string) {
  return useQuery({
    queryKey: ['product-packages', 'category', category],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<ProductPackage>>(
        'product-packages',
        {
          filters: {
            category: { $eq: category },
            inStock: { $eq: true },
          },
          sort: ['priority:desc', 'name:asc'],
          populate: ['featuredImage', 'backgroundImage', 'tiers', 'technicalSpecs'],
        }
      )
      return response.data
    },
    enabled: !!category,
  })
}