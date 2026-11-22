const { describe, it } = require('node:test');
const assert = require('node:assert');
const { setSeed, getSeed, faker, ValidationError, MockMateError } = require('../index');

describe('Seed & Reproducible Random Generation', () => {
  it('should store and return the current seed', () => {
    const seed = setSeed(12345);
    assert.strictEqual(seed, 12345);
    assert.strictEqual(getSeed(), 12345);
  });

  it('should produce identical sequences of Faker values when using the same seed', () => {
    // Run 1 with seed 42
    setSeed(42);
    const run1_name1 = faker.person.fullName();
    const run1_email = faker.internet.email();
    const run1_num = faker.number.int({ min: 1, max: 1000 });

    // Run 2 with same seed 42
    setSeed(42);
    const run2_name1 = faker.person.fullName();
    const run2_email = faker.internet.email();
    const run2_num = faker.number.int({ min: 1, max: 1000 });

    assert.strictEqual(run1_name1, run2_name1, 'Names should be identical across runs with identical seed');
    assert.strictEqual(run1_email, run2_email, 'Emails should be identical across runs with identical seed');
    assert.strictEqual(run1_num, run2_num, 'Numbers should be identical across runs with identical seed');
  });

  it('should produce different sequences of Faker values when using different seeds', () => {
    setSeed(100);
    const seed100_val1 = faker.person.fullName();
    const seed100_val2 = faker.number.int({ min: 1, max: 100000 });

    setSeed(999);
    const seed999_val1 = faker.person.fullName();
    const seed999_val2 = faker.number.int({ min: 1, max: 100000 });

    assert.notStrictEqual(seed100_val1, seed999_val1, 'Different seeds should produce different names');
    assert.notStrictEqual(seed100_val2, seed999_val2, 'Different seeds should produce different numbers');
  });

  it('should reject invalid non-integer or non-numeric seeds', () => {
    const invalidSeeds = ['123', null, undefined, true, {}, [], 42.5, NaN, Infinity];

    for (const invalid of invalidSeeds) {
      assert.throws(
        () => setSeed(invalid),
        (err) => {
          assert.ok(err instanceof ValidationError, `Expected ValidationError for seed: ${invalid}`);
          assert.strictEqual(err.name, 'ValidationError');
          assert.match(err.message, /Seed must be an integer/);
          return true;
        }
      );
    }
  });

  describe('Custom Error Hierarchy', () => {
    it('MockMateError should inherit from native Error', () => {
      const err = new MockMateError('Base error');
      assert.ok(err instanceof Error);
      assert.ok(err instanceof MockMateError);
      assert.strictEqual(err.name, 'MockMateError');
      assert.strictEqual(err.message, 'Base error');
      assert.ok(typeof err.stack === 'string');
    });

    it('ValidationError should inherit from MockMateError and Error', () => {
      const err = new ValidationError('Invalid parameter');
      assert.ok(err instanceof Error);
      assert.ok(err instanceof MockMateError);
      assert.ok(err instanceof ValidationError);
      assert.strictEqual(err.name, 'ValidationError');
      assert.strictEqual(err.message, 'Invalid parameter');
      assert.ok(typeof err.stack === 'string');
    });
  });
});
