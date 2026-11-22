/**
 * lib/exporters/json.js
 * JSON Exporter for MockMate
 *
 * Serializes mock datasets into formatted JSON strings and writes them to disk.
 * Automatically creates parent directories and supports nested structures.
 */

const fs = require('fs');
const path = require('path');
const { ValidationError } = require('../core/errors');

/**
 * Converts a dataset or array of records to a formatted JSON string.
 *
 * @param {*} data - Dataset or records array to serialize
 * @param {number} [indent=2] - Indentation spacing
 * @returns {string} Formatted JSON string
 */
function toJSONString(data, indent = 2) {
  if (data === undefined) {
    throw new ValidationError('Data to export cannot be undefined');
  }
  return JSON.stringify(data, null, indent);
}

/**
 * Exports data to a JSON file on disk. Creates missing parent folders automatically.
 *
 * @param {*} data - Dataset or records array to serialize
 * @param {string} filePath - Target file path
 * @returns {Promise<string>} Resolved absolute file path
 */
async function exportToJSON(data, filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new ValidationError('File path must be a non-empty string');
  }

  const jsonContent = toJSONString(data);
  const resolvedPath = path.resolve(filePath);

  await fs.promises.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.promises.writeFile(resolvedPath, jsonContent, 'utf8');

  return resolvedPath;
}

module.exports = {
  exportToJSON,
  toJSONString
};
