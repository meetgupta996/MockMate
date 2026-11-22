/**
 * examples/03-relational-data.js
 *
 * Demonstrates generating relational datasets with MockMate:
 * - Users table (Parent)
 * - Orders table (Child referencing Users)
 * - 100% referential integrity without orphan records
 */

const mockmate = require('../index');

console.log('=== MockMate: Relational Data Generation ===\n');

// 1. Define parent schema: Users
const userSchema = mockmate.defineSchema({
  id: { type: 'auto-increment', startValue: 1 },
  name: 'name',
  email: 'email',
  city: 'address'
});

// 2. Define child schema: Orders
const orderSchema = mockmate.defineSchema({
  id: { type: 'auto-increment', startValue: 1001 },
  userId: 'number', // Will be populated with valid foreign keys
  amount: { type: 'number', min: 25, max: 750, decimals: 2 },
  status: { type: 'pick', values: ['pending', 'completed', 'shipped'] }
});

// 3. Generate interconnected relational dataset
const dataset = mockmate.generateRelational({
  users: {
    count: 5,
    schema: userSchema,
    primaryKey: 'id'
  },
  orders: {
    count: 15,
    schema: orderSchema,
    primaryKey: 'id',
    foreignKeys: {
      userId: 'users.id' // Orders.userId points to Users.id
    }
  }
});

console.log(`Generated ${dataset.users.length} users and ${dataset.orders.length} orders.\n`);

console.log('--- Users List ---');
console.table(dataset.users.map((u) => ({ id: u.id, name: u.name, email: u.email })));

console.log('\n--- Orders List (Showing Foreign Key References) ---');
console.table(
  dataset.orders.slice(0, 8).map((o) => ({
    orderId: o.id,
    userId: o.userId,
    amount: `$${o.amount}`,
    status: o.status
  }))
);

// Verify referential integrity
const validUserIds = new Set(dataset.users.map((u) => u.id));
const allValid = dataset.orders.every((o) => validUserIds.has(o.userId));
console.log(`\nReferential Integrity Check: ${allValid ? 'PASSED (Zero dangling foreign keys)' : 'FAILED'}`);
