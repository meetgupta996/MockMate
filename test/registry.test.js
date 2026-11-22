const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const {
  generateValue,
  getSupportedTypes,
  setSeed,
  resetId,
  ValidationError
} = require('../index');

describe('Data Type Registry (lib/types/registry.js)', () => {
  beforeEach(() => {
    resetId('default', 1);
    resetId('customCounter', 1);
  });

  describe('Generation of Every Supported Type', () => {
    it('should generate basic types correctly', () => {
      const str = generateValue({ type: 'string' });
      assert.strictEqual(typeof str, 'string');
      assert.ok(str.length >= 5 && str.length <= 15);

      const num = generateValue({ type: 'number' });
      assert.strictEqual(typeof num, 'number');
      assert.ok(Number.isInteger(num));

      const bool = generateValue({ type: 'boolean' });
      assert.strictEqual(typeof bool, 'boolean');

      const dt = generateValue({ type: 'date' });
      assert.ok(dt instanceof Date);
    });

    it('should generate identity types correctly', () => {
      const uuid = generateValue({ type: 'uuid' });
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      assert.match(uuid, uuidV4Regex);

      resetId('testCounter', 50);
      const id1 = generateValue({ type: 'auto-increment', name: 'testCounter', startValue: 50 });
      const id2 = generateValue({ type: 'auto-increment', name: 'testCounter' });
      assert.strictEqual(id1, 50);
      assert.strictEqual(id2, 51);
    });

    it('should generate personal data types realistically', () => {
      const name = generateValue({ type: 'name' });
      assert.strictEqual(typeof name, 'string');
      assert.ok(name.includes(' ')); // Full name typically has first and last name

      const email = generateValue({ type: 'email' });
      assert.strictEqual(typeof email, 'string');
      assert.ok(email.includes('@'));

      const phone = generateValue({ type: 'phone' });
      assert.strictEqual(typeof phone, 'string');
      assert.ok(phone.length > 5);

      const address = generateValue({ type: 'address' });
      assert.strictEqual(typeof address, 'string');
      assert.ok(address.length > 3);

      const company = generateValue({ type: 'company' });
      assert.strictEqual(typeof company, 'string');
      assert.ok(company.length > 0);
    });

    it('should generate content types realistically', () => {
      const paragraph = generateValue({ type: 'paragraph' });
      assert.strictEqual(typeof paragraph, 'string');
      assert.ok(paragraph.length > 20);

      const product = generateValue({ type: 'product' });
      assert.strictEqual(typeof product, 'string');
      assert.ok(product.length > 0);
    });

    it('should generate pick type by selecting from provided values', () => {
      const choices = ['active', 'inactive', 'banned'];
      const picked = generateValue({ type: 'pick', values: choices });
      assert.ok(choices.includes(picked));
    });
  });

  describe('Constraint Fulfillment', () => {
    it('should satisfy string minLength and maxLength constraints', () => {
      for (let i = 0; i < 20; i++) {
        const val = generateValue({ type: 'string', minLength: 7, maxLength: 12 });
        assert.ok(
          val.length >= 7 && val.length <= 12,
          `Expected length between 7 and 12, got ${val.length}`
        );
      }
    });

    it('should handle exact string length when minLength equals maxLength', () => {
      const val = generateValue({ type: 'string', minLength: 10, maxLength: 10 });
      assert.strictEqual(val.length, 10);
    });

    it('should handle string minLength 0 and maxLength 0', () => {
      const val = generateValue({ type: 'string', minLength: 0, maxLength: 0 });
      assert.strictEqual(val, '');
    });

    it('should satisfy number min and max constraints', () => {
      for (let i = 0; i < 20; i++) {
        const val = generateValue({ type: 'number', min: 200, max: 250 });
        assert.ok(val >= 200 && val <= 250, `Value ${val} should be between 200 and 250`);
      }
    });

    it('should satisfy number decimals constraint', () => {
      for (let i = 0; i < 20; i++) {
        const val = generateValue({ type: 'number', min: 10, max: 20, decimals: 2 });
        assert.ok(val >= 10 && val <= 20);
        const parts = val.toString().split('.');
        if (parts.length > 1) {
          assert.ok(parts[1].length <= 2, `Decimals count should be at most 2, got ${parts[1].length}`);
        }
      }
    });

    it('should satisfy date past constraint', () => {
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        const pastDate = generateValue({ type: 'date', past: true });
        assert.ok(pastDate.getTime() <= now, 'Date must be in the past');
      }
    });

    it('should satisfy date future constraint', () => {
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        const futureDate = generateValue({ type: 'date', future: true });
        assert.ok(futureDate.getTime() >= now, 'Date must be in the future');
      }
    });
  });

  describe('Shorthand Support', () => {
    it('should accept simple string type names directly', () => {
      const email = generateValue('email');
      assert.strictEqual(typeof email, 'string');
      assert.ok(email.includes('@'));

      const name = generateValue('name');
      assert.strictEqual(typeof name, 'string');
    });
  });

  describe('Deterministic Seed Reproducibility', () => {
    it('should generate identical values when the same seed is used', () => {
      setSeed(777);
      const run1 = {
        name: generateValue('name'),
        email: generateValue('email'),
        num: generateValue({ type: 'number', min: 1, max: 1000 }),
        product: generateValue('product'),
        pick: generateValue({ type: 'pick', values: ['A', 'B', 'C', 'D'] })
      };

      setSeed(777);
      const run2 = {
        name: generateValue('name'),
        email: generateValue('email'),
        num: generateValue({ type: 'number', min: 1, max: 1000 }),
        product: generateValue('product'),
        pick: generateValue({ type: 'pick', values: ['A', 'B', 'C', 'D'] })
      };

      assert.deepStrictEqual(run1, run2, 'Identical seed must yield identical outputs');
    });
  });

  describe('Error Handling', () => {
    it('should throw ValidationError for unsupported types or invalid constraints', () => {
      assert.throws(
        () => generateValue({ type: 'non_existent_type' }),
        (err) => err instanceof ValidationError
      );

      assert.throws(
        () => generateValue({ type: 'number', min: 500, max: 100 }),
        (err) => err instanceof ValidationError
      );
    });
  });
});
