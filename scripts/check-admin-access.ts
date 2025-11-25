/**
 * Check if a user has admin portal access
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { executeQuery } from '../.claude/tools/supabase-executor';

async function checkAdminAccess() {
  const email = 'tamsynb@intelliview.co.za';

  console.log(`\nChecking admin access for: ${email}\n`);

  try {
    // Query all columns to see what's available
    const response = await executeQuery({
      table: 'admin_users',
      operation: 'select',
      filters: [
        { column: 'email', operator: 'eq', value: email }
      ],
      single: true
    }, {
      logExecution: false // Disable logging to avoid env var issues
    });

    if (response.success && response.data) {
      const user = response.data;
      console.log('✅ ADMIN ACCESS FOUND\n');
      console.log('User Details:');
      console.log('-------------');
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Full Name: ${user.full_name}`);
      console.log(`Role: ${user.role}`);
      console.log(`Role Template: ${user.role_template_id}`);
      console.log(`Status: ${user.is_active ? 'Active' : 'Inactive'}`);
      console.log(`Department: ${user.department || 'Not set'}`);
      console.log(`Job Title: ${user.job_title || 'Not set'}`);
      console.log(`Last Login: ${user.last_login || 'Never'}`);
      console.log(`Created: ${user.created_at}`);
      console.log(`Updated: ${user.updated_at}`);

      if (user.custom_permissions && user.custom_permissions.length > 0) {
        console.log(`\nCustom Permissions: ${user.custom_permissions.join(', ')}`);
      }
    } else if (response.success && !response.data) {
      console.log('❌ NO ADMIN ACCESS');
      console.log(`\nThe email "${email}" is not registered as an admin user.`);
    } else {
      console.log('❌ ERROR');
      console.log('Error Message:', response.error?.message || 'No error message');
      console.log('Error Details:', JSON.stringify(response.error, null, 2));
      console.log('Full Response:', JSON.stringify(response, null, 2));
    }

    console.log('\nQuery Metadata:');
    console.log(`Execution Time: ${response.metadata.executionTime}ms`);

  } catch (error) {
    console.error('Failed to check admin access:', error);
  }
}

checkAdminAccess();
