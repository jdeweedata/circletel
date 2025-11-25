/**
 * Debug AI Service Import
 */

require('dotenv').config({ path: '.env.local' });

async function debugImport() {
  console.log('🔍 Debugging AI Service Import\n');

  try {
    const aiServiceModule = await import('../lib/cms/ai-service.ts');

    console.log('📦 Module imported successfully');
    console.log('   Module keys:', Object.keys(aiServiceModule));
    console.log('   Default export:', typeof aiServiceModule.default);
    console.log('   generateContent:', typeof aiServiceModule.generateContent);
    console.log('   generateImage:', typeof aiServiceModule.generateImage);
    console.log('   checkRateLimit:', typeof aiServiceModule.checkRateLimit);
    console.log('   trackUsage:', typeof aiServiceModule.trackUsage);

    if (aiServiceModule.default) {
      console.log('\n📦 Default export keys:', Object.keys(aiServiceModule.default));
    }

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error.stack);
  }
}

debugImport();
