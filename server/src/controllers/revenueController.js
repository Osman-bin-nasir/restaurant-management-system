import Order from "../models/Order.js";
import Expense from "../models/Expense.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import CustomError from "../utils/customError.js";
import mongoose from "mongoose";

// ====================== GET REVENUE KPIS ======================
export const getRevenueKPIs = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { startDate, endDate } = req.query;

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const filter = {
    branchId: new mongoose.Types.ObjectId(branchId),
    status: "paid",
    createdAt: { $gte: start, $lte: end },
  };

  const kpis = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$payment.amount" },
        totalOrders: { $sum: 1 },
        uniqueCustomers: { $addToSet: "$customer" },
      },
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalOrders: 1,
        averageOrderValue: { $divide: ["$totalRevenue", "$totalOrders"] },
        totalCustomers: { $size: "$uniqueCustomers" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    kpis: kpis[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalCustomers: 0,
    },
  });
});

// ====================== GET REVENUE FORECAST ======================
export const getRevenueForecast = asyncHandler(async (req, res) => {
  const { branchId } = req.user;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 90);

  const filter = {
    branchId: new mongoose.Types.ObjectId(branchId),
    status: "paid",
    createdAt: { $gte: startDate, $lte: endDate },
  };

  const dailyRevenue = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$payment.amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  if (dailyRevenue.length < 2) {
    return res.status(200).json({ success: true, forecast: [] });
  }

  const n = dailyRevenue.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  dailyRevenue.forEach((item, i) => {
    sumX += i;
    sumY += item.revenue;
    sumXY += i * item.revenue;
    sumX2 += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const forecast = [];
  for (let i = 0; i < 30; i++) {
    const futureDate = new Date();
    futureDate.setDate(endDate.getDate() + i);
    const predictedRevenue = slope * (n + i) + intercept;
    forecast.push({
      date: futureDate.toISOString().split('T')[0],
      predictedRevenue: Math.max(0, predictedRevenue),
    });
  }

  res.status(200).json({ success: true, forecast });
});


// ====================== GET DAILY REVENUE ======================
export const getDailyRevenue = asyncHandler(async (req, res) => {
  console.log("getDailyRevenue function called");
  const { branchId } = req.user;
  const { date } = req.query; // Optional: specific date (YYYY-MM-DD)

  // Parse date or use today
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const filter = {
    branchId: new mongoose.Types.ObjectId(branchId),
    status: "paid",
    createdAt: { $gte: targetDate, $lt: nextDay }
  };

  // Aggregate revenue data
  const revenueData = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$payment.amount" },
        totalDiscount: { $sum: "$payment.discount" },
        grossRevenue: { $sum: "$totalAmount" },
        averageOrderValue: { $avg: "$payment.amount" }
      }
    }
  ]);

  // Get payment method breakdown
  const paymentBreakdown = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$payment.method",
        count: { $sum: 1 },
        total: { $sum: "$payment.amount" }
      }
    }
  ]);

  // Get order type breakdown
  const typeBreakdown = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        total: { $sum: "$payment.amount" }
      }
    }
  ]);

  // Get hourly breakdown
  const hourlyBreakdown = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        orders: { $sum: 1 },
        revenue: { $sum: "$payment.amount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get expenses for the day
  const dailyExpenses = await Expense.aggregate([
    {
      $match: {
        branchId: new mongoose.Types.ObjectId(branchId),
        date: { $gte: targetDate, $lt: nextDay }
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: "$amount" }
      }
    }
  ]);

  const revenue = revenueData[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    totalDiscount: 0,
    grossRevenue: 0,
    averageOrderValue: 0
  };

  const expenses = dailyExpenses[0]?.totalExpenses || 0;
  const netProfit = revenue.totalRevenue - expenses;

  res.status(200).json({
    success: true,
    date: targetDate.toISOString().split('T')[0],
    summary: {
      totalOrders: revenue.totalOrders,
      grossRevenue: Math.round(revenue.grossRevenue),
      totalDiscount: Math.round(revenue.totalDiscount || 0),
      totalRevenue: Math.round(revenue.totalRevenue),
      averageOrderValue: Math.round(revenue.averageOrderValue || 0),
      totalExpenses: Math.round(expenses),
      netProfit: Math.round(netProfit)
    },
    breakdown: {
      byPaymentMethod: paymentBreakdown.map(p => ({
        method: p._id || "unknown",
        orders: p.count,
        amount: Math.round(p.total)
      })),
      byOrderType: typeBreakdown.map(t => ({
        type: t._id,
        orders: t.count,
        amount: Math.round(t.total)
      })),
      byHour: hourlyBreakdown.map(h => ({
        hour: h._id,
        orders: h.orders,
        revenue: Math.round(h.revenue)
      }))
    }
  });
});

