/**
 * Test ClickaTell OTP Integration
 * Sends a test OTP to verify the SMS service is working
 */

import { clickatellService } from '../lib/integrations/clickatell/sms-service';
import { otpService } from '../lib/integrations/clickatell/otp-service';

async function testClickatellOTP() {
  const testPhone = '0737288016';
  
  console.log('\n' + '='.repeat(80));
  console.log('CLICKATELL OTP TEST');
  console.log('='.repeat(80));
  console.log(`\n📱 Test Phone Number: ${testPhone}`);
  console.log(`⏰ Test Time: ${new Date().toISOString()}\n`);

  try {
    // Generate OTP
    console.log('🔢 Generating OTP...');
    const otp = otpService.generateOTP();
    console.log(`✅ OTP Generated: ${otp}\n`);

    // Format phone number
    const formattedPhone = testPhone.startsWith('0') 
      ? '27' + testPhone.substring(1) 
      : testPhone;
    console.log(`📞 Formatted Phone: ${formattedPhone}\n`);

    // Send OTP via ClickaTell
    console.log('📤 Sending OTP via ClickaTell...');
    const result = await clickatellService.sendOTP(testPhone, otp);

    if (result.success) {
      console.log('\n' + '='.repeat(80));
      console.log('✅ SUCCESS - OTP SENT!');
      console.log('='.repeat(80));
      console.log(`\n📱 Phone: ${testPhone}`);
      console.log(`🔢 OTP Code: ${otp}`);
      console.log(`⏱️  Valid for: 10 minutes`);
      console.log(`\n💬 Message sent: "Your CircleTel verification code is: ${otp}. This code will expire in 10 minutes."`);
      console.log('\n✨ Check your phone for the SMS!\n');

      // Store OTP for verification testing
      await otpService.storeOTP(testPhone, otp);
      console.log('💾 OTP stored in system for verification testing\n');

    } else {
      console.log('\n' + '='.repeat(80));
      console.log('❌ FAILED - OTP NOT SENT');
      console.log('='.repeat(80));
      console.log(`\n❌ Error: ${result.error}\n`);
      console.log('Possible issues:');
      console.log('  1. Check CLICKATELL_API_KEY in .env.clickatell');
      console.log('  2. Check CLICKATELL_API_ID in .env.clickatell');
      console.log('  3. Verify ClickaTell account has credits');
      console.log('  4. Ensure phone number is valid South African number');
      console.log('  5. Check ClickaTell API status\n');
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
testClickatellOTP().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
