import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { toWaiterDashboardStats } from '../src/utils/waiterDashboard.js';

test('waiter dashboard cards use full filtered API summary counts', () => {
  assert.deepEqual(toWaiterDashboardStats({
    total: 123,
    placed: 2,
    inKitchen: 3,
    ready: 4,
    paidToday: 5,
  }), {
    myOrders: 123,
    activeOrders: 9,
    completedToday: 5,
  });
});

test('waiter dashboard requests only five recent orders and exposes an error state', async () => {
  const source = await readFile(
    new URL('../src/pages/Waiter/WaiterDashboard.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /waiterId:\s*user\.id,\s*limit:\s*5/);
  assert.match(source, /role="alert"/);
  assert.match(source, /!error\s*&&\s*recentOrders\.length\s*===\s*0/);
});
