import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";

dotenv.config();

const seedOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1️⃣ Fetch existing references
    const branch = await Branch.findOne({ name: "Main Branch" });
    if (!branch) throw new Error("Branch not found. Run seedData.js first.");

    const waiter = await User.findOne({ email: "waiter@restaurant.com" });
    const cashier = await User.findOne({ email: "cashier@restaurant.com" });
    const chef = await User.findOne({ email: "chef@restaurant.com" });
    if (!waiter || !cashier || !chef)
      throw new Error("Required users not found. Run seedData.js first.");

    const menuItems = await MenuItem.find();
    if (menuItems.length === 0)
      throw new Error("No menu items found. Run seedMenu.js first.");

    // 2️⃣ Clear existing orders and tables
    await Order.deleteMany({});
    await Table.deleteMany({});
    console.log("🧹 Cleared existing orders & tables");

    // 3️⃣ Create sample tables
    const tables = await Table.insertMany([
      { tableNumber: 1, capacity: 2, status: "available", branchId: branch._id },
      { tableNumber: 2, capacity: 4, status: "available", branchId: branch._id },
      { tableNumber: 3, capacity: 4, status: "available", branchId: branch._id },
      { tableNumber: 4, capacity: 6, status: "available", branchId: branch._id },
      { tableNumber: 5, capacity: 2, status: "available", branchId: branch._id },
    ]);
    console.log("🪑 Tables seeded successfully");

    // Helper to find menu items by name
    const findItem = (name) => menuItems.find((m) => m.name === name);

    // 4️⃣ Create sample orders (auto total)
    const orders = [
      {
        orderNumber: `ORD-${Date.now()}-A1`,
        type: "dine-in",
        tableId: tables[0]._id,
        items: [
          { menuItem: findItem("Margherita Pizza")._id, quantity: 2, notes: "Extra cheese" },
          { menuItem: findItem("Cold Coffee")._id, quantity: 2, notes: "Less sugar" },
        ],
        status: "placed",
        customerName: "Ravi Kumar",
        waiterId: waiter._id,
        branchId: branch._id,
      },
      {
        orderNumber: `ORD-${Date.now() + 1000}-B2`,
        type: "dine-in",
        tableId: tables[1]._id,
        items: [
          { menuItem: findItem("Chicken Biryani")._id, quantity: 1, notes: "Spicy" },
          { menuItem: findItem("Gulab Jamun")._id, quantity: 1, notes: "" },
        ],
        status: "in-kitchen",
        customerName: "Priya Sharma",
        waiterId: waiter._id,
        branchId: branch._id,
      },
      {
        orderNumber: `ORD-${Date.now() + 2000}-C3`,
        type: "parcel",
        items: [
          { menuItem: findItem("Veg Burger")._id, quantity: 2, notes: "Extra mayo" },
          { menuItem: findItem("Cold Coffee")._id, quantity: 2, notes: "" },
        ],
        status: "served",
        customerName: "Online Order",
        waiterId: waiter._id,
        cashierId: cashier._id,
        branchId: branch._id,
      },
      {
        orderNumber: `ORD-${Date.now() + 3000}-D4`,
        type: "dine-in",
        tableId: tables[2]._id,
        items: [
          { menuItem: findItem("Margherita Pizza")._id, quantity: 1, notes: "" },
          { menuItem: findItem("Chicken Biryani")._id, quantity: 1, notes: "Medium spicy" },
        ],
        status: "ready",
        customerName: "Rohan Verma",
        waiterId: waiter._id,
        branchId: branch._id,
      },
      {
        orderNumber: `ORD-${Date.now() + 4000}-E5`,
        type: "dine-in",
        tableId: tables[3]._id,
        items: [
          { menuItem: findItem("Veg Burger")._id, quantity: 1, notes: "" },
          { menuItem: findItem("Gulab Jamun")._id, quantity: 2, notes: "Extra syrup" },
        ],
        status: "paid",
        customerName: "Amit Patel",
        waiterId: waiter._id,
        cashierId: cashier._id,
        branchId: branch._id,
      },
    ];

    // 🧮 Auto-calculate totalAmount for each order
    for (const order of orders) {
      order.totalAmount = order.items.reduce((sum, item) => {
        const menu = menuItems.find((m) => m._id.equals(item.menuItem));
        return sum + (menu.price * item.quantity);
      }, 0);
    }

    await Order.insertMany(orders);
    console.log("✅ Orders seeded successfully");

    console.log("\n📋 Sample Orders Summary:");
    orders.forEach((o, i) =>
      console.log(
        `${i + 1}. ${o.customerName} | ${o.type} | ₹${o.totalAmount} | ${o.status}`
      )
    );

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedOrders();
