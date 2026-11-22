/**
 * lib/database/seedDatabase.js
 * Multi-Table Database Seeder for MockMate
 *
 * Generates per-table seed files in CSV or JSON format for easy database import.
 */

const fs = require('fs');
const path = require('path');
const { ValidationError } = require('../core/errors');
const { exportToCSV } = require('../exporters/csv');
const { exportToJSON } = require('../exporters/json');

/**
 * Seeds a multi-table dataset by generating one file per table in the chosen format.
 *
 * @param {object} dataset - Multi-table dataset object { users: [...], orders: [...] }
 * @param {object} options - Options
 * @param {'csv'|'json'} [options.format='json'] - Export format per table
 * @param {string} options.output - Target output directory
 * @returns {Promise<object>} Summary of generated files
 */
async function seedDatabase(dataset, options = {}) {
  if (!dataset || typeof dataset !== 'object' || Array.isArray(dataset)) {
    throw new ValidationError('Dataset must be an object mapping table names to arrays of records');
  }

  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new ValidationError('Options must be an object');
  }

  const outputDir = options.output;
  if (typeof outputDir !== 'string' || outputDir.trim() === '') {
    throw new ValidationError('Output directory must be a non-empty string');
  }

  const format = (options.format || 'json').toLowerCase().trim();
  if (format !== 'csv' && format !== 'json') {
    throw new ValidationError(`Unsupported seed format "${options.format}". Supported formats are: csv, json`);
  }

  const resolvedOutputDir = path.resolve(outputDir);
  await fs.promises.mkdir(resolvedOutputDir, { recursive: true });

  const files = [];
  let totalRecords = 0;

  for (const [tableName, records] of Object.entries(dataset)) {
    if (!Array.isArray(records)) {
      throw new ValidationError(`Dataset entry for "${tableName}" must be an array of records`);
    }

    const fileName = `${tableName}.${format}`;
    const filePath = path.join(resolvedOutputDir, fileName);

    if (format === 'csv') {
      await exportToCSV(records, filePath);
    } else {
      await exportToJSON(records, filePath);
    }

    files.push({
      table: tableName,
      path: filePath,
      count: records.length
    });
    totalRecords += records.length;
  }

  return {
    format,
    outputDir: resolvedOutputDir,
    files,
    totalRecords
  };
}

module.exports = {
  seedDatabase
};
