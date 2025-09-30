'use client'

import { useQuery } from '@tanstack/react-query'
import { strapiClient } from '@/lib/strapi-client'
import type {
  Campaign,
  StrapiCollectionResponse,
  StrapiQuery
} from '@/lib/types/strapi'

export function useCampaigns(query?: StrapiQuery) {
  return useQuery({
    queryKey: ['campaigns', query],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<Campaign>>(
        'campaigns',
        query
      )
      return response.data
    },
  })
}

export function useCampaign(slug: string) {
  return useQuery({
    queryKey: ['campaign', slug],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<Campaign>>(
        'campaigns',
        {
          filters: {
            slug: { $eq: slug },
          },
          populate: {
            promotions: {
              populate: ['featuredImage'],
            },
            marketingPages: true,
          },
        }
      )
      return response.data?.[0]
    },
    enabled: !!slug,
  })
}

export function useActiveCampaigns() {
  return useQuery({
    queryKey: ['campaigns', 'active'],
    queryFn: async () => {
      const now = new Date().toISOString()
      const response = await strapiClient.get<StrapiCollectionResponse<Campaign>>(
        'campaigns',
        {
          filters: {
            status: { $eq: 'active' },
            startDate: { $lte: now },
            endDate: { $gte: now },
          },
          sort: ['startDate:desc'],
          populate: {
            promotions: {
              populate: ['featuredImage'],
            },
          },
        }
      )
      return response.data
    },
  })
}