import mongoose from "mongoose";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
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
    
    // ✅ Each item starts with "placed" status and has its own history
    validatedItems.push({
      menuItem: item.menuItem,
      quantity: item.quantity,
      notes: item.notes || "",
      status: "placed",
      priceAtOrder: menuItem.price,
      statusHistory: [{
        status: "placed",
        timestamp: new Date()
      }]
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
    status: "placed", // Initial order status
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
  const { status, type, branchId, page = 1, limit = 10, searchTerm } = req.query;
  const userBranchId = req.user.branchId;

  // Build filter
  const filter = { branchId: branchId || userBranchId };
  if (status) filter.status = status;
  if (type) filter.type = type;

  if (searchTerm) {
    const searchRegex = new RegExp(searchTerm, 'i');
    filter.$or = [
      { orderNumber: searchRegex },
      { customerName: searchRegex },
    ];
  }

  const orders = await Order.find(filter)
    .populate("items.menuItem", "name price")
    .populate("waiterId", "name email")
    .populate("cashierId", "name email")
    .populate("tableId", "tableNumber capacity")
    .populate("branchId", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(filter);

  // Get today's date at midnight
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Get stats based on the same filter
  const stats = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        placed: { $sum: { $cond: [{ $eq: ["$status", "placed"] }, 1, 0] } },
        inKitchen: { $sum: { $cond: [{ $eq: ["$status", "in-kitchen"] }, 1, 0] } },
        ready: { $sum: { $cond: [{ $eq: ["$status", "ready"] }, 1, 0] } },
        served: { $sum: { $cond: [{ $eq: ["$status", "served"] }, 1, 0] } },
        paid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, { $ifNull: ["$payment.amount", "$totalAmount"] }, 0] } },
        todayOrders: { $sum: { $cond: [{ $gte: ["$createdAt", startOfToday] }, 1, 0] } },
      }
    },
    { $project: { _id: 0 } }
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    orders,
    stats: stats[0] || { total: 0, placed: 0, inKitchen: 0, ready: 0, served: 0, paid: 0, totalRevenue: 0, todayOrders: 0 },
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

// ====================== UPDATE ITEM STATUS ======================
/**
 * Update status of specific items within an order
 * Replaces the monolithic updateOrderStatus for granular control
 */
export const updateItemStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { itemIds, newStatus } = req.body;
  const { id: userId } = req.user;

  // Validation
  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    throw new CustomError("Item IDs array is required", 400);
  }

  const validStatuses = ['placed', 'in-kitchen', 'ready', 'served', 'cancelled'];
  if (!validStatuses.includes(newStatus)) {
    throw new CustomError(`Status must be one of: ${validStatuses.join(", ")}`, 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  // Find items to update
  const itemsToUpdate = order.items.filter(item => 
    itemIds.includes(item._id.toString())
  );

  if (itemsToUpdate.length === 0) {
    throw new CustomError("No matching items found in order", 404);
  }

  // ✅ Status transition validation
  const invalidTransitions = [];
  itemsToUpdate.forEach(item => {
    if (!isValidTransition(item.status, newStatus)) {
      invalidTransitions.push({
        itemId: item._id,
        from: item.status,
        to: newStatus
      });
    }
  });

  if (invalidTransitions.length > 0) {
    throw new CustomError(
      `Invalid status transitions: ${JSON.stringify(invalidTransitions)}`,
      400
    );
  }

  // Update each item
  const now = new Date();
  itemsToUpdate.forEach(item => {
    item.status = newStatus;
    
    // Track timestamps
    if (newStatus === 'in-kitchen' && !item.kitchenStartTime) {
      item.kitchenStartTime = now;
    } else if (newStatus === 'ready') {
      item.kitchenCompleteTime = now;
    } else if (newStatus === 'served') {
      item.servedTime = now;
    } else if (newStatus === 'cancelled') {
      item.cancelledAt = now;
      item.cancelledBy = userId;
    }

    // Add to history
    item.statusHistory.push({
      status: newStatus,
      timestamp: now,
      updatedBy: userId
    });
  });

  // ✅ Recalculate order-level status
  order.updateOrderStatus();

  await order.save();

  // Populate and return
  const updatedOrder = await Order.findById(orderId)
    .populate("items.menuItem", "name price cookingTime")
    .populate("waiterId", "name")
    .populate("tableId", "tableNumber");

  res.status(200).json({
    success: true,
    message: `${itemsToUpdate.length} item(s) updated to ${newStatus}`,
    order: updatedOrder,
    updatedItemIds: itemIds
  });
});

