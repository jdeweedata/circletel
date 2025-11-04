import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
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