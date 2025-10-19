import mongoose from "mongoose";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import UserModel from '../models/User.js';
import Table from "../models/Table.js";
import CustomError from "../utils/customError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// ====================== CREATE ORDER ======================
export const createOrder = asyncHandler(async (req, res) => {
  const { type, tableId, items, customerName } = req.body;
  const { id: waiterId, branchId } = req.user;

  // ✅ Validation
  if (!type || !items || items.length === 0) {
    throw new CustomError("Order type and items are required", 400);
  }

  if (!["dine-in", "parcel"].includes(type)) {
    throw new CustomError("Order type must be 'dine-in' or 'parcel'", 400);
  }

  // ✅ For dine-in, tableId is required
  if (type === "dine-in" && !tableId) {
    throw new CustomError("Table ID is required for dine-in orders", 400);
  }

  // ✅ Validate table exists and is available (for dine-in)
  if (type === "dine-in") {
    const table = await Table.findById(tableId);
    if (!table) throw new CustomError("Table not found", 404);
    if (table.status !== "available") {
      throw new CustomError("Table is not available", 400);
    }
  }

  // ✅ Validate all menu items exist and calculate total
  let totalAmount = 0;
  const validatedItems = [];

  for (const item of items) {
    if (!item.menuItem || item.quantity <= 0) {
      throw new CustomError("Invalid menu item or quantity", 400);
    }

    const menuItem = await MenuItem.findById(item.menuItem);
    if (!menuItem) throw new CustomError(`Menu item not found: ${item.menuItem}`, 404);

    if (!menuItem.availability) {
      throw new CustomError(`${menuItem.name} is currently unavailable`, 400);
    }

    totalAmount += menuItem.price * item.quantity;
    validatedItems.push({
      menuItem: item.menuItem,
      quantity: item.quantity,
      notes: item.notes || ""
    });
  }

  // ✅ Generate unique order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // ✅ Create order
  const newOrder = await Order.create({
    orderNumber,
    type,
    tableId: type === "dine-in" ? tableId : null,
    items: validatedItems,
    totalAmount,
    status: "placed",
    customerName: customerName || "Guest",
    waiterId,
    branchId
  });

  // ✅ Update table status if dine-in
  if (type === "dine-in") {
    await Table.findByIdAndUpdate(tableId, {
      status: "occupied",
      currentOrderId: newOrder._id
    });
  }

  // ✅ Populate and return
  const populatedOrder = await Order.findById(newOrder._id)
    .populate("items.menuItem", "name price")
    .populate("waiterId", "name")
    .populate("tableId", "tableNumber capacity")
    .populate("branchId", "name");

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    order: populatedOrder
  });
});

// ====================== GET ALL ORDERS ======================
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, type, branchId } = req.query;
  const userBranchId = req.user.branchId;

  // Build filter
  const filter = { branchId: branchId || userBranchId };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const orders = await Order.find(filter)
    .populate("items.menuItem", "name price")
    .populate("waiterId", "name email")
    .populate("cashierId", "name email")
    .populate("tableId", "tableNumber capacity")
    .populate("branchId", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    orders
  });
});

// ====================== GET ORDER BY ID ======================
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("items.menuItem", "name price description image")
    .populate("waiterId", "name email")
    .populate("cashierId", "name email")
    .populate("tableId", "tableNumber capacity")
    .populate("branchId", "name location");

  if (!order) throw new CustomError("Order not found", 404);

  res.status(200).json({
    success: true,
    order
  });
});

// ====================== UPDATE ORDER STATUS ======================
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) throw new CustomError("Status is required", 400);

  const validStatuses = ["placed", "in-kitchen", "ready", "served", "paid", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new CustomError(`Status must be one of: ${validStatuses.join(", ")}`, 400);
  }

  const order = await Order.findByIdAndUpdate(id, { status }, { new: true })
    .populate("items.menuItem", "name price")
    .populate("waiterId", "name")
    .populate("tableId", "tableNumber");

  if (!order) throw new CustomError("Order not found", 404);

  // Update table status only if order is "paid" or "cancelled"
  if ((status === "paid" || status === "cancelled") && order.tableId) {
    await Table.findByIdAndUpdate(order.tableId, {
      status: "available",
      currentOrderId: null
    });
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    order
  });
});

