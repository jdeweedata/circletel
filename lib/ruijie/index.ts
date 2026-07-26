/**
 * Ruijie Cloud API Integration
 * @module lib/ruijie
 */

// Types
export * from './types';

// Auth
export { authenticateRuijie, getAccessToken, clearRuijieAuth, hasRuijieAuth } from './auth';

// Client
export {
  getAllGroups,
  getAllDevices,
  getAllDevicesDetailed,
  getDevice,
  getDeviceMetrics,
  getDeviceCurrentPerformance,
  getGroupStaUsers,
  enrichDevicesWithLiveMetrics,
  getNetworkTraffic,
  pickFlowDeviceSn,
  createTunnel,
  deleteTunnel,
  rebootDevice,
  isMockMode,
} from './client';

export {
  mapCurrentPerformance,
  aggregateStaMetricsForDevice,
  buildHourlyFlowRequest,
} from './performance-metrics';

export {
  RUIJIE_ACTIVE_WINDOW_DAYS,
  isDeviceActiveInWindow,
  filterActiveDevices,
} from './active-window';

export {
  RUIJIE_TRAFFIC_HISTORY_HOURS,
  RUIJIE_TRAFFIC_RETENTION_DAYS,
  RUIJIE_TRAFFIC_GROUP_DELAY_MS,
  clampTrafficHistoryHours,
} from './traffic-history';

// Sync Service
export {
  upsertDevices,
  pruneDevicesNotInSet,
  shouldSkipDevicePrune,
  logSyncRun,
  createSyncLog,
  getActiveTunnelCount,
  expireStaleTunnels,
  seedMockData,
  isCacheEmpty,
} from './sync-service';

// Mock (for testing)
export { getMockDevices, getMockDevice, createMockTunnel } from './mock';
