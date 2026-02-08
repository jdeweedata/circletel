/**
 * Utility Functions Module
 *
 * Centralized exports for utility functions used across the CircleTel codebase.
 * Import from '@/lib/utils' for core utilities or specific sub-paths for
 * domain-specific utilities.
 *
 * @module lib/utils
 *
 * @example
 * ```typescript
 * // Core utility (most common - from lib/utils.ts)
 * import { cn } from '@/lib/utils';
 *
 * // Domain-specific imports (recommended for tree-shaking)
 * import { validateFile } from '@/lib/utils/file-upload';
 * import { getBaseUrl } from '@/lib/utils/webhook-urls';
 * import { convertToCSV, downloadCSV } from '@/lib/utils/export';
 * ```
 */

// ============================================================================
// UI UTILITIES (Aceternity)
// ============================================================================

export {
  cn, // Re-exported from lib/utils.ts
  generateRandomString,
  getRandomFloat,
  getRandomInt,
} from './aceternity';

// ============================================================================
// GOOGLE MAPS
// ============================================================================

export {
  loadGoogleMapsScript,
  isGoogleMapsLoaded,
  resetGoogleMapsState,
} from './google-maps';

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export {
  // General export utilities (export.ts)
  convertToCSV,
  downloadCSV,
  exportToCSV,
  exportToExcel,
  exportInstallationsToCSV,
  type InstallationExportData,
} from './export';

export {
  // Product-specific CSV export (export-csv.ts)
  convertProductsToCSV,
  downloadCSV as downloadProductCSV,
  generateCSVFilename,
} from './export-csv';

// ============================================================================
// FILE UPLOAD
// ============================================================================

export {
  validateFile,
  uploadFileToStorage,
  type FileUploadResult,
  type FileValidationResult,
  type UploadProgress,
} from './file-upload';

// ============================================================================
// WEBHOOK UTILITIES
// ============================================================================

export {
  getCurrentEnvironment,
  getBaseUrl,
  getAllWebhookUrls,
  isValidWebhookUrl,
  WebhookUrls,
  type Environment,
} from './webhook-urls';
