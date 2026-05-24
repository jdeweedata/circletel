/**
 * Rectron Supplier Module
 *
 * Exports all Rectron-related functionality for product sync.
 *
 * Rectron is a major South African ICT distributor. Their price list is
 * distributed as an Excel (.xlsm) file via the RectronZone reseller portal.
 * The file is downloaded manually (CAPTCHA-gated) and placed in a watch
 * directory for automatic sync.
 *
 * Unlike other suppliers (Scoop, MiRO, Nology), Rectron does NOT provide
 * stock-on-hand data. Only pricing and warranty info are available.
 */

export * from './rectron-types'
export * from './rectron-parser'
export * from './rectron-sync'
