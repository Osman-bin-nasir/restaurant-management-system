import mongoose from 'mongoose';

import Order from '../models/Order.js';
import ParcelOrder from '../models/ParcelOrder.js';
import Table from '../models/Table.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { combineDashboardStats } from '../services/dashboardService.js';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const branchId = new mongoose.Types.ObjectId(req.user.branchId);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [orderResults, parcelResults, tableResults] = await Promise.all([
    Order.aggregate([
      { $match: { branchId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          todayOrders: { $sum: { $cond: [{ $gte: ['$createdAt', startOfToday] }, 1, 0] } },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'paid'] },
                { $ifNull: ['$payment.amount', '$totalAmount'] },
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]),
    ParcelOrder.aggregate([
      { $match: { branchId } },
      {
        $group: {
          _id: null,
          todayOrders: { $sum: { $cond: [{ $gte: ['$createdAt', startOfToday] }, 1, 0] } },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, '$totalAmount', 0],
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]),
    Table.aggregate([
      { $match: { branchId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
          reserved: { $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] } },
          totalCapacity: { $sum: '$capacity' },
        },
      },
      { $project: { _id: 0 } },
    ]),
  ]);

  const stats = combineDashboardStats({
    orderStats: orderResults[0],
    parcelStats: parcelResults[0],
    tableStats: tableResults[0],
  });

  res.status(200).json({ success: true, stats });
});
