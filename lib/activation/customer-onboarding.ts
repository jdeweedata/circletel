/**
 * Customer Onboarding Service
 *
 * Purpose: Create customer portal accounts after service activation
 * Task Group: 12.4 - Customer Account Creation
 */

import { createClient } from '@/lib/supabase/server';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import { activationLogger } from '@/lib/logging';
import * as crypto from 'crypto';

/**
 * Create Customer Portal Account
 *
 * This function:
 * 1. Checks if customer account already exists
 * 2. Generates temporary password (8 characters, alphanumeric)
 * 3. Creates customer portal account via Supabase Auth
 * 4. Sends welcome email (Task Group 14)
 *
 * @param customerId - UUID of customers record
 * @returns Email and temporary password
 */
export async function createCustomerAccount(customerId: string): Promise<{
  email: string;
  temporaryPassword: string;
}> {
  const supabase = await createClient();

  activationLogger.info('Starting account creation', { customerId });

  // 1. Fetch customer details
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (customerError || !customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  activationLogger.debug('Customer loaded', { email: customer.email });

  // 2. Check if customer account already exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    activationLogger.error('Failed to list users', { error: listError.message });
    throw new Error('Failed to check existing accounts');
  }

  const userExists = existingUsers.users.some(u => u.email === customer.email);

  if (userExists) {
    activationLogger.info('Account already exists', { email: customer.email });
    return { email: customer.email, temporaryPassword: '' };
  }

  // 3. Generate temporary password (8 characters, alphanumeric)
  const temporaryPassword = crypto.randomBytes(4).toString('hex');

  activationLogger.debug('Temporary password generated', { length: temporaryPassword.length });

  // 4. Create customer portal account via Supabase Auth
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: customer.email,
    password: temporaryPassword,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      name: customer.name,
      customer_id: customerId,
      role: 'customer',
      created_by: 'system',
      created_at: new Date().toISOString()
    }
  });

  if (createError) {
    activationLogger.error('Failed to create user', { error: createError.message });
    throw new Error(`Failed to create customer account: ${createError.message}`);
  }

  activationLogger.info('Account created', { email: newUser.user?.email });

  // 5. Send welcome email with portal credentials
  try {
    await sendWelcomeEmail(customer.email, customer.name || 'Valued Customer', temporaryPassword);
    activationLogger.info('Welcome email sent', { email: customer.email });
  } catch (emailError) {
    // Log but don't fail - account was created successfully
    activationLogger.warn('Welcome email failed but account created', {
      email: customer.email,
      error: emailError instanceof Error ? emailError.message : 'Unknown error'
    });
  }

  return {
    email: customer.email,
    temporaryPassword
  };
}

/**
 * Send welcome email with portal credentials
 */
async function sendWelcomeEmail(
  email: string,
  customerName: string,
  temporaryPassword: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

  await EmailNotificationService.send({
    to: email,
    subject: 'Welcome to Your CircleTel Customer Portal',
    template: 'order_activated', // Reuses the activation template which includes login details
    data: {
      customer_name: customerName,
      temporary_password: temporaryPassword,
      portal_url: `${baseUrl}/account/login`,
      support_email: 'support@circletel.co.za',
      support_phone: '0860 CIRCLE (0860 247 253)',
    },
    tags: {
      notification_type: 'welcome_email',
    },
  });
}

/**
 * Reset Customer Password
 *
 * @param customerId - UUID of customers record
 * @returns New temporary password
 */
export async function resetCustomerPassword(customerId: string): Promise<{
  email: string;
  temporaryPassword: string;
}> {
  const supabase = await createClient();

  activationLogger.info('Resetting password', { customerId });

  // Fetch customer details
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('email, name')
    .eq('id', customerId)
    .single();

  if (customerError || !customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  // Generate new temporary password
  const temporaryPassword = crypto.randomBytes(4).toString('hex');

  // Update user password
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === customer.email);

  if (!user) {
    throw new Error(`User account not found for: ${customer.email}`);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: temporaryPassword
  });

  if (updateError) {
    throw new Error(`Failed to reset password: ${updateError.message}`);
  }

  activationLogger.info('Password reset', { email: customer.email });

  // Send password reset email
  try {
    await sendPasswordResetEmail(customer.email, customer.name || 'Valued Customer', temporaryPassword);
    activationLogger.info('Password reset email sent', { email: customer.email });
  } catch (emailError) {
    activationLogger.warn('Password reset email failed', {
      email: customer.email,
      error: emailError instanceof Error ? emailError.message : 'Unknown error'
    });
  }

  return {
    email: customer.email,
    temporaryPassword
  };
}

/**
 * Send password reset email with new temporary password
 */
async function sendPasswordResetEmail(
  email: string,
  customerName: string,
  temporaryPassword: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

  await EmailNotificationService.send({
    to: email,
    subject: 'Your CircleTel Password Has Been Reset',
    template: 'kyc_approved', // Reuses a simple notification template
    data: {
      customer_name: customerName,
      order_number: '', // Not applicable for password reset
      temporary_password: temporaryPassword,
      portal_url: `${baseUrl}/account/login`,
      message: `Your password has been reset. Please use the temporary password below to log in, then change your password immediately.`,
      support_email: 'support@circletel.co.za',
      support_phone: '0860 CIRCLE (0860 247 253)',
    },
    tags: {
      notification_type: 'password_reset',
    },
  });
}

/**
 * Suspend Customer Account
 *
 * @param customerId - UUID of customers record
 */
export async function suspendCustomerAccount(customerId: string): Promise<void> {
  const supabase = await createClient();

  activationLogger.info('Suspending account', { customerId });

  // Fetch customer email
  const { data: customer } = await supabase
    .from('customers')
    .select('email')
    .eq('id', customerId)
    .single();

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === customer.email);

  if (!user) {
    activationLogger.warn('User account not found for suspension', { email: customer.email });
    return;
  }

  // Ban user (suspends account)
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    ban_duration: 'indefinite' as unknown as string // Suspend indefinitely
  });

  if (error) {
    throw new Error(`Failed to suspend account: ${error.message}`);
  }

  activationLogger.info('Account suspended', { email: customer.email });
}

/**
 * Reactivate Customer Account
 *
 * @param customerId - UUID of customers record
 */
export async function reactivateCustomerAccount(customerId: string): Promise<void> {
  const supabase = await createClient();

  activationLogger.info('Reactivating account', { customerId });

  // Fetch customer email
  const { data: customer } = await supabase
    .from('customers')
    .select('email')
    .eq('id', customerId)
    .single();

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === customer.email);

  if (!user) {
    throw new Error(`User account not found: ${customer.email}`);
  }

  // Unban user (reactivate account)
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    ban_duration: 'none' as unknown as string
  });

  if (error) {
    throw new Error(`Failed to reactivate account: ${error.message}`);
  }

  activationLogger.info('Account reactivated', { email: customer.email });
}