// ====================== UPDATE ALL ITEMS STATUS (FOR ADMINS) ======================
export const updateAllItemsStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { newStatus } = req.body;
  const { id: userId } = req.user;

  console.log('--- updateAllItemsStatus ---');
  console.log('orderId:', orderId);
  console.log('newStatus:', newStatus);

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  console.log('order before update:', order);

  order.items.forEach(item => {
    item.status = newStatus;
    if (!item.statusHistory) {
      item.statusHistory = [];
    }
    item.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      updatedBy: userId
    });
  });

  order.updateOrderStatus();
  await order.save();

  const updatedOrder = await Order.findById(orderId).populate("items.menuItem", "name price");

  console.log('order after update:', updatedOrder);

  res.status(200).json({
    success: true,
    message: `All items in order ${order.orderNumber} updated to ${newStatus}`,
    order: updatedOrder
  });
});

// ====================== MARK ORDER AS PAID (FOR ADMINS) ======================
export const markOrderAsPaid = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { id: userId } = req.user;

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  order.payment = {
    method: 'cash', // or get from req.body
    amount: order.totalAmount,
    paidAt: new Date(),
  };

  order.status = 'paid';
  order.updateOrderStatus();
  await order.save();

  // If the order was for a dine-in table, free up the table
  if (order.tableId) {
    await Table.findByIdAndUpdate(order.tableId, {
      status: "available",
      currentOrderId: null,
    });
  }

  const updatedOrder = await Order.findById(orderId).populate("items.menuItem", "name price");

  res.status(200).json({
    success: true,
    message: `Order ${order.orderNumber} marked as paid`,
    order: updatedOrder
  });
});

// ====================== GET ITEMS BY STATUS ======================
/**
 * Filter order items by status - useful for kitchen display
 */
export const getItemsByStatus = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { status = 'placed,in-kitchen' } = req.query;

  const statuses = status.split(',').filter(s => 
    ['placed', 'in-kitchen', 'ready', 'served'].includes(s)
  );

  // Aggregate items across all orders
  const orders = await Order.find({
    branchId,
    'items.status': { $in: statuses }
  })
    .populate("items.menuItem", "name price cookingTime category")
    .populate("waiterId", "name")
    .populate("tableId", "tableNumber")
    .sort({ createdAt: 1 });

  // Flatten items with order context
  const items = [];
  orders.forEach(order => {
    order.items
      .filter(item => statuses.includes(item.status))
      .forEach(item => {
        items.push({
          itemId: item._id,
          orderId: order._id,
          orderNumber: order.orderNumber,
          tableNumber: order.tableId?.tableNumber || 'Parcel',
          menuItem: item.menuItem,
          quantity: item.quantity,
          notes: item.notes,
          status: item.status,
          kitchenStartTime: item.kitchenStartTime,
          waiter: order.waiterId?.name,
          createdAt: item.createdAt || order.createdAt
        });
      });
  });

  res.status(200).json({
    success: true,
    count: items.length,
    items: items.sort((a, b) => a.createdAt - b.createdAt) // FIFO
  });
});

// ====================== ADD ITEMS TO EXISTING ORDER ======================
/**
/**
 * Add new items to an order - all start with "placed" status
 * Update existing items - only NEW quantity goes to "placed" status
 */
