import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOrderFilter } from '../src/services/orderService.js';

test('waiters can only filter the order list to their own user id', () => {
  const filter = buildOrderFilter({
    query: { waiterId: 'another-user' },
    user: { id: 'current-waiter', role: 'waiter', branchId: 'branch-1' },
  });

  assert.deepEqual(filter, {
    branchId: 'branch-1',
    waiterId: 'current-waiter',
  });
});

test('authorized non-waiter views can request a specific waiter', () => {
  const filter = buildOrderFilter({
    query: { waiterId: 'waiter-2', status: 'ready', type: 'dine-in' },
    user: { id: 'manager-1', role: 'manager', branchId: 'branch-1' },
  });

  assert.deepEqual(filter, {
    branchId: 'branch-1',
    waiterId: 'waiter-2',
    status: 'ready',
    type: 'dine-in',
  });
});
