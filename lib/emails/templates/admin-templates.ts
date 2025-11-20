/**
 * Admin Email Templates
 *
 * Helper functions for sending admin-related emails
 */

import { EnhancedEmailService } from '../enhanced-notification-service';
import type { AdminApprovalEmailData, EmailSendResult } from '../types';

/**
 * Send admin access approval email
 *
 * @param data - Email data including user details and credentials
 * @returns Result of email send operation
 */
export async function sendAdminApprovalEmail(
  data: AdminApprovalEmailData
): Promise<EmailSendResult> {
  try {
    const result = await EnhancedEmailService.sendEmail({
      to: data.email,
      templateId: 'admin-approval',
      props: {
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        roleName: data.roleName,
        tempPassword: data.tempPassword,
        loginUrl: data.loginUrl || 'https://www.circletel.co.za/admin/login',
        notes: data.notes,
      },
    });

    if (!result.success) {
      console.error('Failed to send admin approval email:', result.error);
      return {
        success: false,
        error: result.error,
      };
    }

    console.log('✅ Admin approval email sent successfully to:', data.email);
    console.log('   Message ID:', result.message_id);

    return {
      success: true,
      emailId: result.message_id,
    };
  } catch (error) {
    console.error('Error sending admin approval email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send admin access rejection email
 *
 * @param data - Email data including user details and rejection reason
 * @returns Result of email send operation
 */
export async function sendAdminRejectionEmail(data: {
  fullName: string;
  email: string;
  reason?: string;
}): Promise<EmailSendResult> {
  try {
    // Note: This requires creating a rejection email template
    // For now, we'll use a simple text-based email
    console.warn('⚠️ Admin rejection email template not yet implemented');
    console.log('   Would send to:', data.email);
    console.log('   Reason:', data.reason);

    return {
      success: false,
      error: 'Template not yet implemented',
    };
  } catch (error) {
    console.error('Error sending admin rejection email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send admin password reset email
 *
 * @param data - Email data including user details and reset link
 * @returns Result of email send operation
 */
export async function sendAdminPasswordResetEmail(data: {
  fullName: string;
  email: string;
  resetUrl: string;
  expiresIn?: string;
}): Promise<EmailSendResult> {
  try {
    // Note: This requires creating a password reset email template
    console.warn('⚠️ Admin password reset email template not yet implemented');
    console.log('   Would send to:', data.email);
    console.log('   Reset URL:', data.resetUrl);

    return {
      success: false,
      error: 'Template not yet implemented',
    };
  } catch (error) {
    console.error('Error sending admin password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send admin role changed notification email
 *
 * @param data - Email data including user details and new role
 * @returns Result of email send operation
 */
export async function sendAdminRoleChangedEmail(data: {
  fullName: string;
  email: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
}): Promise<EmailSendResult> {
  try {
    // Note: This requires creating a role changed email template
    console.warn('⚠️ Admin role changed email template not yet implemented');
    console.log('   Would send to:', data.email);
    console.log('   Old role:', data.oldRole);
    console.log('   New role:', data.newRole);

    return {
      success: false,
      error: 'Template not yet implemented',
    };
  } catch (error) {
    console.error('Error sending admin role changed email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
