
import ParcelOrder from "../models/ParcelOrder.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import mongoose from "mongoose";

export const getParcelRevenueSummary = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { startDate, endDate } = req.query;

  let dateFilter = {};
  const branchFilter = { branchId: new mongoose.Types.ObjectId(branchId) };

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter = { createdAt: { $gte: start, $lte: end } };
  }

  const revenueOverTime = await ParcelOrder.aggregate([
    { $match: { ...branchFilter, "payment.status": "paid", ...dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$payment.amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    revenueOverTime,
  });
});
