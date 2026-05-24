const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

/**
 * Convert an ExcelJS worksheet to array-of-arrays (matching xlsx sheet_to_json with header:1)
 */
function sheetToArray(worksheet) {
  const rows = [];
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    rows.push(row.values.slice(1)); // ExcelJS row.values is 1-indexed
  });
  return rows;
}

const excelFilePath = 'docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/DFA Business Internet Access Service with ENNI-GNNI Infrastructure.xlsx';

(async () => {
  try {
    // Read the Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFilePath);

    console.log('📊 Excel Workbook Analysis\n');
    console.log('Sheet Names:', workbook.worksheets.map(ws => ws.name));
    console.log('');

    // Parse all sheets
    const parsedData = {};

    workbook.eachSheet((worksheet, sheetId) => {
      const sheetName = worksheet.name;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Sheet ${sheetId}: ${sheetName}`);
      console.log('='.repeat(60));

      const jsonData = sheetToArray(worksheet);

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
})();
