/** Builds the shared order-list filter while enforcing waiter ownership. */
export const buildOrderFilter = ({ query = {}, user = {} } = {}) => {
  const filter = { branchId: query.branchId || user.branchId };

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;

  const waiterId = user.role === 'waiter' ? user.id : query.waiterId;
  if (waiterId) filter.waiterId = waiterId;

  if (query.searchTerm) {
    const searchRegex = new RegExp(query.searchTerm, 'i');
    filter.$or = [
      { orderNumber: searchRegex },
      { customerName: searchRegex },
    ];
  }

  return filter;
};
