const numberOrZero = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

/**
 * Keeps the existing dashboard card semantics while combining the three
 * collection summaries returned by the database.
 */
export const combineDashboardStats = ({
  orderStats = {},
  parcelStats = {},
  tableStats = {},
} = {}) => {
  const totalTables = numberOrZero(tableStats.total);
  const occupiedTables = numberOrZero(tableStats.occupied);

  return {
    totalOrders: numberOrZero(orderStats.total),
    totalRevenue:
      numberOrZero(orderStats.totalRevenue) + numberOrZero(parcelStats.totalRevenue),
    paidOrdersCount: numberOrZero(orderStats.paid),
    todayOrders:
      numberOrZero(orderStats.todayOrders) + numberOrZero(parcelStats.todayOrders),
    availableTables: numberOrZero(tableStats.available),
    occupiedTables,
    reservedTables: numberOrZero(tableStats.reserved),
    totalTables,
    totalCapacity: numberOrZero(tableStats.totalCapacity),
    occupancyRate: totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0,
  };
};
