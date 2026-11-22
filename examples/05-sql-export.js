/**
 * examples/05-sql-export.js
 *
 * Demonstrates exporting multi-table datasets into ready-to-run SQL seed scripts:
 * - Dialects: PostgreSQL, MySQL, and SQLite
 * - Correct identifier quoting and value escaping
 * - Parent-before-child insertion ordering
 */

const path = require('path');
const fs = require('fs');
const mockmate = require('../index');

async function run() {
  console.log('=== MockMate: SQL Seed Export Demo ===\n');

  // 1. Define schemas
  const userSchema = mockmate.defineSchema({
    id: { type: 'auto-increment', startValue: 1 },
    name: 'name',
    email: 'email'
  });

  const orderSchema = mockmate.defineSchema({
    id: { type: 'auto-increment', startValue: 500 },
    userId: 'number',
    amount: { type: 'number', min: 10, max: 200, decimals: 2 }
  });

  // 2. Generate relational dataset
  const dataset = mockmate.generateRelational({
    users: { count: 3, schema: userSchema, primaryKey: 'id' },
    orders: {
      count: 6,
      schema: orderSchema,
      primaryKey: 'id',
      foreignKeys: { userId: 'users.id' }
    }
  });

  const outputDir = path.resolve(__dirname, '../output/sql_demo');

  // 3. Export for PostgreSQL
  const pgFile = path.join(outputDir, 'postgres_seed.sql');
  await mockmate.exportToSQL(dataset, pgFile, { dialect: 'postgres' });
  console.log(`PostgreSQL seed created: ${pgFile}`);

  // 4. Export for MySQL
  const mysqlFile = path.join(outputDir, 'mysql_seed.sql');
  await mockmate.exportToSQL(dataset, mysqlFile, { dialect: 'mysql' });
  console.log(`MySQL seed created:      ${mysqlFile}`);

  // 5. Preview generated PostgreSQL script
  const pgContent = await fs.promises.readFile(pgFile, 'utf8');
  console.log('\n--- Preview of Generated SQL Script (PostgreSQL) ---');
  console.log(pgContent);

  // Clean up demo files
  await fs.promises.rm(outputDir, { recursive: true, force: true });
  console.log('Temporary SQL demo files cleaned up.');
}

run().catch(console.error);
