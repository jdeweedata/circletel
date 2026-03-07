import { groq } from 'next-sanity';
import { sanityFetch } from './fetch';

// Page queries
export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    content[],
    seo {
      metaTitle,
      metaDescription,
      ogImage
    }
  }
`;

export const allPagesQuery = groq`
  *[_type == "page" && defined(slug.current)] {
    "slug": slug.current
  }
`;

// Product page queries
export const productPageBySlugQuery = groq`
  *[_type == "productPage" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    hero {
      headline,
      subheadline,
      backgroundImage,
      cta
    },
    features[],
    pricing[],
    faq[],
    seo {
      metaTitle,
      metaDescription,
      ogImage
    }
  }
`;

export const allProductPagesQuery = groq`
  *[_type == "productPage" && defined(slug.current)] {
    "slug": slug.current
  }
`;

// WorkConnect Product Queries
export const WORKCONNECT_PRODUCT_QUERY = groq`
  *[_type == "productPage" && slug.current == $slug][0] {
    _id,
    name,
    tagline,
    "slug": slug.current,
    category,
    heroImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions
        }
      },
      alt
    },
    description,
    pricing {
      startingPrice,
      priceNote,
      showContactForPricing
    },
    keyFeatures[] {
      title,
      description,
      icon
    },
    specifications[] {
      label,
      value
    },
    seo {
      metaTitle,
      metaDescription,
      ogImage
    },
    relatedProducts[]-> {
      name,
      "slug": slug.current,
      tagline,
      pricing
    }
  }
`;

export const WORKCONNECT_ALL_QUERY = groq`
  *[_type == "productPage" && category == "soho"] | order(pricing.startingPrice asc) {
    _id,
    name,
    tagline,
    "slug": slug.current,
    heroImage {
      asset->{
        _id,
        url
      }
    },
    pricing {
      startingPrice,
      priceNote
    },
    keyFeatures[0...6] {
      title,
      description
    }
  }
`;

export const WORKCONNECT_SLUGS_QUERY = groq`
  *[_type == "productPage" && category == "soho"] {
    "slug": slug.current
  }
`;

// Service page queries
export const servicePageBySlugQuery = groq`
  *[_type == "servicePage" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    content[],
    seo {
      metaTitle,
      metaDescription,
      ogImage
    }
  }
`;

export const allServicePagesQuery = groq`
  *[_type == "servicePage" && defined(slug.current)] {
    "slug": slug.current
  }
`;

// Homepage query
export const homepageQuery = groq`
  *[_type == "homepage"][0] {
    _id,
    title,
    hero {
      headline,
      subheadline,
      segments[]
    },
    content[],
    seo {
      metaTitle,
      metaDescription,
      ogImage
    }
  }
`;

// Generic fetch functions
export async function getPageBySlug(client: any, slug: string) {
  return client.fetch(pageBySlugQuery, { slug });
}

export async function getAllPages(client: any) {
  return client.fetch(allPagesQuery);
}

export async function getProductPageBySlug(client: any, slug: string) {
  return client.fetch(productPageBySlugQuery, { slug });
}

export async function getAllProductPages(client: any) {
  return client.fetch(allProductPagesQuery);
}

export async function getServicePageBySlug(client: any, slug: string) {
  return client.fetch(servicePageBySlugQuery, { slug });
}

export async function getAllServicePages(client: any) {
  return client.fetch(allServicePagesQuery);
}

export async function getHomepage(client: any) {
  return client.fetch(homepageQuery);
}

// ============================================
// Cache-Tagged Query Functions (ISR)
// ============================================

const PAGE_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  seo,
  blocks[]{
    _key,
    _type,
    ...
  }
`;

const POST_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  featuredImage,
  "author": author->{name, slug, photo},
  "categories": categories[]->{title, slug},
  publishedAt,
  body
`;

export async function getPageWithTags(slug: string) {
  return sanityFetch({
    query: `*[_type == "page" && slug.current == $slug][0]{${PAGE_FIELDS}}`,
    params: { slug },
    tags: [`page:${slug}`, 'pages'],
  });
}

export async function getHomepageWithTags() {
  return sanityFetch({
    query: `*[_type == "homepage"][0]{${PAGE_FIELDS}}`,
    params: {},
    tags: ['homepage'],
  });
}

export async function getProductPageWithTags(slug: string) {
  return sanityFetch({
    query: `*[_type == "productPage" && slug.current == $slug][0]{${PAGE_FIELDS}}`,
    params: { slug },
    tags: [`product:${slug}`, 'products'],
  });
}

export async function getPost(slug: string) {
  return sanityFetch({
    query: `*[_type == "post" && slug.current == $slug][0]{${POST_FIELDS}}`,
    params: { slug },
    tags: [`post:${slug}`, 'posts'],
  });
}

export async function getBlogPosts(limit = 10) {
  return sanityFetch({
    query: `*[_type == "post"] | order(publishedAt desc)[0...$limit]{
      _id,
      title,
      "slug": slug.current,
      excerpt,
      featuredImage,
      "author": author->{name, photo},
      publishedAt
    }`,
    params: { limit },
    tags: ['posts', 'blog'],
  });
}

export async function getActiveCampaigns(audience: string = 'all') {
  const now = new Date().toISOString();

  return sanityFetch({
    query: `*[_type == "campaign"
      && isEnabled == true
      && startDate <= $now
      && (endDate == null || endDate > $now)
      && (targetAudience == "all" || targetAudience == $audience)
    ] | order(priority desc){
      _id,
      title,
      campaignType,
      headline,
      description,
      image,
      cta,
      placement,
      isDismissible,
      backgroundColor,
      targetPages
    }`,
    params: { now, audience },
    tags: ['campaigns', 'active-campaigns'],
  });
}

export async function getResources(limit = 20) {
  return sanityFetch({
    query: `*[_type == "resource" && isEnabled == true] | order(publishedAt desc)[0...$limit]{
      _id,
      title,
      "slug": slug.current,
      resourceType,
      description,
      thumbnail,
      accessLevel
    }`,
    params: { limit },
    tags: ['resources', 'resource-library'],
  });
}

export async function getResource(slug: string) {
  return sanityFetch({
    query: `*[_type == "resource" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      resourceType,
      description,
      thumbnail,
      accessLevel,
      file,
      externalUrl,
      body,
      "products": products[]->{title, slug},
      seo
    }`,
    params: { slug },
    tags: [`resource:${slug}`, 'resources'],
  });
}

export async function getTeamMembers() {
  return sanityFetch({
    query: `*[_type == "teamMember"] | order(order asc){
      _id,
      name,
      "slug": slug.current,
      role,
      department,
      photo,
      bio
    }`,
    params: {},
    tags: ['team'],
  });
}

export async function getSiteSettings() {
  return sanityFetch({
    query: `*[_type == "siteSettings"][0]`,
    params: {},
    tags: ['site-settings', 'navigation'],
  });
}
