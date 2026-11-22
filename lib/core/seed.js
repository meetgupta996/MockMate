/**
 * lib/core/seed.js
 * Reproducible Random Generation Module
 *
 * Ensures deterministic mock data generation across the entire MockMate library.
 * Wraps @faker-js/faker and provides a single shared Faker instance.
 */

const { faker } = require('@faker-js/faker');
const { ValidationError } = require('./errors');

// Tracks the most recent seed set by the user (null if unseeded / default)
let currentSeed = null;

/**
 * Sets the seed for random data generation.
 * When a seed is set, repeated runs of MockMate will produce the exact same sequence of mock data.
 *
 * @param {number} seed - An integer seed value (e.g., 42, 12345)
 * @returns {number} The active seed
 */
function setSeed(seed) {
  if (typeof seed !== 'number' || !Number.isInteger(seed)) {
    throw new ValidationError(`Seed must be an integer, received ${typeof seed === 'number' ? seed : typeof seed}`);
  }

  currentSeed = seed;
  faker.seed(seed);
  return currentSeed;
}

/**
 * Returns the currently active seed, or null if no seed has been explicitly set.
 *
 * @returns {number|null}
 */
function getSeed() {
  return currentSeed;
}

module.exports = {
  setSeed,
  getSeed,
  faker // Export the shared single Faker instance for use across all MockMate modules
};
