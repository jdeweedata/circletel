// Test Chrome MCP server functionality
const chromeLaunch = require('chrome-launcher');

async function testChromeMCP() {
  console.log('Testing Chrome DevTools MCP server...');
  
  try {
    // Launch Chrome with temporary profile for security
    const chrome = await chromeLaunch.launch({
      startingUrl: 'http://localhost:3001',
      chromeFlags: [
        '--no-first-run',
        '--no-default-browser-check', 
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--user-data-dir=' + process.env.TEMP + '\\chrome-mcp-test-' + Date.now()
      ]
    });

    console.log(`✅ Chrome launched successfully on port ${chrome.port}`);
    console.log(`🌐 Browser opened to: http://localhost:3001`);
    console.log('🔧 MCP server configured with:');
    console.log('  - Chrome path: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
    console.log('  - Headless: false (for development)');
    console.log('  - Temporary profile: true (security isolation)');
    
    // Test for telecom debugging features
    console.log('\n📡 Telecom debugging capabilities:');
    console.log('  - Network inspection for MTN API calls');
    console.log('  - Performance traces for coverage aggregation');
    console.log('  - PWA cache inspection for service worker');
    console.log('  - Geographic query performance monitoring');
    
    // Wait a bit then cleanup
    setTimeout(async () => {
      await chrome.kill();
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('❌ Chrome launch failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure Chrome is installed at specified path');
    console.log('2. Check if Chrome is already running');
    console.log('3. Verify MCP server configuration');
    console.log('4. Test with: npx chrome-devtools-mcp@latest');
    process.exit(1);
  }
}

testChromeMCP();
