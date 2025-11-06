import Order from "../models/Order.js";
import ParcelOrder from "../models/ParcelOrder.js";
import MenuItem from "../models/MenuItem.js";
import CustomError from "../utils/customError.js";
import { getIo } from "../utils/socket.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// ====================== GET KITCHEN QUEUE (ITEM-BASED) ======================
/**
 * Get all items that need preparation, grouped by priority - BEST APPROACH
 * Combines order context with item-level tracking
 */
export const getKitchenQueue = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { category, status = "placed,in-kitchen" } = req.query;

  const statuses = status.split(",").filter(s => 
    ["placed", "in-kitchen"].includes(s)
  );

  // Fetch Dine-in Orders
  const dineInOrders = await Order.find({
    branchId,
    "items.status": { $in: statuses }
  })
    .populate("items.menuItem", "name cookingTime category")
    .populate("waiterId", "name")
    .populate("tableId", "tableNumber")
    .sort({ createdAt: 1 });

  // Fetch Parcel Orders
  const parcelOrders = await ParcelOrder.find({
    branchId,
    "items.status": { $in: statuses }
  })
    .populate("items.menuItem", "name cookingTime category")
    .sort({ createdAt: 1 });


  const queue = {
    newItems: [],
    inProgress: [],
    almostReady: []
  };

  const now = new Date();

  // Process Dine-in orders
  dineInOrders.forEach(order => {
    order.items
      .filter(item => statuses.includes(item.status))
      .filter(item => !category || item.menuItem?.category === category)
      .forEach(item => {
        const itemData = {
          itemId: item._id,
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderType: order.type,
          tableNumber: order.tableId?.tableNumber || 'Takeaway',
          customerName: order.customerName,
          menuItem: item.menuItem,
          quantity: item.quantity,
          notes: item.notes,
          status: item.status,
          kitchenStartTime: item.kitchenStartTime,
          estimatedCompletionTime: item.kitchenStartTime 
            ? new Date(item.kitchenStartTime.getTime() + (item.menuItem?.cookingTime || 15) * 60000)
            : null,
          waitTime: order.createdAt 
            ? Math.floor((now - order.createdAt) / 60000) 
            : 0,
          waiter: order.waiterId?.name,
          priority: calculatePriority(order, item)
        };

        if (item.status === 'placed') {
          queue.newItems.push(itemData);
        } else if (item.status === 'in-kitchen') {
          const timeInKitchen = Math.floor((now - item.kitchenStartTime) / 60000);
          const cookingTime = item.menuItem?.cookingTime || 15;
          
          if (timeInKitchen >= cookingTime * 0.8) {
            queue.almostReady.push(itemData);
          } else {
            queue.inProgress.push(itemData);
          }
        }
      });
  });

  // Process Parcel orders
  parcelOrders.forEach(order => {
    order.items
      .filter(item => statuses.includes(item.status))
      .filter(item => !category || item.menuItem?.category === category)
      .forEach(item => {
        const itemData = {
          itemId: item._id,
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderType: 'parcel', // Hardcode order type
          tableNumber: 'Parcel', // Hardcode table number
          customerName: order.customerName,
          menuItem: item.menuItem,
          quantity: item.quantity,
          notes: item.notes,
          status: item.status,
          kitchenStartTime: item.kitchenStartTime,
          estimatedCompletionTime: item.kitchenStartTime 
            ? new Date(item.kitchenStartTime.getTime() + (item.menuItem?.cookingTime || 15) * 60000)
            : null,
          waitTime: order.createdAt // Parcel order has createdAt at top level
            ? Math.floor((now - order.createdAt) / 60000) 
            : 0,
          waiter: 'N/A', // No waiter for parcel orders
          priority: calculatePriority(order, item)
        };

        if (item.status === 'placed') {
          queue.newItems.push(itemData);
        } else if (item.status === 'in-kitchen') {
          const timeInKitchen = Math.floor((now - item.kitchenStartTime) / 60000);
          const cookingTime = item.menuItem?.cookingTime || 15;
          
          if (timeInKitchen >= cookingTime * 0.8) {
            queue.almostReady.push(itemData);
          } else {
            queue.inProgress.push(itemData);
          }
        }
      });
  });


  // Sort by priority and timing
  queue.newItems.sort((a, b) => b.priority - a.priority);
  queue.inProgress.sort((a, b) => (a.estimatedCompletionTime || 0) - (b.estimatedCompletionTime || 0));
  queue.almostReady.sort((a, b) => (a.estimatedCompletionTime || 0) - (b.estimatedCompletionTime || 0));

  res.status(200).json({
    success: true,
    stats: {
      newItems: queue.newItems.length,
      inProgress: queue.inProgress.length,
      almostReady: queue.almostReady.length,
      total: queue.newItems.length + queue.inProgress.length + queue.almostReady.length
    },
    queue
  });
});