// ====================== GET MONTHLY REVENUE ======================
export const getMonthlyRevenue = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { month, year } = req.query; // Optional: specific month (1-12) and year

  // Parse month/year or use current
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 1);

  const filter = {
    branchId: new mongoose.Types.ObjectId(branchId),
    status: "paid",
    createdAt: { $gte: startDate, $lt: endDate }
  };

  // Monthly summary
  const monthlySummary = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$payment.amount" },
        totalDiscount: { $sum: "$payment.discount" },
        grossRevenue: { $sum: "$totalAmount" },
        averageOrderValue: { $avg: "$payment.amount" }
      }
    }
  ]);

  // Daily breakdown for the month
  const dailyBreakdown = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dayOfMonth: "$createdAt" },
        orders: { $sum: 1 },
        revenue: { $sum: "$payment.amount" },
        discount: { $sum: "$payment.discount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Top selling items for the month
  const topItems = await Order.aggregate([
    { $match: filter },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItem",
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { 
          $sum: { 
            $multiply: ["$items.quantity", { $ifNull: ["$items.menuItem.price", 0] }] 
          } 
        }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "menuitems",
        localField: "_id",
        foreignField: "_id",
        as: "itemDetails"
      }
    },
    { $unwind: "$itemDetails" },
    {
      $project: {
        name: "$itemDetails.name",
        category: "$itemDetails.category",
        quantity: "$totalQuantity",
        revenue: { $round: ["$totalRevenue", 0] }
      }
    }
  ]);

  // Monthly expenses
  const monthlyExpenses = await Expense.aggregate([
    {
      $match: {
        branchId: new mongoose.Types.ObjectId(branchId),
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: "$amount" }
      }
    }
  ]);

  const summary = monthlySummary[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    totalDiscount: 0,
    grossRevenue: 0,
    averageOrderValue: 0
  };

  const expenses = monthlyExpenses[0]?.totalExpenses || 0;
  const netProfit = summary.totalRevenue - expenses;

  res.status(200).json({
    success: true,
    period: {
      month: targetMonth + 1,
      year: targetYear,
      monthName: startDate.toLocaleString('en-US', { month: 'long' })
    },
    summary: {
      totalOrders: summary.totalOrders,
      grossRevenue: Math.round(summary.grossRevenue),
      totalDiscount: Math.round(summary.totalDiscount || 0),
      totalRevenue: Math.round(summary.totalRevenue),
      averageOrderValue: Math.round(summary.averageOrderValue || 0),
      totalExpenses: Math.round(expenses),
      netProfit: Math.round(netProfit)
    },
    dailyBreakdown: dailyBreakdown.map(d => ({
      day: d._id,
      orders: d.orders,
      revenue: Math.round(d.revenue),
      discount: Math.round(d.discount || 0)
    })),
    topSellingItems: topItems
  });
});

