import ParcelOrder from "../models/ParcelOrder.js";
import MenuItem from "../models/MenuItem.js";
import CustomError from "../utils/customError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// ============ CREATE PARCEL ORDER & IMMEDIATE BILLING ============
export const createParcelOrder = asyncHandler(async (req, res) => {
  const { items, customerName, customerPhone, paymentMethod, discount, discountType } = req.body;
  const { id: cashierId, branchId } = req.user;

  // Validation
  if (!items || items.length === 0) {
    throw new CustomError("Order items are required", 400);
  }
  
  if (!customerName) {
    throw new CustomError("Customer name is required", 400);
  }
  
  if (!paymentMethod) {
    throw new CustomError("Payment method is required", 400);
  }

  // Validate menu items and build order items
  const validatedItems = [];
  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItem);
    if (!menuItem) {
      throw new CustomError(`Menu item not found: ${item.menuItem}`, 404);
    }
    
    if (!menuItem.availability) {
      throw new CustomError(`${menuItem.name} is currently unavailable`, 400);
    }

    validatedItems.push({
      menuItem: item.menuItem,
      quantity: item.quantity,
      notes: item.notes || "",
      status: "placed", // Will be sent to kitchen
      priceAtOrder: menuItem.price,
      statusHistory: [{
        status: "placed",
        timestamp: new Date(),
        updatedBy: cashierId
      }]
    });
  }

  // Generate order number
  const orderNumber = `PCL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Calculate estimated ready time (sum of cooking times)
  const totalCookingTime = await Promise.all(
    validatedItems.map(async item => {
      const menuItem = await MenuItem.findById(item.menuItem);
      return menuItem.cookingTime || 15;
    })
  );
  const maxCookingTime = Math.max(...totalCookingTime);
  const estimatedReadyTime = new Date(Date.now() + maxCookingTime * 60000);

  // Create order
  const newOrder = await ParcelOrder.create({
    orderNumber,
    items: validatedItems,
    customerName,
    customerPhone: customerPhone || '',
    discount: discount || 0,
    discountType: discountType || 'fixed',
    orderStatus: 'placed',
    payment: {
      status: 'paid', // IMMEDIATE PAYMENT
      method: paymentMethod,
      paidAt: new Date()
    },
    cashierId,
    branchId,
    estimatedReadyTime
  });

  // Calculate totals
  newOrder.calculateTotals();
  newOrder.payment.amount = newOrder.totalAmount;
  await newOrder.save();

  // Populate and return
  const populatedOrder = await ParcelOrder.findById(newOrder._id)
    .populate("items.menuItem", "name price cookingTime")
    .populate("cashierId", "name");

  res.status(201).json({
    success: true,
    message: "Parcel order created and paid successfully",
    order: populatedOrder
  });
});

// ============ GET ALL PARCEL ORDERS ============
export const getAllParcelOrders = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { status, paymentStatus, page = 1, limit = 10, searchTerm } = req.query;

  const filter = { branchId };
  if (status) {
    if (status === 'paid') {
      filter['payment.status'] = 'paid';
    } else if (status === 'served') {
      filter.orderStatus = 'completed';
    } else {
      filter.orderStatus = status;
    }
  }
  if (paymentStatus) filter['payment.status'] = paymentStatus;

  if (searchTerm) {
    const searchRegex = new RegExp(searchTerm, 'i');
    filter.$or = [
      { orderNumber: searchRegex },
      { customerName: searchRegex },
    ];
  }

  const orders = await ParcelOrder.find(filter)
    .populate("items.menuItem", "name price")
    .populate("cashierId", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await ParcelOrder.countDocuments(filter);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Stats are calculated on all orders of the branch, not just the filtered ones.
  const statsAggr = await ParcelOrder.aggregate([
    { $match: { branchId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        placed: { $sum: { $cond: [{ $eq: ["$orderStatus", "placed"] }, 1, 0] } },
        inKitchen: { $sum: { $cond: [{ $eq: ["$orderStatus", "in-kitchen"] }, 1, 0] } },
        ready: { $sum: { $cond: [{ $eq: ["$orderStatus", "ready"] }, 1, 0] } },
        served: { $sum: { $cond: [{ $eq: ["$orderStatus", "completed"] }, 1, 0] } },
        paid: { $sum: { $cond: [{ $eq: ["$payment.status", "paid"] }, 1, 0] } },
        todayOrders: { $sum: { $cond: [{ $gte: ["$createdAt", startOfToday] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ["$payment.status", "paid"] }, "$totalAmount", 0] } },
      }
    },
    { $project: { _id: 0 } }
  ]);

  const stats = statsAggr[0] || { total: 0, placed: 0, inKitchen: 0, ready: 0, served: 0, todayOrders: 0, paid: 0, totalRevenue: 0 };

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    orders,
    stats
  });
});

// ============ GET ORDER BY ID ============
export const getParcelOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await ParcelOrder.findById(id)
    .populate("items.menuItem", "name price cookingTime")
    .populate("cashierId", "name email");

  if (!order) throw new CustomError("Order not found", 404);

  res.status(200).json({
    success: true,
    order
  });
});

// ============ KITCHEN: START PREPARING ITEMS ============
export const startPreparingItems = asyncHandler(async (req, res) => {
  const { orderId, itemIds } = req.body;
  const { id: chefId } = req.user;

  const order = await ParcelOrder.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  const itemsToUpdate = order.items.filter(item => 
    itemIds.includes(item._id.toString()) && item.status === 'placed'
  );

  if (itemsToUpdate.length === 0) {
    throw new CustomError("No eligible items found", 404);
  }

  itemsToUpdate.forEach(item => {
    item.status = 'in-kitchen';
    item.kitchenStartTime = new Date();
    item.statusHistory.push({
      status: 'in-kitchen',
      timestamp: new Date(),
      updatedBy: chefId
    });
  });

  order.updateOrderStatus();
  await order.save();

  const updatedOrder = await ParcelOrder.findById(orderId)
    .populate("items.menuItem", "name cookingTime");

  res.status(200).json({
    success: true,
    message: `${itemsToUpdate.length} items marked as preparing`,
    order: updatedOrder
  });
});

// ============ KITCHEN: MARK ITEMS READY ============
export const markItemsReady = asyncHandler(async (req, res) => {
  const { orderId, itemIds } = req.body;
  const { id: chefId } = req.user;

  const order = await ParcelOrder.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  const itemsToUpdate = order.items.filter(item => 
    itemIds.includes(item._id.toString()) && item.status === 'in-kitchen'
  );

  if (itemsToUpdate.length === 0) {
    throw new CustomError("No eligible items found", 404);
  }

  itemsToUpdate.forEach(item => {
    item.status = 'ready';
    item.kitchenCompleteTime = new Date();
    item.statusHistory.push({
      status: 'ready',
      timestamp: new Date(),
      updatedBy: chefId
    });
  });

  order.updateOrderStatus();
  await order.save();

  const updatedOrder = await ParcelOrder.findById(orderId)
    .populate("items.menuItem", "name");

  res.status(200).json({
    success: true,
    message: `Order ${order.orderNumber} is ready for pickup`,
    order: updatedOrder
  });
});

// ============ CASHIER: MARK AS COMPLETED (HANDED OVER) ============
export const markOrderCompleted = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await ParcelOrder.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  // if (order.orderStatus !== 'ready') {
  //   throw new CustomError("Order must be ready before completion", 400);
  // }

  // Mark all items as completed
  order.items.forEach(item => {
    if (item.status === 'ready') {
      item.status = 'completed';
      item.statusHistory.push({
        status: 'completed',
        timestamp: new Date()
      });
    }
  });

  order.orderStatus = 'completed';
  await order.save();

  res.status(200).json({
    success: true,
    message: "Order marked as completed and handed over to customer",
    order
  });
});

// ============ GET KITCHEN QUEUE (PARCEL ORDERS) ============
export const getParcelKitchenQueue = asyncHandler(async (req, res) => {
  const { branchId } = req.user;

  const orders = await ParcelOrder.find({
    branchId,
    'items.status': { $in: ['placed', 'in-kitchen'] }
  })
    .populate("items.menuItem", "name cookingTime")
    .sort({ orderedAt: 1 });

  // Flatten items
  const queue = {
    placed: [],
    inKitchen: []
  };

  orders.forEach(order => {
    order.items.forEach(item => {
      if (['placed', 'in-kitchen'].includes(item.status)) {
        const itemData = {
          itemId: item._id,
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          menuItem: item.menuItem,
          quantity: item.quantity,
          notes: item.notes,
          status: item.status,
          estimatedReadyTime: order.estimatedReadyTime
        };

        if (item.status === 'placed') {
          queue.placed.push(itemData);
        } else {
          queue.inKitchen.push(itemData);
        }
      }
    });
  });

  res.status(200).json({
    success: true,
    stats: {
      placed: queue.placed.length,
      inKitchen: queue.inKitchen.length,
      total: queue.placed.length + queue.inKitchen.length
    },
    queue
  });
});

// ============ REFUND PARCEL ORDER ============
export const refundParcelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  if (!reason) throw new CustomError("Refund reason is required", 400);

  const order = await ParcelOrder.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (order.payment.status !== 'paid') {
    throw new CustomError("Only paid orders can be refunded", 400);
  }

  order.payment.refund = {
    amount: order.payment.amount,
    reason,
    processedAt: new Date()
  };
  order.payment.status = 'refunded';
  order.orderStatus = 'cancelled';

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order refunded successfully",
    refund: order.payment.refund
  });
});

export const getParcelOrderStats = asyncHandler(async (req, res) => {
  try {
    const branchId = req.user.branchId; // optional, only if branch-based
    const query = branchId ? { branchId } : {};

    // Count per status
    const total = await ParcelOrder.countDocuments(query);
    const placed = await ParcelOrder.countDocuments({ ...query, orderStatus: "placed" });
    const inKitchen = await ParcelOrder.countDocuments({ ...query, orderStatus: "in-kitchen" });
    const ready = await ParcelOrder.countDocuments({ ...query, orderStatus: "ready" });
    const completed = await ParcelOrder.countDocuments({ ...query, orderStatus: "completed" });
    const refunded = await ParcelOrder.countDocuments({ ...query, orderStatus: "refunded" });

    // Total paid revenue
    const totalRevenueResult = await ParcelOrder.aggregate([
      { $match: { ...query, "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$payment.amount" } } }
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      stats: {
        total,
        placed,
        inKitchen,
        ready,
        completed,
        refunded,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch parcel order stats",
      error: error.message,
    });
  }
});