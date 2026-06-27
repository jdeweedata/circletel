/**
 * Rectron Supplier Module
 *
 * Exports all Rectron-related functionality for product sync.
 *
 * Rectron is a major South African ICT distributor. Their latest price list (.xlsm)
 * is auto-downloaded from the public RectronZone CDN (no authentication required),
 * falling back to locally-cached files if download fails.
 *
 * Unlike other suppliers (Scoop, MiRO, Nology), Rectron does NOT provide
 * stock-on-hand data. Only pricing and warranty info are available.
 */

export * from './rectron-types'
export * from './rectron-parser'
export * from './rectron-sync'
export * from './rectron-downloader'
