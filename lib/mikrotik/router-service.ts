/**
 * MikroTik Router Service
 *
 * Business logic for MikroTik router management.
 * Handles CRUD operations, sync, WiFi management, and config backups.
 *
 * @module lib/mikrotik/router-service
 */

import { createClient } from '@/lib/supabase/server';
import { MikrotikEncryptionService } from './encryption-service';
import { getProxyClient, ProxyError } from './proxy-client';
import type {
  MikrotikRouter,
  MikrotikRouterWithClinic,
  MikrotikRouterCreate,
  MikrotikRouterUpdate,
  MikrotikRouterFilters,
  MikrotikSyncResult,
  MikrotikSyncLog,
  MikrotikAuditLog,
  MikrotikAuditAction,
  MikrotikWifiPasswordUpdate,
  MikrotikConnectionTestResult,
} from '@/lib/types/mikrotik';

// =============================================================================
// ROUTER CRUD OPERATIONS
// =============================================================================

export class MikrotikRouterService {
  /**
   * Create a new router entry
   */
  static async createRouter(
    data: MikrotikRouterCreate,
    adminUserId: string
  ): Promise<MikrotikRouter> {
    const supabase = await createClient();

    // Encrypt credentials
    const credentials = MikrotikEncryptionService.encryptRouterCredentials(
      data.pppoe_password,
      data.router_password,
      data.wifi_ssid_staff ? undefined : undefined // WiFi password set separately
    );

    const insertData = {
      identity: data.identity,
      mac_address: data.mac_address,
      management_ip: data.management_ip,
      pppoe_username: data.pppoe_username,
      pppoe_password_encrypted: credentials.pppoe.encrypted,
      pppoe_password_iv: credentials.pppoe.iv,
      pppoe_password_auth_tag: credentials.pppoe.authTag,
      router_username: data.router_username || 'thinkadmin',
      router_password_encrypted: credentials.router.encrypted,
      router_password_iv: credentials.router.iv,
      router_password_auth_tag: credentials.router.authTag,
      clinic_audit_id: data.clinic_audit_id || null,
      clinic_name: data.clinic_name || null,
      province: data.province || null,
      model: data.model || null,
      serial_number: data.serial_number || null,
      wifi_ssid_staff: data.wifi_ssid_staff || null,
      wifi_ssid_hotspot: data.wifi_ssid_hotspot || null,
      notes: data.notes || null,
      created_by: adminUserId,
      updated_by: adminUserId,
    };

    const { data: router, error } = await supabase
      .from('mikrotik_routers')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create router: ${error.message}`);
    }

    // Log audit
    await this.logAudit(router.id, adminUserId, 'router_created', {
      identity: data.identity,
      management_ip: data.management_ip,
    });

    return this.mapToRouter(router);
  }

  /**
   * Get a router by ID
   */
  static async getRouter(id: string): Promise<MikrotikRouterWithClinic | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('mikrotik_routers')
      .select(`
        *,
        clinic:unjani_contract_audits(
          id,
          clinic_name,
          province,
          region,
          address
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get router: ${error.message}`);
    }

    return this.mapToRouterWithClinic(data);
  }

  /**
   * List routers with optional filters
   */
  static async listRouters(
    filters?: MikrotikRouterFilters
  ): Promise<{ routers: MikrotikRouter[]; total: number; filters: { provinces: string[]; models: string[] } }> {
    const supabase = await createClient();

    let query = supabase
      .from('mikrotik_routers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.search) {
      query = query.or(
        `identity.ilike.%${filters.search}%,clinic_name.ilike.%${filters.search}%,management_ip::text.ilike.%${filters.search}%`
      );
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.province) {
      query = query.eq('province', filters.province);
    }
    if (filters?.clinic_audit_id) {
      query = query.eq('clinic_audit_id', filters.clinic_audit_id);
    }

    query = query.order('identity', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list routers: ${error.message}`);
    }

    // Get distinct filter options
    const { data: filterData } = await supabase
      .from('mikrotik_routers')
      .select('province, model');

    const provinces = [...new Set((filterData || []).map((r) => r.province).filter(Boolean))] as string[];
    const models = [...new Set((filterData || []).map((r) => r.model).filter(Boolean))] as string[];