// ====================== START COOKING ITEMS ======================
/**
 * Mark specific items as "in-kitchen" - chef claims items
 * GRANULAR CONTROL - Better than order-level approach
 */
export const startCookingItems = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const { id: chefId } = req.user;

  if (!items || !Array.isArray(items)) {
    throw new CustomError("Items array is required", 400);
  }

  const results = [];
  const now = new Date();

  for (const { orderId, itemIds } of items) {
    let order = await Order.findById(orderId);
    let orderModelName = 'Order';
    if (!order) {
        order = await ParcelOrder.findById(orderId);
        orderModelName = 'ParcelOrder';
    }
    if (!order) continue;

    if(order.type === 'parcel') {
      console.log("it is parcel")
      order.orderStatus = 'in-kitchen'
    }

    const itemsToStart = order.items.filter(item => 
      itemIds.includes(item._id.toString()) && item.status === 'placed'
    );

    itemsToStart.forEach(item => {
      item.status = 'in-kitchen';
      item.kitchenStartTime = now;
      item.statusHistory.push({
        status: 'in-kitchen',
        timestamp: now,
        updatedBy: chefId
      });
    });

    if (itemsToStart.length > 0) {
      // Update overall order status if needed
      if (order.status === 'placed') {
        order.status = 'in-kitchen';
      }
      await order.save();

      // Emit a socket event for the order update
      let updatedOrder;
      if (orderModelName === 'Order') {
        updatedOrder = await Order.findById(orderId).populate('items.menuItem', 'name price').populate('tableId', 'tableNumber').populate('waiterId', 'name');
      } else {
        updatedOrder = await ParcelOrder.findById(orderId).populate('items.menuItem', 'name price');
        console.log(updatedOrder);
      }
      
      getIo().emit("orderUpdated", updatedOrder);

      results.push({
        orderId,
        startedCount: itemsToStart.length,
        itemIds: itemsToStart.map(i => i._id)
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Started cooking ${results.reduce((sum, r) => sum + r.startedCount, 0)} items`,
    results
  });
});

// ====================== MARK ITEMS READY ======================
/**
 * Mark cooked items as ready for serving
 * GRANULAR CONTROL - Better than order-level approach
 */
export const markItemsReady = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const { id: chefId } = req.user;

  if (!items || !Array.isArray(items)) {
    throw new CustomError("Items array is required", 400);
  }

  const results = [];
  const now = new Date();

  for (const { orderId, itemIds } of items) {
    let order = await Order.findById(orderId);
    let orderModelName = 'Order';
    if (!order) {
        order = await ParcelOrder.findById(orderId);
        orderModelName = 'ParcelOrder';
    }
    if (!order) continue;

    if(order.type === 'parcel') {
      console.log("it is parcel")
      order.orderStatus = 'completed'
    }

    const itemsToComplete = order.items.filter(item => 
      itemIds.includes(item._id.toString()) && item.status === 'in-kitchen'
    );

    itemsToComplete.forEach(item => {
      item.status = 'ready';
      item.kitchenCompleteTime = now;
      item.statusHistory.push({
        status: 'ready',
        timestamp: now,
        updatedBy: chefId
      });
    });

    if (itemsToComplete.length > 0) {
      // Check if all items in order are ready
      const allItemsReady = order.items
        .filter(i => i.status !== 'cancelled')
        .every(i => i.status === 'ready');
      
      if (allItemsReady) {
        order.status = 'ready';
      }

      await order.save();

      // Emit a socket event for the order update
      let updatedOrder;
      if (orderModelName === 'Order') {
        updatedOrder = await Order.findById(orderId).populate('items.menuItem', 'name price').populate('tableId', 'tableNumber').populate('waiterId', 'name');
      } else {
        updatedOrder = await ParcelOrder.findById(orderId).populate('items.menuItem', 'name price');
      }
      getIo().emit("orderUpdated", updatedOrder);

      results.push({
        orderId,
        orderNumber: order.orderNumber,
        readyCount: itemsToComplete.length,
        tableNumber: order.tableId?.tableNumber || 'Takeaway',
        allItemsReady
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Marked ${results.reduce((sum, r) => sum + r.readyCount, 0)} items ready`,
    results
  });
});

