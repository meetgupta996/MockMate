/**
 * lib/generators/posts.js
 * Predefined Blog Post Generator for MockMate
 *
 * Generates realistic blog articles with titles, unique slugs, categories,
 * tags, content paragraphs, and publication dates.
 */

const { faker } = require('../core/seed');
const { generateUUID } = require('../core/id');
const { ValidationError } = require('../core/errors');

const POST_CATEGORIES = ['Technology', 'Design', 'Business', 'Education', 'Lifestyle', 'Programming'];
const POST_TAGS_POOL = ['javascript', 'nodejs', 'webdev', 'database', 'tutorial', 'career', 'ai', 'cloud'];
const POST_STATUSES = ['draft', 'published'];

/**
 * Generates an array of realistic blog post records.
 *
 * @param {number} [count=10] - Number of blog post records to generate
 * @param {object} [options={}] - Optional configuration
 * @param {'draft'|'published'} [options.status] - Optional fixed status
 * @param {string} [options.category] - Optional fixed category
 * @param {'auto-increment'|'uuid'} [options.idType='auto-increment'] - ID format
 * @returns {object[]} Array of blog post objects
 */
function posts(count = 10, options = {}) {
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
    throw new ValidationError(`Record count must be a non-negative integer, received ${count}`);
  }

  if (count === 0) {
    return [];
  }

  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new ValidationError('Options must be a valid object');
  }

  if (options.status && !POST_STATUSES.includes(options.status)) {
    throw new ValidationError(
      `Invalid post status "${options.status}". Supported statuses are: ${POST_STATUSES.join(', ')}`
    );
  }

  const idType = options.idType || 'auto-increment';
  if (idType !== 'auto-increment' && idType !== 'uuid') {
    throw new ValidationError(`Invalid idType "${idType}". Supported types are: 'auto-increment', 'uuid'`);
  }

  const results = new Array(count);

  for (let i = 0; i < count; i++) {
    const rawTitle = faker.lorem.sentence({ min: 3, max: 7 });
    // Capitalize first letter and remove trailing dot
    const title = rawTitle.replace(/\.$/, '');

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 35);
    const slug = `${baseSlug}-${i + 1}`;

    const category = options.category || faker.helpers.arrayElement(POST_CATEGORIES);
    const tagsCount = faker.number.int({ min: 2, max: 4 });
    const tags = faker.helpers.arrayElements(POST_TAGS_POOL, tagsCount);

    const status = options.status || faker.helpers.arrayElement(POST_STATUSES);
    const refDate = options.refDate || '2025-01-01T00:00:00.000Z';
    const publishedAt = status === 'published' ? faker.date.recent({ days: 90, refDate }) : null;

    const record = {
      id: idType === 'uuid' ? generateUUID() : i + 1,
      title,
      slug,
      content: faker.lorem.paragraphs(2),
      authorId: faker.number.int({ min: 1, max: 20 }), // Standalone placeholder; relational linking in Phase 5
      category,
      tags,
      likes: faker.number.int({ min: 0, max: 1500 }),
      status,
      publishedAt
    };

    results[i] = record;
  }

  return results;
}

module.exports = {
  posts,
  generatePosts: posts,
  POST_CATEGORIES,
  POST_STATUSES
};