    return {
      routers: (data || []).map(this.mapToRouter),
      total: count || 0,
      filters: { provinces, models },
    };
  }

  /**
   * Update a router
   */
  static async updateRouter(
    id: string,
    data: MikrotikRouterUpdate,
    adminUserId: string
  ): Promise<MikrotikRouter> {
    const supabase = await createClient();

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_by: adminUserId,
    };

    // Copy simple fields
    const simpleFields = [
      'identity', 'mac_address', 'management_ip', 'pppoe_username',
      'router_username', 'clinic_audit_id', 'clinic_name', 'province',
      'model', 'serial_number', 'wifi_ssid_staff', 'wifi_ssid_hotspot', 'notes'
    ];
    for (const field of simpleFields) {
      if (field in data) {
        updateData[field] = data[field as keyof MikrotikRouterUpdate];
      }
    }

    // Handle password updates
    if (data.pppoe_password) {
      const encrypted = MikrotikEncryptionService.encrypt(data.pppoe_password);
      updateData.pppoe_password_encrypted = encrypted.encrypted;
      updateData.pppoe_password_iv = encrypted.iv;
      updateData.pppoe_password_auth_tag = encrypted.authTag;
    }

    if (data.router_password) {
      const encrypted = MikrotikEncryptionService.encrypt(data.router_password);
      updateData.router_password_encrypted = encrypted.encrypted;
      updateData.router_password_iv = encrypted.iv;
      updateData.router_password_auth_tag = encrypted.authTag;
    }

    const { data: router, error } = await supabase
      .from('mikrotik_routers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update router: ${error.message}`);
    }

    // Log audit
    await this.logAudit(id, adminUserId, 'router_updated', {
      updated_fields: Object.keys(updateData).filter((k) => k !== 'updated_by'),
    });

    return this.mapToRouter(router);
  }

  /**
   * Delete a router
   */
  static async deleteRouter(id: string, adminUserId: string): Promise<void> {
    const supabase = await createClient();

    // Get router info before delete for audit
    const router = await this.getRouter(id);
    if (!router) {
      throw new Error('Router not found');
    }

    const { error } = await supabase
      .from('mikrotik_routers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete router: ${error.message}`);
    }

    // Log audit (router_id will be null after cascade delete)
    await this.logAudit(null, adminUserId, 'router_deleted', {
      deleted_identity: router.identity,
      deleted_management_ip: router.management_ip,
    });
  }

  // ===========================================================================
  // SYNC OPERATIONS
  // ===========================================================================

  /**
   * Sync status for a single router
   */
  static async syncRouterStatus(id: string): Promise<MikrotikRouter> {
    const supabase = await createClient();

    // Get router with credentials
    const { data: router, error: fetchError } = await supabase
      .from('mikrotik_routers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !router) {
      throw new Error('Router not found');
    }

    const proxy = getProxyClient();

    try {
      const status = await proxy.getBasicStatus(router.management_ip);

      // Update router with status
      const { data: updated, error: updateError } = await supabase
        .from('mikrotik_routers')
        .update({
          status: 'online',
          firmware_version: status.version,
          uptime_seconds: status.uptime_seconds,
          cpu_usage: status.cpu_load,
          memory_usage: Math.round(
            ((status.total_memory - status.free_memory) / status.total_memory) * 100
          ),
          last_seen_at: new Date().toISOString(),
          synced_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update status: ${updateError.message}`);
      }

      return this.mapToRouter(updated);
    } catch (error) {
      // Mark as offline
      const { data: updated } = await supabase
        .from('mikrotik_routers')
        .update({
          status: 'offline',
          synced_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updated) {
        return this.mapToRouter(updated);
      }
      throw error;
    }
  }

  /**
   * Sync all routers
   */
  static async syncAllRouters(
    triggeredBy: 'cron' | 'manual' = 'cron',
    adminUserId?: string
  ): Promise<MikrotikSyncResult> {
    const supabase = await createClient();
    const startTime = Date.now();

    // Create sync log
    const { data: syncLog } = await supabase
      .from('mikrotik_sync_logs')
      .insert({
        started_at: new Date().toISOString(),
        triggered_by: triggeredBy,
        admin_user_id: adminUserId || null,
      })
      .select()
      .single();

    // Get all routers
    const { data: routers, error: listError } = await supabase
      .from('mikrotik_routers')
      .select('id, identity, management_ip');

    if (listError || !routers) {
      throw new Error('Failed to list routers for sync');
    }

    const proxy = getProxyClient();
    const results: MikrotikSyncResult = {
      online: 0,
      offline: 0,
      failed: 0,
      errors: [],
      duration_ms: 0,
    };

    // Batch ping all routers
    const routerIps = routers.map((r) => r.management_ip);
    const pingResults = await proxy.batchPing(routerIps);

    // Update each router based on ping result
    for (const router of routers) {
      const pingResult = pingResults.get(router.management_ip);

      if (pingResult?.success) {
        results.online++;
        await supabase
          .from('mikrotik_routers')
          .update({
            status: 'online',
            last_seen_at: new Date().toISOString(),
            synced_at: new Date().toISOString(),
          })
          .eq('id', router.id);
      } else {
        results.offline++;
        await supabase
          .from('mikrotik_routers')
          .update({
            status: 'offline',
            synced_at: new Date().toISOString(),
          })
          .eq('id', router.id);

        if (pingResult?.error) {
          results.errors.push({
            router_id: router.id,
            identity: router.identity,
            error: pingResult.error,
          });
        }
      }
    }

    results.duration_ms = Date.now() - startTime;

    // Update sync log
    if (syncLog) {
      await supabase
        .from('mikrotik_sync_logs')
        .update({
          completed_at: new Date().toISOString(),
          duration_ms: results.duration_ms,
          routers_checked: routers.length,
          routers_online: results.online,
          routers_offline: results.offline,
          routers_failed: results.errors.length,
          error_message: results.errors.length > 0
            ? `${results.errors.length} routers failed: ${results.errors.map((e) => e.identity).join(', ')}`
            : null,
        })
        .eq('id', syncLog.id);
    }

    return results;
  }

  // ===========================================================================
  // WIFI MANAGEMENT
  // ===========================================================================

  /**
   * Get WiFi configuration from router
   */
  static async getWifiConfig(routerId: string) {
    const router = await this.getRouter(routerId);
    if (!router) {
      throw new Error('Router not found');
    }

    const proxy = getProxyClient();
    return proxy.getWifiConfig(router.management_ip);
  }

  /**
   * Update WiFi password
   */
  static async updateWifiPassword(
    routerId: string,
    update: MikrotikWifiPasswordUpdate,
    adminUserId: string
  ): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient();

    const router = await this.getRouter(routerId);
    if (!router) {
      throw new Error('Router not found');
    }

    const proxy = getProxyClient();

    try {
      const result = await proxy.updateWifiPassword(router.management_ip, update);

      // Update cached SSID if changed
      if (update.ssid && update.vlan_id === 10) {
        await supabase
          .from('mikrotik_routers')
          .update({ wifi_ssid_staff: update.ssid })
          .eq('id', routerId);
      }

      // Log audit
      await this.logAudit(routerId, adminUserId, 'wifi_password_changed', {
        vlan_id: update.vlan_id,
        ssid_changed: !!update.ssid,
      });

      return result;
    } catch (error) {
      // Log failed attempt
      await this.logAudit(
        routerId,
        adminUserId,
        'wifi_password_changed',
        { vlan_id: update.vlan_id },
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  // ===========================================================================
  // CONFIG BACKUP
  // ===========================================================================

  /**
   * Export and store router config
   */
  static async backupConfig(routerId: string, adminUserId: string): Promise<string> {
    const supabase = await createClient();

    const router = await this.getRouter(routerId);
    if (!router) {
      throw new Error('Router not found');
    }

    const proxy = getProxyClient();
    const backup = await proxy.exportConfig(router.management_ip);

    // Store in Supabase storage
    const filename = `mikrotik-backups/${router.identity}/${new Date().toISOString().replace(/[:.]/g, '-')}.rsc`;
    const { error: uploadError } = await supabase.storage
      .from('network-configs')
      .upload(filename, backup.config, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to store backup: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('network-configs')
      .getPublicUrl(filename);

    // Update router with backup info
    await supabase
      .from('mikrotik_routers')
      .update({
        config_backup_url: urlData.publicUrl,
        config_backup_at: new Date().toISOString(),
      })
      .eq('id', routerId);

    // Log audit
    await this.logAudit(routerId, adminUserId, 'config_exported', {
      filename,
      version: backup.version,
    });

    return urlData.publicUrl;
  }

  // ===========================================================================
  // ROUTER CONTROL
  // ===========================================================================

  /**
   * Reboot a router
   */
  static async rebootRouter(
    routerId: string,
    adminUserId: string
  ): Promise<{ success: boolean; message: string }> {
    const router = await this.getRouter(routerId);
    if (!router) {
      throw new Error('Router not found');
    }

    const proxy = getProxyClient();

    try {
      const result = await proxy.reboot(router.management_ip);

      // Log audit
      await this.logAudit(routerId, adminUserId, 'reboot_requested', {
        identity: router.identity,
      });

      return result;
    } catch (error) {
      await this.logAudit(
        routerId,
        adminUserId,
        'reboot_requested',
        { identity: router.identity },
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Test connection to a router (for validation)
   */
  static async testConnection(
    ip: string,
    _username: string,
    _password: string
  ): Promise<MikrotikConnectionTestResult> {
    const proxy = getProxyClient();
    return proxy.ping(ip);
  }

  // ===========================================================================
  // SYNC LOGS
  // ===========================================================================

  /**
   * Get sync logs
   */
  static async getSyncLogs(limit = 20): Promise<MikrotikSyncLog[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('mikrotik_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get sync logs: ${error.message}`);
    }

    return data || [];
  }

  // ===========================================================================
  // AUDIT LOGGING
  // ===========================================================================

  /**
   * Log an audit entry
   */
  private static async logAudit(
    routerId: string | null,
    adminUserId: string,
    action: MikrotikAuditAction,
    detail?: Record<string, unknown>,
    status: 'success' | 'failed' | 'pending' = 'success',
    errorMessage?: string
  ): Promise<void> {
    const supabase = await createClient();

    await supabase.from('mikrotik_audit_log').insert({
      router_id: routerId,
      admin_user_id: adminUserId,
      action,
      action_detail: detail || null,
      status,
      error_message: errorMessage || null,
    });
  }

  /**
   * Get audit log for a router
   */
  static async getAuditLog(routerId: string, limit = 50): Promise<MikrotikAuditLog[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('mikrotik_audit_log')
      .select('*')
      .eq('router_id', routerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get audit log: ${error.message}`);
    }

    return data || [];
  }

  // ===========================================================================
  // MAPPERS
  // ===========================================================================

  private static mapToRouter(data: Record<string, unknown>): MikrotikRouter {
    return {
      id: data.id as string,
      identity: data.identity as string,
      serial_number: data.serial_number as string | null,
      mac_address: data.mac_address as string,
      model: data.model as string | null,
      clinic_audit_id: data.clinic_audit_id as string | null,
      clinic_name: data.clinic_name as string | null,
      province: data.province as string | null,
      management_ip: data.management_ip as string,
      pppoe_username: data.pppoe_username as string,
      router_username: data.router_username as string,
      status: data.status as 'online' | 'offline' | 'unknown',
      firmware_version: data.firmware_version as string | null,
      uptime_seconds: data.uptime_seconds as number | null,
      cpu_usage: data.cpu_usage as number | null,
      memory_usage: data.memory_usage as number | null,
      last_seen_at: data.last_seen_at as string | null,
      wifi_ssid_staff: data.wifi_ssid_staff as string | null,
      wifi_ssid_hotspot: data.wifi_ssid_hotspot as string | null,
      synced_at: data.synced_at as string | null,
      config_backup_url: data.config_backup_url as string | null,
      config_backup_at: data.config_backup_at as string | null,
      notes: data.notes as string | null,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
      created_by: data.created_by as string | null,
      updated_by: data.updated_by as string | null,
    };
  }

  private static mapToRouterWithClinic(
    data: Record<string, unknown>
  ): MikrotikRouterWithClinic {
    const router = this.mapToRouter(data);
    const clinic = data.clinic as Record<string, unknown> | null;

    return {
      ...router,
      clinic: clinic
        ? {
            id: clinic.id as string,
            clinic_name: clinic.clinic_name as string,
            province: clinic.province as string,
            region: clinic.region as string,
            address: clinic.address as string,
          }
        : null,
    };
  }
}
