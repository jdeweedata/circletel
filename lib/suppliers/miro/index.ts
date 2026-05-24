/**
 * MiRO Distribution Supplier Module
 *
 * Exports all MiRO-related functionality for product sync.
 *
 * Updated from HTML scraping to xlsx file-based parsing (May 2026).
 * The xlsx has 69 sheets — one per brand — each with identical:
 *   Item Code | Item Description | Retail Price | Your Price | Item Link
 *
 * Prices exclude VAT. No stock or warranty data.
 */

export * from './miro-types'
export * from './miro-parser'
export * from './miro-sync'
