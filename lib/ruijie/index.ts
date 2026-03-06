/**
 * Ruijie Cloud API Integration
 * @module lib/ruijie
 */

// Types
export * from './types';

// Auth
export { getAccessToken, clearRuijieAuth, hasRuijieAuth } from './auth';

// Client
export {
  getAllDevices,
  getDevice,
  createTunnel,
  deleteTunnel,
  rebootDevice,
  isMockMode,
} from './client';

// Sync Service
export {
  upsertDevices,
  logSyncRun,
  createSyncLog,
  getActiveTunnelCount,
  expireStaleTunnels,
  seedMockData,
  isCacheEmpty,
} from './sync-service';

// Mock (for testing)
export { getMockDevices, getMockDevice, createMockTunnel } from './mock';
