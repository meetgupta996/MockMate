/**
 * index.js
 * MockMate - Main Library Entry Point
 *
 * Phase 1: Core Primitives (ID generation, Seed management, Custom Errors)
 * Phase 2: Type Registry & Constraint Validation
 * Phase 3: Custom Schema Engine & Bulk Data Generation
 * Phase 4: Predefined Data Generators (Users, Products, Orders, Posts)
 * Phase 5: Relational Data Generator (generateRelational)
 * Phase 6: Exporters & Database Seeding (JSON, CSV, SQL, seedDatabase)
 */

const {
  generateUUID,
  nextId,
  resetId,
  createCounter
} = require('./lib/core/id');

const {
  setSeed,
  getSeed,
  faker
} = require('./lib/core/seed');

const {
  MockMateError,
  ValidationError
} = require('./lib/core/errors');

const {
  generateValue,
  getSupportedTypes,
  SUPPORTED_TYPES,
  validateFieldConfig
} = require('./lib/types/registry');

const {
  defineSchema
} = require('./lib/schema/schema');

const {
  generateRelational
} = require('./lib/schema/relational');

const {
  users,
  generateUsers
} = require('./lib/generators/users');

const {
  products,
  generateProducts
} = require('./lib/generators/products');

const {
  orders,
  generateOrders
} = require('./lib/generators/orders');

const {
  posts,
  generatePosts
} = require('./lib/generators/posts');

const {
  exportToJSON,
  toJSONString
} = require('./lib/exporters/json');

const {
  exportToCSV,
  toCSVString
} = require('./lib/exporters/csv');

const {
  exportToSQL,
  toSQLString
} = require('./lib/exporters/sql');

const {
  seedDatabase
} = require('./lib/database/seedDatabase');

module.exports = {
  // ID Generation (Phase 1)
  generateUUID,
  nextId,
  resetId,
  createCounter,

  // Seed & Reproducibility (Phase 1)
  setSeed,
  getSeed,
  faker,

  // Custom Error Classes (Phase 1)
  MockMateError,
  ValidationError,

  // Type Registry & Validation (Phase 2)
  generateValue,
  getSupportedTypes,
  SUPPORTED_TYPES,
  validateFieldConfig,

  // Schema Engine (Phase 3)
  defineSchema,

  // Relational Generator (Phase 5)
  generateRelational,

  // Predefined Generators (Phase 4)
  users,
  generateUsers,
  products,
  generateProducts,
  orders,
  generateOrders,
  posts,
  generatePosts,

  // Exporters & Seeding (Phase 6)
  exportToJSON,
  toJSONString,
  exportToCSV,
  toCSVString,
  exportToSQL,
  toSQLString,
  seedDatabase
};
