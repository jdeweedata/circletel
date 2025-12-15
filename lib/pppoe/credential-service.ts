/**
 * PPPoE Credential Service
 *
 * Handles CRUD operations for PPPoE credentials, including:
 * - Creation with encrypted password storage
 * - Secure password reveal with audit logging
 * - Password regeneration
 * - Notification delivery (SMS/Email)
 * - Interstellio provisioning
 */

import { createClient } from '@/lib/supabase/server'
import { PPPoEEncryptionService, type EncryptedData } from './encryption-service'
import { getInterstellioClient } from '@/lib/interstellio'

// ============================================================================
// Types
// ============================================================================

export interface CreatePPPoEParams {
  customerId: string
  serviceId: string
  accountNumber: string
  profileId: string
  createdBy?: string
  sendNotifications?: {
    sms?: boolean
    email?: boolean
  }
}

export interface PPPoECredential {
  id: string
  customerId: string
  serviceId: string
  pppoeUsername: string
  provisioningStatus: 'pending' | 'provisioned' | 'failed' | 'deprovisioned'
  provisionedAt: string | null
  provisioningError: string | null
  interstellioSubscriberId: string | null
  credentialsSentAt: string | null
  credentialsSentVia: string[]
  createdAt: string
  updatedAt: string
}

export interface PPPoECredentialWithCustomer extends PPPoECredential {
  customer?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  service?: {
    id: string
    packageName: string
    status: string
  }
}

export interface AuditLogParams {
  credentialId?: string
  customerId?: string
  serviceId?: string
  action: string
  performedBy?: string
  performedByType: 'admin' | 'customer' | 'system'
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// PPPoE Credential Service
// ============================================================================

export class PPPoECredentialService {
  /**
   * Create new PPPoE credentials for a service
   */
  static async create(params: CreatePPPoEParams): Promise<{
    success: boolean
    credential?: PPPoECredential
    password?: string
    error?: string
  }> {
    const supabase = await createClient()

    try {
      // Generate PPPoE username from account number
      const pppoeUsername = `${params.accountNumber}@circletel.co.za`

      // Generate and encrypt password
      const password = PPPoEEncryptionService.generateHumanFriendlyPassword(12)
      const encryptedData = PPPoEEncryptionService.encrypt(password)

      // Check if credentials already exist for this service
      const { data: existing } = await supabase
        .from('pppoe_credentials')
        .select('id')
        .eq('service_id', params.serviceId)
        .single()

      if (existing) {
        return {
          success: false,
          error: 'PPPoE credentials already exist for this service',
        }
      }

      // Check if username is already taken
      const { data: usernameExists } = await supabase
        .from('pppoe_credentials')
        .select('id')
        .eq('pppoe_username', pppoeUsername)
        .single()

      if (usernameExists) {
        return {
          success: false,
          error: `PPPoE username ${pppoeUsername} is already in use`,
        }
      }

      // Create credential record
      const { data: credential, error: insertError } = await supabase
        .from('pppoe_credentials')
        .insert({
          customer_id: params.customerId,
          service_id: params.serviceId,
          pppoe_username: pppoeUsername,
          pppoe_password_encrypted: encryptedData.encrypted,
          password_iv: encryptedData.iv,
          password_auth_tag: encryptedData.authTag,
          created_by: params.createdBy,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create PPPoE credentials:', insertError)
        return {
          success: false,
          error: insertError.message,
        }
      }

      // Log creation
      await this.logAudit({
        credentialId: credential.id,
        customerId: params.customerId,
        serviceId: params.serviceId,
        action: 'created',
        performedBy: params.createdBy,
        performedByType: params.createdBy ? 'admin' : 'system',
      })

      // Send notifications if requested
      if (params.sendNotifications?.sms || params.sendNotifications?.email) {
        // This will be implemented in the notification phase
        // For now, we'll queue this for later
      }

      return {
        success: true,
        credential: this.mapCredential(credential),
        password, // Return password only on creation
      }
    } catch (error) {
      console.error('Error creating PPPoE credentials:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get credential by service ID
   */
  static async getByServiceId(serviceId: string): Promise<PPPoECredential | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pppoe_credentials')
      .select('*')
      .eq('service_id', serviceId)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapCredential(data)
  }

  /**
   * Get credential by ID
   */
  static async getById(id: string): Promise<PPPoECredential | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pppoe_credentials')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapCredential(data)
  }

  /**
   * Get credential with customer and service details
   */
  static async getByIdWithDetails(id: string): Promise<PPPoECredentialWithCustomer | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pppoe_credentials')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        customer_services (
          id,
          package_name,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers
    const service = Array.isArray(data.customer_services)
      ? data.customer_services[0]
      : data.customer_services

    return {
      ...this.mapCredential(data),
      customer: customer
        ? {
            id: customer.id,
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email,
            phone: customer.phone,
          }
        : undefined,
      service: service
        ? {
            id: service.id,
            packageName: service.package_name,
            status: service.status,
          }
        : undefined,
    }
  }

  /**
   * Get all credentials for a customer
   */
  static async getByCustomerId(customerId: string): Promise<PPPoECredential[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pppoe_credentials')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(this.mapCredential)
  }

  /**
   * List all credentials with pagination and filters
   */
  static async list(params: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }): Promise<{
    credentials: PPPoECredentialWithCustomer[]
    total: number
    page: number
    limit: number
  }> {
    const supabase = await createClient()
    const page = params.page || 1
    const limit = Math.min(params.limit || 20, 50)
    const offset = (page - 1) * limit

    let query = supabase
      .from('pppoe_credentials')
      .select(
        `
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        customer_services (
          id,
          package_name,
          status
        )
      `,
        { count: 'exact' }
      )

    if (params.status) {
      query = query.eq('provisioning_status', params.status)
    }

    if (params.search) {
      query = query.ilike('pppoe_username', `%${params.search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error || !data) {
      return { credentials: [], total: 0, page, limit }
    }

    const credentials = data.map((row) => {
      const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers
      const service = Array.isArray(row.customer_services)
        ? row.customer_services[0]
        : row.customer_services

      return {
        ...this.mapCredential(row),
        customer: customer
          ? {
              id: customer.id,
              firstName: customer.first_name,
              lastName: customer.last_name,
              email: customer.email,
              phone: customer.phone,
            }
          : undefined,
        service: service
          ? {
              id: service.id,
              packageName: service.package_name,
              status: service.status,
            }
          : undefined,
      }
    })

    return {
      credentials,
      total: count || 0,
      page,
      limit,
    }
  }

  /**
   * Reveal password (with audit logging)
   */
  static async revealPassword(
    id: string,
    requestedBy: string,
    requestedByType: 'admin' | 'customer',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; password?: string; error?: string }> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pppoe_credentials')
      .select('pppoe_password_encrypted, password_iv, password_auth_tag, customer_id, service_id')
      .eq('id', id)
      .single()

    if (error || !data) {
      return { success: false, error: 'Credential not found' }
    }

    try {
      const password = PPPoEEncryptionService.decrypt({
        encrypted: data.pppoe_password_encrypted,
        iv: data.password_iv,
        authTag: data.password_auth_tag,
      })

      // Log the reveal
      await this.logAudit({
        credentialId: id,
        customerId: data.customer_id,
        serviceId: data.service_id,
        action: 'password_revealed',
        performedBy: requestedBy,
        performedByType: requestedByType,
        ipAddress,
        userAgent,
      })

      return { success: true, password }
    } catch (error) {
      console.error('Failed to decrypt password:', error)
      return { success: false, error: 'Failed to decrypt password' }
    }
  }

  /**
   * Regenerate password
   */
  static async regeneratePassword(
    id: string,
    regeneratedBy: string,
    ipAddress?: string
  ): Promise<{ success: boolean; password?: string; error?: string }> {
    const supabase = await createClient()

    // Get current credential
    const { data: existing, error: fetchError } = await supabase
      .from('pppoe_credentials')
      .select('customer_id, service_id, interstellio_subscriber_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Credential not found' }
    }

    // Generate new password
    const newPassword = PPPoEEncryptionService.generateHumanFriendlyPassword(12)
    const encryptedData = PPPoEEncryptionService.encrypt(newPassword)

    // Update in database
    const { error: updateError } = await supabase
      .from('pppoe_credentials')
      .update({
        pppoe_password_encrypted: encryptedData.encrypted,
        password_iv: encryptedData.iv,
        password_auth_tag: encryptedData.authTag,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Log the regeneration
    await this.logAudit({
      credentialId: id,
      customerId: existing.customer_id,
      serviceId: existing.service_id,
      action: 'password_regenerated',
      performedBy: regeneratedBy,
      performedByType: 'admin',
      ipAddress,
    })

    // If already provisioned to Interstellio, we need to update there too
    // NOTE: Interstellio may not support password updates - will need to recreate subscriber
    if (existing.interstellio_subscriber_id) {
      // Mark as needing re-provisioning
      await supabase
        .from('pppoe_credentials')
        .update({
          provisioning_status: 'pending',
          provisioning_error: 'Password regenerated - needs re-provisioning',
        })
        .eq('id', id)
    }

    return { success: true, password: newPassword }
  }

  /**
   * Provision subscriber to Interstellio
   */
  static async provision(
    id: string,
    provisionedBy?: string
  ): Promise<{ success: boolean; subscriberId?: string; error?: string }> {
    const supabase = await createClient()

    // Get credential with decrypted password
    const { data: credential, error: fetchError } = await supabase
      .from('pppoe_credentials')
      .select(`
        *,
        customer_services (
          package_id,
          installation_address
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !credential) {
      return { success: false, error: 'Credential not found' }
    }

    // Decrypt password
    let password: string
    try {
      password = PPPoEEncryptionService.decrypt({
        encrypted: credential.pppoe_password_encrypted,
        iv: credential.password_iv,
        authTag: credential.password_auth_tag,
      })
    } catch {
      return { success: false, error: 'Failed to decrypt password for provisioning' }
    }

    try {
      const client = getInterstellioClient()

      // Get profile ID from environment or service mapping
      const profileId = await this.getInterstellioProfileId(
        credential.customer_services?.package_id
      )

      // Create subscriber in Interstellio with password
      const subscriber = await client.createSubscriber({
        virtual_id: process.env.INTERSTELLIO_VIRTUAL_ID!,
        service_id: process.env.INTERSTELLIO_SERVICE_ID!,
        profile_id: profileId,
        username: credential.pppoe_username,
        name: `CircleTel Customer`,
        enabled: true,
        password, // Include password in creation
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
        .eq('id', id)

      // Log provisioning
      await this.logAudit({
        credentialId: id,
        customerId: credential.customer_id,
        serviceId: credential.service_id,
        action: 'provisioned',
        performedBy: provisionedBy,
        performedByType: provisionedBy ? 'admin' : 'system',
        metadata: { interstellioSubscriberId: subscriber.id },
      })

      return { success: true, subscriberId: subscriber.id }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update credential with error
      await supabase
        .from('pppoe_credentials')
        .update({
          provisioning_status: 'failed',
          provisioning_error: errorMessage,
        })
        .eq('id', id)

      console.error('Failed to provision subscriber:', error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Deprovision subscriber from Interstellio
   */
  static async deprovision(
    id: string,
    deprovisionedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { data: credential, error: fetchError } = await supabase
      .from('pppoe_credentials')
      .select('interstellio_subscriber_id, customer_id, service_id')
      .eq('id', id)
      .single()

    if (fetchError || !credential) {
      return { success: false, error: 'Credential not found' }
    }

    if (!credential.interstellio_subscriber_id) {
      return { success: false, error: 'Not provisioned to Interstellio' }
    }

    try {
      const client = getInterstellioClient()

      // Delete subscriber from Interstellio
      await client.deleteSubscriber(credential.interstellio_subscriber_id)

      // Update credential
      await supabase
        .from('pppoe_credentials')
        .update({
          interstellio_subscriber_id: null,
          provisioning_status: 'deprovisioned',
          provisioned_at: null,
        })
        .eq('id', id)

      // Log deprovisioning
      await this.logAudit({
        credentialId: id,
        customerId: credential.customer_id,
        serviceId: credential.service_id,
        action: 'deprovisioned',
        performedBy: deprovisionedBy,
        performedByType: deprovisionedBy ? 'admin' : 'system',
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to deprovision subscriber:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Update notification status after sending credentials
   */
  static async updateNotificationStatus(
    id: string,
    method: 'sms' | 'email'
  ): Promise<void> {
    const supabase = await createClient()

    const { data } = await supabase
      .from('pppoe_credentials')
      .select('credentials_sent_via, customer_id, service_id')
      .eq('id', id)
      .single()

    if (!data) return

    const sentVia = data.credentials_sent_via || []
    if (!sentVia.includes(method)) {
      sentVia.push(method)
    }

    await supabase
      .from('pppoe_credentials')
      .update({
        credentials_sent_at: new Date().toISOString(),
        credentials_sent_via: sentVia,
      })
      .eq('id', id)

    // Log notification
    await this.logAudit({
      credentialId: id,
      customerId: data.customer_id,
      serviceId: data.service_id,
      action: method === 'sms' ? 'credentials_sent_sms' : 'credentials_sent_email',
      performedByType: 'system',
    })
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  /**
   * Log an audit entry
   */
  private static async logAudit(params: AuditLogParams): Promise<void> {
    const supabase = await createClient()

    await supabase.from('pppoe_audit_log').insert({
      credential_id: params.credentialId,
      customer_id: params.customerId,
      service_id: params.serviceId,
      action: params.action,
      performed_by: params.performedBy,
      performed_by_type: params.performedByType,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      metadata: params.metadata || {},
    })
  }

  /**
   * Map database row to PPPoECredential type
   */
  private static mapCredential(row: Record<string, unknown>): PPPoECredential {
    return {
      id: row.id as string,
      customerId: row.customer_id as string,
      serviceId: row.service_id as string,
      pppoeUsername: row.pppoe_username as string,
      provisioningStatus: row.provisioning_status as PPPoECredential['provisioningStatus'],
      provisionedAt: row.provisioned_at as string | null,
      provisioningError: row.provisioning_error as string | null,
      interstellioSubscriberId: row.interstellio_subscriber_id as string | null,
      credentialsSentAt: row.credentials_sent_at as string | null,
      credentialsSentVia: (row.credentials_sent_via as string[]) || [],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  }

  /**
   * Get Interstellio profile ID for a package
   * TODO: Implement proper mapping from CircleTel packages to Interstellio profiles
   */
  private static async getInterstellioProfileId(packageId?: string): Promise<string> {
    // For now, use environment variable default
    // This should be expanded to map specific packages to profiles
    return process.env.INTERSTELLIO_DEFAULT_PROFILE_ID || ''
  }
}
