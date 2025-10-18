const fetch = require('node-fetch');

async function triggerMigration() {
  try {
    console.log('Triggering product migration...');
    
    const response = await fetch('http://localhost:3000/api/products/migrate-excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'admin@circletel.co.za'
      }
    });

    const result = await response.text();
    console.log('Migration response:');
    console.log(result);
    
    if (response.ok) {
      console.log('✅ Migration completed successfully');
    } else {
      console.log('❌ Migration failed');
    }
  } catch (error) {
    console.error('Error triggering migration:', error);
  }
}

triggerMigration();
