import type { PublicOffer, PublicOfferDetail } from '@/lib/types/offer';

export const OFFERS_BASE_URL = 'https://www.circletel.co.za';

export function offerProductJsonLd(o: PublicOfferDetail): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: o.title,
    ...(o.image ? { image: o.image } : {}),
    ...(o.description ? { description: o.description } : {}),
    offers: {
      '@type': 'Offer',
      price: o.priceInclVat,
      priceCurrency: 'ZAR',
      availability: 'https://schema.org/InStock',
      url: `${OFFERS_BASE_URL}/offers/${o.slug}`,
    },
  };
}

export function offersItemListJsonLd(offers: PublicOffer[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: offers.map((o, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: o.title,
      url: `${OFFERS_BASE_URL}/offers/${o.slug}`,
    })),
  };
}
