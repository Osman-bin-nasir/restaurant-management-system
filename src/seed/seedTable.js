import mongoose from "mongoose";
import dotenv from "dotenv";
import Table from "../models/Table.js";
import Branch from "../models/Branch.js";

dotenv.config();

const seedTables = async () => {
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

    // 3️⃣ Create realistic restaurant table layout
    const tables = [
      // Small tables (2-seater) - near windows/bar
      {
        tableNumber: 1,
        capacity: 2,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 2,
        capacity: 2,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 3,
        capacity: 2,
        status: "occupied",
        branchId: branch._id,
        // Will link to order later
      },
      {
        tableNumber: 4,
        capacity: 2,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 5,
        capacity: 2,
        status: "reserved",
        branchId: branch._id,
      },

      // Medium tables (4-seater) - main dining area
      {
        tableNumber: 6,
        capacity: 4,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 7,
        capacity: 4,
        status: "occupied",
        branchId: branch._id,
      },
      {
        tableNumber: 8,
        capacity: 4,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 9,
        capacity: 4,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 10,
        capacity: 4,
        status: "occupied",
        branchId: branch._id,
      },
      {
        tableNumber: 11,
        capacity: 4,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 12,
        capacity: 4,
        status: "reserved",
        branchId: branch._id,
      },

      // Large tables (6-seater) - family section
      {
        tableNumber: 13,
        capacity: 6,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 14,
        capacity: 6,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 15,
        capacity: 6,
        status: "occupied",
        branchId: branch._id,
      },

      // Extra large (8-seater) - group bookings
      {
        tableNumber: 16,
        capacity: 8,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 17,
        capacity: 8,
        status: "reserved",
        branchId: branch._id,
      },

      // Bar counter seats (1-seater)
      {
        tableNumber: 18,
        capacity: 1,
        status: "available",
        branchId: branch._id,
      },
      {
        tableNumber: 19,
        capacity: 1,
        status: "occupied",
        branchId: branch._id,
      },
      {
        tableNumber: 20,
        capacity: 1,
        status: "available",
        branchId: branch._id,
      },
    ];

    // 4️⃣ Insert tables
    const createdTables = await Table.insertMany(tables);
    console.log(`✅ ${createdTables.length} tables seeded successfully`);

    // 5️⃣ Calculate statistics
    const stats = {
      total: createdTables.length,
      available: createdTables.filter((t) => t.status === "available").length,
      occupied: createdTables.filter((t) => t.status === "occupied").length,
      reserved: createdTables.filter((t) => t.status === "reserved").length,
      totalCapacity: createdTables.reduce((sum, t) => sum + t.capacity, 0),
    };

    console.log("\n📊 Table Statistics:");
    console.log(`Total Tables: ${stats.total}`);
    console.log(`Available: ${stats.available}`);
    console.log(`Occupied: ${stats.occupied}`);
    console.log(`Reserved: ${stats.reserved}`);
    console.log(`Total Seating Capacity: ${stats.totalCapacity} persons`);

    console.log("\n🪑 Table Layout Summary:");
    console.log("- 2-seater tables: 5 (Tables 1-5)");
    console.log("- 4-seater tables: 7 (Tables 6-12)");
    console.log("- 6-seater tables: 3 (Tables 13-15)");
    console.log("- 8-seater tables: 2 (Tables 16-17)");
    console.log("- Bar seats: 3 (Tables 18-20)");

    console.log("\n💡 Usage Tips:");
    console.log("- Occupied tables (3, 7, 10, 15, 19) can be linked to orders");
    console.log("- Reserved tables (5, 12, 17) are ready for customer arrival");
    console.log("- Try merging tables 6 & 7 for larger groups");
    console.log("- Clear occupied tables after orders are paid");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedTables();