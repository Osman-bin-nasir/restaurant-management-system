import assert from 'node:assert/strict';
import test from 'node:test';

import { combineDashboardStats } from '../src/services/dashboardService.js';

test('combines dashboard totals without changing existing card semantics', () => {
  const result = combineDashboardStats({
    orderStats: {
      total: 1166,
      paid: 1163,
      todayOrders: 2,
      totalRevenue: 1_800_000,
    },
    parcelStats: {
      total: 140,
      paid: 140,
      todayOrders: 1,
      totalRevenue: 48_925,
    },
    tableStats: {
      total: 25,
      available: 22,
      occupied: 3,
      reserved: 0,
      totalCapacity: 100,
    },
  });

  assert.deepEqual(result, {
    totalOrders: 1166,
    totalRevenue: 1_848_925,
    paidOrdersCount: 1163,
    todayOrders: 3,
    availableTables: 22,
    occupiedTables: 3,
    reservedTables: 0,
    totalTables: 25,
    totalCapacity: 100,
    occupancyRate: 12,
  });
});

test('returns a complete zero-valued summary when collections are empty', () => {
  assert.deepEqual(combineDashboardStats({}), {
    totalOrders: 0,
    totalRevenue: 0,
    paidOrdersCount: 0,
    todayOrders: 0,
    availableTables: 0,
    occupiedTables: 0,
    reservedTables: 0,
    totalTables: 0,
    totalCapacity: 0,
    occupancyRate: 0,
  });
});
