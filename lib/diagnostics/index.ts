/**
 * Diagnostics & Troubleshooting Module
 *
 * Monitors subscriber connection health using Interstellio (NebularStack) CDR data.
 * Provides auto-ticketing, alerts, and admin dashboard integration.
 *
 * @version 1.0
 * @created 2025-12-20
 */

// Types
export * from './types'

// Analyzer
export { DiagnosticsAnalyzer, createDiagnosticsAnalyzer, analyzeSubscriber } from './analyzer'
