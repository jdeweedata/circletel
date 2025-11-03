/**
 * Customer Onboarding Service
 *
 * Purpose: Create customer portal accounts after service activation
 * Task Group: 12.4 - Customer Account Creation
 */

import { createClient } from '@/lib/supabase/server';
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

  console.log('[Customer Onboarding] Starting account creation for customer:', customerId);

  // 1. Fetch customer details
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (customerError || !customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  console.log('[Customer Onboarding] Customer loaded:', customer.email);

  // 2. Check if customer account already exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('[Customer Onboarding] Failed to list users:', listError);
    throw new Error('Failed to check existing accounts');
  }

  const userExists = existingUsers.users.some(u => u.email === customer.email);

  if (userExists) {
    console.log('[Customer Onboarding] Account already exists:', customer.email);
    return { email: customer.email, temporaryPassword: '' };
  }

  // 3. Generate temporary password (8 characters, alphanumeric)
  const temporaryPassword = crypto.randomBytes(4).toString('hex');

  console.log('[Customer Onboarding] Temporary password generated (length:', temporaryPassword.length, ')');

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
    console.error('[Customer Onboarding] Failed to create user:', createError);
    throw new Error(`Failed to create customer account: ${createError.message}`);
  }

  console.log('[Customer Onboarding] ✅ Account created:', newUser.user?.email);

  // 5. Send welcome email with credentials (Task Group 14 will implement this)
  // TODO: await sendWelcomeEmail(customer.email, temporaryPassword);
  console.log('[Customer Onboarding] ⚠️ Welcome email not yet implemented (Task Group 14)');

  return {
    email: customer.email,
    temporaryPassword
  };
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

  console.log('[Customer Onboarding] Resetting password for customer:', customerId);

  // Fetch customer details
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('email')
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

  console.log('[Customer Onboarding] ✅ Password reset for:', customer.email);

  // TODO: Send password reset email (Task Group 14)

  return {
    email: customer.email,
    temporaryPassword
  };
}

/**
 * Suspend Customer Account
 *
 * @param customerId - UUID of customers record
 */
export async function suspendCustomerAccount(customerId: string): Promise<void> {
  const supabase = await createClient();

  console.log('[Customer Onboarding] Suspending account for customer:', customerId);

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
    console.warn('[Customer Onboarding] User account not found:', customer.email);
    return;
  }

  // Ban user (suspends account)
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    ban_duration: 'indefinite' as any // Suspend indefinitely
  });

  if (error) {
    throw new Error(`Failed to suspend account: ${error.message}`);
  }

  console.log('[Customer Onboarding] ✅ Account suspended:', customer.email);
}

/**
 * Reactivate Customer Account
 *
 * @param customerId - UUID of customers record
 */
export async function reactivateCustomerAccount(customerId: string): Promise<void> {
  const supabase = await createClient();

  console.log('[Customer Onboarding] Reactivating account for customer:', customerId);

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
    ban_duration: 'none' as any
  });

  if (error) {
    throw new Error(`Failed to reactivate account: ${error.message}`);
  }

  console.log('[Customer Onboarding] ✅ Account reactivated:', customer.email);
}
