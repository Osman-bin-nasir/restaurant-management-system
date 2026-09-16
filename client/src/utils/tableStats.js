export const withOccupancyRate = (stats = {}) => {
  const total = Number(stats.total) || 0;
  const occupied = Number(stats.occupied) || 0;

  return {
    ...stats,
    occupancyRate: total > 0 ? ((occupied / total) * 100).toFixed(2) : '0.00',
  };
};
