import { getIo } from "../utils/socket.js";
import Table from "../models/Table.js";
import Order from "../models/Order.js";
import Branch from "../models/Branch.js";
import CustomError from "../utils/customError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// ====================== CREATE TABLE ======================
export const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, capacity, branchId } = req.body;
  const userBranchId = req.user.branchId;

  // Validation
  if (!tableNumber || !capacity) {
    throw new CustomError("Table number and capacity are required", 400);
  }

  if (capacity < 1 || capacity > 20) {
    throw new CustomError("Capacity must be between 1 and 20", 400);
  }

  // Use provided branchId or user's branch
  const targetBranch = branchId || userBranchId;
  if (!targetBranch) {
    throw new CustomError("Branch ID is required", 400);
  }

  // Check if branch exists
  const branch = await Branch.findById(targetBranch);
  if (!branch) throw new CustomError("Branch not found", 404);

  // Check if table number already exists in this branch
  const existingTable = await Table.findOne({
    tableNumber,
    branchId: targetBranch,
  });

  if (existingTable) {
    throw new CustomError(
      `Table ${tableNumber} already exists in this branch`,
      409
    );
  }

  // Create table
  const newTable = await Table.create({
    tableNumber,
    capacity,
    branchId: targetBranch,
    status: "available",
  });

  const populatedTable = await Table.findById(newTable._id).populate(
    "branchId",
    "name location"
  );

  res.status(201).json({
    success: true,
    message: "Table created successfully",
    table: populatedTable,
  });
});

// ====================== GET ALL TABLES ======================
export const getAllTables = asyncHandler(async (req, res) => {
  const { branchId, status, sortBy = "tableNumber" } = req.query;
  const userBranchId = req.user.branchId;

  // Build filter
  const filter = {};

  // If branchId provided in query, use it (admin can view all)
  // Otherwise use user's branch
  if (branchId) {
    filter.branchId = branchId;
  } else if (userBranchId) {
    filter.branchId = userBranchId;
  }

  if (status) {
    const validStatuses = ["available", "occupied", "reserved"];
    if (validStatuses.includes(status)) {
      filter.status = status;
    }
  }

  const tables = await Table.find(filter)
    .populate("branchId", "name location")
    .populate("currentOrderId", "orderNumber totalAmount status")
    .populate("mergedWith", "tableNumber")
    .sort({ [sortBy]: 1 });

  // Calculate statistics
  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
  };

  res.status(200).json({
    success: true,
    count: tables.length,
    stats,
    tables,
  });
});

// ====================== GET TABLE BY ID ======================
export const getTableById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const table = await Table.findById(id)
    .populate("branchId", "name location contact")
    .populate("currentOrderId")
    .populate("mergedWith", "tableNumber capacity");

  if (!table) throw new CustomError("Table not found", 404);

  // Get order history for this table (last 10 orders)
  const orderHistory = await Order.find({ tableId: id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("waiterId", "name")
    .select("orderNumber totalAmount status createdAt");

  res.status(200).json({
    success: true,
    table,
    orderHistory,
  });
});

// ====================== UPDATE TABLE ======================
export const updateTable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tableNumber, capacity, status } = req.body;

  const table = await Table.findById(id);
  if (!table) throw new CustomError("Table not found", 404);

  // Validate status change
  if (status) {
    const validStatuses = ["available", "occupied", "reserved"];
    if (!validStatuses.includes(status)) {
      throw new CustomError(
        `Status must be one of: ${validStatuses.join(", ")}`,
        400
      );
    }

    // Can't manually set to occupied if there's an active order
    if (status === "occupied" && !table.currentOrderId) {
      throw new CustomError(
        "Cannot set to occupied without an active order",
        400
      );
    }
  }

  // Update fields
  if (tableNumber !== undefined) {
    // Check if new table number conflicts
    const existingTable = await Table.findOne({
      tableNumber,
      branchId: table.branchId,
      _id: { $ne: id },
    });

    if (existingTable) {
      throw new CustomError(
        `Table ${tableNumber} already exists in this branch`,
        409
      );
    }

    table.tableNumber = tableNumber;
  }

  if (capacity !== undefined) {
    if (capacity < 1 || capacity > 20) {
      throw new CustomError("Capacity must be between 1 and 20", 400);
    }
    table.capacity = capacity;
  }

  if (status) table.status = status;

  await table.save();

  const updatedTable = await Table.findById(id)
    .populate("branchId", "name location")
    .populate("currentOrderId", "orderNumber totalAmount");

  res.status(200).json({
    success: true,
    message: "Table updated successfully",
    table: updatedTable,
  });
});

