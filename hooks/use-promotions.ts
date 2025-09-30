'use client'

import { useQuery } from '@tanstack/react-query'
import { strapiClient } from '@/lib/strapi-client'
import type {
  Promotion,
  StrapiCollectionResponse,
  StrapiResponse,
  StrapiQuery
} from '@/lib/types/strapi'

export function usePromotions(query?: StrapiQuery) {
  return useQuery({
    queryKey: ['promotions', query],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<Promotion>>(
        'promotions',
        query
      )
      return response.data
    },
  })
}

export function usePromotion(slug: string, query?: StrapiQuery) {
  return useQuery({
    queryKey: ['promotion', slug, query],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<Promotion>>(
        'promotions',
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

export function useFeaturedPromotions(limit = 6) {
  return useQuery({
    queryKey: ['promotions', 'featured', limit],
    queryFn: async () => {
      const now = new Date().toISOString()
      const response = await strapiClient.get<StrapiCollectionResponse<Promotion>>(
        'promotions',
        {
          filters: {
            featured: { $eq: true },
            $or: [
              { startDate: { $null: true } },
              { startDate: { $lte: now } },
            ],
            $and: [
              {
                $or: [
                  { endDate: { $null: true } },
                  { endDate: { $gte: now } },
                ],
              },
            ],
          },
          sort: ['priority:desc', 'createdAt:desc'],
          pagination: { pageSize: limit },
          populate: ['featuredImage', 'backgroundImage'],
        }
      )
      return response.data
    },
  })
}

export function useActivePromotions(category?: string) {
  return useQuery({
    queryKey: ['promotions', 'active', category],
    queryFn: async () => {
      const now = new Date().toISOString()
      const filters: any = {
        $or: [
          { startDate: { $null: true } },
          { startDate: { $lte: now } },
        ],
        $and: [
          {
            $or: [
              { endDate: { $null: true } },
              { endDate: { $gte: now } },
            ],
          },
        ],
      }

      if (category && category !== 'all') {
        filters.category = { $eq: category }
      }

      const response = await strapiClient.get<StrapiCollectionResponse<Promotion>>(
        'promotions',
        {
          filters,
          sort: ['priority:desc', 'createdAt:desc'],
          populate: ['featuredImage', 'backgroundImage'],
        }
      )
      return response.data
    },
  })
}

export function usePromotionsByCategory() {
  return useQuery({
    queryKey: ['promotions', 'by-category'],
    queryFn: async () => {
      const now = new Date().toISOString()
      const response = await strapiClient.get<StrapiCollectionResponse<Promotion>>(
        'promotions',
        {
          filters: {
            $or: [
              { startDate: { $null: true } },
              { startDate: { $lte: now } },
            ],
            $and: [
              {
                $or: [
                  { endDate: { $null: true } },
                  { endDate: { $gte: now } },
                ],
              },
            ],
          },
          sort: ['category:asc', 'priority:desc'],
          populate: ['featuredImage', 'backgroundImage'],
        }
      )

      // Group by category
      const grouped = response.data.reduce((acc: Record<string, Promotion[]>, promo: Promotion) => {
        const cat = promo.category
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(promo)
        return acc
      }, {} as Record<string, Promotion[]>)

      return grouped
    },
  })
}