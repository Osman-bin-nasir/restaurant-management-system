import Order from "../models/Order.js";
import User from "../models/User.js";
import CustomError from "../utils/customError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import mongoose from "mongoose";

// ====================== PROCESS PAYMENT ======================
export const processPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod, discount = 0, notes } = req.body;
  const { id: cashierId } = req.user;

  if (!orderId || !paymentMethod) {
    throw new CustomError("Order ID and payment method are required", 400);
  }

  const validPaymentMethods = ["cash", "card", "upi", "cheque"];
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new CustomError(`Payment method must be one of: ${validPaymentMethods.join(", ")}`, 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (order.status === "paid") {
    throw new CustomError("Order already paid", 400);
  }

  if (order.status !== "served" && order.status !== "ready") {
    throw new CustomError("Order must be served or ready before payment", 400);
  }

  // Validate discount
  if (discount < 0 || discount > order.totalAmount) {
    throw new CustomError("Invalid discount amount", 400);
  }

  const finalAmount = order.totalAmount - discount;

  order.status = "paid";
  order.cashierId = cashierId;
  order.payment = {
    method: paymentMethod,
    amount: finalAmount,
    originalAmount: order.totalAmount,
    discount: discount,
    paidAt: new Date(),
    notes: notes || ""
  };

  await order.save();

  const populatedOrder = await Order.findById(orderId)
    .populate("items.menuItem", "name price")
    .populate("waiterId", "name")
    .populate("cashierId", "name")
    .populate("tableId", "tableNumber");

  res.status(200).json({
    success: true,
    message: "Payment processed successfully",
    order: populatedOrder
  });
});

