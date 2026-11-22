/**
 * lib/exporters/sql.js
 * SQL Exporter for MockMate
 *
 * Generates dialect-aware SQL INSERT seed scripts for PostgreSQL, MySQL, and SQLite.
 * Handles identifier quoting, string escaping, nulls, booleans, dates, and JSON serialization.
 */

const fs = require('fs');
const path = require('path');
const { ValidationError } = require('../core/errors');

const SUPPORTED_DIALECTS = ['postgres', 'postgresql', 'mysql', 'sqlite'];

/**
 * Normalizes and validates the SQL dialect.
 *
 * @param {string} [dialect='postgres']
 * @returns {'postgres'|'mysql'|'sqlite'}
 */
function normalizeDialect(dialect = 'postgres') {
  if (typeof dialect !== 'string') {
    throw new ValidationError(`Unsupported SQL dialect "${dialect}". Supported dialects are: postgres, mysql, sqlite`);
  }

  const normalized = dialect.toLowerCase().trim();
  if (normalized === 'postgresql') {
    return 'postgres';
  }

  if (!SUPPORTED_DIALECTS.includes(normalized)) {
    throw new ValidationError(
      `Unsupported SQL dialect "${dialect}". Supported dialects are: postgres, mysql, sqlite`
    );
  }

  return normalized;
}

/**
 * Safely quotes table and column identifiers based on dialect.
 * - PostgreSQL / SQLite: "identifier"
 * - MySQL: `identifier`
 *
 * @param {string} identifier - Table or column name
 * @param {string} dialect - SQL dialect
 * @returns {string} Quoted identifier
 */
function quoteIdentifier(identifier, dialect) {
  if (typeof identifier !== 'string' || identifier.trim() === '') {
    throw new ValidationError('Table and column identifiers must be non-empty strings');
  }

  if (dialect === 'mysql') {
    return `\`${identifier.replace(/`/g, '``')}\``;
  }

  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Safely formats and escapes a value for SQL INSERT statements.
 *
 * @param {*} val - Value to format
 * @param {string} dialect - SQL dialect
 * @returns {string} Formatted SQL literal
 */
function formatSQLValue(val, dialect) {
  if (val === null || val === undefined) {
    return 'NULL';
  }

  if (typeof val === 'number') {
    return Number.isFinite(val) ? val.toString() : 'NULL';
  }

  if (typeof val === 'boolean') {
    if (dialect === 'sqlite') {
      return val ? '1' : '0';
    }
    return val ? 'TRUE' : 'FALSE';
  }

  if (val instanceof Date) {
    return `'${val.toISOString()}'`;
  }

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  let escaped = str.replace(/'/g, "''");

  // MySQL requires backslashes to be escaped
  if (dialect === 'mysql') {
    escaped = escaped.replace(/\\/g, '\\\\');
  }

  return `'${escaped}'`;
}

/**
 * Generates an SQL INSERT seed script string for single or multi-table datasets.
 *
 * @param {object|object[]} dataset - Single array of records or multi-table object { users: [...], orders: [...] }
 * @param {object} [options={}] - Options
 * @param {'postgres'|'mysql'|'sqlite'} [options.dialect='postgres'] - Target dialect
 * @param {string} [options.tableName='data'] - Fallback table name when dataset is a single array
 * @returns {string} Formatted SQL script
 */
function toSQLString(dataset, options = {}) {
  const dialect = normalizeDialect(options.dialect || 'postgres');

  let normalizedDataset = dataset;
  if (Array.isArray(dataset)) {
    const defaultTable = options.tableName || 'data';
    normalizedDataset = { [defaultTable]: dataset };
  } else if (!dataset || typeof dataset !== 'object') {
    throw new ValidationError('Dataset must be an object mapping table names to record arrays');
  }

  const tableNames = Object.keys(normalizedDataset);
  if (tableNames.length === 0) {
    return '-- MockMate SQL Seed Export: No tables defined\n';
  }

  const sections = [];
  sections.push(`-- ========================================================`);
  sections.push(`-- MockMate Database Seed Export`);
  sections.push(`-- Dialect: ${dialect.toUpperCase()}`);
  sections.push(`-- ========================================================\n`);

  for (const tableName of tableNames) {
    const records = normalizedDataset[tableName];
    if (!Array.isArray(records)) {
      throw new ValidationError(`Dataset entry for table "${tableName}" must be an array of records`);
    }

    const quotedTable = quoteIdentifier(tableName, dialect);
    sections.push(`-- --------------------------------------------------------`);
    sections.push(`-- Table: ${tableName} (${records.length} records)`);
    sections.push(`-- --------------------------------------------------------`);

    if (records.length === 0) {
      sections.push(`-- (No records to insert)\n`);
      continue;
    }

    const columns = Array.from(new Set(records.flatMap(Object.keys)));
    if (columns.length === 0) {
      sections.push(`-- (Records have no columns)\n`);
      continue;
    }

    const quotedColumns = columns.map((col) => quoteIdentifier(col, dialect)).join(', ');

    // Write INSERT statement
    const valueRows = records.map((rec) => {
      const formatted = columns.map((col) => formatSQLValue(rec[col], dialect));
      return `  (${formatted.join(', ')})`;
    });

    sections.push(`INSERT INTO ${quotedTable} (${quotedColumns}) VALUES`);
    sections.push(valueRows.join(',\n') + ';\n');
  }

  return sections.join('\n');
}

/**
 * Exports single or multi-table datasets into an SQL seed file on disk.
 *
 * @param {object|object[]} dataset - Single array or multi-table object
 * @param {string} filePath - Target file path
 * @param {object} [options={}] - Options (e.g., dialect)
 * @returns {Promise<string>} Resolved absolute file path
 */
async function exportToSQL(dataset, filePath, options = {}) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new ValidationError('File path must be a non-empty string');
  }

  const sqlContent = toSQLString(dataset, options);
  const resolvedPath = path.resolve(filePath);

  await fs.promises.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.promises.writeFile(resolvedPath, sqlContent, 'utf8');

  return resolvedPath;
}

module.exports = {
  exportToSQL,
  toSQLString,
  normalizeDialect,
  quoteIdentifier,
  formatSQLValue
};
