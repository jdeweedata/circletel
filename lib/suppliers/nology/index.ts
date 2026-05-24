/**
 * Nology Supplier Module
 *
 * Exports all Nology-related functionality for product sync.
 *
 * Updated from HTML scraping to xlsx file-based parsing (April 2026).
 * The xlsx has 39 sheets — one per brand/manufacturer — each with
 * consistent SKU | Description | Price | Comments structure.
 *
 * Note: Nology's price list does NOT include stock levels.
 */

export * from './nology-types'
export * from './nology-parser'
export * from './nology-sync'
