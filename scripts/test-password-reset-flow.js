// Test password reset email flow with correct Supabase configuration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: 'implicit', // Force implicit flow instead of PKCE
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

async function testPasswordResetFlow() {
  const email = 'jeffrey.de.wee@circletel.co.za';

  console.log('\n=== Testing Password Reset Flow ===\n');
  console.log(`Email: ${email}\n`);

  try {
    // Send password reset email with explicit redirect URL
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://circletel-staging.vercel.app/auth/reset-password',
    });

    if (error) {
      console.error('❌ Error sending password reset:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Password reset email sent successfully!');
    console.log('\nNext steps:');
    console.log('1. Check your email inbox');
    console.log('2. Look at the URL format in the email link');
    console.log('3. It should contain either:');
    console.log('   - ?token_hash=xxx&type=recovery (OTP flow)');
    console.log('   - #access_token=xxx&refresh_token=yyy (Magic Link)');
    console.log('4. It should NOT contain: ?code=xxx (PKCE flow)');
    console.log('\nIf it still shows ?code=, the Supabase Auth Flow setting needs to be changed.');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testPasswordResetFlow().catch(console.error);
