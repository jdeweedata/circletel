const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelFilePath = 'docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/DFA Business Internet Access Service with ENNI-GNNI Infrastructure.xlsx';

try {
  // Read the Excel file
  const workbook = XLSX.readFile(excelFilePath);

  console.log('📊 Excel Workbook Analysis\n');
  console.log('Sheet Names:', workbook.SheetNames);
  console.log('');

  // Parse all sheets
  const parsedData = {};

  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Sheet ${index + 1}: ${sheetName}`);
    console.log('='.repeat(60));

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Display first 20 rows
    console.log('\nFirst 20 rows:');
    jsonData.slice(0, 20).forEach((row, rowIndex) => {
      console.log(`Row ${rowIndex + 1}:`, row);
    });

    // Store parsed data
    parsedData[sheetName] = {
      totalRows: jsonData.length,
      data: jsonData
    };

    console.log(`\nTotal rows: ${jsonData.length}`);
  });

  // Save parsed data to JSON for review
  const outputPath = 'docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/parsed-product-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(parsedData, null, 2));
  console.log(`\n✅ Parsed data saved to: ${outputPath}`);

} catch (error) {
  console.error('❌ Error parsing Excel:', error.message);
  process.exit(1);
}
