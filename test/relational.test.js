const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  defineSchema,
  generateRelational,
  setSeed,
  ValidationError
} = require('../index');

describe('Relational Data Generator (lib/schema/relational.js)', () => {
  const userSchema = defineSchema({
    id: { type: 'auto-increment', startValue: 1 },
    name: 'name',
    email: 'email'
  });

  const orderSchema = defineSchema({
    id: { type: 'auto-increment', startValue: 100 },
    userId: 'number',
    amount: { type: 'number', min: 20, max: 500, decimals: 2 }
  });

  const productSchema = defineSchema({
    id: { type: 'auto-increment', startValue: 500 },
    title: 'product',
    price: { type: 'number', min: 10, max: 100 }
  });

  const orderItemSchema = defineSchema({
    id: { type: 'auto-increment', startValue: 1000 },
    orderId: 'number',
    productId: 'number',
    quantity: { type: 'number', min: 1, max: 5 }
  });

  // 1. Multiple dataset generation
  it('1. should generate multiple independent datasets successfully', () => {
    const dataset = generateRelational({
      users: { count: 3, schema: userSchema, primaryKey: 'id' },
      products: { count: 4, schema: productSchema, primaryKey: 'id' }
    });

    assert.ok('users' in dataset && 'products' in dataset);
    assert.strictEqual(dataset.users.length, 3);
    assert.strictEqual(dataset.products.length, 4);
  });

  // 2. Parent and child dataset generation
  it('2. should generate parent and child datasets with foreign keys', () => {
    const dataset = generateRelational({
      users: { count: 4, schema: userSchema, primaryKey: 'id' },
      orders: {
        count: 10,
        schema: orderSchema,
        primaryKey: 'id',
        foreignKeys: { userId: 'users.id' }
      }
    });

    assert.strictEqual(dataset.users.length, 4);
    assert.strictEqual(dataset.orders.length, 10);
    for (const order of dataset.orders) {
      assert.ok('userId' in order);
      assert.strictEqual(typeof order.userId, 'number');
    }
  });

  // 3. One-to-many relationships
  it('3. should support one-to-many relationships where multiple children reference the same parent', () => {
    const dataset = generateRelational({
      users: { count: 3, schema: userSchema, primaryKey: 'id' },
      orders: {
        count: 20,
        schema: orderSchema,
        primaryKey: 'id',
        foreignKeys: { userId: 'users.id' }
      }
    });

    const userIds = dataset.users.map((u) => u.id);
    const orderUserIds = dataset.orders.map((o) => o.userId);

    // With 20 orders and only 3 users, at least one user must have multiple orders
    const counts = {};
    for (const uid of orderUserIds) {
      counts[uid] = (counts[uid] || 0) + 1;
    }
    const hasMultipleOrders = Object.values(counts).some((count) => count > 1);
    assert.ok(hasMultipleOrders, 'At least one user must have multiple orders');

    // All order userId references must be within the user IDs
    for (const uid of orderUserIds) {
      assert.ok(userIds.includes(uid));
    }
  });

  // 4. Multiple foreign keys
  it('4. should support multiple foreign keys in a single child dataset', () => {
    const dataset = generateRelational({
      users: { count: 3, schema: userSchema, primaryKey: 'id' },
      products: { count: 5, schema: productSchema, primaryKey: 'id' },
      orders: {
        count: 5,
        schema: orderSchema,
        primaryKey: 'id',
        foreignKeys: { userId: 'users.id' }
      },
      orderItems: {
        count: 15,
        schema: orderItemSchema,
        primaryKey: 'id',
        foreignKeys: {
          orderId: 'orders.id',
          productId: 'products.id'
        }
      }
    });

    const orderIds = new Set(dataset.orders.map((o) => o.id));
    const productIds = new Set(dataset.products.map((p) => p.id));

    assert.strictEqual(dataset.orderItems.length, 15);
    for (const item of dataset.orderItems) {
      assert.ok(orderIds.has(item.orderId), `Invalid orderId ${item.orderId}`);
      assert.ok(productIds.has(item.productId), `Invalid productId ${item.productId}`);
    }
  });

  // 5. Correct primary key handling
  it('5. should correctly identify and populate primary keys on all generated records', () => {
    const dataset = generateRelational({
      users: { count: 5, schema: userSchema, primaryKey: 'id' },
      orders: { count: 5, schema: orderSchema, primaryKey: 'id' }
    });

    for (const u of dataset.users) {
      assert.ok('id' in u && u.id !== undefined && u.id !== null);
    }
    for (const o of dataset.orders) {
      assert.ok('id' in o && o.id !== undefined && o.id !== null);
    }
  });

  // 6. Foreign keys always reference existing records
  it('6. should ensure that 100% of foreign keys point to valid existing parent records', () => {
    const dataset = generateRelational({
      users: { count: 10, schema: userSchema, primaryKey: 'id' },
      orders: {
        count: 50,
        schema: orderSchema,
        primaryKey: 'id',
        foreignKeys: { userId: 'users.id' }
      }
    });

    const validUserIds = new Set(dataset.users.map((u) => u.id));
    for (const order of dataset.orders) {
      assert.ok(validUserIds.has(order.userId), `Foreign key ${order.userId} is dangling`);
    }
  });

  // 7. Parent-child generation order
  it('7. should automatically resolve topological dependency order even if child is defined first', () => {
    // Child dataset "orders" is declared BEFORE parent dataset "users"
    const dataset = generateRelational({
      orders: {
        count: 10,
        schema: orderSchema,
        primaryKey: 'id',
        foreignKeys: { userId: 'users.id' }
      },
      users: { count: 5, schema: userSchema, primaryKey: 'id' }
    });

    assert.strictEqual(dataset.users.length, 5);
    assert.strictEqual(dataset.orders.length, 10);
    const userIds = new Set(dataset.users.map((u) => u.id));
    for (const o of dataset.orders) {
      assert.ok(userIds.has(o.userId));
    }
  });

  // 8. Multiple records referencing the same parent
  it('8. should distribute multiple foreign keys across parents', () => {
    const dataset = generateRelational({
      users: { count: 2, schema: userSchema, primaryKey: 'id' },
      orders: {
        count: 10,
        schema: orderSchema,
        primaryKey: 'id',
        foreignKeys: { userId: 'users.id' }
      }
    });

    const user1Orders = dataset.orders.filter((o) => o.userId === dataset.users[0].id);
    const user2Orders = dataset.orders.filter((o) => o.userId === dataset.users[1].id);
    assert.strictEqual(user1Orders.length + user2Orders.length, 10);
  });

  // 9. Zero-record parent validation
  it('9. should throw ValidationError if child references a parent dataset with 0 records', () => {
    assert.throws(
      () =>
        generateRelational({
          users: { count: 0, schema: userSchema, primaryKey: 'id' },
          orders: {
            count: 5,
            schema: orderSchema,
            primaryKey: 'id',
            foreignKeys: { userId: 'users.id' }
          }
        }),
      (err) => err instanceof ValidationError && /referencing empty parent dataset "users"/.test(err.message)
    );
  });

  // 10. Invalid dataset definitions
  it('10. should reject invalid dataset definitions (null, primitives, arrays, empty objects)', () => {
    const invalidDefs = [null, undefined, 123, 'invalid', [], {}];

    for (const def of invalidDefs) {
      assert.throws(
        () => generateRelational(def),
        (err) => err instanceof ValidationError
      );
    }
  });

  // 11. Missing referenced tables
  it('11. should throw ValidationError if a foreign key references a non-existent dataset', () => {
    assert.throws(
      () =>
        generateRelational({
          orders: {
            count: 5,
            schema: orderSchema,
            primaryKey: 'id',
            foreignKeys: { userId: 'nonExistentTable.id' }
          }
        }),
      (err) => err instanceof ValidationError && /references unknown parent dataset/.test(err.message)
    );
  });

  // 12. Invalid foreign key fields
  it('12. should throw ValidationError for invalid foreign key syntax or mismatched target fields', () => {
    assert.throws(
      () =>
        generateRelational({
          users: { count: 2, schema: userSchema, primaryKey: 'id' },
          orders: {
            count: 2,
            schema: orderSchema,
            primaryKey: 'id',
            foreignKeys: { userId: 'users_without_dot' }
          }
        }),
      (err) => err instanceof ValidationError && /Expected format: "parentTable.parentField"/.test(err.message)
    );

    assert.throws(
      () =>
        generateRelational({
          users: { count: 2, schema: userSchema, primaryKey: 'id' },
          orders: {
            count: 2,
            schema: orderSchema,
            primaryKey: 'id',
            foreignKeys: { userId: 'users.nonPrimaryKeyField' }
          }
        }),
      (err) => err instanceof ValidationError && /references field "nonPrimaryKeyField"/.test(err.message)
    );
  });

  // 13. Circular dependency detection
  it('13. should detect circular dependencies and throw ValidationError', () => {
    const schemaA = defineSchema({ id: 'uuid', bId: 'uuid' });
    const schemaB = defineSchema({ id: 'uuid', aId: 'uuid' });

    assert.throws(
      () =>
        generateRelational({
          tableA: {
            count: 2,
            schema: schemaA,
            primaryKey: 'id',
            foreignKeys: { bId: 'tableB.id' }
          },
          tableB: {
            count: 2,
            schema: schemaB,
            primaryKey: 'id',
            foreignKeys: { aId: 'tableA.id' }
          }
        }),
      (err) => err instanceof ValidationError && /Circular dependency detected/.test(err.message)
    );
  });

  // 14. Seed reproducibility
  it('14. should generate 100% reproducible relational datasets when using setSeed()', () => {
    function makeSchemas() {
      return {
        uSchema: defineSchema({
          id: { type: 'auto-increment', startValue: 1 },
          name: 'name',
          email: 'email'
        }),
        oSchema: defineSchema({
          id: { type: 'auto-increment', startValue: 100 },
          userId: 'number',
          amount: { type: 'number', min: 20, max: 500, decimals: 2 }
        })
      };
    }

    const { uSchema: u1, oSchema: o1 } = makeSchemas();
    setSeed(999);
    const run1 = generateRelational({
      users: { count: 3, schema: u1, primaryKey: 'id' },
      orders: {
        count: 6,
        schema: o1,
        primaryKey: 'id',
        foreignKeys: { userId: 'users.id' }
      }
    });

    const { uSchema: u2, oSchema: o2 } = makeSchemas();
    setSeed(999);
    const run2 = generateRelational({
      users: { count: 3, schema: u2, primaryKey: 'id' },
      orders: {
        count: 6,
        schema: o2,
        primaryKey: 'id',
        foreignKeys: { userId: 'users.id' }
      }
    });

    assert.deepStrictEqual(run1, run2, 'Relational datasets must be identical across identical seeds');
  });

  // 15. Empty datasets without relationships
  it('15. should handle zero-count datasets gracefully when no dependent foreign keys exist', () => {
    const dataset = generateRelational({
      users: { count: 0, schema: userSchema, primaryKey: 'id' },
      products: { count: 0, schema: productSchema, primaryKey: 'id' }
    });

    assert.deepStrictEqual(dataset.users, []);
    assert.deepStrictEqual(dataset.products, []);
  });
});
