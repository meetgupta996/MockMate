/**
 * examples/06-database-seeding.js
 *
 * Demonstrates multi-table database seeding:
 * - Generating separate per-table CSV or JSON files for database import tools
 * - Returns a detailed summary of generated files
 */

const path = require('path');
const fs = require('fs');
const mockmate = require('../index');

async function run() {
  console.log('=== MockMate: Multi-Table Database Seeding Demo ===\n');

  // 1. Prepare multi-table dataset
  const dataset = {
    users: mockmate.users(5),
    products: mockmate.products(5),
    posts: mockmate.posts(5)
  };

  const outputDir = path.resolve(__dirname, '../output/seed_database_demo');

  // 2. Seed database in CSV format (one CSV file per table)
  console.log('Generating CSV seed files...');
  const csvSummary = await mockmate.seedDatabase(dataset, {
    format: 'csv',
    output: path.join(outputDir, 'csv_seeds')
  });

  console.log(`Format:        ${csvSummary.format.toUpperCase()}`);
  console.log(`Total Records: ${csvSummary.totalRecords}`);
  console.log('Generated Files:');
  for (const f of csvSummary.files) {
    console.log(`  - Table "${f.table}": ${f.count} records -> ${f.path}`);
  }

  // 3. Seed database in JSON format (one JSON file per table)
  console.log('\nGenerating JSON seed files...');
  const jsonSummary = await mockmate.seedDatabase(dataset, {
    format: 'json',
    output: path.join(outputDir, 'json_seeds')
  });

  console.log(`Format:        ${jsonSummary.format.toUpperCase()}`);
  console.log(`Total Records: ${jsonSummary.totalRecords}`);
  for (const f of jsonSummary.files) {
    console.log(`  - Table "${f.table}": ${f.count} records -> ${f.path}`);
  }

  // Clean up demo files
  await fs.promises.rm(outputDir, { recursive: true, force: true });
  console.log('\nTemporary seed directory cleaned up.');
}

run().catch(console.error);
