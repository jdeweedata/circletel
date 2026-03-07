/**
 * MikroTik Router Management Module
 *
 * @module lib/mikrotik
 */

export { MikrotikEncryptionService } from './encryption-service';
export type { EncryptedCredential, DecryptParams } from './encryption-service';

export { MikrotikProxyClient, ProxyError, getProxyClient } from './proxy-client';

export { MikrotikRouterService } from './router-service';

// Re-export types for convenience
export type {
  MikrotikRouter,
  MikrotikRouterWithClinic,
  MikrotikRouterCreate,
  MikrotikRouterUpdate,
  MikrotikRouterFilters,
  MikrotikRouterStatus,
  MikrotikSyncResult,
  MikrotikSyncLog,
  MikrotikAuditLog,
  MikrotikAuditAction,
  MikrotikSyncTrigger,
  MikrotikWifiConfig,
  MikrotikWifiPasswordUpdate,
  MikrotikInterface,
  MikrotikProxyStatus,
  MikrotikStatusResponse,
  MikrotikConfigBackup,
  MikrotikConnectionTestResult,
  MikrotikRoutersListResponse,
  MikrotikRouterResponse,
  MikrotikSyncLogsResponse,
  MikrotikActionResponse,
} from '@/lib/types/mikrotik';
