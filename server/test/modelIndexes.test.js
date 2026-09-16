import assert from 'node:assert/strict';
import test from 'node:test';

import Expense from '../src/models/Expense.js';
import Order from '../src/models/Order.js';
import ParcelOrder from '../src/models/ParcelOrder.js';
import Table from '../src/models/Table.js';

const hasIndex = (model, expected) => {
  const expectedEntries = Object.entries(expected);

  return model.schema.indexes().some(([fields]) => {
    const actualEntries = Object.entries(fields);
    return actualEntries.length === expectedEntries.length &&
      actualEntries.every(([field, direction], index) =>
        field === expectedEntries[index][0] && direction === expectedEntries[index][1],
      );
  });
};

test('order listings and kitchen queues have compound indexes', () => {
  assert.equal(hasIndex(Order, { branchId: 1, status: 1, createdAt: -1 }), true);
  assert.equal(hasIndex(Order, { branchId: 1, 'items.status': 1, createdAt: 1 }), true);
});

test('parcel listings and kitchen queues have compound indexes', () => {
  assert.equal(hasIndex(ParcelOrder, { branchId: 1, orderStatus: 1, createdAt: -1 }), true);
  assert.equal(hasIndex(ParcelOrder, { branchId: 1, 'items.status': 1, createdAt: 1 }), true);
});

test('table and expense screens have indexes matching their filters and sorts', () => {
  assert.equal(hasIndex(Table, { branchId: 1, status: 1, tableNumber: 1 }), true);
  assert.equal(hasIndex(Expense, { branchId: 1, date: -1 }), true);
});