// ====================== DELETE TABLE ======================
export const deleteTable = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const table = await Table.findById(id);
  if (!table) throw new CustomError("Table not found", 404);

  // Cannot delete if table is occupied
  if (table.status === "occupied") {
    throw new CustomError("Cannot delete occupied table", 400);
  }

  // Cannot delete if there's an active order
  if (table.currentOrderId) {
    throw new CustomError("Cannot delete table with active order", 400);
  }

  await table.deleteOne();

  res.status(200).json({
    success: true,
    message: "Table deleted successfully",
  });
});

// ====================== UPDATE TABLE STATUS ======================
export const updateTableStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) throw new CustomError("Status is required", 400);

  const validStatuses = ["available", "occupied", "reserved"];
  if (!validStatuses.includes(status)) {
    throw new CustomError(
      `Status must be one of: ${validStatuses.join(", ")}`,
      400
    );
  }

  const table = await Table.findById(id);
  if (!table) throw new CustomError("Table not found", 404);

  // Business logic for status changes
  if (status === "available") {
    // Clear current order when making available
    table.currentOrderId = null;
    table.mergedWith = [];
  }

  if (status === "occupied" && !table.currentOrderId) {
    throw new CustomError(
      "Cannot set to occupied without an active order",
      400
    );
  }

  table.status = status;
  await table.save();

  const updatedTable = await Table.findById(id)
    .populate("branchId", "name")
    .populate("currentOrderId", "orderNumber totalAmount");

  res.status(200).json({
    success: true,
    message: `Table status updated to ${status}`,
    table: updatedTable,
  });
});

// ====================== GET AVAILABLE TABLES ======================
export const getAvailableTables = asyncHandler(async (req, res) => {
  const { branchId, minCapacity } = req.query;
  const userBranchId = req.user.branchId;

  const filter = {
    status: "available",
    branchId: branchId || userBranchId,
  };

  if (minCapacity) {
    filter.capacity = { $gte: parseInt(minCapacity) };
  }

  const tables = await Table.find(filter)
    .populate("branchId", "name location")
    .sort({ tableNumber: 1 });

  res.status(200).json({
    success: true,
    count: tables.length,
    tables,
  });
});

// ====================== MERGE TABLES ======================
export const mergeTables = asyncHandler(async (req, res) => {
  const { tableIds } = req.body;

  if (!tableIds || !Array.isArray(tableIds) || tableIds.length < 2) {
    throw new CustomError("At least 2 table IDs are required to merge", 400);
  }

  // Fetch all tables
  const tables = await Table.find({ _id: { $in: tableIds } });

  if (tables.length !== tableIds.length) {
    throw new CustomError("One or more tables not found", 404);
  }

  // Validate all tables are in same branch
  const branchIds = [...new Set(tables.map((t) => t.branchId.toString()))];
  if (branchIds.length > 1) {
    throw new CustomError("Cannot merge tables from different branches", 400);
  }

  // Check if any table is occupied
  const occupiedTable = tables.find((t) => t.status === "occupied");
  if (occupiedTable) {
    throw new CustomError(
      `Table ${occupiedTable.tableNumber} is occupied`,
      400
    );
  }

  // Set primary table (first one) and merge others into it
  const [primaryTable, ...secondaryTables] = tables;

  // Update primary table
  primaryTable.mergedWith = secondaryTables.map((t) => t._id);
  primaryTable.capacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  primaryTable.status = "reserved"; // Set to reserved after merging
  await primaryTable.save();

  // Update secondary tables
  for (const table of secondaryTables) {
    table.status = "reserved";
    table.mergedWith = [primaryTable._id];
    await table.save();
  }

  const mergedTable = await Table.findById(primaryTable._id)
    .populate("branchId", "name")
    .populate("mergedWith", "tableNumber capacity");

  res.status(200).json({
    success: true,
    message: `Tables merged successfully. Total capacity: ${primaryTable.capacity}`,
    table: mergedTable,
  });
});

