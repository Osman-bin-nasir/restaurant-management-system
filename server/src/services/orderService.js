import mongoose from 'mongoose';

import CustomError from '../utils/customError.js';

/** Builds the shared order-list filter while enforcing waiter ownership. */
export const buildOrderFilter = ({ query = {}, user = {} } = {}) => {
  const branchId = user.role === 'waiter'
    ? user.branchId
    : query.branchId || user.branchId;
  const filter = { branchId };

  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;

  const waiterId = user.role === 'waiter' ? user.id : query.waiterId;
  if (waiterId) {
    if (!mongoose.isValidObjectId(waiterId)) {
      throw new CustomError('Invalid waiter ID', 400);
    }
    filter.waiterId = waiterId;
  }

  if (query.searchTerm) {
    const searchRegex = new RegExp(query.searchTerm, 'i');
    filter.$or = [
      { orderNumber: searchRegex },
      { customerName: searchRegex },
    ];
  }

  return filter;
};
