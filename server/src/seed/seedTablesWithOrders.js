import mongoose from "mongoose";
import dotenv from "dotenv";
import Table from "../models/Table.js";
import Order from "../models/Order.js";
import Branch from "../models/Branch.js";

dotenv.config();

const seedTablesWithOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1️⃣ Get existing branch
    const branch = await Branch.findOne({ name: "Main Branch" });
    if (!branch) {
      throw new Error("Branch not found. Run seedData.js first.");
    }

    // 2️⃣ Clear existing tables
    await Table.deleteMany({ branchId: branch._id });
    console.log("🧹 Cleared existing tables");

    // 3️⃣ Create tables
    const tablesData = [
      // Available tables
      { tableNumber: 1, capacity: 2, status: "available" },
      { tableNumber: 2, capacity: 2, status: "available" },
      { tableNumber: 4, capacity: 2, status: "available" },
      { tableNumber: 6, capacity: 4, status: "available" },
      { tableNumber: 8, capacity: 4, status: "available" },
      { tableNumber: 9, capacity: 4, status: "available" },
      { tableNumber: 11, capacity: 4, status: "available" },
      { tableNumber: 13, capacity: 6, status: "available" },
      { tableNumber: 14, capacity: 6, status: "available" },
      { tableNumber: 16, capacity: 8, status: "available" },
      { tableNumber: 18, capacity: 1, status: "available" },
      { tableNumber: 20, capacity: 1, status: "available" },

      // Reserved tables
      { tableNumber: 5, capacity: 2, status: "reserved" },
      { tableNumber: 12, capacity: 4, status: "reserved" },
      { tableNumber: 17, capacity: 8, status: "reserved" },

      // Occupied tables (will link to orders)
      { tableNumber: 3, capacity: 2, status: "occupied" },
      { tableNumber: 7, capacity: 4, status: "occupied" },
      { tableNumber: 10, capacity: 4, status: "occupied" },
      { tableNumber: 15, capacity: 6, status: "occupied" },
      { tableNumber: 19, capacity: 1, status: "occupied" },
    ];

    const tables = [];
    for (const tableData of tablesData) {
      tables.push({
        ...tableData,
        branchId: branch._id,
        currentOrderId: null,
        mergedWith: [],
      });
    }

    const createdTables = await Table.insertMany(tables);
    console.log(`✅ ${createdTables.length} tables seeded successfully`);

    // 4️⃣ Get existing dine-in orders
    const existingOrders = await Order.find({
      branchId: branch._id,
      type: "dine-in",
      status: { $in: ["placed", "in-kitchen", "ready", "served"] },
    }).sort({ createdAt: 1 });

    console.log(`📋 Found ${existingOrders.length} dine-in orders`);

    // 5️⃣ Link occupied tables to orders
    const occupiedTables = createdTables.filter((t) => t.status === "occupied");

    if (existingOrders.length > 0 && occupiedTables.length > 0) {
      for (let i = 0; i < Math.min(occupiedTables.length, existingOrders.length); i++) {
        const table = occupiedTables[i];
        const order = existingOrders[i];

        // Update table with order
        table.currentOrderId = order._id;
        await table.save();

        // Update order with table
        order.tableId = table._id;
        await order.save();

        console.log(
          `🔗 Linked Table ${table.tableNumber} ➔ Order ${order.orderNumber}`
        );
      }
    } else {
      console.log("⚠️  No existing orders to link. Run seedOrders.js first if needed.");
    }

    // 6️⃣ Calculate statistics
    const finalTables = await Table.find({ branchId: branch._id });
    const stats = {
      total: finalTables.length,
      available: finalTables.filter((t) => t.status === "available").length,
      occupied: finalTables.filter((t) => t.status === "occupied").length,
      reserved: finalTables.filter((t) => t.status === "reserved").length,
      withOrders: finalTables.filter((t) => t.currentOrderId).length,
      totalCapacity: finalTables.reduce((sum, t) => sum + t.capacity, 0),
      occupancyRate: (
        (finalTables.filter((t) => t.status === "occupied").length /
          finalTables.length) *
        100
      ).toFixed(2),
    };

    console.log("\n📊 Table Statistics:");
    console.log(`Total Tables: ${stats.total}`);
    console.log(`Available: ${stats.available}`);
    console.log(`Occupied: ${stats.occupied} (${stats.occupancyRate}% occupancy)`);
    console.log(`Reserved: ${stats.reserved}`);
    console.log(`With Active Orders: ${stats.withOrders}`);
    console.log(`Total Seating Capacity: ${stats.totalCapacity} persons`);

    console.log("\n🪑 Table Breakdown by Size:");
    console.log(`- 1-seater (bar): ${finalTables.filter((t) => t.capacity === 1).length}`);
    console.log(`- 2-seater: ${finalTables.filter((t) => t.capacity === 2).length}`);
    console.log(`- 4-seater: ${finalTables.filter((t) => t.capacity === 4).length}`);
    console.log(`- 6-seater: ${finalTables.filter((t) => t.capacity === 6).length}`);
    console.log(`- 8-seater: ${finalTables.filter((t) => t.capacity === 8).length}`);

    console.log("\n✅ Table Management Ready!");
    console.log("\n💡 Try These Operations:");
    console.log("1. GET /api/tables - View all tables");
    console.log("2. GET /api/tables/available - Find free tables");
    console.log("3. POST /api/tables/merge - Merge tables 6 & 8");
    console.log("4. PATCH /api/tables/:id/status - Change table status");
    console.log("5. POST /api/tables/:id/clear - Clear table after payment");
    console.log("6. GET /api/tables/stats - View occupancy statistics");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedTablesWithOrders();