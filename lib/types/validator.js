/**
 * lib/types/validator.js
 * Constraint & Configuration Validator for MockMate Data Types
 *
 * Validates type configurations before data generation to ensure
 * consistency, valid constraints, and friendly error messages for students.
 */

const { ValidationError } = require('../core/errors');

// List of all supported data types across categories
const SUPPORTED_TYPES = Object.freeze([
  // Basic Types
  'string',
  'number',
  'boolean',
  'date',
  // Identity Types
  'uuid',
  'auto-increment',
  // Personal Data Types
  'name',
  'email',
  'phone',
  'address',
  'company',
  // Content Types
  'paragraph',
  'product',
  // Custom Type
  'pick'
]);

// Map of allowed constraint keys per type to catch incompatible options
const ALLOWED_CONSTRAINTS = {
  string: new Set(['type', 'minLength', 'maxLength']),
  number: new Set(['type', 'min', 'max', 'decimals']),
  boolean: new Set(['type']),
  date: new Set(['type', 'past', 'future']),
  uuid: new Set(['type']),
  'auto-increment': new Set(['type', 'name', 'startValue']),
  name: new Set(['type']),
  email: new Set(['type']),
  phone: new Set(['type']),
  address: new Set(['type']),
  company: new Set(['type']),
  paragraph: new Set(['type']),
  product: new Set(['type']),
  pick: new Set(['type', 'values'])
};

/**
 * Validates number-specific constraints: min, max, decimals.
 *
 * @param {object} config - Configuration object
 */
function validateNumberConstraints(config) {
  const { min, max, decimals } = config;

  if (min !== undefined) {
    if (typeof min !== 'number' || !Number.isFinite(min)) {
      throw new ValidationError(`Number constraint "min" must be a valid finite number, received ${min}`);
    }
  }

  if (max !== undefined) {
    if (typeof max !== 'number' || !Number.isFinite(max)) {
      throw new ValidationError(`Number constraint "max" must be a valid finite number, received ${max}`);
    }
  }

  if (min !== undefined && max !== undefined && min > max) {
    throw new ValidationError(`Number constraint "min" (${min}) cannot be greater than "max" (${max})`);
  }

  if (decimals !== undefined) {
    if (typeof decimals !== 'number' || !Number.isInteger(decimals) || decimals < 0) {
      throw new ValidationError(`Number constraint "decimals" must be a non-negative integer, received ${decimals}`);
    }
  }
}

/**
 * Validates string-specific constraints: minLength, maxLength.
 *
 * @param {object} config - Configuration object
 */
function validateStringConstraints(config) {
  const { minLength, maxLength } = config;

  if (minLength !== undefined) {
    if (typeof minLength !== 'number' || !Number.isInteger(minLength) || minLength < 0) {
      throw new ValidationError(`String constraint "minLength" must be a non-negative integer, received ${minLength}`);
    }
  }

  if (maxLength !== undefined) {
    if (typeof maxLength !== 'number' || !Number.isInteger(maxLength) || maxLength < 0) {
      throw new ValidationError(`String constraint "maxLength" must be a non-negative integer, received ${maxLength}`);
    }
  }

  if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) {
    throw new ValidationError(`String constraint "minLength" (${minLength}) cannot be greater than "maxLength" (${maxLength})`);
  }
}

/**
 * Validates date-specific constraints: past, future.
 *
 * @param {object} config - Configuration object
 */
function validateDateConstraints(config) {
  const { past, future } = config;

  if (past && future) {
    throw new ValidationError('Date constraint cannot specify both "past: true" and "future: true"');
  }

  if (past !== undefined && typeof past !== 'boolean') {
    throw new ValidationError(`Date constraint "past" must be a boolean, received ${typeof past}`);
  }

  if (future !== undefined && typeof future !== 'boolean') {
    throw new ValidationError(`Date constraint "future" must be a boolean, received ${typeof future}`);
  }
}

/**
 * Validates pick-specific constraints: values array.
 *
 * @param {object} config - Configuration object
 */
function validatePickConstraints(config) {
  const { values } = config;

  if (!Array.isArray(values) || values.length === 0) {
    throw new ValidationError('Pick type requires a non-empty "values" array');
  }
}

/**
 * Validates auto-increment specific options: name, startValue.
 *
 * @param {object} config - Configuration object
 */
function validateAutoIncrementConstraints(config) {
  const { name, startValue } = config;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new ValidationError('Auto-increment "name" must be a non-empty string');
    }
  }

  if (startValue !== undefined) {
    if (typeof startValue !== 'number' || !Number.isInteger(startValue)) {
      throw new ValidationError(`Auto-increment "startValue" must be an integer, received ${startValue}`);
    }
  }
}

/**
 * Validates for incompatible or unknown constraints on a field config.
 *
 * @param {string} type - Normalized type name
 * @param {object} config - Configuration object
 */
function validateAllowedConstraints(type, config) {
  const allowed = ALLOWED_CONSTRAINTS[type];
  if (!allowed) return;

  for (const key of Object.keys(config)) {
    if (!allowed.has(key)) {
      throw new ValidationError(`Constraint "${key}" is incompatible with type "${type}"`);
    }
  }
}

/**
 * Validates a field configuration object.
 * Supports string shorthand (e.g., 'email' -> { type: 'email' }) or object form.
 *
 * @param {object|string} config - The field type or configuration object
 * @returns {object} Validated and normalized configuration object
 */
function validateFieldConfig(config) {
  if (!config) {
    throw new ValidationError('Field configuration cannot be null or undefined');
  }

  // Allow shorthand string definition: 'string' -> { type: 'string' }
  let normalizedConfig = config;
  if (typeof config === 'string') {
    normalizedConfig = { type: config };
  } else if (typeof config !== 'object' || Array.isArray(config)) {
    throw new ValidationError('Field configuration must be an object or a type string');
  }

  if (!normalizedConfig.type || typeof normalizedConfig.type !== 'string') {
    throw new ValidationError('Field configuration must specify a valid "type" string');
  }

  const type = normalizedConfig.type.toLowerCase().trim();

  if (!SUPPORTED_TYPES.includes(type)) {
    throw new ValidationError(
      `Unsupported data type: "${normalizedConfig.type}". Supported types are: ${SUPPORTED_TYPES.join(', ')}`
    );
  }

  // Create clean normalized configuration
  const result = { ...normalizedConfig, type };

  // Check for incompatible constraints
  validateAllowedConstraints(type, result);

  // Type-specific constraint checks
  switch (type) {
    case 'number':
      validateNumberConstraints(result);
      break;
    case 'string':
      validateStringConstraints(result);
      break;
    case 'date':
      validateDateConstraints(result);
      break;
    case 'pick':
      validatePickConstraints(result);
      break;
    case 'auto-increment':
      validateAutoIncrementConstraints(result);
      break;
  }

  return result;
}

module.exports = {
  SUPPORTED_TYPES,
  validateFieldConfig
};
