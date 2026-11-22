const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  defineSchema,
  setSeed,
  ValidationError
} = require('../index');

describe('Custom Schema Engine & Bulk Data Generation (lib/schema/schema.js)', () => {
  // 1. Schema definition
  it('1. should define a schema successfully and return generateOne and generate methods', () => {
    const userSchema = defineSchema({
      id: 'uuid',
      name: 'name'
    });

    assert.strictEqual(typeof userSchema.generateOne, 'function');
    assert.strictEqual(typeof userSchema.generate, 'function');
    assert.deepStrictEqual(userSchema.getDefinition(), { id: 'uuid', name: 'name' });
  });

  // 2. Single record generation
  it('2. should generate a single record with generateOne()', () => {
    const userSchema = defineSchema({
      id: 'uuid',
      name: 'name',
      email: 'email'
    });

    const user = userSchema.generateOne();
    assert.strictEqual(typeof user, 'object');
    assert.ok(user !== null && !Array.isArray(user));
    assert.strictEqual(typeof user.id, 'string');
    assert.strictEqual(typeof user.name, 'string');
    assert.strictEqual(typeof user.email, 'string');
  });

  // 3. Bulk generation of 10, 100 and 1000 records
  it('3. should generate exactly 10, 100, and 1000 records in bulk', () => {
    const productSchema = defineSchema({
      id: 'uuid',
      title: 'product',
      price: { type: 'number', min: 10, max: 100 }
    });

    const bulk10 = productSchema.generate(10);
    assert.strictEqual(bulk10.length, 10);

    const bulk100 = productSchema.generate(100);
    assert.strictEqual(bulk100.length, 100);

    const bulk1000 = productSchema.generate(1000);
    assert.strictEqual(bulk1000.length, 1000);

    // Verify first and last records are distinct objects
    assert.notStrictEqual(bulk10[0], bulk10[1]);
  });

  // 4. Correct field names and structure
  it('4. should produce records with exactly the specified fields and structure', () => {
    const schema = defineSchema({
      empId: 'uuid',
      fullName: 'name',
      workEmail: 'email',
      active: 'boolean',
      joinedAt: 'date'
    });

    const record = schema.generateOne();
    const expectedKeys = ['empId', 'fullName', 'workEmail', 'active', 'joinedAt'];
    assert.deepStrictEqual(Object.keys(record), expectedKeys);
  });

  // 5. Simple and object-based field configurations
  it('5. should support both shorthand strings and detailed object configurations', () => {
    const schema = defineSchema({
      // Shorthand string
      username: 'string',
      contact: 'email',
      // Object configuration
      age: { type: 'number', min: 25, max: 40 },
      bio: { type: 'string', minLength: 10, maxLength: 25 }
    });

    const user = schema.generateOne();
    assert.strictEqual(typeof user.username, 'string');
    assert.strictEqual(typeof user.contact, 'string');
    assert.ok(user.age >= 25 && user.age <= 40);
    assert.ok(user.bio.length >= 10 && user.bio.length <= 25);
  });

  // 6. Number constraints
  it('6. should strictly respect number constraints (min, max, decimals)', () => {
    const schema = defineSchema({
      salary: { type: 'number', min: 50000, max: 60000, decimals: 2 }
    });

    const records = schema.generate(25);
    for (const rec of records) {
      assert.ok(rec.salary >= 50000 && rec.salary <= 60000);
      const parts = rec.salary.toString().split('.');
      if (parts.length > 1) {
        assert.ok(parts[1].length <= 2, `Expected at most 2 decimal places, got ${parts[1].length}`);
      }
    }
  });

  // 7. Pick field generation
  it('7. should pick values only from the provided list', () => {
    const categories = ['Electronics', 'Books', 'Clothing', 'Home'];
    const schema = defineSchema({
      category: { type: 'pick', values: categories }
    });

    const records = schema.generate(30);
    for (const rec of records) {
      assert.ok(categories.includes(rec.category));
    }
  });

  // 8. UUID generation
  it('8. should generate valid RFC4122 v4 UUIDs for each record', () => {
    const schema = defineSchema({
      id: 'uuid'
    });

    const records = schema.generate(20);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const seen = new Set();

    for (const rec of records) {
      assert.match(rec.id, uuidRegex);
      seen.add(rec.id);
    }
    assert.strictEqual(seen.size, 20, 'All generated UUIDs must be distinct');
  });

  // 9. Auto-increment IDs
  it('9. should handle auto-increment IDs sequentially with custom starting value', () => {
    const schema = defineSchema({
      serialNo: { type: 'auto-increment', startValue: 1000 },
      title: 'product'
    });

    const records = schema.generate(5);
    assert.strictEqual(records[0].serialNo, 1000);
    assert.strictEqual(records[1].serialNo, 1001);
    assert.strictEqual(records[2].serialNo, 1002);
    assert.strictEqual(records[3].serialNo, 1003);
    assert.strictEqual(records[4].serialNo, 1004);
  });

  // 10. Custom generator functions
  it('10. should support custom generator functions with index parameter', () => {
    const schema = defineSchema({
      id: 'uuid',
      // Object custom generator
      code: {
        type: 'custom',
        generate: (index) => `EMP-${String(index + 1).padStart(3, '0')}`
      },
      // Shorthand function custom generator
      slug: (index) => `slug-item-${index}`
    });

    const records = schema.generate(3);
    assert.strictEqual(records[0].code, 'EMP-001');
    assert.strictEqual(records[1].code, 'EMP-002');
    assert.strictEqual(records[2].code, 'EMP-003');

    assert.strictEqual(records[0].slug, 'slug-item-0');
    assert.strictEqual(records[1].slug, 'slug-item-1');
    assert.strictEqual(records[2].slug, 'slug-item-2');
  });

  // 11. Invalid schemas
  it('11. should reject invalid schemas (null, undefined, primitives, arrays, empty object)', () => {
    const invalidSchemas = [null, undefined, 123, 'string', true, [], {}];

    for (const invalid of invalidSchemas) {
      assert.throws(
        () => defineSchema(invalid),
        (err) => err instanceof ValidationError
      );
    }
  });

  // 12. Invalid field types
  it('12. should reject invalid field types or invalid configurations in schema definition', () => {
    assert.throws(
      () => defineSchema({ badField: 'non_existent_type' }),
      (err) => err instanceof ValidationError && /Unsupported data type/.test(err.message)
    );

    assert.throws(
      () => defineSchema({ badCustom: { type: 'custom', generate: 'not_a_function' } }),
      (err) => err instanceof ValidationError && /must provide a "generate" function/.test(err.message)
    );

    assert.throws(
      () => defineSchema({ emptyField: '' }),
      (err) => err instanceof ValidationError
    );
  });

  // 13. Invalid record counts
  it('13. should reject negative, fractional, non-numeric, or invalid counts', () => {
    const schema = defineSchema({ id: 'uuid' });
    const invalidCounts = [-1, -100, 3.14, '5', null, undefined, NaN, Infinity, {}];

    for (const count of invalidCounts) {
      assert.throws(
        () => schema.generate(count),
        (err) => err instanceof ValidationError && /must be a non-negative integer/.test(err.message)
      );
    }
  });

  // 14. Zero-record generation
  it('14. should return an empty array when count is 0', () => {
    const schema = defineSchema({ id: 'uuid', name: 'name' });
    const emptyRecords = schema.generate(0);

    assert.ok(Array.isArray(emptyRecords));
    assert.strictEqual(emptyRecords.length, 0);
  });

  // 15. Seed reproducibility
  it('15. should produce 100% reproducible datasets when using setSeed()', () => {
    const userSchema = defineSchema({
      name: 'name',
      email: 'email',
      age: { type: 'number', min: 20, max: 60 },
      role: { type: 'pick', values: ['admin', 'manager', 'developer'] },
      score: { type: 'number', min: 100, max: 1000 }
    });

    // Run 1 with seed 555
    setSeed(555);
    const run1 = userSchema.generate(10);

    // Run 2 with same seed 555
    setSeed(555);
    const run2 = userSchema.generate(10);

    assert.deepStrictEqual(run1, run2, 'Both dataset generations must be strictly identical');
  });
});