// ====================== SPLIT TABLES ======================
export const splitTables = asyncHandler(async (req, res) => {
  const { tableId } = req.body;

  if (!tableId) throw new CustomError("Table ID is required", 400);

  const table = await Table.findById(tableId).populate("mergedWith");

  if (!table) throw new CustomError("Table not found", 404);

  if (!table.mergedWith || table.mergedWith.length === 0) {
    throw new CustomError("This table is not merged", 400);
  }

  // Cannot split if table is occupied
  if (table.status === "occupied") {
    throw new CustomError("Cannot split occupied table", 400);
  }

  // Get original table IDs
  const mergedTableIds = table.mergedWith.map((t) => t._id);

  // Reset all tables
  await Table.updateMany(
    { _id: { $in: [...mergedTableIds, table._id] } },
    {
      $set: { status: "available", mergedWith: [] },
    }
  );

  // Reset capacity of primary table to original
  const originalCapacity = table.capacity - table.mergedWith.reduce((sum, t) => sum + t.capacity, 0);
  table.capacity = originalCapacity;
  table.mergedWith = [];
  table.status = "available";
  await table.save();

  const updatedTables = await Table.find({
    _id: { $in: [...mergedTableIds, table._id] },
  }).populate("branchId", "name");

  res.status(200).json({
    success: true,
    message: "Tables split successfully",
    tables: updatedTables,
  });
});

// ====================== RESERVE TABLE ======================
export const reserveTable = asyncHandler(async (req, res) => {
  const { tableId, customerName, reservationTime, guestCount } = req.body;

  if (!tableId || !customerName) {
    throw new CustomError("Table ID and customer name are required", 400);
  }

  const table = await Table.findById(tableId);
  if (!table) throw new CustomError("Table not found", 404);

  if (table.status === "occupied") {
    throw new CustomError("Table is currently occupied", 400);
  }

  if (guestCount && guestCount > table.capacity) {
    throw new CustomError(
      `Table capacity is ${table.capacity}, requested ${guestCount} guests`,
      400
    );
  }

  table.status = "reserved";
  // You might want to add reservation details to table schema
  await table.save();

  res.status(200).json({
    success: true,
    message: "Table reserved successfully",
    table: {
      id: table._id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
      customerName,
      reservationTime,
      guestCount,
    },
  });
});

// ====================== ASSIGN TABLE TO ORDER ======================
export const assignTableToOrder = asyncHandler(async (req, res) => {
  const { tableId, orderId } = req.body;

  if (!tableId || !orderId) {
    throw new CustomError("Table ID and Order ID are required", 400);
  }

  const table = await Table.findById(tableId);
  if (!table) throw new CustomError("Table not found", 404);

  const order = await Order.findById(orderId);
  if (!order) throw new CustomError("Order not found", 404);

  if (table.status === "occupied" && table.currentOrderId) {
    throw new CustomError("Table already has an active order", 400);
  }

  // Update table
  table.status = "occupied";
  table.currentOrderId = orderId;
  await table.save();

  // Update order
  order.tableId = tableId;
  await order.save();

  const updatedTable = await Table.findById(tableId)
    .populate("currentOrderId", "orderNumber totalAmount status")
    .populate("branchId", "name");

  res.status(200).json({
    success: true,
    message: "Table assigned to order successfully",
    table: updatedTable,
  });
});

// ====================== GET TABLE STATS ======================
export const getTableStats = asyncHandler(async (req, res) => {
  const { branchId } = req.query;
  const userBranchId = req.user.branchId;

  const targetBranch = branchId || userBranchId;

  const tables = await Table.find({ branchId: targetBranch });

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
    totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0),
    occupancyRate:
      tables.length > 0
        ? ((tables.filter((t) => t.status === "occupied").length /
            tables.length) *
            100
          ).toFixed(2)
        : 0,
  };

  res.status(200).json({
    success: true,
    branchId: targetBranch,
    stats,
  });
});

// ====================== CLEAR TABLE (After Payment) ======================
export const clearTable = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const table = await Table.findById(id);
  if (!table) throw new CustomError("Table not found", 404);

  // Verify order is paid or cancelled
  if (table.currentOrderId) {
    const order = await Order.findById(table.currentOrderId);
    if (order && order.status !== "paid" && order.status !== "cancelled") {
      throw new CustomError("Order must be paid or cancelled first", 400);
    }
  }

  table.status = "available";
  table.currentOrderId = null;
  await table.save();

  // Emit a socket event to notify clients of the update
  getIo().emit("tableUpdated", table);

  res.status(200).json({
    success: true,
    message: "Table cleared successfully",
    table,
  });
});