/**
 * Export MTN SSO Session as Environment Variable
 *
 * Converts cached session to base64 for Vercel environment variables
 *
 * Usage:
 *   npx tsx scripts/export-session-env.ts              # Interactive mode with instructions
 *   npx tsx scripts/export-session-env.ts --output-only # Output only base64 (for CI/CD)
 */

import fs from 'fs/promises';
import path from 'path';

async function exportSession() {
  const args = process.argv.slice(2);
  const outputOnly = args.includes('--output-only');

  try {
    if (!outputOnly) {
      console.log('');
      console.log('='.repeat(80));
      console.log('MTN SSO Session Export for Vercel');
      console.log('='.repeat(80));
      console.log('');
    }

    // Read session file
    const sessionPath = path.join(process.cwd(), '.cache', 'mtn-session.json');

    let sessionData: string;
    try {
      sessionData = await fs.readFile(sessionPath, 'utf-8');
    } catch (error) {
      console.error('❌ Error: Session file not found');
      console.error('');
      console.error('Please run authentication first:');
      console.error('  npx tsx scripts/test-mtn-sso-auth.ts --manual');
      console.error('');
      process.exit(1);
    }

    const session = JSON.parse(sessionData);

    // Check if session is still valid
    const expiresAt = new Date(session.expiresAt);
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    const minutesLeft = Math.floor(timeLeft / 60000);

    if (timeLeft <= 0) {
      console.error('❌ Error: Session already expired');
      console.error('');
      console.error('Please re-authenticate:');
      console.error('  npx tsx scripts/test-mtn-sso-auth.ts --manual');
      console.error('');
      process.exit(1);
    }

    if (minutesLeft < 10) {
      console.warn('⚠️  Warning: Session expires in less than 10 minutes');
      console.warn('   Consider re-authenticating for a fresh session');
      console.warn('');
    }

    // Convert to base64
    const sessionBase64 = Buffer.from(JSON.stringify(session)).toString('base64');

    // If output-only mode, just print the base64 and exit
    if (outputOnly) {
      console.log(sessionBase64);
      return;
    }

    // Display session info
    console.log('📊 Session Information:');
    console.log(`   Session ID: ${session.sessionId}`);
    console.log(`   Expires At: ${expiresAt.toISOString()}`);
    console.log(`   Time Left:  ${minutesLeft} minutes`);
    console.log(`   Cookies:    ${session.cookies?.length || 0}`);
    console.log('');

    // Display instructions
    console.log('📋 Instructions for Vercel Deployment:');
    console.log('');
    console.log('1. Go to Vercel Dashboard:');
    console.log('');
    console.log('   Production:');
    console.log('   https://vercel.com/jdewee-livecoms-projects/circletel/settings/environment-variables');
    console.log('');
    console.log('   Staging:');
    console.log('   https://vercel.com/jdewee-livecoms-projects/circletel-stagging/settings/environment-variables');
    console.log('');

    console.log('2. Add/Update Environment Variable:');
    console.log('');
    console.log('   Variable Name:');
    console.log('   ─'.repeat(80));
    console.log('   MTN_SESSION');
    console.log('   ─'.repeat(80));
    console.log('');

    console.log('   Variable Value (copy below):');
    console.log('   ─'.repeat(80));
    console.log(sessionBase64);
    console.log('   ─'.repeat(80));
    console.log('');

    console.log('3. Environment Selection:');
    console.log('   ☑ Production');
    console.log('   ☑ Preview');
    console.log('   ☑ Development');
    console.log('');

    console.log('4. Save and Redeploy:');
    console.log('   - Click "Save"');
    console.log('   - Redeploy: vercel --prod (or just `vercel` for staging)');
    console.log('');

    console.log('5. Also ensure these variables are set:');
    console.log('');
    console.log('   MTN_USERNAME=Lindokuhle.mdake@circletel.co.za');
    console.log('   MTN_PASSWORD=Lwandle@1992*');
    console.log('');

    console.log('='.repeat(80));
    console.log('');

    // Save to file for reference
    const exportPath = path.join(process.cwd(), '.cache', 'mtn-session-export.txt');
    await fs.writeFile(exportPath, `MTN_SESSION=${sessionBase64}\n\nExpires: ${expiresAt.toISOString()}\n`);

    console.log(`✅ Export saved to: ${exportPath}`);
    console.log('');

    console.log('⏰ Reminder: Set calendar alert for ${expiresAt.toISOString()} to refresh session');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(80));
    console.error('❌ Error Exporting Session');
    console.error('='.repeat(80));
    console.error('');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('');
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

exportSession();
