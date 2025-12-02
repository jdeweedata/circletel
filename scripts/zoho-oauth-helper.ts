/**
 * Zoho OAuth Helper Script
 * 
 * This script helps you generate a new Zoho refresh token when the existing one expires.
 * 
 * Usage:
 *   npx ts-node scripts/zoho-oauth-helper.ts
 * 
 * Or with environment variables:
 *   ZOHO_AUTH_CODE=your_code npx ts-node scripts/zoho-oauth-helper.ts exchange
 */

import * as readline from 'readline';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID || '1000.EIDKFRP87CAZYVGZKABAOV1Y4LP8RF';
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || '';
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || 'https://circletel.co.za/api/integrations/zoho/callback';
const ZOHO_REGION = process.env.ZOHO_REGION || 'US';

// Zoho OAuth endpoints by region
const ZOHO_ACCOUNTS_URL: Record<string, string> = {
  'US': 'https://accounts.zoho.com',
  'EU': 'https://accounts.zoho.eu',
  'IN': 'https://accounts.zoho.in',
  'AU': 'https://accounts.zoho.com.au',
  'CN': 'https://accounts.zoho.com.cn',
};

// Required scopes for CircleTel
const SCOPES = [
  'ZohoCRM.modules.ALL',
  'ZohoCRM.settings.ALL',
  'ZohoCRM.users.READ',
  'ZohoSubscriptions.fullaccess.all',
  'ZohoSign.documents.ALL',
  'ZohoSign.templates.ALL',
].join(',');

function getAccountsUrl(): string {
  return ZOHO_ACCOUNTS_URL[ZOHO_REGION] || ZOHO_ACCOUNTS_URL['US'];
}

function generateAuthUrl(): string {
  const baseUrl = getAccountsUrl();
  const params = new URLSearchParams({
    scope: SCOPES,
    client_id: ZOHO_CLIENT_ID,
    response_type: 'code',
    access_type: 'offline',
    redirect_uri: ZOHO_REDIRECT_URI,
    prompt: 'consent',
  });
  
  return `${baseUrl}/oauth/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(authCode: string): Promise<any> {
  const baseUrl = getAccountsUrl();
  const tokenUrl = `${baseUrl}/oauth/v2/token`;
  
  const params = new URLSearchParams({
    code: authCode,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: ZOHO_REDIRECT_URI,
  });

  console.log('\n🔄 Exchanging authorization code for tokens...\n');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Zoho OAuth Error: ${data.error}`);
  }
  
  return data;
}

async function refreshAccessToken(refreshToken: string): Promise<any> {
  const baseUrl = getAccountsUrl();
  const tokenUrl = `${baseUrl}/oauth/v2/token`;
  
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  console.log('\n🔄 Refreshing access token...\n');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Zoho OAuth Error: ${data.error}`);
  }
  
  return data;
}

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           🔐 Zoho OAuth Helper for CircleTel                  ║
╠═══════════════════════════════════════════════════════════════╣
║  This script helps you generate a new Zoho refresh token      ║
║  when the existing one expires or becomes invalid.            ║
╚═══════════════════════════════════════════════════════════════╝
`);

  console.log('📋 Current Configuration:');
  console.log(`   Client ID: ${ZOHO_CLIENT_ID.substring(0, 20)}...`);
  console.log(`   Region: ${ZOHO_REGION}`);
  console.log(`   Redirect URI: ${ZOHO_REDIRECT_URI}`);
  console.log(`   Scopes: ${SCOPES.split(',').length} scopes configured\n`);

  const rl = createReadlineInterface();

  try {
    const action = await prompt(rl, `
What would you like to do?
  1. Generate new authorization URL (start fresh)
  2. Exchange authorization code for tokens
  3. Test refresh token
  4. Exit

Enter choice (1-4): `);

    switch (action) {
      case '1': {
        const authUrl = generateAuthUrl();
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  Step 1: Authorize CircleTel with Zoho                        ║
╚═══════════════════════════════════════════════════════════════╝

1. Open this URL in your browser:

${authUrl}

2. Log in to Zoho and authorize the application

3. After authorization, you'll be redirected to a URL like:
   ${ZOHO_REDIRECT_URI}?code=AUTHORIZATION_CODE

4. Copy the 'code' parameter value from the URL

5. Run this script again and choose option 2 to exchange the code
`);
        break;
      }

      case '2': {
        const authCode = process.env.ZOHO_AUTH_CODE || await prompt(rl, '\nEnter the authorization code from the redirect URL: ');
        
        if (!authCode) {
          console.log('❌ No authorization code provided');
          break;
        }

        try {
          const tokens = await exchangeCodeForTokens(authCode);
          
          console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  ✅ SUCCESS! New tokens generated                             ║
╚═══════════════════════════════════════════════════════════════╝

Access Token: ${tokens.access_token?.substring(0, 50)}...
Refresh Token: ${tokens.refresh_token}
Expires In: ${tokens.expires_in} seconds
Token Type: ${tokens.token_type}

╔═══════════════════════════════════════════════════════════════╗
║  📝 UPDATE YOUR ENVIRONMENT VARIABLES                         ║
╚═══════════════════════════════════════════════════════════════╝

1. Update .env.local:
   ZOHO_REFRESH_TOKEN="${tokens.refresh_token}"

2. Update Vercel Environment Variables:
   - Go to: https://vercel.com/your-project/settings/environment-variables
   - Update ZOHO_REFRESH_TOKEN with the new value

3. Redeploy your application

⚠️  IMPORTANT: The refresh token is permanent but can be revoked.
    Store it securely and don't share it!
`);
        } catch (error) {
          console.error('\n❌ Error exchanging code:', error);
        }
        break;
      }

      case '3': {
        const refreshToken = process.env.ZOHO_REFRESH_TOKEN || await prompt(rl, '\nEnter the refresh token to test: ');
        
        if (!refreshToken) {
          console.log('❌ No refresh token provided');
          break;
        }

        try {
          const tokens = await refreshAccessToken(refreshToken);
          
          console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  ✅ Refresh Token is VALID!                                   ║
╚═══════════════════════════════════════════════════════════════╝

New Access Token: ${tokens.access_token?.substring(0, 50)}...
Expires In: ${tokens.expires_in} seconds

The refresh token is working correctly.
`);
        } catch (error) {
          console.error(`
╔═══════════════════════════════════════════════════════════════╗
║  ❌ Refresh Token is INVALID or EXPIRED                       ║
╚═══════════════════════════════════════════════════════════════╝

Error: ${error}

You need to generate a new refresh token.
Run this script again and choose option 1.
`);
        }
        break;
      }

      case '4':
        console.log('\n👋 Goodbye!\n');
        break;

      default:
        console.log('\n❌ Invalid choice. Please enter 1, 2, 3, or 4.\n');
    }
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(console.error);
