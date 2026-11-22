/**
 * examples/01-predefined-generators.js
 *
 * Demonstrates MockMate's out-of-the-box domain generators:
 * - Users
 * - Products
 * - Orders
 * - Blog Posts
 */

const mockmate = require('../index');

console.log('=== MockMate: Predefined Domain Generators ===\n');

// 1. Generate 3 realistic user profiles with age constraints
const userList = mockmate.users(3, { minAge: 22, maxAge: 40 });
console.log('--- 1. Users (Sample 1 of 3) ---');
console.log({
  id: userList[0].id,
  fullName: userList[0].fullName,
  username: userList[0].username,
  email: userList[0].email,
  age: userList[0].age,
  company: userList[0].company,
  city: userList[0].city
});

// 2. Generate 3 product records with custom price boundaries
const productList = mockmate.products(3, { minPrice: 25, maxPrice: 150 });
console.log('\n--- 2. Products (Sample 1 of 3) ---');
console.log({
  id: productList[0].id,
  name: productList[0].name,
  sku: productList[0].sku,
  category: productList[0].category,
  price: `$${productList[0].price}`,
  stock: productList[0].stock,
  rating: productList[0].rating,
  isAvailable: productList[0].isAvailable
});

// 3. Generate 3 customer orders
const orderList = mockmate.orders(3, { status: 'shipped' });
console.log('\n--- 3. Orders (Sample 1 of 3) ---');
console.log({
  id: orderList[0].id,
  orderNumber: orderList[0].orderNumber,
  status: orderList[0].status,
  itemsCount: orderList[0].products.length,
  totalAmount: `$${orderList[0].totalAmount}`,
  orderDate: orderList[0].orderDate.toISOString().split('T')[0]
});

// 4. Generate 3 blog post articles
const postList = mockmate.posts(3, { status: 'published', category: 'Technology' });
console.log('\n--- 4. Blog Posts (Sample 1 of 3) ---');
console.log({
  id: postList[0].id,
  title: postList[0].title,
  slug: postList[0].slug,
  category: postList[0].category,
  tags: postList[0].tags,
  likes: postList[0].likes,
  status: postList[0].status,
  publishedAt: postList[0].publishedAt ? postList[0].publishedAt.toISOString().split('T')[0] : 'N/A'
});

console.log('\nPredefined generators demonstrated successfully!');
