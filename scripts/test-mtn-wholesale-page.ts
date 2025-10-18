// Simple type check for MTN Wholesale test page
import type { NextPage } from 'next';

// This will fail at compile time if the page has type errors
async function testImport() {
  const page = await import('../app/test/mtn-wholesale/page');
  console.log('✓ MTN Wholesale test page compiles successfully');
  return page;
}

testImport().catch(err => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});
