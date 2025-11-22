import { createClient, type QueryParams } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7iqq2t7l'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = '2024-01-01'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
  stega: {
    studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3000/admin/cms',
  },
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

export async function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  tags,
}: {
  query: QueryString
  params?: QueryParams
  tags?: string[]
}) {
  return client.fetch(query, params, {
    next: {
      revalidate: process.env.NODE_ENV === 'development' ? 30 : 3600,
      tags,
    },
  })
}

// GROQ queries for different content types
export const queries = {
  // Get all pages
  pages: `*[_type == "page"] | order(_createdAt desc) {
    _id,
    title,
    slug,
    excerpt,
    content,
    image,
    seo,
    _createdAt
  }`,
  
  // Get page by slug
  pageBySlug: `*[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    content,
    image,
    seo,
    _createdAt
  }`,
  
  // Get all products
  products: `*[_type == "product"] | order(price asc) {
    _id,
    name,
    slug,
    description,
    price,
    setupFee,
    category->{
      title,
      slug,
      color
    },
    features,
    specifications,
    image,
    isActive,
    isFeatured,
    _createdAt
  }`,
  
  // Get product by slug
  productBySlug: `*[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    price,
    setupFee,
    category->{
      title,
      slug,
      color
    },
    features,
    specifications,
    image,
    gallery,
    isActive,
    isFeatured,
    _createdAt
  }`,
  
  // Get all blog posts
  posts: `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    content,
    author->{
      name,
      slug,
      bio
    },
    publishedAt,
    isPublished,
    seo,
    _createdAt
  }`,
  
  // Get blog post by slug
  postBySlug: `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    content,
    author->{
      name,
      slug,
      bio,
      email
    },
    publishedAt,
    isPublished,
    seo,
    _createdAt
  }`,
  
  // Get all categories
  categories: `*[_type == "category"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    color
  }`
}