// ====================== GET KITCHEN STATS ======================
/**
 * Comprehensive kitchen statistics with item-level tracking
 */
export const getKitchenStats = asyncHandler(async (req, res) => {
  const { branchId } = req.user;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const orders = await Order.find({
    branchId,
    createdAt: { $gte: today, $lt: tomorrow }
  });

  // Item-level statistics - MORE ACCURATE
  let totalItems = 0;
  let itemsPlaced = 0;
  let itemsInKitchen = 0;
  let itemsReady = 0;
  let itemsServed = 0;
  let itemsCancelled = 0;
  let totalCookingTime = 0;
  let itemsWithCookingTime = 0;

  // Order-level statistics for dashboard
  const pendingOrders = await Order.countDocuments({ 
    branchId, 
    status: "placed" 
  });
  
  const inKitchenOrders = await Order.countDocuments({ 
    branchId, 
    status: "in-kitchen" 
  });

  orders.forEach(order => {
    order.items.forEach(item => {
      totalItems++;
      
      switch(item.status) {
        case 'placed': itemsPlaced++; break;
        case 'in-kitchen': itemsInKitchen++; break;
        case 'ready': itemsReady++; break;
        case 'served': itemsServed++; break;
        case 'cancelled': itemsCancelled++; break;
      }

      if (item.kitchenStartTime && item.kitchenCompleteTime) {
        const cookingTime = (item.kitchenCompleteTime - item.kitchenStartTime) / 60000;
        totalCookingTime += cookingTime;
        itemsWithCookingTime++;
      }
    });
  });

  res.status(200).json({
    success: true,
    date: today.toISOString().split('T')[0],
    stats: {
      // Order-level stats
      pendingOrders,
      inKitchenOrders,
      completedToday: orders.filter(o => 
        ["ready", "served", "paid"].includes(o.status)
      ).length,

      // Item-level stats
      totalItems,
      pendingItems: itemsPlaced,
      inKitchenItems: itemsInKitchen,
      readyItems: itemsReady,
      servedItems: itemsServed,
      cancelledItems: itemsCancelled,
      
      // Performance metrics
      averageCookingTime: itemsWithCookingTime > 0 
        ? Math.round(totalCookingTime / itemsWithCookingTime) 
        : 0,
      completionRate: totalItems > 0 
        ? Math.round(((itemsServed / (totalItems - itemsCancelled)) * 100)) 
        : 0
    }
  });
});

// ====================== UPDATE ITEM AVAILABILITY ======================
/**
 * Mark menu items as unavailable (out of stock)
 */
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

// ====================== ORDER-LEVEL ENDPOINTS (for compatibility) ======================
/**
 * Simple order-level endpoints for basic operations
 */
export const startPreparingOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { id: chefId } = req.user;

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (order.status !== "placed") {
    throw new CustomError("Can only start preparing orders in 'placed' status", 400);
  }

  // Start all items in the order
  order.items.forEach(item => {
    if (item.status === 'placed') {
      item.status = 'in-kitchen';
      item.kitchenStartTime = new Date();
      item.statusHistory.push({
        status: 'in-kitchen',
        timestamp: new Date(),
        updatedBy: chefId
      });
    }
  });

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

export const markOrderReady = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { id: chefId } = req.user;

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (order.status !== "in-kitchen") {
    throw new CustomError("Can only mark 'in-kitchen' orders as ready", 400);
  }

  // Mark all items as ready
  order.items.forEach(item => {
    if (item.status === 'in-kitchen') {
      item.status = 'ready';
      item.kitchenCompleteTime = new Date();
      item.statusHistory.push({
        status: 'ready',
        timestamp: new Date(),
        updatedBy: chefId
      });
    }
  });

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

// ====================== HELPER: CALCULATE PRIORITY ======================
function calculatePriority(order, item) {
  let priority = 100;
  
  // Dine-in orders get higher priority
  if (order.type === 'dine-in') priority += 20;
  
  // Older orders get priority
  const ageMinutes = (Date.now() - order.createdAt) / 60000;
  priority += Math.min(ageMinutes * 2, 50);
  
  // Quick-cook items get slight boost
  if (item.menuItem?.cookingTime <= 10) priority += 10;
  
  // VIP customers or special requests
  if (order.priority === 'high') priority += 30;
  if (item.notes?.toLowerCase().includes('urgent')) priority += 25;
  
  return Math.round(priority);
}