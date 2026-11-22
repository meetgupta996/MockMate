/**
 * examples/07-reproducible-data.js
 *
 * Demonstrates deterministic mock data generation with setSeed():
 * - Two runs using the same seed produce identical datasets
 * - Essential for unit testing and consistent database snapshots
 */

const assert = require('assert');
const mockmate = require('../index');

console.log('=== MockMate: Reproducible Seeded Generation Demo ===\n');

// 1. Define schema
const schema = mockmate.defineSchema({
  username: 'string',
  email: 'email',
  score: { type: 'number', min: 100, max: 999 },
  role: { type: 'pick', values: ['admin', 'moderator', 'member'] }
});

// 2. Run 1 with seed 42
console.log('Setting seed to 42 (Run 1)...');
mockmate.setSeed(42);
const run1 = schema.generate(5);
console.log('Run 1 records:');
console.table(run1);

// 3. Run 2 with the same seed 42
console.log('\nResetting seed to 42 (Run 2)...');
mockmate.setSeed(42);
const run2 = schema.generate(5);
console.log('Run 2 records:');
console.table(run2);

// 4. Verification
assert.deepStrictEqual(run1, run2);
console.log('\nResult: Run 1 and Run 2 are 100% IDENTICAL!');
console.log('Deterministic seed generation verified successfully.');
