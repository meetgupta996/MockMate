/**
 * lib/types/registry.js
 * Data Type Registry for MockMate
 *
 * Maps data types to generator functions and applies user-defined constraints.
 * Reuses the shared Faker instance and ID primitives from Phase 1.
 */

const { faker } = require('../core/seed');
const { generateUUID, nextId } = require('../core/id');
const { validateFieldConfig, SUPPORTED_TYPES } = require('./validator');

/**
 * Basic Types
 */

function generateString(config) {
  let min = config.minLength;
  let max = config.maxLength;

  if (min === undefined && max === undefined) {
    min = 5;
    max = 15;
  } else if (min === undefined) {
    min = 0;
  } else if (max === undefined) {
    max = min + 10;
  }

  if (min === 0 && max === 0) {
    return '';
  }

  if (min === max) {
    return faker.string.alphanumeric(min);
  }

  return faker.string.alphanumeric({ length: { min, max } });
}

function generateNumber(config) {
  const min = config.min !== undefined ? config.min : 0;
  const max = config.max !== undefined ? config.max : (min > 1000 ? min + 1000 : 1000);
  const decimals = config.decimals;

  if (decimals !== undefined && decimals > 0) {
    return faker.number.float({ min, max, fractionDigits: decimals });
  }

  return faker.number.int({ min: Math.ceil(min), max: Math.floor(max) });
}

function generateBoolean() {
  return faker.datatype.boolean();
}

function generateDate(config) {
  if (config.past) {
    return faker.date.past();
  }
  if (config.future) {
    return faker.date.future();
  }
  return faker.date.recent();
}

/**
 * Identity Types
 */

function generateUUIDValue() {
  return generateUUID();
}

function generateAutoIncrementValue(config) {
  const name = config.name || 'default';
  const startValue = config.startValue !== undefined ? config.startValue : 1;
  return nextId(name, startValue);
}

/**
 * Personal Data Types
 */

function generateName() {
  return faker.person.fullName();
}

function generateEmail() {
  return faker.internet.email();
}

function generatePhone() {
  return faker.phone.number();
}

function generateAddress() {
  return faker.location.streetAddress();
}

function generateCompany() {
  return faker.company.name();
}

/**
 * Content Types
 */

function generateParagraph() {
  return faker.lorem.paragraph();
}

function generateProduct() {
  return faker.commerce.productName();
}

/**
 * Custom Pick Type
 */

function generatePick(config) {
  return faker.helpers.arrayElement(config.values);
}

// Handler lookup table
const TYPE_HANDLERS = {
  // Basic
  string: generateString,
  number: generateNumber,
  boolean: generateBoolean,
  date: generateDate,
  // Identity
  uuid: generateUUIDValue,
  'auto-increment': generateAutoIncrementValue,
  // Personal
  name: generateName,
  email: generateEmail,
  phone: generatePhone,
  address: generateAddress,
  company: generateCompany,
  // Content
  paragraph: generateParagraph,
  product: generateProduct,
  // Custom
  pick: generatePick
};

/**
 * Generates a mock value given a field configuration.
 * Validates the configuration before generation.
 *
 * @param {object|string} fieldConfig - Configuration object or type string
 * @returns {*} The generated mock value
 */
function generateValue(fieldConfig) {
  const validated = validateFieldConfig(fieldConfig);
  const handler = TYPE_HANDLERS[validated.type];
  return handler(validated);
}

/**
 * Returns a list of all supported data types.
 *
 * @returns {string[]}
 */
function getSupportedTypes() {
  return [...SUPPORTED_TYPES];
}

module.exports = {
  generateValue,
  getSupportedTypes,
  SUPPORTED_TYPES,
  validateFieldConfig
};
