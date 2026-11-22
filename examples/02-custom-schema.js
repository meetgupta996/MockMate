/**
 * examples/02-custom-schema.js
 *
 * Demonstrates defining custom schemas with MockMate:
 * - Custom field configurations (types, number ranges, pick choices, dates)
 * - Custom computed generator functions (e.g. employee code)
 * - Bulk generation of 100 employee records
 */

const mockmate = require('../index');

console.log('=== MockMate: Custom Schema Definition ===\n');

// 1. Define a custom Employee schema
const employeeSchema = mockmate.defineSchema({
  // Auto-increment integer ID
  id: { type: 'auto-increment', startValue: 101 },

  // Custom computed field using the record index
  employeeCode: {
    type: 'custom',
    generate: (index) => `EMP-${String(index + 1).padStart(4, '0')}`
  },

  // Personal data types
  name: 'name',
  email: 'email',

  // Number with range constraints
  age: {
    type: 'number',
    min: 22,
    max: 60
  },

  // Pick from custom list of values
  department: {
    type: 'pick',
    values: ['Engineering', 'Product', 'Marketing', 'Finance', 'Human Resources']
  },

  // Pick role level
  role: {
    type: 'pick',
    values: ['Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager']
  },

  // Number with decimals constraint
  salary: {
    type: 'number',
    min: 45000,
    max: 135000,
    decimals: 2
  },

  // Basic boolean
  isFullTime: 'boolean',

  // Date with past constraint
  hiredAt: {
    type: 'date',
    past: true
  }
});

// 2. Generate a single record
const singleEmployee = employeeSchema.generateOne();
console.log('--- Single Generated Employee ---');
console.log(singleEmployee);

// 3. Generate 100 employee records in bulk
const employees = employeeSchema.generate(100);
console.log(`\nSuccessfully generated ${employees.length} employee records in bulk.`);
console.log('First employee:', employees[0].employeeCode, employees[0].name, `($${employees[0].salary})`);
console.log('Last employee: ', employees[99].employeeCode, employees[99].name, `($${employees[99].salary})`);