export const addItemsToOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new CustomError("Items array is required", 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (['paid', 'cancelled'].includes(order.status)) {
    throw new CustomError("Cannot add items to paid or cancelled orders", 400);
  }

  // Validate and process items
  let additionalAmount = 0;

  for (const newItem of items) {
    const menuItem = await MenuItem.findById(newItem.menuItem);
    if (!menuItem) throw new CustomError(`Menu item not found: ${newItem.menuItem}`, 404);

    if (!menuItem.availability) {
      throw new CustomError(`${menuItem.name} is currently unavailable`, 400);
    }

    // Check if the menuItem already exists in the order
    const existingItem = order.items.find(
      (item) => item.menuItem.toString() === newItem.menuItem.toString()
    );

    if (existingItem) {
      // ✅ Treat incoming quantity as "add this many new items"
      const quantityToAdd = newItem.quantity;

      if (quantityToAdd > 0) {
        for (let i = 0; i < quantityToAdd; i++) {
          order.items.push({
            menuItem: newItem.menuItem,
            quantity: 1, // Each new item tracked separately
            notes: newItem.notes || '',
            status: 'placed',
            priceAtOrder: menuItem.price,
            statusHistory: [
              {
                status: 'placed',
                timestamp: new Date(),
                updatedBy: req.user.id,
                note: 'Additional item added to existing order'
              },
            ],
          });
        }

        additionalAmount += menuItem.price * quantityToAdd;
      }
    } else {
      // ✅ New item - add with "placed" status
      order.items.push({
        menuItem: newItem.menuItem,
        quantity: newItem.quantity,
        notes: newItem.notes || '',
        status: 'placed',
        priceAtOrder: menuItem.price,
        statusHistory: [
          {
            status: 'placed',
            timestamp: new Date(),
            updatedBy: req.user.id,
          },
        ],
      });
      additionalAmount += menuItem.price * newItem.quantity;
    }
  }

  order.totalAmount += additionalAmount;
  order.updateOrderStatus();

  await order.save();

  const updatedOrder = await Order.findById(orderId)
    .populate("items.menuItem", "name price")
    .populate("tableId", "tableNumber");

  res.status(200).json({
    success: true,
    message: `Order updated successfully`,
    order: updatedOrder,
  });
});

// ====================== REMOVE ITEM FROM ORDER ======================
export const removeItemFromOrder = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new CustomError("Order not found", 404);
  }

  if (['paid', 'cancelled'].includes(order.status)) {
    throw new CustomError("Cannot remove items from paid or cancelled orders", 400);
  }

  const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);

  if (itemIndex === -1) {
    throw new CustomError("Item not found in order", 404);
  }

  const itemToRemove = order.items[itemIndex];

  if (!['placed', 'in-kitchen'].includes(itemToRemove.status)) {
    throw new CustomError(`Cannot remove an item with status '${itemToRemove.status}'`, 400);
  }

  // Recalculate total amount
  order.totalAmount -= (itemToRemove.priceAtOrder || 0) * itemToRemove.quantity;

  // Remove the item
  order.items.splice(itemIndex, 1);

  // Update order status
  order.updateOrderStatus();

  await order.save();

  // If all items are removed, the order is cancelled. Free up the table.
  if (order.status === 'cancelled' && order.tableId) {
    await Table.findByIdAndUpdate(order.tableId, {
      status: "available",
      currentOrderId: null
    });
  }

  const updatedOrder = await Order.findById(orderId)
    .populate("items.menuItem", "name price")
    .populate("waiterId", "name")
    .populate("tableId", "tableNumber");

  res.status(200).json({
    success: true,
    message: "Item removed from order successfully",
    order: updatedOrder,
  });
});

// ====================== BULK STATUS UPDATE ======================
/**
 * Update multiple items across different orders (kitchen efficiency)
 */
