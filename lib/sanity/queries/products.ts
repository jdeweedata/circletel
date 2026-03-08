import { groq } from 'next-sanity';

export const PRODUCT_LIST_QUERY = groq`
  *[_type == "productPage"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    category,
    tagline,
    "heroImage": heroImage.asset->url,
    pricing
  }
`;

export const PRODUCT_BY_SLUG_QUERY = groq`
  *[_type == "productPage" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    category,
    tagline,
    description,
    "heroImage": heroImage.asset->url,
    pricing,
    keyFeatures,
    specifications,
    seo,
    blocks,
    "relatedProducts": relatedProducts[]-> {
      _id,
      name,
      "slug": slug.current,
      tagline,
      "heroImage": heroImage.asset->url,
      pricing
    }
  }
`;

export const PRODUCT_SLUGS_QUERY = groq`
  *[_type == "productPage"] { "slug": slug.current }
`;
