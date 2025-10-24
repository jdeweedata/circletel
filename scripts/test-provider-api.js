const http = require('http');

async function testProviderAPI() {
  console.log('\n=== Testing Coverage API - Provider Data ===\n');

  const leadId = '55270b02-6e80-4c55-b902-13261e7515e0';
  const url = `http://localhost:3002/api/coverage/packages?leadId=${leadId}&type=residential`;

  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          console.log('Status:', res.statusCode);
          console.log('Address:', response.address);
          console.log('Available:', response.available);
          console.log('Services:', response.services?.join(', ') || 'none');
          console.log('Packages found:', response.packages?.length || 0);
          console.log('');

          if (response.packages && response.packages.length > 0) {
            console.log('Provider Data in First 3 Packages:');
            console.log('===================================\n');

            response.packages.slice(0, 3).forEach((pkg, i) => {
              console.log(`${i+1}. ${pkg.name} - R${pkg.price}pm`);
              if (pkg.provider) {
                console.log(`   ✓ Provider: ${pkg.provider.name}`);
                console.log(`   ✓ Code: ${pkg.provider.code}`);
                console.log(`   ✓ Logo: ${pkg.provider.logo_url}`);
                console.log(`   ✓ Format: ${pkg.provider.logo_format}`);
              } else {
                console.log('   ⚠️  No provider data attached');
              }
              console.log('');
            });

            const withProvider = response.packages.filter(p => p.provider).length;
            const total = response.packages.length;
            console.log(`Summary: ${withProvider}/${total} packages have provider data (${Math.round(withProvider/total*100)}%)\n`);

            if (withProvider > 0) {
              console.log('✅ SUCCESS - Provider data is being returned by API!\n');
            } else {
              console.log('⚠️  WARNING - No packages have provider data\n');
            }
          } else {
            console.log('⚠️  No packages in response\n');
          }

          resolve();
        } catch (error) {
          console.error('Parse error:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
  });
}

testProviderAPI()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
