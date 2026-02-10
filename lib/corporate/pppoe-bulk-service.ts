/**
 * Corporate PPPoE Bulk Service
 *
 * Handles bulk PPPoE operations for corporate sites:
 * - Bulk credential generation
 * - Bulk provisioning to Interstellio
 * - Export credentials as CSV for ops team
 */

import { createClient } from '@/lib/supabase/server'
import { PPPoEEncryptionService } from '@/lib/pppoe/encryption-service'
import { getInterstellioClient } from '@/lib/interstellio'
import { CorporateSite, PPPoEBulkGenerateResult, PPPoEBulkProvisionResult, PPPoEExportRow } from './types'

// ============================================================================
// Corporate PPPoE Bulk Service
// ============================================================================

export class CorporatePPPoEBulkService {
  /**
   * Generate PPPoE credentials for multiple sites
   * Creates encrypted passwords and stores in pppoe_credentials table
   *
   * @param siteIds - Array of site IDs to generate credentials for
   * @param generatedBy - Admin user ID who initiated the generation
   */
  static async bulkGenerate(
    siteIds: string[],
    generatedBy?: string
  ): Promise<PPPoEBulkGenerateResult> {
    const supabase = await createClient()
    const errors: PPPoEBulkGenerateResult['errors'] = []
    const credentials: PPPoEBulkGenerateResult['credentials'] = []

    // Get all sites with their details
    const { data: sites, error: fetchError } = await supabase
      .from('corporate_sites')
      .select('id, site_name, account_number, pppoe_username, pppoe_credential_id, status')
      .in('id', siteIds)

    if (fetchError || !sites) {
      return {
        success: false,
        totalSites: siteIds.length,
        generatedCount: 0,
        failedCount: siteIds.length,
        errors: [{ siteId: '', siteName: '', error: 'Failed to fetch sites' }],
        credentials: [],
      }
    }

    // Process each site
    for (const site of sites) {
      try {
        // Skip if credentials already exist
        if (site.pppoe_credential_id) {
          errors.push({
            siteId: site.id,
            siteName: site.site_name,
            error: 'Credentials already exist for this site',
          })
          continue
        }

        // Validate site has account number
        if (!site.account_number) {
          errors.push({
            siteId: site.id,
            siteName: site.site_name,
            error: 'Site does not have an account number',
          })
          continue
        }

        // Generate password
        const password = PPPoEEncryptionService.generateHumanFriendlyPassword(12)
        const encryptedData = PPPoEEncryptionService.encrypt(password)

        // PPPoE username is already set by trigger (account_number@circletel.co.za)
        const pppoeUsername = site.pppoe_username || `${site.account_number}@circletel.co.za`

        // Check if username already exists in pppoe_credentials
        const { data: existingCred } = await supabase
          .from('pppoe_credentials')
          .select('id')
          .eq('pppoe_username', pppoeUsername)
          .single()

        if (existingCred) {
          errors.push({
            siteId: site.id,
            siteName: site.site_name,
            error: `PPPoE username ${pppoeUsername} already exists`,
          })
          continue
        }

        // Create credential record
        const { data: credential, error: insertError } = await supabase
          .from('pppoe_credentials')
          .insert({
            pppoe_username: pppoeUsername,
            pppoe_password_encrypted: encryptedData.encrypted,
            password_iv: encryptedData.iv,
            password_auth_tag: encryptedData.authTag,
            created_by: generatedBy,
            // Note: customer_id and service_id are optional for corporate sites
          })
          .select('id')
          .single()

        if (insertError) {
          errors.push({
            siteId: site.id,
            siteName: site.site_name,
            error: insertError.message,
          })
          continue
        }

        // Update site with credential reference
        const { error: updateError } = await supabase
          .from('corporate_sites')
          .update({
            pppoe_credential_id: credential.id,
            pppoe_username: pppoeUsername,
            status: 'provisioned',
          })
          .eq('id', site.id)

        if (updateError) {
          // Rollback credential creation
          await supabase.from('pppoe_credentials').delete().eq('id', credential.id)
          errors.push({
            siteId: site.id,
            siteName: site.site_name,
            error: updateError.message,
          })
          continue
        }

        // Log to audit
        await supabase.from('pppoe_audit_log').insert({
          credential_id: credential.id,
          action: 'created',
          performed_by: generatedBy,
          performed_by_type: generatedBy ? 'admin' : 'system',
          metadata: { siteId: site.id, accountNumber: site.account_number },
        })

        credentials.push({
          siteId: site.id,
          accountNumber: site.account_number,
          username: pppoeUsername,
          password,
        })
      } catch (error) {
        errors.push({
          siteId: site.id,
          siteName: site.site_name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return {
      success: errors.length === 0,
      totalSites: siteIds.length,
      generatedCount: credentials.length,
      failedCount: errors.length,
      errors,
      credentials,
    }
  }

  /**
   * Provision multiple sites to Interstellio
   * Creates subscribers in NebularStack for PPPoE authentication
   */
  static async bulkProvision(
    siteIds: string[],
    provisionedBy?: string
  ): Promise<PPPoEBulkProvisionResult> {
    const supabase = await createClient()
    const errors: PPPoEBulkProvisionResult['errors'] = []
    let provisionedCount = 0

    // Get sites with credentials
    const { data: sites, error: fetchError } = await supabase
      .from('corporate_sites')
      .select(`
        id,
        account_number,
        pppoe_credential_id,
        pppoe_credentials (
          id,
          pppoe_username,
          pppoe_password_encrypted,
          password_iv,
          password_auth_tag,
          interstellio_subscriber_id,
          provisioning_status
        )
      `)
      .in('id', siteIds)

    if (fetchError || !sites) {
      return {
        success: false,
        totalSites: siteIds.length,
        provisionedCount: 0,
        failedCount: siteIds.length,
        errors: [{ siteId: '', accountNumber: '', error: 'Failed to fetch sites' }],
      }
    }

    const client = getInterstellioClient()

    for (const site of sites) {
      try {
        // Handle Supabase join returning array
        const cred = Array.isArray(site.pppoe_credentials)
          ? site.pppoe_credentials[0]
          : site.pppoe_credentials

        if (!cred) {
          errors.push({
            siteId: site.id,
            accountNumber: site.account_number || '',
            error: 'No PPPoE credentials found. Generate credentials first.',
          })
          continue
        }

        // Skip if already provisioned
        if (cred.interstellio_subscriber_id) {
          errors.push({
            siteId: site.id,
            accountNumber: site.account_number || '',
            error: 'Already provisioned to Interstellio',
          })
          continue
        }

        // Decrypt password
        let password: string
        try {
          password = PPPoEEncryptionService.decrypt({
            encrypted: cred.pppoe_password_encrypted,
            iv: cred.password_iv,
            authTag: cred.password_auth_tag,
          })
        } catch {
          errors.push({
            siteId: site.id,
            accountNumber: site.account_number || '',
            error: 'Failed to decrypt password',
          })
          continue
        }

        // Create subscriber in Interstellio
        const subscriber = await client.createSubscriber({
          virtual_id: process.env.INTERSTELLIO_VIRTUAL_ID!,
          service_id: process.env.INTERSTELLIO_SERVICE_ID!,
          profile_id: process.env.INTERSTELLIO_DEFAULT_PROFILE_ID || '',
          username: cred.pppoe_username,
          name: `Corporate Site: ${site.account_number}`,
          enabled: true,
          password, // Include password
        } as Parameters<typeof client.createSubscriber>[0] & { password: string })

        // Update credential with Interstellio subscriber ID
        await supabase
          .from('pppoe_credentials')
          .update({
            interstellio_subscriber_id: subscriber.id,
            provisioning_status: 'provisioned',
            provisioned_at: new Date().toISOString(),
            provisioning_error: null,
          })
          .eq('id', cred.id)

        // Update site status
        await supabase
          .from('corporate_sites')
          .update({ status: 'provisioned' })
          .eq('id', site.id)

        // Log to audit
        await supabase.from('pppoe_audit_log').insert({
          credential_id: cred.id,
          action: 'provisioned',
          performed_by: provisionedBy,
          performed_by_type: provisionedBy ? 'admin' : 'system',
          metadata: {
            siteId: site.id,
            accountNumber: site.account_number,
            interstellioSubscriberId: subscriber.id,
          },
        })

        provisionedCount++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Update credential with error
        if (site.pppoe_credential_id) {
          await supabase
            .from('pppoe_credentials')
            .update({
              provisioning_status: 'failed',
              provisioning_error: errorMessage,
            })
            .eq('id', site.pppoe_credential_id)
        }

        errors.push({
          siteId: site.id,
          accountNumber: site.account_number || '',
          error: errorMessage,
        })
      }
    }

    return {
      success: errors.length === 0,
      totalSites: siteIds.length,
      provisionedCount,
      failedCount: errors.length,
      errors,
    }
  }

  /**
   * Export credentials for all sites in a corporate
   * Returns decrypted passwords for ops team
   */
  static async exportCredentials(
    corporateId: string,
    requestedBy: string,
    ipAddress?: string
  ): Promise<{
    success: boolean
    data?: PPPoEExportRow[]
    error?: string
  }> {
    const supabase = await createClient()

    // Get all sites with credentials
    const { data: sites, error: fetchError } = await supabase
      .from('corporate_sites')
      .select(`
        id,
        site_name,
        account_number,
        pppoe_username,
        installation_address,
        province,
        status,
        pppoe_credential_id,
        pppoe_credentials (
          pppoe_password_encrypted,
          password_iv,
          password_auth_tag
        )
      `)
      .eq('corporate_id', corporateId)
      .order('site_number', { ascending: true })

    if (fetchError || !sites) {
      return { success: false, error: 'Failed to fetch sites' }
    }

    const exportRows: PPPoEExportRow[] = []

    for (const site of sites) {
      // Handle Supabase join returning array
      const cred = Array.isArray(site.pppoe_credentials)
        ? site.pppoe_credentials[0]
        : site.pppoe_credentials

      let password = ''

      if (cred) {
        try {
          password = PPPoEEncryptionService.decrypt({
            encrypted: cred.pppoe_password_encrypted,
            iv: cred.password_iv,
            authTag: cred.password_auth_tag,
          })

          // Log credential access for audit
          await supabase.from('pppoe_audit_log').insert({
            credential_id: site.pppoe_credential_id,
            action: 'password_exported',
            performed_by: requestedBy,
            performed_by_type: 'admin',
            ip_address: ipAddress,
            metadata: { corporateId, exportType: 'bulk' },
          })
        } catch {
          password = '[DECRYPTION_ERROR]'
        }
      }

      // Format address for export
      const addr = site.installation_address as { street?: string; city?: string } | null
      const address = addr
        ? [addr.street, addr.city].filter(Boolean).join(', ')
        : ''

      exportRows.push({
        siteName: site.site_name,
        accountNumber: site.account_number || '',
        pppoeUsername: site.pppoe_username || '',
        password,
        address,
        province: site.province || '',
        status: site.status as CorporateSite['status'],
      })
    }

    return { success: true, data: exportRows }
  }

  /**
   * Generate credentials for sites without credentials
   */
  static async generateMissingCredentials(
    corporateId: string,
    generatedBy?: string
  ): Promise<PPPoEBulkGenerateResult> {
    const supabase = await createClient()

    // Get sites without credentials
    const { data: sites, error } = await supabase
      .from('corporate_sites')
      .select('id')
      .eq('corporate_id', corporateId)
      .is('pppoe_credential_id', null)

    if (error || !sites) {
      return {
        success: false,
        totalSites: 0,
        generatedCount: 0,
        failedCount: 0,
        errors: [{ siteId: '', siteName: '', error: 'Failed to fetch sites' }],
        credentials: [],
      }
    }

    if (sites.length === 0) {
      return {
        success: true,
        totalSites: 0,
        generatedCount: 0,
        failedCount: 0,
        errors: [],
        credentials: [],
      }
    }

    const siteIds = sites.map((s) => s.id)
    return this.bulkGenerate(siteIds, generatedBy)
  }

  /**
   * Get credential stats for a corporate
   */
  static async getCredentialStats(corporateId: string): Promise<{
    totalSites: number
    withCredentials: number
    provisioned: number
    pending: number
    failed: number
  }> {
    const supabase = await createClient()

    const { data: sites, error } = await supabase
      .from('corporate_sites')
      .select(`
        id,
        pppoe_credential_id,
        pppoe_credentials (provisioning_status)
      `)
      .eq('corporate_id', corporateId)

    if (error || !sites) {
      return {
        totalSites: 0,
        withCredentials: 0,
        provisioned: 0,
        pending: 0,
        failed: 0,
      }
    }

    let withCredentials = 0
    let provisioned = 0
    let pending = 0
    let failed = 0

    for (const site of sites) {
      if (site.pppoe_credential_id) {
        withCredentials++

        const cred = Array.isArray(site.pppoe_credentials)
          ? site.pppoe_credentials[0]
          : site.pppoe_credentials

        if (cred) {
          switch (cred.provisioning_status) {
            case 'provisioned':
              provisioned++
              break
            case 'failed':
              failed++
              break
            default:
              pending++
          }
        }
      }
    }

    return {
      totalSites: sites.length,
      withCredentials,
      provisioned,
      pending,
      failed,
    }
  }
}
