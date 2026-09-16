import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOrderFilter } from '../src/services/orderService.js';

test('waiters can only filter the order list to their own user id', () => {
  const filter = buildOrderFilter({
    query: {
      waiterId: '000000000000000000000002',
      branchId: 'another-branch',
    },
    user: {
      id: '000000000000000000000001',
      role: 'waiter',
      branchId: 'branch-1',
    },
  });

  assert.deepEqual(filter, {
    branchId: 'branch-1',
    waiterId: '000000000000000000000001',
  });
});

test('authorized non-waiter views can request a specific waiter', () => {
  const filter = buildOrderFilter({
    query: { waiterId: '000000000000000000000002', status: 'ready', type: 'dine-in' },
    user: { id: 'manager-1', role: 'manager', branchId: 'branch-1' },
  });

  assert.deepEqual(filter, {
    branchId: 'branch-1',
    waiterId: '000000000000000000000002',
    status: 'ready',
    type: 'dine-in',
  });
});

test('invalid waiter ids are rejected as bad requests', () => {
  assert.throws(
    () => buildOrderFilter({
      query: { waiterId: 'waiter-2' },
      user: { id: 'manager-1', role: 'manager', branchId: 'branch-1' },
    }),
    (error) => error.statusCode === 400 && error.message === 'Invalid waiter ID',
  );
});
