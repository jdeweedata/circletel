/**
 * PM Agent Context Module
 *
 * Exports context-related utilities for the PM Agent including
 * the product/sitemap mental map.
 */

export {
  CIRCLETEL_SITEMAP,
  findRoutes,
  getRouteSection,
  getProductsByCategory,
  getAllProductSlugs,
  routeExists,
} from './product-map'

export type {
  RouteItem,
  MenuSection,
  NavigationTab,
  ProductCategory,
  ProductDefinition,
  SitemapStructure,
} from './product-map'
