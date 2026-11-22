const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const mockmate = require('../index');

const E2E_DIR = path.resolve(__dirname, '../tmp/e2e');

describe('End-to-End Workflows (Phase 7)', () => {
  // Workflow A: Custom Dataset
  it('Workflow A: Custom Dataset (define schema, generate 100 records, verify constraints)', () => {
    const employeeSchema = mockmate.defineSchema({
      id: { type: 'auto-increment', startValue: 1 },
      empCode: { type: 'custom', generate: (idx) => `EMP-${idx + 1}` },
      name: 'name',
      email: 'email',
      age: { type: 'number', min: 21, max: 65 },
      department: { type: 'pick', values: ['Engineering', 'Marketing', 'Sales'] },
      salary: { type: 'number', min: 30000, max: 120000, decimals: 2 }
    });

    const employees = employeeSchema.generate(100);
    assert.strictEqual(employees.length, 100);

    for (const emp of employees) {
      assert.strictEqual(typeof emp.id, 'number');
      assert.ok(emp.empCode.startsWith('EMP-'));
      assert.ok(emp.age >= 21 && emp.age <= 65);
      assert.ok(['Engineering', 'Marketing', 'Sales'].includes(emp.department));
      assert.ok(emp.salary >= 30000 && emp.salary <= 120000);
    }
  });

  // Workflow B: Relational Dataset
  it('Workflow B: Relational Dataset (generate users and orders, verify referential integrity)', () => {
    const uSchema = mockmate.defineSchema({
      id: { type: 'auto-increment', startValue: 1 },
      name: 'name',
      email: 'email'
    });

    const oSchema = mockmate.defineSchema({
      id: { type: 'auto-increment', startValue: 500 },
      userId: 'number',
      amount: { type: 'number', min: 10, max: 500 }
    });

    const dataset = mockmate.generateRelational({
      users: { count: 10, schema: uSchema, primaryKey: 'id' },
      orders: {
        count: 40,
        schema: oSchema,
        primaryKey: 'id',
        foreignKeys: { userId: 'users.id' }
      }
    });

    assert.strictEqual(dataset.users.length, 10);
    assert.strictEqual(dataset.orders.length, 40);

    const userIds = new Set(dataset.users.map((u) => u.id));
    for (const ord of dataset.orders) {
      assert.ok(userIds.has(ord.userId), `Foreign key ${ord.userId} must exist in users`);
    }
  });

  // Workflow C: Database Seeding
  it('Workflow C: Database Seeding (CSV, JSON, and SQL multi-table exports)', async () => {
    await fs.promises.mkdir(E2E_DIR, { recursive: true });

    const dataset = {
      users: mockmate.users(5),
      products: mockmate.products(5),
      orders: mockmate.orders(5)
    };

    const csvSummary = await mockmate.seedDatabase(dataset, {
      format: 'csv',
      output: path.join(E2E_DIR, 'csv')
    });
    assert.strictEqual(csvSummary.files.length, 3);
    assert.ok(fs.existsSync(path.join(E2E_DIR, 'csv/users.csv')));

    const jsonSummary = await mockmate.seedDatabase(dataset, {
      format: 'json',
      output: path.join(E2E_DIR, 'json')
    });
    assert.strictEqual(jsonSummary.files.length, 3);
    assert.ok(fs.existsSync(path.join(E2E_DIR, 'json/products.json')));

    const sqlFile = path.join(E2E_DIR, 'seed.sql');
    await mockmate.exportToSQL(dataset, sqlFile, { dialect: 'postgres' });
    assert.ok(fs.existsSync(sqlFile));

    const sqlText = await fs.promises.readFile(sqlFile, 'utf8');
    assert.ok(sqlText.includes('INSERT INTO "users"'));
    assert.ok(sqlText.includes('INSERT INTO "products"'));
    assert.ok(sqlText.includes('INSERT INTO "orders"'));

    await fs.promises.rm(E2E_DIR, { recursive: true, force: true });
  });

  // Workflow D: Reproducibility
  it('Workflow D: Reproducibility (deterministic output when using setSeed)', () => {
    const schema = mockmate.defineSchema({
      username: 'string',
      score: { type: 'number', min: 10, max: 99 }
    });

    mockmate.setSeed(7777);
    const runA = schema.generate(10);

    mockmate.setSeed(7777);
    const runB = schema.generate(10);

    assert.deepStrictEqual(runA, runB);
  });
});
