/**
 * lib/core/errors.js
 * Custom error hierarchy for MockMate.
 *
 * Keeps error handling structured, identifiable, and easy to explain.
 */

/**
 * Base error class for all MockMate errors.
 * Inherits from JavaScript's native Error class.
 */
class MockMateError extends Error {
  /**
   * @param {string} message - Descriptive error message
   */
  constructor(message) {
    super(message);
    this.name = 'MockMateError';

    // Maintains proper stack trace in V8 engines (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when inputs, options, or schema definitions fail validation.
 * Inherits from MockMateError.
 */
class ValidationError extends MockMateError {
  /**
   * @param {string} message - Validation failure details
   */
  constructor(message) {
    super(message);
    this.name = 'ValidationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = {
  MockMateError,
  ValidationError
};
