import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import strapi from '@/lib/strapi-client'
import type {
  StrapiResponse,
  StrapiCollectionResponse,
  StrapiEntity,
  StrapiQuery,
  StrapiCollectionName,
  BlogPost,
  Page,
  Product,
  Author,
  Category
} from '@/lib/types/strapi'

// Generic hook for fetching collections
export function useStrapiCollection<T extends StrapiEntity>(
  collectionName: StrapiCollectionName,
  query?: StrapiQuery,
  options?: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
  }
) {
  return useQuery({
    queryKey: ['strapi', collectionName, query],
    queryFn: async (): Promise<StrapiCollectionResponse<T>> => {
      return strapi.find(collectionName, query)
    },
    enabled: options?.enabled,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 minutes
  })
}

// Generic hook for fetching single entity
export function useStrapiEntity<T extends StrapiEntity>(
  collectionName: StrapiCollectionName,
  id: string | number,
  query?: Omit<StrapiQuery, 'pagination'>,
  options?: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
  }
) {
  return useQuery({
    queryKey: ['strapi', collectionName, id, query],
    queryFn: async (): Promise<StrapiResponse<T>> => {
      return strapi.findOne(collectionName, id, query)
    },
    enabled: options?.enabled && !!id,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    gcTime: options?.cacheTime ?? 10 * 60 * 1000,
  })
}

// Specific hooks for common content types
export function useBlogPosts(query?: StrapiQuery) {
  return useStrapiCollection<BlogPost>('blog-posts', {
    populate: ['featuredImage', 'author', 'categories'],
    sort: ['publishedAt:desc'],
    ...query,
  })
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['strapi', 'blog-post', slug],
    queryFn: async (): Promise<BlogPost | null> => {
      const response = await strapi.find('blog-posts', {
        filters: { slug },
        populate: ['featuredImage', 'author', 'categories', 'tags'],
      }) as StrapiCollectionResponse<BlogPost>

      return response.data.length > 0 ? response.data[0] : null
    },
    enabled: !!slug,
  })
}

export function usePages(query?: StrapiQuery) {
  return useStrapiCollection<Page>('pages', {
    populate: ['featuredImage', 'seo', 'blocks'],
    ...query,
  })
}

export function usePage(slug: string) {
  return useQuery({
    queryKey: ['strapi', 'page', slug],
    queryFn: async (): Promise<Page | null> => {
      const response = await strapi.find('pages', {
        filters: { slug },
        populate: ['featuredImage', 'seo', 'blocks'],
      }) as StrapiCollectionResponse<Page>

      return response.data.length > 0 ? response.data[0] : null
    },
    enabled: !!slug,
  })
}

export function useProducts(query?: StrapiQuery) {
  return useStrapiCollection<Product>('products', {
    populate: ['images', 'category'],
    ...query,
  })
}

export function useAuthors(query?: StrapiQuery) {
  return useStrapiCollection<Author>('authors', {
    populate: ['avatar'],
    ...query,
  })
}

export function useCategories(query?: StrapiQuery) {
  return useStrapiCollection<Category>('categories', query)
}

// Mutation hooks for creating/updating content
export function useCreateStrapiEntity<T extends StrapiEntity>(
  collectionName: StrapiCollectionName
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<T>): Promise<StrapiResponse<T>> => {
      return strapi.create(collectionName, { data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strapi', collectionName] })
    },
  })
}

export function useUpdateStrapiEntity<T extends StrapiEntity>(
  collectionName: StrapiCollectionName
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<T> }): Promise<StrapiResponse<T>> => {
      return strapi.update(collectionName, id, { data })
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['strapi', collectionName] })
      queryClient.invalidateQueries({ queryKey: ['strapi', collectionName, id] })
    },
  })
}

export function useDeleteStrapiEntity(collectionName: StrapiCollectionName) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string | number): Promise<StrapiResponse<any>> => {
      return strapi.delete(collectionName, id)
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['strapi', collectionName] })
      queryClient.removeQueries({ queryKey: ['strapi', collectionName, id] })
    },
  })
}