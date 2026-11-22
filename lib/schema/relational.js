/**
 * lib/schema/relational.js
 * Relational Data Generator for MockMate
 *
 * Generates interconnected datasets with primary-key pooling,
 * foreign-key referential integrity, dependency ordering, and circular dependency detection.
 */

const { faker } = require('../core/seed');
const { ValidationError } = require('../core/errors');

/**
 * Validates the top-level dataset definition object.
 *
 * @param {object} datasetDefinition - Object defining datasets and their relations
 */
function validateDatasetDefinition(datasetDefinition) {
  if (!datasetDefinition || typeof datasetDefinition !== 'object' || Array.isArray(datasetDefinition)) {
    throw new ValidationError('Dataset definition must be a non-empty object');
  }

  const tableNames = Object.keys(datasetDefinition);
  if (tableNames.length === 0) {
    throw new ValidationError('Dataset definition must contain at least one dataset');
  }

  for (const tableName of tableNames) {
    const config = datasetDefinition[tableName];
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new ValidationError(`Configuration for dataset "${tableName}" must be an object`);
    }

    if (typeof config.count !== 'number' || !Number.isInteger(config.count) || config.count < 0) {
      throw new ValidationError(`Record count for dataset "${tableName}" must be a non-negative integer`);
    }

    if (!config.schema || typeof config.schema.generate !== 'function') {
      throw new ValidationError(`Dataset "${tableName}" must have a valid schema with a generate() method`);
    }

    if (config.primaryKey !== undefined) {
      if (typeof config.primaryKey !== 'string' || config.primaryKey.trim() === '') {
        throw new ValidationError(`primaryKey for dataset "${tableName}" must be a non-empty string`);
      }
    }

    if (config.foreignKeys !== undefined) {
      if (typeof config.foreignKeys !== 'object' || config.foreignKeys === null || Array.isArray(config.foreignKeys)) {
        throw new ValidationError(`foreignKeys for dataset "${tableName}" must be an object`);
      }

      for (const [fkField, target] of Object.entries(config.foreignKeys)) {
        if (typeof fkField !== 'string' || fkField.trim() === '') {
          throw new ValidationError(`Foreign key field in dataset "${tableName}" must be a non-empty string`);
        }

        if (typeof target !== 'string') {
          throw new ValidationError(`Foreign key target for "${tableName}.${fkField}" must be a string in "table.field" format`);
        }

        const parts = target.split('.');
        if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
          throw new ValidationError(
            `Invalid foreign key target "${target}" in dataset "${tableName}". Expected format: "parentTable.parentField"`
          );
        }

        const [parentTable, parentField] = parts;
        if (!datasetDefinition[parentTable]) {
          throw new ValidationError(
            `Dataset "${tableName}" references unknown parent dataset "${parentTable}"`
          );
        }

        const parentPK = datasetDefinition[parentTable].primaryKey || 'id';
        if (parentField !== parentPK) {
          throw new ValidationError(
            `Foreign key target "${target}" in "${tableName}" references field "${parentField}", but primaryKey of "${parentTable}" is "${parentPK}"`
          );
        }
      }
    }
  }
}

/**
 * Builds dependency graph and resolves topological generation order.
 * Detects circular dependencies.
 *
 * @param {object} datasetDefinition - Validated dataset configurations
 * @returns {string[]} Topologically ordered list of dataset names (parents before children)
 */
function resolveGenerationOrder(datasetDefinition) {
  const tableNames = Object.keys(datasetDefinition);
  const dependencies = {};

  for (const tableName of tableNames) {
    dependencies[tableName] = new Set();
    const fks = datasetDefinition[tableName].foreignKeys;
    if (fks) {
      for (const target of Object.values(fks)) {
        const parentTable = target.split('.')[0];
        dependencies[tableName].add(parentTable);
      }
    }
  }

  // 0 = unvisited, 1 = visiting (in current DFS stack), 2 = visited (completed)
  const state = {};
  const order = [];

  function dfs(node, path) {
    state[node] = 1;
    path.push(node);

    for (const dep of dependencies[node]) {
      if (state[dep] === 1) {
        const cycleStartIndex = path.indexOf(dep);
        const cyclePath = [...path.slice(cycleStartIndex), dep].join(' -> ');
        throw new ValidationError(`Circular dependency detected between datasets: ${cyclePath}`);
      }
      if (!state[dep]) {
        dfs(dep, [...path]);
      }
    }

    state[node] = 2;
    order.push(node);
  }

  for (const tableName of tableNames) {
    if (!state[tableName]) {
      dfs(tableName, []);
    }
  }

  return order;
}

/**
 * Generates relational datasets with valid primary-key and foreign-key references.
 *
 * @param {object} datasetDefinition - Object defining datasets, counts, schemas, and relationships
 * @returns {object} Object with generated record arrays for each dataset
 */
function generateRelational(datasetDefinition) {
  validateDatasetDefinition(datasetDefinition);

  // Resolve generation sequence so parent tables are generated before child tables
  const generationOrder = resolveGenerationOrder(datasetDefinition);

  const results = {};
  // In-memory pool storing valid primary key values per table: { [tableName]: { [pkField]: [...] } }
  const primaryKeyPool = {};

  for (const tableName of generationOrder) {
    const config = datasetDefinition[tableName];
    const pkField = config.primaryKey || 'id';

    // 1. Generate base records using the provided schema
    const records = config.schema.generate(config.count);

    // 2. Validate primary key presence in generated parent records
    if (records.length > 0) {
      if (records[0][pkField] === undefined) {
        throw new ValidationError(
          `Primary key field "${pkField}" was not found in generated records for dataset "${tableName}"`
        );
      }
    }

    // 3. Populate foreign key references if this is a dependent child table
    if (config.foreignKeys && records.length > 0) {
      for (const [fkField, target] of Object.entries(config.foreignKeys)) {
        const [parentTable, parentField] = target.split('.');
        const parentPool = primaryKeyPool[parentTable] && primaryKeyPool[parentTable][parentField];

        if (!parentPool || parentPool.length === 0) {
          throw new ValidationError(
            `Cannot generate child dataset "${tableName}" with foreign key "${fkField}" referencing empty parent dataset "${parentTable}"`
          );
        }

        // Assign a valid parent ID to each child record using the shared Faker instance
        for (const record of records) {
          record[fkField] = faker.helpers.arrayElement(parentPool);
        }
      }
    }

    // 4. Register generated primary keys in pool for downstream dependent tables
    primaryKeyPool[tableName] = primaryKeyPool[tableName] || {};
    primaryKeyPool[tableName][pkField] = records.map((r) => r[pkField]);

    results[tableName] = records;
  }

  return results;
}

module.exports = {
  generateRelational
};
