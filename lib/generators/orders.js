/**
 * lib/generators/orders.js
 * Predefined Order Generator for MockMate
 *
 * Generates realistic e-commerce order records with unique order numbers,
 * sensible order statuses, items count, and order amounts.
 */

const { faker } = require('../core/seed');
const { generateUUID } = require('../core/id');
const { ValidationError } = require('../core/errors');

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

/**
 * Generates an array of realistic mock customer orders.
 *
 * @param {number} [count=10] - Number of orders to generate
 * @param {object} [options={}] - Optional configuration
 * @param {string} [options.status] - Optional fixed order status
 * @param {'auto-increment'|'uuid'} [options.idType='auto-increment'] - ID format
 * @returns {object[]} Array of order objects
 */
function orders(count = 10, options = {}) {
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
    throw new ValidationError(`Record count must be a non-negative integer, received ${count}`);
  }

  if (count === 0) {
    return [];
  }

  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new ValidationError('Options must be a valid object');
  }

  if (options.status && !ORDER_STATUSES.includes(options.status)) {
    throw new ValidationError(
      `Invalid order status "${options.status}". Supported statuses are: ${ORDER_STATUSES.join(', ')}`
    );
  }

  const idType = options.idType || 'auto-increment';
  if (idType !== 'auto-increment' && idType !== 'uuid') {
    throw new ValidationError(`Invalid idType "${idType}". Supported types are: 'auto-increment', 'uuid'`);
  }

  const results = new Array(count);

  for (let i = 0; i < count; i++) {
    const orderNumber = `ORD-${String(i + 1).padStart(6, '0')}`;
    const status = options.status || faker.helpers.arrayElement(ORDER_STATUSES);
    const quantity = faker.number.int({ min: 1, max: 10 });
    const productCount = faker.number.int({ min: 1, max: 4 });

    const orderProducts = [];
    let calculatedTotal = 0;

    for (let p = 0; p < productCount; p++) {
      const itemQty = faker.number.int({ min: 1, max: 3 });
      const itemPrice = faker.number.float({ min: 10, max: 250, fractionDigits: 2 });
      calculatedTotal += itemQty * itemPrice;

      orderProducts.push({
        name: faker.commerce.productName(),
        quantity: itemQty,
        unitPrice: itemPrice
      });
    }

    const totalAmount = Number(calculatedTotal.toFixed(2));
    const refDate = options.refDate || '2025-01-01T00:00:00.000Z';
    const orderDate = faker.date.recent({ days: 60, refDate });

    const record = {
      id: idType === 'uuid' ? generateUUID() : i + 1,
      orderNumber,
      userId: faker.number.int({ min: 1, max: 100 }), // Standalone placeholder; relational linking in Phase 5
      products: orderProducts,
      quantity,
      totalAmount,
      status,
      orderDate
    };

    results[i] = record;
  }

  return results;
}

module.exports = {
  orders,
  generateOrders: orders,
  ORDER_STATUSES
};
