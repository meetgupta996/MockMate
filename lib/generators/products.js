/**
 * lib/generators/products.js
 * Predefined Product Generator for MockMate
 *
 * Generates realistic e-commerce product records with unique IDs and unique SKUs.
 * Supports configurable price ranges, stock levels, and categories.
 */

const { faker } = require('../core/seed');
const { generateUUID } = require('../core/id');
const { ValidationError } = require('../core/errors');

/**
 * Generates an array of realistic mock product items.
 *
 * @param {number} [count=10] - Number of product records to generate
 * @param {object} [options={}] - Optional configuration
 * @param {number} [options.minPrice=5] - Minimum price
 * @param {number} [options.maxPrice=1000] - Maximum price
 * @param {string} [options.category] - Optional fixed category
 * @param {'auto-increment'|'uuid'} [options.idType='auto-increment'] - ID format
 * @returns {object[]} Array of product objects
 */
function products(count = 10, options = {}) {
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
    throw new ValidationError(`Record count must be a non-negative integer, received ${count}`);
  }

  if (count === 0) {
    return [];
  }

  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new ValidationError('Options must be a valid object');
  }

  const minPrice = options.minPrice !== undefined ? options.minPrice : 5;
  const maxPrice = options.maxPrice !== undefined ? options.maxPrice : 1000;

  if (typeof minPrice !== 'number' || !Number.isFinite(minPrice) || minPrice < 0) {
    throw new ValidationError(`minPrice must be a non-negative number, received ${minPrice}`);
  }

  if (typeof maxPrice !== 'number' || !Number.isFinite(maxPrice) || maxPrice < 0) {
    throw new ValidationError(`maxPrice must be a non-negative number, received ${maxPrice}`);
  }

  if (minPrice > maxPrice) {
    throw new ValidationError(`minPrice (${minPrice}) cannot be greater than maxPrice (${maxPrice})`);
  }

  const idType = options.idType || 'auto-increment';
  if (idType !== 'auto-increment' && idType !== 'uuid') {
    throw new ValidationError(`Invalid idType "${idType}". Supported types are: 'auto-increment', 'uuid'`);
  }

  const results = new Array(count);

  for (let i = 0; i < count; i++) {
    const category = options.category || faker.commerce.department();
    const cleanCategory = category.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PRD';
    const sku = `${cleanCategory}-${String(i + 1).padStart(5, '0')}`;
    const stock = faker.number.int({ min: 0, max: 250 });
    const price = faker.number.float({ min: minPrice, max: maxPrice, fractionDigits: 2 });
    const rating = faker.number.float({ min: 1.0, max: 5.0, fractionDigits: 1 });

    const record = {
      id: idType === 'uuid' ? generateUUID() : i + 1,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category,
      price,
      sku,
      stock,
      rating,
      isAvailable: stock > 0
    };

    results[i] = record;
  }

  return results;
}

module.exports = {
  products,
  generateProducts: products
};
