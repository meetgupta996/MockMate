/**
 * lib/schema/schema.js
 * Custom Schema Engine & Bulk Data Generator for MockMate
 *
 * Provides defineSchema() to compile declarative schemas and generate
 * single or bulk mock records with constraint validation and custom generators.
 */

const { generateUUID } = require('../core/id');
const { ValidationError } = require('../core/errors');
const { generateValue, validateFieldConfig } = require('../types/registry');

/**
 * Validates a schema definition object and normalizes each field configuration.
 *
 * @param {object} schemaDefinition - Object defining fields and their types/configs
 * @param {string} schemaInstanceId - Unique ID for isolating unnamed auto-increment sequences
 * @returns {object} Normalized schema fields
 */
function normalizeSchemaDefinition(schemaDefinition, schemaInstanceId) {
  if (!schemaDefinition || typeof schemaDefinition !== 'object' || Array.isArray(schemaDefinition)) {
    throw new ValidationError('Schema definition must be a non-empty object');
  }

  const fieldNames = Object.keys(schemaDefinition);
  if (fieldNames.length === 0) {
    throw new ValidationError('Schema definition must contain at least one field');
  }

  const normalized = {};

  for (const fieldName of fieldNames) {
    if (typeof fieldName !== 'string' || fieldName.trim() === '') {
      throw new ValidationError('Field name must be a non-empty string');
    }

    const fieldConfig = schemaDefinition[fieldName];

    if (!fieldConfig) {
      throw new ValidationError(`Field "${fieldName}" cannot have null or undefined configuration`);
    }

    // 1. Shorthand custom generator function: { code: (index) => `EMP-${index}` }
    if (typeof fieldConfig === 'function') {
      normalized[fieldName] = {
        type: 'custom',
        generate: fieldConfig
      };
      continue;
    }

    // 2. Object custom generator: { code: { type: 'custom', generate: (index) => `EMP-${index}` } }
    if (typeof fieldConfig === 'object' && fieldConfig.type === 'custom') {
      if (typeof fieldConfig.generate !== 'function') {
        throw new ValidationError(`Custom field "${fieldName}" must provide a "generate" function`);
      }
      normalized[fieldName] = {
        type: 'custom',
        generate: fieldConfig.generate
      };
      continue;
    }

    // 3. Standard data type (string shorthand or configuration object)
    const validated = validateFieldConfig(fieldConfig);

    // If auto-increment does not specify an explicit counter name, isolate it to this schema field
    if (validated.type === 'auto-increment' && !validated.name) {
      validated.name = `schema_${schemaInstanceId}_${fieldName}`;
    }

    normalized[fieldName] = validated;
  }

  return normalized;
}

/**
 * Defines a new data schema for generating mock records.
 *
 * @param {object} schemaDefinition - Key-value map of field names to types or configs
 * @returns {object} Schema object providing generateOne() and generate(count)
 */
function defineSchema(schemaDefinition) {
  const schemaInstanceId = generateUUID();
  const normalizedFields = normalizeSchemaDefinition(schemaDefinition, schemaInstanceId);
  const fieldNames = Object.keys(normalizedFields);

  return {
    /**
     * Generates a single mock record matching the schema.
     *
     * @returns {object} A plain JavaScript object with generated mock values
     */
    generateOne() {
      const records = this.generate(1);
      return records[0];
    },

    /**
     * Generates multiple mock records matching the schema.
     *
     * @param {number} count - The number of records to generate (must be an integer >= 0)
     * @returns {object[]} Array of generated mock records
     */
    generate(count) {
      if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
        throw new ValidationError(`Record count must be a non-negative integer, received ${count}`);
      }

      if (count === 0) {
        return [];
      }

      const records = new Array(count);

      for (let i = 0; i < count; i++) {
        const record = {};

        for (const fieldName of fieldNames) {
          const config = normalizedFields[fieldName];

          if (config.type === 'custom') {
            record[fieldName] = config.generate(i, record);
          } else {
            record[fieldName] = generateValue(config);
          }
        }

        records[i] = record;
      }

      return records;
    },

    /**
     * Returns a copy of the original schema definition.
     *
     * @returns {object}
     */
    getDefinition() {
      return { ...schemaDefinition };
    }
  };
}

module.exports = {
  defineSchema
};
