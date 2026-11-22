/**
 * lib/exporters/csv.js
 * CSV Exporter for MockMate
 *
 * Converts arrays of mock records into RFC4180-compliant CSV files.
 * Correctly handles commas, quotes, newlines, nulls, and nested structures.
 */

const fs = require('fs');
const path = require('path');
const { ValidationError } = require('../core/errors');

/**
 * Escapes an individual value according to RFC4180 CSV specifications.
 *
 * @param {*} val - Value to escape
 * @returns {string} Escaped CSV string
 */
function escapeCSVValue(val) {
  if (val === null || val === undefined) {
    return '';
  }

  if (val instanceof Date) {
    return val.toISOString();
  }

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // Values containing commas, quotes, or newlines must be enclosed in quotes
  // with internal quotes doubled.
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts an array of objects into a CSV string.
 *
 * @param {object[]} data - Array of record objects
 * @returns {string} Formatted CSV text
 */
function toCSVString(data) {
  if (!Array.isArray(data)) {
    throw new ValidationError('Data must be an array of objects for CSV export');
  }

  if (data.length === 0) {
    return '';
  }

  // Extract all unique headers across all records to handle irregular schemas
  const headers = Array.from(new Set(data.flatMap(Object.keys)));
  const headerLine = headers.map(escapeCSVValue).join(',');

  const lines = [headerLine];

  for (const record of data) {
    if (typeof record !== 'object' || record === null) {
      continue;
    }
    const row = headers.map((key) => escapeCSVValue(record[key]));
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Exports an array of records to a CSV file on disk. Creates missing parent directories automatically.
 *
 * @param {object[]} data - Array of records
 * @param {string} filePath - Target file path
 * @returns {Promise<string>} Resolved absolute file path
 */
async function exportToCSV(data, filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new ValidationError('File path must be a non-empty string');
  }

  const csvContent = toCSVString(data);
  const resolvedPath = path.resolve(filePath);

  await fs.promises.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.promises.writeFile(resolvedPath, csvContent, 'utf8');

  return resolvedPath;
}

module.exports = {
  exportToCSV,
  toCSVString,
  escapeCSVValue
};
