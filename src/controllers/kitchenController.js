import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import CustomError from "../utils/customError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// ====================== GET KITCHEN ORDERS ======================
// Get all orders that are in kitchen or need preparation
export const getKitchenOrders = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { status = "in-kitchen,placed" } = req.query;

  const statuses = status.split(",").filter(s => 
    ["placed", "in-kitchen"].includes(s)
  );

  const orders = await Order.find({
    branchId,
    status: { $in: statuses }
  })
    .populate("items.menuItem", "name cookingTime category")
    .populate("waiterId", "name")
    .populate("tableId", "tableNumber")
    .sort({ createdAt: 1 }); // Oldest first (FIFO)

  res.status(200).json({
    success: true,
    count: orders.length,
    orders
  });
});

// ====================== START PREPARING ORDER ======================
// Mark order as "in-kitchen" when chef starts working on it
export const startPreparingOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (order.status !== "placed") {
    throw new CustomError("Can only start preparing orders in 'placed' status", 400);
  }

  order.status = "in-kitchen";
  await order.save();

  const updatedOrder = await Order.findById(orderId)
    .populate("items.menuItem", "name cookingTime")
    .populate("tableId", "tableNumber");

  res.status(200).json({
    success: true,
    message: "Order preparation started",
    order: updatedOrder
  });
});

// ====================== MARK ORDER AS READY ======================
// Mark order as ready for serving
export const markOrderReady = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (order.status !== "in-kitchen") {
    throw new CustomError("Can only mark 'in-kitchen' orders as ready", 400);
  }

  order.status = "ready";
  await order.save();

  const updatedOrder = await Order.findById(orderId)
    .populate("items.menuItem", "name")
    .populate("waiterId", "name")
    .populate("tableId", "tableNumber");

  res.status(200).json({
    success: true,
    message: "Order is ready for serving",
    order: updatedOrder
  });
});

// ====================== GET KITCHEN STATS ======================
// Dashboard stats for kitchen
export const getKitchenStats = asyncHandler(async (req, res) => {
  const { branchId } = req.user;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    pendingCount,
    inKitchenCount,
    completedToday
  ] = await Promise.all([
    Order.countDocuments({ branchId, status: "placed" }),
    Order.countDocuments({ branchId, status: "in-kitchen" }),
    Order.countDocuments({
      branchId,
      status: { $in: ["ready", "served", "paid"] },
      createdAt: { $gte: today, $lt: tomorrow }
    })
  ]);

  res.status(200).json({
    success: true,
    stats: {
      pending: pendingCount,
      inKitchen: inKitchenCount,
      completedToday,
      averagePrepTime: 15 // Placeholder - you can calculate this later
    }
  });
});

// ====================== UPDATE ITEM AVAILABILITY ======================
// Mark menu items as unavailable (out of stock)
export const updateItemAvailability = asyncHandler(async (req, res) => {
  const { menuItemId, availability } = req.body;

  if (typeof availability !== "boolean") {
    throw new CustomError("Availability must be true or false", 400);
  }

  const item = await MenuItem.findByIdAndUpdate(
    menuItemId,
    { availability },
    { new: true }
  );

  if (!item) throw new CustomError("Menu item not found", 404);

  res.status(200).json({
    success: true,
    message: `${item.name} is now ${availability ? "available" : "unavailable"}`,
    item
  });
});