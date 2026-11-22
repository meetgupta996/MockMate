/**
 * examples/04-json-csv-export.js
 *
 * Demonstrates exporting mock data to JSON and CSV files:
 * - Proper RFC4180 CSV escaping for quotes, commas, and newlines
 * - Automatic parent directory creation
 */

const path = require('path');
const fs = require('fs');
const mockmate = require('../index');

async function run() {
  console.log('=== MockMate: JSON & CSV Exporter Demo ===\n');

  // 1. Generate 10 realistic products
  const products = mockmate.products(10, { minPrice: 15, maxPrice: 300 });

  const outputDir = path.resolve(__dirname, '../output/export_demo');

  // 2. Export to formatted JSON
  const jsonPath = path.join(outputDir, 'products.json');
  await mockmate.exportToJSON(products, jsonPath);
  console.log(`JSON exported successfully: ${jsonPath}`);

  // 3. Export to RFC4180-compliant CSV
  const csvPath = path.join(outputDir, 'products.csv');
  await mockmate.exportToCSV(products, csvPath);
  console.log(`CSV exported successfully:  ${csvPath}`);

  // 4. Preview the first few lines of the exported CSV
  const csvContent = await fs.promises.readFile(csvPath, 'utf8');
  console.log('\n--- Preview of Generated CSV ---');
  console.log(csvContent.split('\n').slice(0, 4).join('\n'));

  // Clean up demo files
  await fs.promises.rm(outputDir, { recursive: true, force: true });
  console.log('\nTemporary demo files cleaned up.');
}

run().catch(console.error);