// ====================== UPDATE ORDER (EDIT ITEMS) ======================
export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items, customerName } = req.body;

  // Find the existing order
  const order = await Order.findById(id);
  if (!order) throw new CustomError("Order not found", 404);

  // Prevent updates if order is in certain statuses
  if (["paid", "cancelled"].includes(order.status)) {
    throw new CustomError(`Cannot update order with status: ${order.status}`, 400);
  }

  let totalAmount = 0;
  const validatedItems = [];
  const newItemsForKitchen = [];

  if (items && items.length > 0) {
    // Create a map of existing items for comparison
    const existingItemsMap = new Map(
      order.items.map(item => [item.menuItem.toString(), item])
    );

    for (const item of items) {
      if (!item.menuItem || item.quantity <= 0) {
        throw new CustomError("Invalid menu item or quantity", 400);
      }

      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) throw new CustomError(`Menu item not found: ${item.menuItem}`, 404);

      if (!menuItem.availability) {
        throw new CustomError(`${menuItem.name} is currently unavailable`, 400);
      }

      totalAmount += menuItem.price * item.quantity;

      // Check if this is a new item (not in existing order)
      const existingItem = existingItemsMap.get(item.menuItem.toString());

      const validatedItem = {
        menuItem: item.menuItem,
        quantity: item.quantity,
        notes: item.notes || "",
        status: "pending" // Default status
      };

      if (!existingItem) {
        // This is a NEW item - mark for kitchen
        validatedItem.status = "in-kitchen";
        newItemsForKitchen.push({
          menuItem: item.menuItem,
          name: menuItem.name,
          quantity: item.quantity,
          notes: validatedItem.notes
        });
      } else {
        // This is an EXISTING item - retain its original status
        validatedItem.status = existingItem.status;
        
        // Optional: Handle quantity changes for existing items if needed
        // if (existingItem.quantity !== item.quantity) {
        //   // Logic for quantity adjustments can go here
        //   // But don't mark as "in-kitchen" to prevent reprocessing
        // }
      }
      
      validatedItems.push(validatedItem);
    }

    // Update order items and total
    order.items = validatedItems;
    order.totalAmount = totalAmount;
  }

  // Update customer name if provided
  if (customerName) order.customerName = customerName;

  // Update order status to "in-kitchen" ONLY if there are new items
  if (newItemsForKitchen.length > 0) {
    order.status = "in-kitchen";

    // Send ONLY the new items to the kitchen queue
    console.log("Sending new items to kitchen:", newItemsForKitchen);
    // Example: await KitchenQueue.create({ 
    //   orderId: order._id, 
    //   items: newItemsForKitchen,
    //   type: "new-items-only"
    // });
  }

  // Save the updated order
  await order.save();

  // Populate and return the updated order
  const updatedOrder = await Order.findById(id)
    .populate("items.menuItem", "name price")
    .populate("waiterId", "name")
    .populate("tableId", "tableNumber");

  res.status(200).json({
    success: true,
    message: "Order updated successfully",
    order: updatedOrder,
    // Return only the new items that were sent to kitchen
    newItemsForKitchen: newItemsForKitchen.length > 0 ? newItemsForKitchen : undefined
  });
});

// ====================== CANCEL ORDER ======================
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new CustomError("Order not found", 404);

  if (order.status === "paid" || order.status === "cancelled") {
    throw new CustomError("Cannot cancel a paid or already cancelled order", 400);
  }

  order.status = "cancelled";
  await order.save();

  // ✅ If order had a table, free it up
  if (order.tableId) {
    await Table.findByIdAndUpdate(order.tableId, {
      status: "available",
      currentOrderId: null
    });
  }

  const updatedOrder = await Order.findById(id)
    .populate("items.menuItem", "name price")
    .populate("tableId", "tableNumber");

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order: updatedOrder
  });
});

// ====================== ASSIGN CASHIER TO ORDER ======================
export const assignCashier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cashierId } = req.body;

  if (!cashierId) throw new CustomError("Cashier ID is required", 400);

  const order = await Order.findByIdAndUpdate(
    id,
    { cashierId },
    { new: true }
  ).populate("items.menuItem", "name price")
    .populate("cashierId", "name email");

  if (!order) throw new CustomError("Order not found", 404);

  res.status(200).json({
    success: true,
    message: "Cashier assigned to order",
    order
  });
});

// ====================== GET ORDER STATS ======================
export const getOrderStats = asyncHandler(async (req, res) => {
  const { branchId } = req.user;

  if (!branchId) {
    res.status(400);
    throw new Error("Branch ID missing from user");
  }

  const branchObjectId = new mongoose.Types.ObjectId(branchId);

  const stats = await Order.aggregate([
    { $match: { branchId: branchObjectId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" }
      }
    }
  ]);

  const ordersByType = await Order.aggregate([
    { $match: { branchId: branchObjectId } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    stats: {
      byStatus: stats,
      byType: ordersByType
    }
  });
});