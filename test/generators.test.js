const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  users,
  products,
  orders,
  posts,
  setSeed,
  ValidationError
} = require('../index');

describe('Predefined Domain Generators (lib/generators/)', () => {
  describe('User Generator (users)', () => {
    it('should generate requested number of user records with complete profile fields', () => {
      const userList = users(15);
      assert.strictEqual(userList.length, 15);

      const first = userList[0];
      const requiredFields = [
        'id', 'firstName', 'lastName', 'fullName', 'username',
        'email', 'phone', 'age', 'gender', 'address', 'city', 'country', 'company'
      ];

      for (const field of requiredFields) {
        assert.ok(field in first, `User must contain field: ${field}`);
      }
      assert.strictEqual(first.fullName, `${first.firstName} ${first.lastName}`);
      assert.ok(['male', 'female'].includes(first.gender));
    });

    it('should ensure IDs and emails are unique across generated users', () => {
      const count = 50;
      const userList = users(count);
      const idSet = new Set();
      const emailSet = new Set();

      for (const u of userList) {
        idSet.add(u.id);
        emailSet.add(u.email);
        assert.ok(u.email.includes('@'), `Invalid email format: ${u.email}`);
      }

      assert.strictEqual(idSet.size, count, 'All user IDs must be unique');
      assert.strictEqual(emailSet.size, count, 'All user emails must be unique');
    });

    it('should respect custom age constraints and UUID idType', () => {
      const userList = users(10, { minAge: 25, maxAge: 30, idType: 'uuid' });
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      for (const u of userList) {
        assert.ok(u.age >= 25 && u.age <= 30, `Age ${u.age} must be between 25 and 30`);
        assert.match(u.id, uuidRegex, 'ID should match UUID v4 format');
      }
    });

    it('should reject invalid age constraints or count', () => {
      assert.throws(
        () => users(10, { minAge: 50, maxAge: 20 }),
        (err) => err instanceof ValidationError && /cannot be greater than maxAge/.test(err.message)
      );

      assert.throws(
        () => users(-5),
        (err) => err instanceof ValidationError && /non-negative integer/.test(err.message)
      );
    });
  });

  describe('Product Generator (products)', () => {
    it('should generate requested number of product records with complete fields', () => {
      const productList = products(20);
      assert.strictEqual(productList.length, 20);

      const first = productList[0];
      const requiredFields = [
        'id', 'name', 'description', 'category', 'price',
        'sku', 'stock', 'rating', 'isAvailable'
      ];

      for (const field of requiredFields) {
        assert.ok(field in first, `Product must contain field: ${field}`);
      }
    });

    it('should ensure product IDs and SKUs are unique within dataset', () => {
      const count = 40;
      const productList = products(count);
      const idSet = new Set();
      const skuSet = new Set();

      for (const p of productList) {
        idSet.add(p.id);
        skuSet.add(p.sku);
      }

      assert.strictEqual(idSet.size, count, 'All product IDs must be unique');
      assert.strictEqual(skuSet.size, count, 'All product SKUs must be unique');
    });

    it('should respect custom price bounds, category, and rating constraints', () => {
      const productList = products(15, { minPrice: 50, maxPrice: 150, category: 'Electronics' });

      for (const p of productList) {
        assert.ok(p.price >= 50 && p.price <= 150, `Price ${p.price} must be within [50, 150]`);
        assert.strictEqual(p.category, 'Electronics');
        assert.ok(p.rating >= 1.0 && p.rating <= 5.0, `Rating ${p.rating} must be within [1.0, 5.0]`);
        assert.strictEqual(p.isAvailable, p.stock > 0);
      }
    });

    it('should reject invalid price bounds or count', () => {
      assert.throws(
        () => products(10, { minPrice: 200, maxPrice: 100 }),
        (err) => err instanceof ValidationError && /cannot be greater than maxPrice/.test(err.message)
      );
    });
  });

  describe('Order Generator (orders)', () => {
    it('should generate valid order records with sensible statuses and totals', () => {
      const orderList = orders(25);
      assert.strictEqual(orderList.length, 25);

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      const orderNumbers = new Set();

      for (const ord of orderList) {
        assert.ok(validStatuses.includes(ord.status), `Invalid status: ${ord.status}`);
        assert.ok(ord.quantity >= 1);
        assert.ok(ord.totalAmount > 0);
        assert.ok(ord.orderDate instanceof Date);
        assert.ok(Array.isArray(ord.products));
        assert.ok(ord.products.length >= 1);

        orderNumbers.add(ord.orderNumber);
      }

      assert.strictEqual(orderNumbers.size, 25, 'Order numbers must be unique');
    });

    it('should support fixed order status and UUID idType', () => {
      const orderList = orders(10, { status: 'delivered', idType: 'uuid' });
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      for (const ord of orderList) {
        assert.strictEqual(ord.status, 'delivered');
        assert.match(ord.id, uuidRegex);
      }
    });

    it('should reject unsupported order status', () => {
      assert.throws(
        () => orders(5, { status: 'invalid_status' }),
        (err) => err instanceof ValidationError && /Invalid order status/.test(err.message)
      );
    });
  });

  describe('Blog Post Generator (posts)', () => {
    it('should generate blog posts with valid titles, unique slugs, tags, and content', () => {
      const postList = posts(20);
      assert.strictEqual(postList.length, 20);

      const slugs = new Set();

      for (const p of postList) {
        assert.strictEqual(typeof p.title, 'string');
        assert.ok(p.title.length > 5);
        assert.strictEqual(typeof p.slug, 'string');
        assert.ok(Array.isArray(p.tags) && p.tags.length >= 2);
        assert.ok(['draft', 'published'].includes(p.status));

        if (p.status === 'published') {
          assert.ok(p.publishedAt instanceof Date);
        } else {
          assert.strictEqual(p.publishedAt, null);
        }

        assert.ok(p.likes >= 0);
        slugs.add(p.slug);
      }

      assert.strictEqual(slugs.size, 20, 'All slugs must be unique');
    });

    it('should support fixed post status and category', () => {
      const postList = posts(5, { status: 'published', category: 'Programming' });

      for (const p of postList) {
        assert.strictEqual(p.status, 'published');
        assert.strictEqual(p.category, 'Programming');
        assert.ok(p.publishedAt instanceof Date);
      }
    });

    it('should reject invalid post status', () => {
      assert.throws(
        () => posts(5, { status: 'archived' }),
        (err) => err instanceof ValidationError && /Invalid post status/.test(err.message)
      );
    });
  });

  describe('General Features Across Predefined Generators', () => {
    it('should return empty arrays when count is 0', () => {
      assert.deepStrictEqual(users(0), []);
      assert.deepStrictEqual(products(0), []);
      assert.deepStrictEqual(orders(0), []);
      assert.deepStrictEqual(posts(0), []);
    });

    it('should produce 100% reproducible data when using setSeed()', () => {
      setSeed(888);
      const usersA = users(5);
      const productsA = products(5);
      const ordersA = orders(5);
      const postsA = posts(5);

      setSeed(888);
      const usersB = users(5);
      const productsB = products(5);
      const ordersB = orders(5);
      const postsB = posts(5);

      assert.deepStrictEqual(usersA, usersB, 'Users must be identical across seeded runs');
      assert.deepStrictEqual(productsA, productsB, 'Products must be identical across seeded runs');
      assert.deepStrictEqual(ordersA, ordersB, 'Orders must be identical across seeded runs');
      assert.deepStrictEqual(postsA, postsB, 'Posts must be identical across seeded runs');
    });
  });
});
