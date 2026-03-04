import { IconType } from 'react-icons';
import { PiDeviceMobileBold, PiGlobeBold, PiLightningBold, PiRadioBold, PiWifiHighBold } from 'react-icons/pi';

export interface CategoryTheme {
  color: string
  bg: string
  border: string
  icon: IconType
}

export const PRODUCT_CATEGORY_THEMES: Record<string, CategoryTheme> = {
  // ISP/Telecom categories
  business_fibre: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: PiGlobeBold },
  lte: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: PiLightningBold },
  '5g': { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: PiRadioBold },
  wireless: { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', icon: PiWifiHighBold },
  fibre_consumer: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: PiGlobeBold },
  fibre: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: PiGlobeBold },

  // General product categories
  connectivity: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: PiGlobeBold },
  hardware: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: PiDeviceMobileBold },
  software: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', icon: PiGlobeBold },
  services: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: PiGlobeBold },
  bundles: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', icon: PiGlobeBold },

  // Default fallback
  default: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', icon: PiGlobeBold },
}

/**
 * Get the theme (colors and icon) for a product category
 * @param category - The product category string
 * @returns CategoryTheme with color, bg, border, and icon
 */
export function getCategoryTheme(category: string | null | undefined): CategoryTheme {
  if (!category) return PRODUCT_CATEGORY_THEMES.default
  const normalized = category.toLowerCase().replace(/[\s-]/g, '_')
  return PRODUCT_CATEGORY_THEMES[normalized] || PRODUCT_CATEGORY_THEMES.default
}

/**
 * Get the status stripe color based on product status
 * @param product - Product with is_active and status fields
 * @returns Tailwind CSS class for the stripe background color
 */
export function getStatusStripeColor(product: { is_active?: boolean; status?: string }): string {
  if (!product.is_active) return 'bg-slate-200'
  switch (product.status) {
    case 'active':
      return 'bg-emerald-500'
    case 'archived':
      return 'bg-red-400'
    case 'draft':
    default:
      return 'bg-slate-200'
  }
}

/**
 * Format category name for display (convert snake_case to Title Case)
 * @param category - The category string
 * @returns Formatted category name
 */
export function formatCategoryName(category: string | null | undefined): string {
  if (!category) return 'Uncategorized'
  return category
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
