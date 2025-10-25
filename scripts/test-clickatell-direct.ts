/**
 * Direct ClickaTell OTP Test
 * Sends OTP directly without relying on .env loading
 */

// Hardcode credentials for testing
const CLICKATELL_API_KEY = 'zlt2pwSyRKySrygQNm9XVg==';
const CLICKATELL_BASE_URL = 'https://platform.clickatell.com/v1/message';
const TEST_PHONE = '0737288016';

async function sendOTP() {
  console.log('\n' + '='.repeat(80));
  console.log('CLICKATELL OTP TEST - DIRECT');
  console.log('='.repeat(80));
  console.log(`\n📱 Phone: ${TEST_PHONE}`);
  console.log(`⏰ Time: ${new Date().toISOString()}\n`);

  try {
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔢 Generated OTP: ${otp}\n`);

    // Format phone number (remove leading 0, add 27 for South Africa)
    const formattedPhone = '27' + TEST_PHONE.substring(1);
    console.log(`📞 Formatted Phone: ${formattedPhone}\n`);

    // Prepare message
    const message = `Your CircleTel verification code is: ${otp}. This code will expire in 10 minutes.`;
    console.log(`💬 Message: "${message}"\n`);

    // Send via ClickaTell Platform API v1
    console.log('📤 Sending SMS via ClickaTell Platform API...\n');
    
    const response = await fetch(CLICKATELL_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': CLICKATELL_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          {
            channel: 'sms',
            to: formattedPhone,
            content: message,
          }
        ]
      }),
    });

    const data = await response.json();

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok && data.messages && data.messages[0] && !data.messages[0].error) {
      console.log('='.repeat(80));
      console.log('✅ SUCCESS - OTP SENT!');
      console.log('='.repeat(80));
      console.log(`\n📱 Phone: ${TEST_PHONE}`);
      console.log(`🔢 OTP Code: ${otp}`);
      console.log(`⏱️  Valid for: 10 minutes`);
      console.log(`📨 Message ID: ${data.messages[0].apiMessageId || 'N/A'}`);
      console.log('\n✨ Check your phone for the SMS!\n');
    } else {
      console.log('='.repeat(80));
      console.log('❌ FAILED - OTP NOT SENT');
      console.log('='.repeat(80));
      
      if (data.error) {
        console.log(`\n❌ Error: ${data.error.description || data.error.code}`);
      } else if (data.messages && data.messages[0] && data.messages[0].error) {
        console.log(`\n❌ Error: ${data.messages[0].error.description || data.messages[0].error.code}`);
      } else {
        console.log(`\n❌ HTTP ${response.status}: Failed to send SMS`);
      }
      
      console.log('\nPossible issues:');
      console.log('  1. Invalid API key');
      console.log('  2. Insufficient credits in ClickaTell account');
      console.log('  3. Phone number format issue');
      console.log('  4. API endpoint changed');
      console.log('  5. Account restrictions\n');
    }

  } catch (error) {
    console.log('\n' + '='.repeat(80));
    console.log('💥 ERROR - EXCEPTION OCCURRED');
    console.log('='.repeat(80));
    console.error('\n', error);
    console.log('\n');
  }

  console.log('='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80) + '\n');
}

// Run the test
sendOTP().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
