'use client'

import { useQuery } from '@tanstack/react-query'
import { strapiClient } from '@/lib/strapi-client'
import type {
  ServicePage,
  StrapiCollectionResponse,
  StrapiQuery
} from '@/lib/types/strapi'

export function useServicePages(query?: StrapiQuery) {
  return useQuery({
    queryKey: ['service-pages', query],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<ServicePage>>(
        'service-pages',
        query
      )
      return response.data
    },
  })
}

export function useServicePage(slug: string, query?: StrapiQuery) {
  return useQuery({
    queryKey: ['service-page', slug, query],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<ServicePage>>(
        'service-pages',
        {
          ...query,
          filters: {
            slug: { $eq: slug },
            published: { $eq: true },
          },
          populate: {
            hero: {
              populate: ['backgroundImage'],
            },
            sections: {
              populate: ['*'],
            },
            packages: {
              populate: ['featuredImage', 'backgroundImage', 'tiers', 'technicalSpecs'],
            },
          },
        }
      )
      return response.data?.[0]
    },
    enabled: !!slug,
  })
}

export function useServicePagesByCategory(category: string) {
  return useQuery({
    queryKey: ['service-pages', 'category', category],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<ServicePage>>(
        'service-pages',
        {
          filters: {
            category: { $eq: category },
            published: { $eq: true },
          },
          sort: ['createdAt:desc'],
          populate: {
            hero: {
              populate: ['backgroundImage'],
            },
          },
        }
      )
      return response.data
    },
    enabled: !!category,
  })
}