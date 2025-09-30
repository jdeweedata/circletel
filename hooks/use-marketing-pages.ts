'use client'

import { useQuery } from '@tanstack/react-query'
import { strapiClient } from '@/lib/strapi-client'
import type {
  MarketingPage,
  StrapiCollectionResponse,
  StrapiQuery
} from '@/lib/types/strapi'

export function useMarketingPages(query?: StrapiQuery) {
  return useQuery({
    queryKey: ['marketing-pages', query],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<MarketingPage>>(
        'marketing-pages',
        query
      )
      return response.data
    },
  })
}

export function useMarketingPage(slug: string) {
  return useQuery({
    queryKey: ['marketing-page', slug],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<MarketingPage>>(
        'marketing-pages',
        {
          filters: {
            slug: { $eq: slug },
            published: { $eq: true },
          },
          populate: {
            hero: {
              populate: ['backgroundImage'],
            },
            sections: {
              populate: {
                features: true,
                image: true,
                backgroundImage: true,
              },
            },
            promotions: {
              populate: ['featuredImage', 'backgroundImage'],
            },
          },
        }
      )
      return response.data?.[0]
    },
    enabled: !!slug,
  })
}

export function usePublishedMarketingPages() {
  return useQuery({
    queryKey: ['marketing-pages', 'published'],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<MarketingPage>>(
        'marketing-pages',
        {
          filters: {
            published: { $eq: true },
          },
          sort: ['createdAt:desc'],
          populate: ['hero.backgroundImage'],
        }
      )
      return response.data
    },
  })
}