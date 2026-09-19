const count = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export const toWaiterDashboardStats = (stats = {}) => ({
  myOrders: count(stats.total),
  activeOrders: count(stats.placed) + count(stats.inKitchen) + count(stats.ready),
  completedToday: count(stats.paidToday),
});