export const bulkUpdateItemStatus = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  const { id: userId } = req.user;

  // updates format: [{ orderId, itemIds, newStatus }, ...]
  if (!updates || !Array.isArray(updates)) {
    throw new CustomError("Updates array is required", 400);
  }

  const results = [];
  const errors = [];

  for (const update of updates) {
    try {
      const order = await Order.findById(update.orderId);
      if (!order) {
        errors.push({ orderId: update.orderId, error: "Order not found" });
        continue;
      }

      const itemsToUpdate = order.items.filter(item => 
        update.itemIds.includes(item._id.toString())
      );

      itemsToUpdate.forEach(item => {
        if (isValidTransition(item.status, update.newStatus)) {
          item.status = update.newStatus;
          
          if (update.newStatus === 'in-kitchen') {
            item.kitchenStartTime = new Date();
          } else if (update.newStatus === 'ready') {
            item.kitchenCompleteTime = new Date();
          }

          item.statusHistory.push({
            status: update.newStatus,
            timestamp: new Date(),
            updatedBy: userId
          });
        }
      });

      order.updateOrderStatus();
      await order.save();

      results.push({
        orderId: update.orderId,
        updatedCount: itemsToUpdate.length
      });
    } catch (error) {
      errors.push({
        orderId: update.orderId,
        error: error.message
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Bulk update completed`,
    results,
    errors: errors.length > 0 ? errors : undefined
  });
});

// ====================== CANCEL SPECIFIC ITEMS ======================
/**
 * Cancel individual items before preparation
 */
export const cancelOrderItems = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { itemIds, reason } = req.body;
  const { id: userId } = req.user;

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    throw new CustomError("Item IDs are required", 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  const itemsToCancel = order.items.filter(item => 
    itemIds.includes(item._id.toString())
  );

  // Validate cancellation is allowed
  const notCancellable = itemsToCancel.filter(item => 
    ['served', 'cancelled'].includes(item.status)
  );

  if (notCancellable.length > 0) {
    throw new CustomError(
      `Cannot cancel items that are already served or cancelled`,
      400
    );
  }

  // Calculate refund amount
  let refundAmount = 0;
  itemsToCancel.forEach(item => {
    item.status = 'cancelled';
    item.cancellationReason = reason || 'Customer request';
    item.cancelledBy = userId;
    item.cancelledAt = new Date();
    
    item.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      updatedBy: userId
    });

    refundAmount += (item.priceAtOrder || 0) * item.quantity;
  });

  // Adjust order total
  order.totalAmount -= refundAmount;
  order.updateOrderStatus();

  await order.save();

  // If all items are cancelled, the order is cancelled. Free up the table.
  if (order.status === 'cancelled' && order.tableId) {
    await Table.findByIdAndUpdate(order.tableId, {
      status: "available",
      currentOrderId: null
    });
  }

  const updatedOrder = await Order.findById(orderId)
    .populate("items.menuItem", "name price");

  res.status(200).json({
    success: true,
    message: `${itemsToCancel.length} item(s) cancelled`,
    refundAmount,
    order: updatedOrder
  });
});

// ====================== CANCEL ORDER (ENTIRE ORDER) ======================
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const { id: userId } = req.user;

  const order = await Order.findById(id);
  if (!order) throw new CustomError("Order not found", 404);

  if (order.status === "paid" || order.status === "cancelled") {
    throw new CustomError("Cannot cancel a paid or already cancelled order", 400);
  }

  // Cancel all items individually
  order.items.forEach(item => {
    if (!['served', 'cancelled'].includes(item.status)) {
      item.status = 'cancelled';
      item.cancellationReason = reason || 'Order cancelled';
      item.cancelledBy = userId;
      item.cancelledAt = new Date();
      
      item.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        updatedBy: userId
      });
    }
  });

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
        totalAmount: { $sum: { $ifNull: ["$payment.amount", "$totalAmount"] } }
      }
    }
  ]);

  const ordersByType = await Order.aggregate([
    { $match: { branchId: branchObjectId, status: 'paid' } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        totalAmount: { $sum: { $ifNull: ["$payment.amount", "$totalAmount"] } }
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

// ====================== HELPER: VALIDATE STATUS TRANSITIONS ======================
function isValidTransition(currentStatus, newStatus) {
  const validTransitions = {
    'placed': ['in-kitchen', 'cancelled'],
    'in-kitchen': ['ready', 'cancelled'],
    'ready': ['served', 'in-kitchen', 'cancelled'], // Allow back to kitchen
    'served': [], // Terminal state (except payment at order level)
    'cancelled': [] // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}