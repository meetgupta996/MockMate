const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { generateUUID, nextId, resetId, createCounter, ValidationError, MockMateError } = require('../index');

describe('ID Generation Module', () => {
  beforeEach(() => {
    // Reset standard counters before each test to maintain isolation
    resetId('default', 1);
    resetId('users', 1);
    resetId('products', 100);
  });

  describe('UUID Generation', () => {
    it('should generate a valid RFC4122 v4 UUID', () => {
      const uuid = generateUUID();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      assert.strictEqual(typeof uuid, 'string');
      assert.strictEqual(uuid.length, 36);
      assert.match(uuid, uuidV4Regex, 'UUID should match v4 format');
    });

    it('should generate unique UUIDs on consecutive calls', () => {
      const set = new Set();
      const total = 50;

      for (let i = 0; i < total; i++) {
        set.add(generateUUID());
      }

      assert.strictEqual(set.size, total, 'All generated UUIDs must be distinct');
    });
  });

  describe('Auto-Increment IDs', () => {
    it('should start at 1 by default and increment sequentially', () => {
      assert.strictEqual(nextId(), 1);
      assert.strictEqual(nextId(), 2);
      assert.strictEqual(nextId(), 3);
    });

    it('should support custom starting values for named counters', () => {
      assert.strictEqual(nextId('products', 100), 100);
      assert.strictEqual(nextId('products', 100), 101);
      assert.strictEqual(nextId('products', 100), 102);
    });

    it('should keep different counter namespaces isolated', () => {
      resetId('alpha', 10);
      resetId('beta', 50);

      assert.strictEqual(nextId('alpha'), 10);
      assert.strictEqual(nextId('beta'), 50);
      assert.strictEqual(nextId('alpha'), 11);
      assert.strictEqual(nextId('beta'), 51);
    });

    it('should reset counter correctly to default 1', () => {
      nextId('users'); // 1
      nextId('users'); // 2
      nextId('users'); // 3

      resetId('users');
      assert.strictEqual(nextId('users'), 1);
    });

    it('should reset counter correctly to a custom value', () => {
      nextId('orders');
      resetId('orders', 500);

      assert.strictEqual(nextId('orders'), 500);
      assert.strictEqual(nextId('orders'), 501);
    });
  });

  describe('createCounter helper', () => {
    it('should create an isolated counter instance', () => {
      const counterA = createCounter(1);
      const counterB = createCounter(10);

      assert.strictEqual(counterA.next(), 1);
      assert.strictEqual(counterA.next(), 2);

      assert.strictEqual(counterB.next(), 10);
      assert.strictEqual(counterB.next(), 11);

      assert.strictEqual(counterA.current(), 2);
      assert.strictEqual(counterB.current(), 11);

      counterA.reset(5);
      assert.strictEqual(counterA.next(), 5);
      assert.strictEqual(counterB.next(), 12, 'counterB should not be affected by counterA reset');
    });
  });

  describe('Input Validation & Error Handling', () => {
    it('should throw ValidationError if counter name is not a string', () => {
      assert.throws(
        () => nextId(123),
        (err) => err instanceof ValidationError && err.name === 'ValidationError'
      );
      assert.throws(
        () => resetId(null),
        (err) => err instanceof ValidationError
      );
    });

    it('should throw ValidationError if counter name is empty or whitespace', () => {
      assert.throws(
        () => nextId(''),
        (err) => err instanceof ValidationError && /empty/.test(err.message)
      );
      assert.throws(
        () => resetId('   '),
        (err) => err instanceof ValidationError && /empty/.test(err.message)
      );
    });

    it('should throw ValidationError if start value is not an integer', () => {
      assert.throws(
        () => nextId('test', '1'),
        (err) => err instanceof ValidationError && /must be an integer/.test(err.message)
      );
      assert.throws(
        () => nextId('test', 1.5),
        (err) => err instanceof ValidationError && /must be an integer/.test(err.message)
      );
      assert.throws(
        () => nextId('test', NaN),
        (err) => err instanceof ValidationError && /must be an integer/.test(err.message)
      );
      assert.throws(
        () => createCounter('invalid'),
        (err) => err instanceof ValidationError && /must be an integer/.test(err.message)
      );
    });
  });
});