// ====================== GENERATE BILL ======================
export const generateBill = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate("items.menuItem", "name price category")
    .populate("waiterId", "name")
    .populate("tableId", "tableNumber capacity")
    .populate("branchId", "name location contact");

  if (!order) throw new CustomError("Order not found", 404);

  // Calculate tax (assume 5%)
  const TAX_RATE = 0.05;
  const subtotal = order.totalAmount;
  const discount = order.payment?.discount || 0;
  const taxableAmount = subtotal - discount;
  const tax = Math.round(taxableAmount * TAX_RATE);
  const finalTotal = taxableAmount + tax;

  const bill = {
    billNumber: `BILL-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    date: new Date().toLocaleDateString("en-IN"),
    time: new Date().toLocaleTimeString("en-IN"),
    branch: order.branchId,
    table: order.tableId,
    waiter: order.waiterId?.name || "N/A",
    customer: order.customerName,
    items: order.items.map(item => ({
      name: item.menuItem.name,
      category: item.menuItem.category,
      qty: item.quantity,
      price: item.menuItem.price,
      notes: item.notes,
      amount: item.menuItem.price * item.quantity
    })),
    summary: {
      subtotal: subtotal,
      discount: discount,
      taxableAmount: taxableAmount,
      tax: tax,
      total: finalTotal
    },
    payment: order.payment ? {
      method: order.payment.method,
      paidAmount: order.payment.amount,
      status: "Paid"
    } : null
  };

  res.status(200).json({
    success: true,
    bill
  });
});

// ====================== APPLY DISCOUNT ======================
export const applyDiscount = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { discountType, discountValue } = req.body;

  if (!discountType || discountValue === undefined) {
    throw new CustomError("Discount type and value are required", 400);
  }

  if (!["percentage", "fixed"].includes(discountType)) {
    throw new CustomError("Discount type must be 'percentage' or 'fixed'", 400);
  }

  if (discountValue < 0) {
    throw new CustomError("Discount value must be positive", 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (order.status === "paid") {
    throw new CustomError("Cannot apply discount to paid order", 400);
  }

  let discount = 0;
  if (discountType === "percentage") {
    if (discountValue > 100) {
      throw new CustomError("Percentage discount cannot exceed 100%", 400);
    }
    discount = Math.round((order.totalAmount * discountValue) / 100);
  } else {
    discount = discountValue;
  }

  if (discount > order.totalAmount) {
    throw new CustomError("Discount cannot exceed order total", 400);
  }

  order.discount = {
    type: discountType,
    value: discountValue,
    amount: discount,
    appliedAt: new Date()
  };

  // Update totalAmount after discount
  const newTotal = order.totalAmount - discount;
  order.totalAmount = newTotal;

  await order.save();

  res.status(200).json({
    success: true,
    message: "Discount applied successfully",
    order: {
      id: order._id,
      originalTotal: order.totalAmount + discount,
      discountAmount: discount,
      newTotal: newTotal
    }
  });
});

// ====================== GET PENDING BILLS ======================
export const getPendingBills = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { status = "ready", sortBy = "createdAt" } = req.query;

  const validStatuses = ["ready", "served"];
  const statuses = status ? status.split(",").filter(s => validStatuses.includes(s)) : validStatuses;

  const orders = await Order.find({
    branchId,
    status: { $in: statuses }
  })
    .populate("items.menuItem", "name price")
    .populate("waiterId", "name email")
    .populate("tableId", "tableNumber")
    .sort({ [sortBy]: -1 });

  const bills = orders.map(order => ({
    orderId: order._id,
    orderNumber: order.orderNumber,
    tableNumber: order.tableId?.tableNumber || "Parcel",
    customerName: order.customerName,
    items: order.items.length,
    totalAmount: order.totalAmount,
    status: order.status,
    waiterId: order.waiterId?.name,
    createdAt: order.createdAt
  }));

  res.status(200).json({
    success: true,
    count: bills.length,
    bills
  });
});

// ====================== GET DAILY SUMMARY ======================
export const getDailySummary = asyncHandler(async (req, res) => {
  const { branchId } = req.user;

  // Get today's start and end time
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const orders = await Order.find({
    branchId,
    status: "paid",
    createdAt: { $gte: today, $lt: tomorrow }
  });

  // Calculate statistics
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, order) => sum + (order.payment?.amount || 0), 0);
  const totalDiscount = orders.reduce((sum, order) => sum + (order.payment?.discount || 0), 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Payment method breakdown
  const paymentBreakdown = {};
  orders.forEach(order => {
    const method = order.payment?.method || "unknown";
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + order.payment?.amount;
  });

  // Order type breakdown
  const typeBreakdown = {
    "dine-in": 0,
    "parcel": 0
  };
  orders.forEach(order => {
    typeBreakdown[order.type]++;
  });

  res.status(200).json({
    success: true,
    date: today.toLocaleDateString("en-IN"),
    summary: {
      totalOrders,
      totalSales,
      totalDiscount,
      averageOrderValue,
      paymentBreakdown,
      typeBreakdown
    }
  });
});

// ====================== REFUND ORDER ======================
export const refundOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason, refundAmount } = req.body;
  const { id: cashierId } = req.user;

  if (!reason) throw new CustomError("Refund reason is required", 400);

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (!order.payment) {
    throw new CustomError("Order has not been paid yet", 400);
  }

  const actualRefundAmount = refundAmount || order.payment.amount;

  if (actualRefundAmount > order.payment.amount) {
    throw new CustomError("Refund amount cannot exceed paid amount", 400);
  }

  order.payment.refund = {
    amount: actualRefundAmount,
    reason: reason,
    processedBy: cashierId,
    processedAt: new Date()
  };

  // Mark order as refunded if full refund
  if (actualRefundAmount === order.payment.amount) {
    order.status = "cancelled";
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: "Refund processed successfully",
    refund: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      refundAmount: actualRefundAmount,
      reason: reason,
      processedAt: new Date()
    }
  });
});

// ====================== SPLIT BILL ======================
export const splitBill = asyncHandler(async (req, res) => {
  const { orderId, numberOfWays } = req.body;

  if (!orderId || !numberOfWays || numberOfWays < 2) {
    throw new CustomError("Order ID and numberOfWays (min 2) are required", 400);
  }

  const order = await Order.findById(orderId)
    .populate("items.menuItem", "name price");

  if (!order) throw new CustomError("Order not found", 404);

  const totalAmount = order.totalAmount;
  const splitAmount = Math.ceil(totalAmount / numberOfWays);
  const remainder = totalAmount % numberOfWays;

  const splits = [];
  for (let i = 0; i < numberOfWays; i++) {
    const amount = i === numberOfWays - 1 ? splitAmount + remainder : splitAmount;
    splits.push({
      splitNumber: i + 1,
      amount: amount,
      status: "pending"
    });
  }

  res.status(200).json({
    success: true,
    message: `Bill split into ${numberOfWays} parts`,
    billSplit: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: totalAmount,
      numberOfWays: numberOfWays,
      splits: splits
    }
  });
});

// ====================== GET CASHIER STATS ======================
export const getCashierStats = asyncHandler(async (req, res) => {
  const { id: cashierId } = req.user;
  const { branchId } = req.user;

  // Get today's orders processed by this cashier
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const orders = await Order.find({
    cashierId,
    branchId,
    status: "paid",
    createdAt: { $gte: today, $lt: tomorrow }
  });

  const stats = {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, order) => sum + (order.payment?.amount || 0), 0),
    totalDiscount: orders.reduce((sum, order) => sum + (order.payment?.discount || 0), 0),
    averageTransaction: orders.length > 0 
      ? Math.round(orders.reduce((sum, order) => sum + (order.payment?.amount || 0), 0) / orders.length)
      : 0
  };

  res.status(200).json({
    success: true,
    cashier: req.userDoc.name,
    date: today.toLocaleDateString("en-IN"),
    stats
  });
});

// ====================== VOID TRANSACTION ======================
export const voidTransaction = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const { id: cashierId } = req.user;

  if (!reason) throw new CustomError("Reason for void is required", 400);

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (order.status !== "paid") {
    throw new CustomError("Only paid orders can be voided", 400);
  }

  order.payment.voided = {
    reason: reason,
    voidedBy: cashierId,
    voidedAt: new Date()
  };

  order.status = "served"; // Back to served status
  await order.save();

  res.status(200).json({
    success: true,
    message: "Transaction voided successfully",
    order: {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status
    }
  });
});