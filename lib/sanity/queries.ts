import { groq } from 'next-sanity';

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
