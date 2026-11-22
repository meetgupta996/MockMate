/**
 * lib/generators/users.js
 * Predefined User Generator for MockMate
 *
 * Generates realistic user records with unique IDs and unique emails.
 * Supports configurable counts and optional age / ID type constraints.
 */

const { faker } = require('../core/seed');
const { generateUUID } = require('../core/id');
const { ValidationError } = require('../core/errors');

/**
 * Generates an array of realistic mock user profiles.
 *
 * @param {number} [count=10] - Number of user records to generate
 * @param {object} [options={}] - Optional configuration
 * @param {number} [options.minAge=18] - Minimum age
 * @param {number} [options.maxAge=65] - Maximum age
 * @param {'auto-increment'|'uuid'} [options.idType='auto-increment'] - ID format
 * @returns {object[]} Array of user objects
 */
function users(count = 10, options = {}) {
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
    throw new ValidationError(`Record count must be a non-negative integer, received ${count}`);
  }

  if (count === 0) {
    return [];
  }

  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new ValidationError('Options must be a valid object');
  }

  const minAge = options.minAge !== undefined ? options.minAge : 18;
  const maxAge = options.maxAge !== undefined ? options.maxAge : 65;

  if (typeof minAge !== 'number' || !Number.isInteger(minAge) || minAge < 0) {
    throw new ValidationError(`minAge must be a non-negative integer, received ${minAge}`);
  }

  if (typeof maxAge !== 'number' || !Number.isInteger(maxAge) || maxAge < 0) {
    throw new ValidationError(`maxAge must be a non-negative integer, received ${maxAge}`);
  }

  if (minAge > maxAge) {
    throw new ValidationError(`minAge (${minAge}) cannot be greater than maxAge (${maxAge})`);
  }

  const idType = options.idType || 'auto-increment';
  if (idType !== 'auto-increment' && idType !== 'uuid') {
    throw new ValidationError(`Invalid idType "${idType}". Supported types are: 'auto-increment', 'uuid'`);
  }

  const results = new Array(count);
  const seenEmails = new Set();
  const emailDomains = ['example.com', 'mockmate.dev', 'mailhub.org', 'testnet.io'];

  for (let i = 0; i < count; i++) {
    const gender = faker.helpers.arrayElement(['male', 'female']);
    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;

    const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = `${cleanFirst}.${cleanLast}${i + 1}`;

    // Ensure email uniqueness across all records
    const domain = faker.helpers.arrayElement(emailDomains);
    let email = `${cleanFirst}.${cleanLast}@${domain}`;
    if (seenEmails.has(email)) {
      email = `${cleanFirst}.${cleanLast}.${i + 1}@${domain}`;
    }
    seenEmails.add(email);

    const record = {
      id: idType === 'uuid' ? generateUUID() : i + 1,
      firstName,
      lastName,
      fullName,
      username,
      email,
      phone: faker.phone.number(),
      age: faker.number.int({ min: minAge, max: maxAge }),
      gender,
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.location.country(),
      company: faker.company.name()
    };

    results[i] = record;
  }

  return results;
}

module.exports = {
  users,
  generateUsers: users
};
