# MockMate

MockMate is a reusable Node.js library for generating realistic mock data, custom datasets, relational data models, and database seed files without needing a live database connection.

---

## Table of Contents

1. [Problem MockMate Solves](#problem-mockmate-solves)
2. [Key Features](#key-features)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Predefined Generators](#predefined-generators)
6. [Custom Schema Engine](#custom-schema-engine)
7. [Supported Field Types](#supported-field-types)
8. [Constraint Validation](#constraint-validation)
9. [Relational Data Generation](#relational-data-generation)
10. [Primary & Foreign Keys Explained](#primary--foreign-keys-explained)
11. [Data Exporters (JSON, CSV, SQL)](#data-exporters-json-csv-sql)
12. [Database Seeding (seedDatabase)](#database-seeding-seeddatabase)
13. [Deterministic Reproducibility with Seeds](#deterministic-reproducibility-with-seeds)
14. [Complete Usage Example](#complete-usage-example)
15. [API Reference](#api-reference)
16. [Project Structure](#project-structure)
17. [Dependencies](#dependencies)
18. [Error Handling](#error-handling)
19. [Running Tests & Examples](#running-tests--examples)
20. [License](#license)

---

## Problem MockMate Solves

When developing applications or designing database schemas, developers and students often need realistic testing datasets. Handcrafting dummy records is tedious, while simple random string generators produce messy, unstructured data.
Furthermore, testing relational databases requires foreign keys in child records that strictly match existing parent records.

MockMate solves this by providing:

- Instant realistic entities (users, products, orders, articles).
- Declarative custom schemas with constraint enforcement.
- Foreign-key consistent relational generation.
- Ready-to-import output files in CSV, JSON, and dialect-specific SQL (`INSERT INTO ...`).

---

## Key Features

- **Zero Database Overhead**: Generates import-ready `.sql`, `.csv`, and `.json` seed files purely in memory.
- **Relational Integrity**: Automatically correlates foreign keys to existing parent primary keys.
- **Topological Dependency Resolution**: Automatically generates parent tables before child tables and detects circular dependencies.
- **Dialect-Aware SQL**: Exports SQL inserts tailored for PostgreSQL, MySQL, and SQLite with correct identifier quoting and string escaping.
- **RFC4180-Compliant CSV**: Escapes commas, quotes, and multiline text.
- **Deterministic Seeding**: `setSeed(number)` ensures identical, repeatable datasets for automated testing.
- **Minimal Dependencies**: Relies exclusively on `@faker-js/faker` and Node.js built-in standard modules.

---

## Installation

```bash
npm install @meetgupta996/mockmate
```

---

## Quick Start

```javascript
const mockmate = require("@meetgupta996/mockmate");

// 1. Set seed for reproducible data
mockmate.setSeed(42);

// 2. Generate 5 users using the built-in generator
const users = mockmate.users(5);
console.log(users[0]);

// 3. Define a custom product schema
const productSchema = mockmate.defineSchema({
  id: { type: "auto-increment", startValue: 100 },
  title: "product",
  price: { type: "number", min: 10, max: 200, decimals: 2 },
  status: { type: "pick", values: ["in-stock", "backorder", "discontinued"] },
});

const products = productSchema.generate(10);
console.log(products[0]);
```

---

## Predefined Generators

MockMate provides four pre-built generators with domain-specific properties:

### 1. `mockmate.users(count, options)`

Generates realistic user profiles with unique IDs and unique emails.

- **Fields**: `id`, `firstName`, `lastName`, `fullName`, `username`, `email`, `phone`, `age`, `gender`, `address`, `city`, `country`, `company`.
- **Options**:
  - `minAge` (default: 18)
  - `maxAge` (default: 65)
  - `idType`: `'auto-increment'` (default) or `'uuid'`

### 2. `mockmate.products(count, options)`

Generates e-commerce catalog items with unique SKUs.

- **Fields**: `id`, `name`, `description`, `category`, `price`, `sku`, `stock`, `rating`, `isAvailable`.
- **Options**:
  - `minPrice` (default: 5)
  - `maxPrice` (default: 1000)
  - `category`: optional fixed string
  - `idType`: `'auto-increment'` (default) or `'uuid'`

### 3. `mockmate.orders(count, options)`

Generates customer orders with calculated totals and line items.

- **Fields**: `id`, `orderNumber`, `userId`, `products`, `quantity`, `totalAmount`, `status`, `orderDate`.
- **Options**:
  - `status`: `'pending'`, `'processing'`, `'shipped'`, `'delivered'`, `'cancelled'`
  - `idType`: `'auto-increment'` (default) or `'uuid'`

### 4. `mockmate.posts(count, options)`

Generates blog articles with unique URL slugs and publication dates.

- **Fields**: `id`, `title`, `slug`, `content`, `authorId`, `category`, `tags`, `likes`, `status`, `publishedAt`.
- **Options**:
  - `status`: `'draft'` or `'published'`
  - `category`: optional string
  - `idType`: `'auto-increment'` (default) or `'uuid'`

---

## Custom Schema Engine

Define custom data models using `mockmate.defineSchema(definition)`:

```javascript
const studentSchema = mockmate.defineSchema({
  rollNumber: { type: "auto-increment", startValue: 1001 },
  name: "name",
  email: "email",
  score: { type: "number", min: 0, max: 100 },
  grade: { type: "pick", values: ["A", "B", "C", "D", "F"] },
  studentIdCard: (index) => `STU-${String(index + 1).padStart(4, "0")}`,
});

// Single record
const student = studentSchema.generateOne();

// Bulk records
const classList = studentSchema.generate(50);
```

---

## Supported Field Types

| Category     | Type Name        | Description                | Example Output                           |
| :----------- | :--------------- | :------------------------- | :--------------------------------------- |
| **Basic**    | `string`         | Random alphanumeric string | `"uEZiyeyM"`                             |
|              | `number`         | Random integer or float    | `42` or `19.99`                          |
|              | `boolean`        | Boolean true or false      | `true`                                   |
|              | `date`           | Date object                | `2025-06-15T08:30:00.000Z`               |
| **Identity** | `uuid`           | RFC4122 v4 UUID string     | `"9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"` |
|              | `auto-increment` | Sequential integer         | `1`, `2`, `3`...                         |
| **Personal** | `name`           | Realistic full name        | `"Jane Doe"`                             |
|              | `email`          | Valid email address        | `"jane.doe@example.com"`                 |
|              | `phone`          | Formatted phone number     | `"(555) 234-5678"`                       |
|              | `address`        | Street address             | `"742 Evergreen Terrace"`                |
|              | `company`        | Business organization      | `"Acme Corporation"`                     |
| **Content**  | `paragraph`      | Text paragraph             | `"Lorem ipsum..."`                       |
|              | `product`        | Commercial product name    | `"Ergonomic Granite Chair"`              |
| **Custom**   | `pick`           | Picks from user array      | Selected element                         |
|              | `custom`         | Custom generator callback  | Computed value `(index) => ...`          |

---

## Constraint Validation

MockMate validates all field configurations before generation:

- **Number constraints**: `min`, `max`, `decimals`.
- **String constraints**: `minLength`, `maxLength`.
- **Date constraints**: `past: true` or `future: true`.
- **Pick constraints**: `values: [...]` (must be non-empty array).
- **Incompatible constraints**: Specifying `min` on a `string` or `minLength` on a `number` immediately throws `ValidationError`.

---

## Relational Data Generation

Generate multiple interconnected tables with `mockmate.generateRelational(definition)`:

```javascript
const userSchema = mockmate.defineSchema({
  id: { type: "auto-increment", startValue: 1 },
  name: "name",
  email: "email",
});

const orderSchema = mockmate.defineSchema({
  id: { type: "auto-increment", startValue: 100 },
  userId: "number",
  amount: { type: "number", min: 10, max: 500, decimals: 2 },
});

const dataset = mockmate.generateRelational({
  users: {
    count: 5,
    schema: userSchema,
    primaryKey: "id",
  },
  orders: {
    count: 20,
    schema: orderSchema,
    primaryKey: "id",
    foreignKeys: {
      userId: "users.id",
    },
  },
});
```

---

## Primary & Foreign Keys Explained

- **Primary Key (PK)**: Uniquely identifies each row in a parent table (`users.id`).
- **Foreign Key (FK)**: A field in a child table that points to an existing primary key (`orders.userId -> users.id`).
- **Referential Integrity**: MockMate guarantees that 100% of generated foreign keys match an actual primary key in the parent dataset. If a child table references an empty parent table, a descriptive `ValidationError` is thrown.
- **Topological Ordering & Circular Dependency**: Parent tables are automatically generated before child tables. If datasets form a loop (`A -> B -> A`), MockMate detects the cycle and halts with an error.

---

## Data Exporters (JSON, CSV, SQL)

### 1. JSON Export

```javascript
await mockmate.exportToJSON(dataset, "./output/data.json");
```

### 2. RFC4180 CSV Export

```javascript
await mockmate.exportToCSV(dataset.users, "./output/users.csv");
```

Handles commas, double quotes, newlines, and nested objects without corrupting columns.

### 3. SQL Seed Script Export

```javascript
await mockmate.exportToSQL(dataset, "./output/seed.sql", {
  dialect: "postgres", // 'postgres' | 'mysql' | 'sqlite'
});
```

- **PostgreSQL**: Standard double quotes `"table"`, single quotes `'value'`, `TRUE`/`FALSE`.
- **MySQL**: Backticks `` `table` ``, escaped backslashes, `TRUE`/`FALSE`.
- **SQLite**: Double quotes `"table"`, `1`/`0` numeric booleans.

---

## Database Seeding (seedDatabase)

Export individual seed files per table for database loaders:

```javascript
const summary = await mockmate.seedDatabase(dataset, {
  format: "csv", // or 'json'
  output: "./seed-data",
});

console.log(summary.files);
// Output:
// [
//   { table: 'users', path: '.../users.csv', count: 5 },
//   { table: 'orders', path: '.../orders.csv', count: 20 }
// ]
```

---

## Deterministic Reproducibility with Seeds

MockMate uses a shared pseudo-random seed controller. Calling `setSeed(number)` produces identical data on consecutive runs:

```javascript
mockmate.setSeed(12345);
const batchA = mockmate.users(5);

mockmate.setSeed(12345);
const batchB = mockmate.users(5);

// batchA and batchB are 100% identical
```

---

## Complete Usage Example

```javascript
const mockmate = require("@meetgupta996/mockmate");

async function main() {
  mockmate.setSeed(100);

  // 1. Schemas
  const authorSchema = mockmate.defineSchema({
    id: { type: "auto-increment", startValue: 1 },
    name: "name",
    email: "email",
  });

  const postSchema = mockmate.defineSchema({
    id: { type: "auto-increment", startValue: 50 },
    authorId: "number",
    title: "paragraph",
    likes: { type: "number", min: 0, max: 500 },
  });

  // 2. Relational generation
  const dataset = mockmate.generateRelational({
    authors: { count: 3, schema: authorSchema, primaryKey: "id" },
    posts: {
      count: 10,
      schema: postSchema,
      primaryKey: "id",
      foreignKeys: { authorId: "authors.id" },
    },
  });

  // 3. Export
  await mockmate.exportToSQL(dataset, "./seeds/blog.sql", {
    dialect: "postgres",
  });
  await mockmate.seedDatabase(dataset, {
    format: "csv",
    output: "./seeds/csv",
  });

  console.log("Finished generating relational seed files!");
}

main();
```

---

## API Reference

### Core Primitives

- `setSeed(seed: number)`: Sets pseudo-random seed.
- `getSeed()`: Returns current seed or `null`.
- `generateUUID()`: Generates an RFC4122 v4 UUID string.
- `nextId(name?, startValue?)`: Generates the next sequential integer.
- `resetId(name?, startValue?)`: Resets an auto-increment counter.
- `createCounter(startValue?)`: Creates an isolated counter instance.

### Schema Engine

- `defineSchema(definition: object)`: Compiles schema; returns `{ generateOne(), generate(count), getDefinition() }`.

### Predefined Generators

- `users(count?, options?)`: Generates realistic user records.
- `products(count?, options?)`: Generates product records.
- `orders(count?, options?)`: Generates order records.
- `posts(count?, options?)`: Generates blog article records.

### Relational Generator

- `generateRelational(datasetDefinition: object)`: Generates multi-table records with valid foreign-key links.

### Exporters & Seeding

- `exportToJSON(data, filePath)`: Asynchronously writes formatted JSON.
- `toJSONString(data, indent?)`: Returns JSON string.
- `exportToCSV(data, filePath)`: Asynchronously writes RFC4180 CSV.
- `toCSVString(data)`: Returns CSV string.
- `exportToSQL(dataset, filePath, options?)`: Asynchronously writes SQL script.
- `toSQLString(dataset, options?)`: Returns SQL INSERT statements.
- `seedDatabase(dataset, options)`: Generates per-table seed files (`format: 'csv' | 'json'`).

### Custom Errors

- `MockMateError`: Base error class extending native `Error`.
- `ValidationError`: Error thrown on invalid inputs, schemas, or constraints.

---

## Project Structure

```
mockmate/
├── package.json
├── README.md
├── index.js
├── lib/
│   ├── core/
│   │   ├── errors.js        # Error classes (MockMateError, ValidationError)
│   │   ├── id.js            # UUID and auto-increment generators
│   │   └── seed.js          # Seed controller & singleton Faker wrapper
│   ├── types/
│   │   ├── registry.js      # Type generators lookup table
│   │   └── validator.js     # Constraint & type validation
│   ├── schema/
│   │   ├── schema.js        # defineSchema and record generator
│   │   └── relational.js    # Relational dataset generator & FK resolver
│   ├── generators/
│   │   ├── users.js         # Predefined user generator
│   │   ├── products.js      # Predefined product generator
│   │   ├── orders.js        # Predefined order generator
│   │   └── posts.js         # Predefined blog post generator
│   ├── exporters/
│   │   ├── json.js          # JSON exporter
│   │   ├── csv.js           # RFC4180 CSV exporter
│   │   └── sql.js           # Dialect-aware SQL exporter
│   └── database/
│       └── seedDatabase.js  # Per-table multi-format database seeder
├── examples/                # Standalone runnable demonstrations
└── test/                    # Automated native unit & integration test suites
```

---

## Dependencies

- **Production Dependency**:
  - `@faker-js/faker`: Provides realistic personal, internet, location, and commerce data.
- **Node.js Core Modules**:
  - `crypto`: High-entropy RFC4122 v4 UUID generation (`crypto.randomUUID()`).
  - `fs` & `path`: Asynchronous file and directory management.
  - `node:test` & `node:assert`: Built-in zero-dependency test runner.

---

## Error Handling

MockMate throws `ValidationError` (subclass of `MockMateError` and JavaScript's `Error`) for actionable feedback on invalid configurations:

- Invalid field types or constraints.
- Negative or non-integer record counts.
- Missing referenced tables or foreign key targets.
- Circular dataset dependencies.
- Empty parent datasets with dependent children.

---

## Running Tests & Examples

Run the complete automated test suite:

```bash
npm test
```

Run all standalone examples:

```bash
npm run examples
```

---

## License

MIT
