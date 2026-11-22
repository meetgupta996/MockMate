const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const {
  exportToJSON,
  toJSONString,
  exportToCSV,
  toCSVString,
  exportToSQL,
  toSQLString,
  seedDatabase,
  ValidationError
} = require('../index');

const TEST_TMP_DIR = path.resolve(__dirname, '../tmp/test_exports');

describe('Exporters & Database Seeding (Phase 6)', () => {
  before(async () => {
    await fs.promises.mkdir(TEST_TMP_DIR, { recursive: true });
  });

  after(async () => {
    try {
      await fs.promises.rm(TEST_TMP_DIR, { recursive: true, force: true });
    } catch (_) {
      // Ignore cleanup error if already removed
    }
  });

  const sampleUsers = [
    { id: 1, name: 'Alice Smith', email: 'alice@example.com', active: true, balance: 150.5 },
    { id: 2, name: 'Bob "The Builder" Jones', email: 'bob,jr@example.com', active: false, balance: 0.0 }
  ];

  // 1. JSON export
  it('1. should export data to a valid JSON file and create directories', async () => {
    const filePath = path.join(TEST_TMP_DIR, 'sub/folder/users.json');
    const resultPath = await exportToJSON(sampleUsers, filePath);

    assert.strictEqual(resultPath, filePath);
    assert.ok(fs.existsSync(filePath));

    const content = await fs.promises.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);
    assert.deepStrictEqual(parsed, sampleUsers);
  });

  // 2. CSV export
  it('2. should export array of objects to a valid CSV file', async () => {
    const filePath = path.join(TEST_TMP_DIR, 'csv/users.csv');
    await exportToCSV(sampleUsers, filePath);

    assert.ok(fs.existsSync(filePath));
    const content = await fs.promises.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n');

    assert.strictEqual(lines.length, 3); // Header + 2 rows
    assert.strictEqual(lines[0], 'id,name,email,active,balance');
  });

  // 3. SQL export
  it('3. should export dataset to a valid SQL file', async () => {
    const filePath = path.join(TEST_TMP_DIR, 'sql/seed.sql');
    await exportToSQL({ users: sampleUsers }, filePath, { dialect: 'postgres' });

    assert.ok(fs.existsSync(filePath));
    const content = await fs.promises.readFile(filePath, 'utf8');
    assert.ok(content.includes('INSERT INTO "users" ("id", "name", "email", "active", "balance") VALUES'));
  });

  // 4. PostgreSQL dialect
  it('4. should format identifiers and booleans correctly for PostgreSQL dialect', () => {
    const sql = toSQLString({ users: sampleUsers }, { dialect: 'postgres' });
    assert.ok(sql.includes('"users"'));
    assert.ok(sql.includes('"name"'));
    assert.ok(sql.includes('TRUE'));
    assert.ok(sql.includes('FALSE'));
  });

  // 5. MySQL dialect
  it('5. should quote identifiers with backticks and escape backslashes for MySQL dialect', () => {
    const dataset = {
      notes: [{ id: 1, text: 'Path is C:\\Users\\User', flag: true }]
    };
    const sql = toSQLString(dataset, { dialect: 'mysql' });
    assert.ok(sql.includes('`notes`'));
    assert.ok(sql.includes('`text`'));
    assert.ok(sql.includes('C:\\\\Users\\\\User'));
    assert.ok(sql.includes('TRUE'));
  });

  // 6. SQLite dialect
  it('6. should use double quotes and 1/0 numeric booleans for SQLite dialect', () => {
    const sql = toSQLString({ users: sampleUsers }, { dialect: 'sqlite' });
    assert.ok(sql.includes('"users"'));
    assert.ok(sql.includes(', 1,')); // true -> 1
    assert.ok(sql.includes(', 0,')); // false -> 0
  });

  // 7. Multi-table exports
  it('7. should generate INSERT statements for multiple tables in one SQL script', () => {
    const multi = {
      users: [{ id: 1, name: 'Alice' }],
      orders: [{ id: 101, userId: 1, total: 99.99 }]
    };
    const sql = toSQLString(multi, { dialect: 'postgres' });
    assert.ok(sql.includes('INSERT INTO "users"'));
    assert.ok(sql.includes('INSERT INTO "orders"'));
  });

  // 8. Correct CSV headers
  it('8. should generate accurate CSV headers across irregular rows', () => {
    const irregular = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta', age: 30 }
    ];
    const csv = toCSVString(irregular);
    const firstLine = csv.split('\n')[0];
    assert.strictEqual(firstLine, 'id,name,age');
  });

  // 9. CSV escaping of commas and quotes
  it('9. should escape commas, quotes, and newlines per RFC4180 in CSV output', () => {
    const trickyData = [
      {
        id: 1,
        quote: 'He said "Hello"',
        comma: 'A, B, C',
        multiline: 'Line 1\nLine 2'
      }
    ];
    const csv = toCSVString(trickyData);
    const row = csv.split('\n')[1];

    assert.ok(csv.includes('"He said ""Hello"""'));
    assert.ok(csv.includes('"A, B, C"'));
    assert.ok(csv.includes('"Line 1\nLine 2"'));
  });

  // 10. Null and undefined handling
  it('10. should handle null and undefined safely in CSV and SQL', () => {
    const dataWithNulls = [
      { id: 1, note: null, extra: undefined }
    ];

    const csv = toCSVString(dataWithNulls);
    assert.strictEqual(csv, 'id,note,extra\n1,,');

    const sql = toSQLString({ test: dataWithNulls }, { dialect: 'postgres' });
    assert.ok(sql.includes('(1, NULL, NULL)'));
  });

  // 11. Nested objects and arrays
  it('11. should serialize nested objects and arrays appropriately in CSV and SQL', () => {
    const nestedData = [
      { id: 1, tags: ['js', 'node'], meta: { score: 95 } }
    ];

    const csv = toCSVString(nestedData);
    assert.ok(csv.includes('"[\\"js\\",\\"node\\"]"'.replace(/\\"/g, '""')));
    assert.ok(csv.includes('"{""score"":95}"'));

    const sql = toSQLString({ items: nestedData }, { dialect: 'postgres' });
    assert.ok(sql.includes("'[\"js\",\"node\"]'"));
    assert.ok(sql.includes("'{\"score\":95}'"));
  });

  // 12. SQL string escaping
  it('12. should escape single quotes in SQL by doubling them', () => {
    const data = [{ id: 1, author: "O'Reilly & Sons" }];
    const sql = toSQLString({ books: data }, { dialect: 'postgres' });
    assert.ok(sql.includes("'O''Reilly & Sons'"));
  });

  // 13. SQL identifier quoting
  it('13. should safely quote SQL identifiers with internal characters', () => {
    const data = [{ id: 1, 'order details': 'info' }];
    const sql = toSQLString({ 'user orders': data }, { dialect: 'postgres' });
    assert.ok(sql.includes('"user orders"'));
    assert.ok(sql.includes('"order details"'));
  });

  // 14. Parent-child table ordering
  it('14. should preserve table ordering in SQL export (parents inserted first)', () => {
    const dataset = {
      users: [{ id: 1 }],
      orders: [{ id: 101, userId: 1 }],
      items: [{ id: 1001, orderId: 101 }]
    };
    const sql = toSQLString(dataset);
    const usersPos = sql.indexOf('INSERT INTO "users"');
    const ordersPos = sql.indexOf('INSERT INTO "orders"');
    const itemsPos = sql.indexOf('INSERT INTO "items"');

    assert.ok(usersPos < ordersPos);
    assert.ok(ordersPos < itemsPos);
  });

  // 15. Automatic directory creation
  it('15. should create deep missing directories automatically', async () => {
    const deepPath = path.join(TEST_TMP_DIR, 'level1/level2/level3/data.json');
    await exportToJSON({ test: true }, deepPath);
    assert.ok(fs.existsSync(deepPath));
  });

  // 16. Empty dataset handling
  it('16. should handle empty arrays and empty tables gracefully', async () => {
    const emptyCSV = toCSVString([]);
    assert.strictEqual(emptyCSV, '');

    const emptySQL = toSQLString({ empty_table: [] });
    assert.ok(emptySQL.includes('-- (No records to insert)'));

    const emptyFile = path.join(TEST_TMP_DIR, 'empty.csv');
    await exportToCSV([], emptyFile);
    assert.ok(fs.existsSync(emptyFile));
  });

  // 17. Invalid formats and dialects
  it('17. should reject unsupported dialects and seed formats', async () => {
    assert.throws(
      () => toSQLString({ users: [] }, { dialect: 'oracle' }),
      (err) => err instanceof ValidationError && /Unsupported SQL dialect/.test(err.message)
    );

    await assert.rejects(
      async () => {
        await seedDatabase({ users: [] }, { format: 'parquet', output: TEST_TMP_DIR });
      },
      (err) => err instanceof ValidationError && /Unsupported seed format/.test(err.message)
    );
  });

  // 18. Invalid file paths
  it('18. should reject invalid file paths', async () => {
    await assert.rejects(
      async () => {
        await exportToJSON({ a: 1 }, '');
      },
      (err) => err instanceof ValidationError && /non-empty string/.test(err.message)
    );

    await assert.rejects(
      async () => {
        await exportToCSV([{ a: 1 }], '   ');
      },
      (err) => err instanceof ValidationError && /non-empty string/.test(err.message)
    );
  });

  // 19. Database seeding in CSV mode
  it('19. should seed database in CSV mode by generating one CSV per table', async () => {
    const dataset = {
      users: sampleUsers,
      products: [
        { id: 10, title: 'Widget', price: 9.99 },
        { id: 20, title: 'Gadget', price: 19.99 }
      ]
    };

    const outDir = path.join(TEST_TMP_DIR, 'seed_csv');
    const summary = await seedDatabase(dataset, { format: 'csv', output: outDir });

    assert.strictEqual(summary.format, 'csv');
    assert.strictEqual(summary.totalRecords, 4);
    assert.strictEqual(summary.files.length, 2);

    assert.ok(fs.existsSync(path.join(outDir, 'users.csv')));
    assert.ok(fs.existsSync(path.join(outDir, 'products.csv')));
  });

  // 20. Database seeding in JSON mode
  it('20. should seed database in JSON mode by generating one JSON file per table', async () => {
    const dataset = {
      users: sampleUsers,
      posts: [
        { id: 1, title: 'Hello World', views: 500 }
      ]
    };

    const outDir = path.join(TEST_TMP_DIR, 'seed_json');
    const summary = await seedDatabase(dataset, { format: 'json', output: outDir });

    assert.strictEqual(summary.format, 'json');
    assert.strictEqual(summary.totalRecords, 3);
    assert.strictEqual(summary.files.length, 2);

    assert.ok(fs.existsSync(path.join(outDir, 'users.json')));
    assert.ok(fs.existsSync(path.join(outDir, 'posts.json')));

    const usersContent = JSON.parse(await fs.promises.readFile(path.join(outDir, 'users.json'), 'utf8'));
    assert.deepStrictEqual(usersContent, sampleUsers);
  });
});
