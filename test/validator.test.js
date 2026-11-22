const { describe, it } = require('node:test');
const assert = require('node:assert');
const { validateFieldConfig, SUPPORTED_TYPES, ValidationError } = require('../index');

describe('Field Constraint Validator (lib/types/validator.js)', () => {
  describe('General Validation', () => {
    it('should reject null or undefined configurations', () => {
      assert.throws(
        () => validateFieldConfig(null),
        (err) => err instanceof ValidationError && /null or undefined/.test(err.message)
      );
      assert.throws(
        () => validateFieldConfig(undefined),
        (err) => err instanceof ValidationError && /null or undefined/.test(err.message)
      );
    });

    it('should reject invalid configuration types (e.g., numbers, booleans, arrays)', () => {
      assert.throws(
        () => validateFieldConfig(123),
        (err) => err instanceof ValidationError && /must be an object/.test(err.message)
      );
      assert.throws(
        () => validateFieldConfig(['string']),
        (err) => err instanceof ValidationError && /must be an object/.test(err.message)
      );
    });

    it('should reject configurations without a type string', () => {
      assert.throws(
        () => validateFieldConfig({}),
        (err) => err instanceof ValidationError && /specify a valid "type" string/.test(err.message)
      );
      assert.throws(
        () => validateFieldConfig({ type: 123 }),
        (err) => err instanceof ValidationError && /specify a valid "type" string/.test(err.message)
      );
    });

    it('should reject unsupported data types', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'unknown_type' }),
        (err) => err instanceof ValidationError && /Unsupported data type: "unknown_type"/.test(err.message)
      );
    });

    it('should allow string shorthand and normalize it to an object', () => {
      const result = validateFieldConfig('email');
      assert.deepStrictEqual(result, { type: 'email' });
    });

    it('should normalize type strings case-insensitively', () => {
      const result = validateFieldConfig({ type: '  STRING  ' });
      assert.strictEqual(result.type, 'string');
    });

    it('should export all 14 supported types', () => {
      assert.strictEqual(SUPPORTED_TYPES.length, 14);
      assert.ok(SUPPORTED_TYPES.includes('string'));
      assert.ok(SUPPORTED_TYPES.includes('number'));
      assert.ok(SUPPORTED_TYPES.includes('boolean'));
      assert.ok(SUPPORTED_TYPES.includes('date'));
      assert.ok(SUPPORTED_TYPES.includes('uuid'));
      assert.ok(SUPPORTED_TYPES.includes('auto-increment'));
      assert.ok(SUPPORTED_TYPES.includes('name'));
      assert.ok(SUPPORTED_TYPES.includes('email'));
      assert.ok(SUPPORTED_TYPES.includes('phone'));
      assert.ok(SUPPORTED_TYPES.includes('address'));
      assert.ok(SUPPORTED_TYPES.includes('company'));
      assert.ok(SUPPORTED_TYPES.includes('paragraph'));
      assert.ok(SUPPORTED_TYPES.includes('product'));
      assert.ok(SUPPORTED_TYPES.includes('pick'));
    });
  });

  describe('Number Constraints', () => {
    it('should accept valid number configurations', () => {
      const valid = { type: 'number', min: 10, max: 50, decimals: 2 };
      const result = validateFieldConfig(valid);
      assert.deepStrictEqual(result, valid);
    });

    it('should reject non-numeric min or max', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'number', min: '10' }),
        (err) => err instanceof ValidationError && /must be a valid finite number/.test(err.message)
      );
      assert.throws(
        () => validateFieldConfig({ type: 'number', max: NaN }),
        (err) => err instanceof ValidationError && /must be a valid finite number/.test(err.message)
      );
    });

    it('should reject min greater than max', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'number', min: 100, max: 50 }),
        (err) => err instanceof ValidationError && /cannot be greater than "max"/.test(err.message)
      );
    });

    it('should reject negative or non-integer decimals', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'number', decimals: -1 }),
        (err) => err instanceof ValidationError && /must be a non-negative integer/.test(err.message)
      );
      assert.throws(
        () => validateFieldConfig({ type: 'number', decimals: 1.5 }),
        (err) => err instanceof ValidationError && /must be a non-negative integer/.test(err.message)
      );
    });

    it('should reject incompatible constraints on number', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'number', minLength: 5 }),
        (err) => err instanceof ValidationError && /incompatible with type "number"/.test(err.message)
      );
    });
  });

  describe('String Constraints', () => {
    it('should accept valid string configurations', () => {
      const valid = { type: 'string', minLength: 3, maxLength: 10 };
      const result = validateFieldConfig(valid);
      assert.deepStrictEqual(result, valid);
    });

    it('should reject negative minLength or maxLength', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'string', minLength: -1 }),
        (err) => err instanceof ValidationError && /must be a non-negative integer/.test(err.message)
      );
      assert.throws(
        () => validateFieldConfig({ type: 'string', maxLength: -5 }),
        (err) => err instanceof ValidationError && /must be a non-negative integer/.test(err.message)
      );
    });

    it('should reject non-integer minLength or maxLength', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'string', minLength: 3.5 }),
        (err) => err instanceof ValidationError && /must be a non-negative integer/.test(err.message)
      );
      assert.throws(
        () => validateFieldConfig({ type: 'string', maxLength: '10' }),
        (err) => err instanceof ValidationError && /must be a non-negative integer/.test(err.message)
      );
    });

    it('should reject minLength greater than maxLength', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'string', minLength: 20, maxLength: 5 }),
        (err) => err instanceof ValidationError && /cannot be greater than "maxLength"/.test(err.message)
      );
    });

    it('should reject incompatible constraints on string', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'string', min: 10 }),
        (err) => err instanceof ValidationError && /incompatible with type "string"/.test(err.message)
      );
    });
  });

  describe('Date Constraints', () => {
    it('should accept valid date configurations', () => {
      assert.deepStrictEqual(validateFieldConfig({ type: 'date', past: true }), { type: 'date', past: true });
      assert.deepStrictEqual(validateFieldConfig({ type: 'date', future: true }), { type: 'date', future: true });
    });

    it('should reject date when both past and future are true', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'date', past: true, future: true }),
        (err) => err instanceof ValidationError && /both "past: true" and "future: true"/.test(err.message)
      );
    });

    it('should reject non-boolean past or future values', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'date', past: 'yes' }),
        (err) => err instanceof ValidationError && /must be a boolean/.test(err.message)
      );
    });
  });

  describe('Pick Constraints', () => {
    it('should accept valid pick configurations', () => {
      const valid = { type: 'pick', values: ['admin', 'user', 'guest'] };
      const result = validateFieldConfig(valid);
      assert.deepStrictEqual(result, valid);
    });

    it('should reject missing, non-array, or empty values', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'pick' }),
        (err) => err instanceof ValidationError && /non-empty "values" array/.test(err.message)
      );
      assert.throws(
        () => validateFieldConfig({ type: 'pick', values: 'admin' }),
        (err) => err instanceof ValidationError && /non-empty "values" array/.test(err.message)
      );
      assert.throws(
        () => validateFieldConfig({ type: 'pick', values: [] }),
        (err) => err instanceof ValidationError && /non-empty "values" array/.test(err.message)
      );
    });
  });

  describe('Auto-Increment Constraints', () => {
    it('should accept valid auto-increment configurations', () => {
      const valid = { type: 'auto-increment', name: 'orderIds', startValue: 100 };
      const result = validateFieldConfig(valid);
      assert.deepStrictEqual(result, valid);
    });

    it('should reject invalid auto-increment name or startValue', () => {
      assert.throws(
        () => validateFieldConfig({ type: 'auto-increment', name: '' }),
        (err) => err instanceof ValidationError && /non-empty string/.test(err.message)
      );
      assert.throws(
        () => validateFieldConfig({ type: 'auto-increment', startValue: '10' }),
        (err) => err instanceof ValidationError && /must be an integer/.test(err.message)
      );
    });
  });
});
