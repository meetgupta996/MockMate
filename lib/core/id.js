/**
 * lib/core/id.js
 * ID Generation Module
 *
 * Provides:
 * 1. UUID v4 generation using Node.js built-in crypto module.
 * 2. Auto-increment numeric ID generation with custom start values and reset capabilities.
 * 3. Counter helper for isolated instances.
 */

const crypto = require('crypto');
const { ValidationError } = require('./errors');

// In-memory registry to store auto-increment state per counter name
const counters = new Map();

/**
 * Generates a standard RFC4122 Version 4 UUID.
 * Uses Node.js native crypto.randomUUID() for high performance and zero dependencies.
 *
 * @returns {string} A randomly generated UUID (e.g., "123e4567-e89b-12d3-a456-426614174000")
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Validates the counter name.
 *
 * @param {string} name - The identifier for the counter
 */
function validateCounterName(name) {
  if (typeof name !== 'string') {
    throw new ValidationError(`Counter name must be a string, received ${typeof name}`);
  }
  if (name.trim() === '') {
    throw new ValidationError('Counter name cannot be empty');
  }
}

/**
 * Validates a start value.
 *
 * @param {number} value - The numeric value to validate
 */
function validateNumericValue(value, paramName = 'Starting value') {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ValidationError(`${paramName} must be an integer, received ${value}`);
  }
}

/**
 * Generates the next auto-incrementing integer ID.
 * Supports multiple independent counters identified by name (default is 'default').
 *
 * @param {string} [name='default'] - Counter name (e.g., 'users', 'products')
 * @param {number} [startValue=1] - The starting value if this counter has not been initialized
 * @returns {number} The next sequential ID
 */
function nextId(name = 'default', startValue = 1) {
  validateCounterName(name);
  validateNumericValue(startValue, 'Starting value');

  if (!counters.has(name)) {
    counters.set(name, startValue);
    return startValue;
  }

  const current = counters.get(name);
  const next = current + 1;
  counters.set(name, next);
  return next;
}

/**
 * Resets an auto-increment counter to a specific starting value.
 *
 * @param {string} [name='default'] - Counter name to reset
 * @param {number} [startValue=1] - The value that will be returned on the next call to nextId()
 */
function resetId(name = 'default', startValue = 1) {
  validateCounterName(name);
  validateNumericValue(startValue, 'Starting value');

  // We set the counter state so that the next call to nextId returns startValue
  // When nextId is called and finds the counter already initialized, it increments by 1.
  // Therefore, setting (startValue - 1) ensures the subsequent nextId returns startValue.
  counters.set(name, startValue - 1);
}

/**
 * Creates an isolated auto-increment counter instance.
 * Useful when an isolated sequence is preferred over global names.
 *
 * @param {number} [startValue=1] - Initial starting value
 * @returns {object} Counter instance with next(), reset(), and current() methods
 */
function createCounter(startValue = 1) {
  validateNumericValue(startValue, 'Starting value');

  let current = null;
  let configuredStart = startValue;

  return {
    /**
     * Returns the next sequential ID
     * @returns {number}
     */
    next() {
      if (current === null) {
        current = configuredStart;
      } else {
        current += 1;
      }
      return current;
    },

    /**
     * Resets this counter
     * @param {number} [newStart=startValue]
     */
    reset(newStart = startValue) {
      validateNumericValue(newStart, 'Starting value');
      configuredStart = newStart;
      current = null;
    },

    /**
     * Returns the most recently generated ID, or null if none generated yet
     * @returns {number|null}
     */
    current() {
      return current;
    }
  };
}

module.exports = {
  generateUUID,
  nextId,
  resetId,
  createCounter
};