// ====================== GET YEARLY REVENUE ======================
export const getYearlyRevenue = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { year } = req.query; // Optional: specific year

  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear + 1, 0, 1);

  const filter = {
    branchId: new mongoose.Types.ObjectId(branchId),
    status: "paid",
    createdAt: { $gte: startDate, $lt: endDate }
  };

  // Yearly summary
  const yearlySummary = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$payment.amount" },
        totalDiscount: { $sum: "$payment.discount" },
        grossRevenue: { $sum: "$totalAmount" },
        averageOrderValue: { $avg: "$payment.amount" }
      }
    }
  ]);

  // Monthly breakdown for the year
  const monthlyBreakdown = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $month: "$createdAt" },
        orders: { $sum: 1 },
        revenue: { $sum: "$payment.amount" },
        discount: { $sum: "$payment.discount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Quarterly breakdown
  const quarterlyBreakdown = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { 
          $ceil: { $divide: [{ $month: "$createdAt" }, 3] } 
        },
        orders: { $sum: 1 },
        revenue: { $sum: "$payment.amount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Category performance
  const categoryPerformance = await Order.aggregate([
    { $match: filter },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "menuitems",
        localField: "items.menuItem",
        foreignField: "_id",
        as: "menuItem"
      }
    },
    { $unwind: "$menuItem" },
    {
      $group: {
        _id: "$menuItem.category",
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { 
          $sum: { $multiply: ["$items.quantity", "$menuItem.price"] } 
        }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Yearly expenses
  const yearlyExpenses = await Expense.aggregate([
    {
      $match: {
        branchId: new mongoose.Types.ObjectId(branchId),
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: "$amount" }
      }
    }
  ]);

  // Expense breakdown by category
  const expenseBreakdown = await Expense.aggregate([
    {
      $match: {
        branchId: new mongoose.Types.ObjectId(branchId),
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" }
      }
    },
    { $sort: { total: -1 } }
  ]);

  const summary = yearlySummary[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    totalDiscount: 0,
    grossRevenue: 0,
    averageOrderValue: 0
  };

  const expenses = yearlyExpenses[0]?.totalExpenses || 0;
  const netProfit = summary.totalRevenue - expenses;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  res.status(200).json({
    success: true,
    year: targetYear,
    summary: {
      totalOrders: summary.totalOrders,
      grossRevenue: Math.round(summary.grossRevenue),
      totalDiscount: Math.round(summary.totalDiscount || 0),
      totalRevenue: Math.round(summary.totalRevenue),
      averageOrderValue: Math.round(summary.averageOrderValue || 0),
      totalExpenses: Math.round(expenses),
      netProfit: Math.round(netProfit),
      profitMargin: summary.totalRevenue > 0 
        ? ((netProfit / summary.totalRevenue) * 100).toFixed(2) 
        : 0
    },
    monthlyBreakdown: monthlyBreakdown.map(m => ({
      month: m._id,
      monthName: monthNames[m._id - 1],
      orders: m.orders,
      revenue: Math.round(m.revenue),
      discount: Math.round(m.discount || 0)
    })),
    quarterlyBreakdown: quarterlyBreakdown.map(q => ({
      quarter: q._id,
      quarterName: `Q${q._id}`,
      orders: q.orders,
      revenue: Math.round(q.revenue)
    })),
    categoryPerformance: categoryPerformance.map(c => ({
      category: c._id,
      quantity: c.totalQuantity,
      revenue: Math.round(c.totalRevenue)
    })),
    expenseBreakdown: expenseBreakdown.map(e => ({
      category: e._id,
      amount: Math.round(e.total)
    }))
  });
});

// ====================== GET REVENUE COMPARISON ======================
export const getRevenueComparison = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { period = "monthly" } = req.query; // daily, monthly, yearly

  let currentStart, currentEnd, previousStart, previousEnd;
  const now = new Date();

  switch (period) {
    case "daily":
      // Compare today vs yesterday
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 1);
      
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 1);
      previousEnd = new Date(currentStart);
      break;

    case "monthly":
      // Compare this month vs last month
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 1);
      break;

    case "yearly":
      // Compare this year vs last year
      currentStart = new Date(now.getFullYear(), 0, 1);
      currentEnd = new Date(now.getFullYear() + 1, 0, 1);
      
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = new Date(now.getFullYear(), 0, 1);
      break;

    default:
      throw new CustomError("Invalid period. Use 'daily', 'monthly', or 'yearly'", 400);
  }

  const baseFilter = {
    branchId: new mongoose.Types.ObjectId(branchId),
    status: "paid"
  };

  // Get current period data
  const currentData = await Order.aggregate([
    { 
      $match: { 
        ...baseFilter, 
        createdAt: { $gte: currentStart, $lt: currentEnd } 
      } 
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: { $sum: "$payment.amount" }
      }
    }
  ]);

  // Get previous period data
  const previousData = await Order.aggregate([
    { 
      $match: { 
        ...baseFilter, 
        createdAt: { $gte: previousStart, $lt: previousEnd } 
      } 
    },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: { $sum: "$payment.amount" }
      }
    }
  ]);

  const current = currentData[0] || { orders: 0, revenue: 0 };
  const previous = previousData[0] || { orders: 0, revenue: 0 };

  const orderGrowth = previous.orders > 0 
    ? (((current.orders - previous.orders) / previous.orders) * 100).toFixed(2)
    : 0;

  const revenueGrowth = previous.revenue > 0
    ? (((current.revenue - previous.revenue) / previous.revenue) * 100).toFixed(2)
    : 0;

  res.status(200).json({
    success: true,
    period,
    current: {
      orders: current.orders,
      revenue: Math.round(current.revenue)
    },
    previous: {
      orders: previous.orders,
      revenue: Math.round(previous.revenue)
    },
    growth: {
      orders: parseFloat(orderGrowth),
      revenue: parseFloat(revenueGrowth)
    }
  });
});

// ====================== GET REVENUE TRENDS ======================
export const getRevenueTrends = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { days = 30 } = req.query; // Last N days

  const daysCount = parseInt(days);
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysCount);
  startDate.setHours(0, 0, 0, 0);

  const trends = await Order.aggregate([
    {
      $match: {
        branchId: new mongoose.Types.ObjectId(branchId),
        status: "paid",
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        orders: { $sum: 1 },
        revenue: { $sum: "$payment.amount" },
        avgOrderValue: { $avg: "$payment.amount" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  const dailyExpenses = await Expense.aggregate([
    {
      $match: {
        branchId: new mongoose.Types.ObjectId(branchId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" }
        },
        totalExpenses: { $sum: "$amount" }
      }
    }
  ]);

  const expensesMap = new Map();
  dailyExpenses.forEach(expense => {
    const date = new Date(expense._id.year, expense._id.month - 1, expense._id.day).toISOString().split('T')[0];
    expensesMap.set(date, expense.totalExpenses);
  });

  const trendsWithNetProfit = trends.map(t => {
    const date = new Date(t._id.year, t._id.month - 1, t._id.day).toISOString().split('T')[0];
    const expenses = expensesMap.get(date) || 0;
    const netProfit = t.revenue - expenses;
    return {
      date,
      orders: t.orders,
      revenue: Math.round(t.revenue),
      avgOrderValue: Math.round(t.avgOrderValue),
      netProfit: Math.round(netProfit)
    };
  });

  res.status(200).json({
    success: true,
    period: `Last ${daysCount} days`,
    trends: trendsWithNetProfit
  });
});