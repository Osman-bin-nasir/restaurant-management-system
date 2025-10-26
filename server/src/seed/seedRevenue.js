import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Expense from '../models/Expense.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import Role from '../models/Role.js'; // Import Role model

dotenv.config({ path: './server/.env' });

/**
 * =================================================================
 * 🎯 ADVANCED REVENUE SEED DATA SCRIPT
 * =================================================================
 * Creates realistic, temporally aware historical order and
 * expense data for rich revenue analytics.
 *
 * Features:
 * - Business growth simulation over the seeded period.
 * - Realistic daily, weekly, and seasonal fluctuations.
 * - Peak days simulation (e.g., holidays, events).
 * - Detailed expense model with recurring and one-off costs.
 * - Popularity-weighted menu item selection.
 * - Dynamic order generation based on time of day (rush hours).
 * =================================================================
 */

// --- SCRIPT CONFIGURATION ---
const DAYS_TO_SEED = 90; // Generate data for the last 90 days
const BASE_ORDERS_PER_DAY = { weekday: 25, friday: 40, weekend: 50 };
const ORDER_FLUCTUATION = 10; // +/-
const BUSINESS_GROWTH_FACTOR = 0.15; // 15% growth over the period
const PEAK_DAY_CHANCE = 0.05; // 5% chance for any day to be a "peak day"
const PEAK_DAY_MULTIPLIER = 1.8; // 80% more orders on a peak day
const BATCH_SIZE = 200; // For DB insertion

const seedRevenueData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ==================== STEP 1: FETCHING DEPENDENCIES ====================
    console.log('📋 Step 1: Fetching existing data...');
    
    const branch = await Branch.findOne({ name: 'Main Branch - Downtown' });
    if (!branch) throw new Error('❌ Main branch not found. Run seedAll.js first.');

    // Correctly fetch users by role
    const cashierRole = await Role.findOne({ name: 'cashier' });
    const waiterRole = await Role.findOne({ name: 'waiter' });
    if (!cashierRole || !waiterRole) throw new Error('❌ Cashier or Waiter role not found in database.');

    const cashier = await User.findOne({ email: 'cashier@restaurant.com', role: cashierRole._id });
    const waiters = await User.find({ role: waiterRole._id });

    if (!cashier || waiters.length === 0) {
      throw new Error('❌ Required users (cashier, waiter) not found. Run seedAll.js first.');
    }

    const menuItems = await MenuItem.find({ branchId: branch._id });
    if (menuItems.length === 0) throw new Error('❌ No menu items found. Run seedAll.js first.');

    const tables = await Table.find({ branchId: branch._id });
    if (tables.length === 0) throw new Error('❌ No tables found. Run seedAll.js first.');

    console.log(`✅ Found: ${menuItems.length} menu items, ${tables.length} tables, ${waiters.length + 1} required users.`);

    // ==================== STEP 2: CLEARING PREVIOUS DATA ====================
    console.log('🧹 Step 2: Clearing existing revenue data...');
    
    const { deletedCount: deletedOrders } = await Order.deleteMany({ branchId: branch._id });
    const { deletedCount: deletedExpenses } = await Expense.deleteMany({ branchId: branch._id });

    console.log(`✅ Cleared ${deletedOrders} orders and ${deletedExpenses} expenses.`);
    console.log('✅ Step 2 Complete');

    // ==================== STEP 3: GENERATING HISTORICAL DATA ====================
    console.log(`📊 Step 3: Generating historical data for ${DAYS_TO_SEED} days...`);
    console.log('⏳ This may take a minute...');

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - DAYS_TO_SEED);

    const orders = [];
    const expenses = [];
    let orderCounter = 1;

    // --- HELPERS ---
    const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

    const paymentMethods = ['cash', 'card', 'upi'];
    const paymentWeights = [0.4, 0.35, 0.25];
    const getRandomPaymentMethod = () => {
      const rand = Math.random();
      let sum = 0;
      for (let i = 0; i < paymentWeights.length; i++) {
        sum += paymentWeights[i];
        if (rand < sum) return paymentMethods[i];
      }
      return 'cash';
    };

    // Create a weighted list of menu items based on "popularity"
    const popularMenuItems = menuItems.flatMap(item => {
      const weight = item.category === 'Main Course' ? 3 : item.category === 'Appetizer' ? 2 : 1;
      return Array(weight).fill(item);
    });

    // --- MAIN GENERATION LOOP ---
    for (let d = 0; d < DAYS_TO_SEED; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + d);
      const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat

      // Determine base order count for the day
      let baseOrderCount;
      if (dayOfWeek === 0 || dayOfWeek === 6) baseOrderCount = BASE_ORDERS_PER_DAY.weekend;
      else if (dayOfWeek === 5) baseOrderCount = BASE_ORDERS_PER_DAY.friday;
      else baseOrderCount = BASE_ORDERS_PER_DAY.weekday;

      // Apply growth factor - more orders in recent days
      const growth = (d / DAYS_TO_SEED) * BUSINESS_GROWTH_FACTOR;
      let ordersPerDay = Math.round(baseOrderCount * (1 + growth));
      
      // Apply random fluctuation
      ordersPerDay += getRandomInt(-ORDER_FLUCTUATION, ORDER_FLUCTUATION);

      // Check for peak day
      if (Math.random() < PEAK_DAY_CHANCE) {
        ordersPerDay = Math.round(ordersPerDay * PEAK_DAY_MULTIPLIER);
      }
      ordersPerDay = Math.max(5, ordersPerDay); // Ensure at least 5 orders

      if (d % 10 === 0) console.log(`📅 Processing Day ${d + 1}/${DAYS_TO_SEED}... (${ordersPerDay} orders)`);

      // --- ORDER GENERATION ---
      for (let i = 0; i < ordersPerDay; i++) {
        const hour = Math.random() < 0.5 ? getRandomInt(12, 15) : getRandomInt(18, 22);
        const minute = getRandomInt(0, 59);
        const orderDate = new Date(currentDate);
        orderDate.setHours(hour, minute);

        const numItems = getRandomInt(1, 5);
        let totalAmount = 0;
        const orderItems = Array.from({ length: numItems }, () => {
          const menuItem = getRandomItem(popularMenuItems);
          const quantity = getRandomInt(1, 2);
          totalAmount += menuItem.price * quantity;
          return {
            menuItem: menuItem._id,
            quantity,
            priceAtOrder: menuItem.price,
            status: 'served',
          };
        });

        const hasDiscount = Math.random() < 0.2;
        const discount = hasDiscount ? totalAmount * getRandomFloat(0.05, 0.15) : 0;
        const finalAmount = totalAmount - discount;

        orders.push({
          orderNumber: `ORD-${Date.now()}-${orderCounter++}`,
          type: Math.random() < 0.7 ? 'dine-in' : 'parcel',
          tableId: getRandomItem(tables)._id,
          items: orderItems,
          totalAmount,
          status: 'paid',
          waiterId: getRandomItem(waiters)._id,
          cashierId: cashier._id,
          branchId: branch._id,
          payment: {
            method: getRandomPaymentMethod(),
            amount: finalAmount,
            originalAmount: totalAmount,
            discount,
            paidAt: new Date(orderDate.getTime() + 15 * 60000),
          },
          createdAt: orderDate,
          updatedAt: new Date(orderDate.getTime() + 15 * 60000),
        });
      }

      // --- EXPENSE GENERATION ---
      const expenseDate = new Date(currentDate);
      expenseDate.setHours(10, 0, 0, 0);

      // Daily recurring expenses
      expenses.push({
        category: 'Groceries',
        amount: getRandomFloat(3000, 6000) * (ordersPerDay / baseOrderCount), // Scale with orders
        description: 'Daily purchase of fresh ingredients',
        date: expenseDate,
        branchId: branch._id,
      });

      // Weekly expenses
      if (dayOfWeek === 1) { // Monday
        expenses.push({
          category: 'Supplies',
          amount: getRandomFloat(1000, 2500),
          description: 'Weekly cleaning and kitchen supplies',
          date: expenseDate,
          branchId: branch._id,
        });
      }

      // Monthly expenses
      if (currentDate.getDate() === 1) {
        expenses.push({ category: 'Rent', amount: 50000, description: 'Monthly rent', date: expenseDate, branchId: branch._id });
        expenses.push({ category: 'Utilities', amount: getRandomFloat(8000, 12000), description: 'Electricity, water, gas bills', date: expenseDate, branchId: branch._id });
      }
      if (currentDate.getDate() === 28) {
        expenses.push({ category: 'Salaries', amount: 150000, description: 'Monthly staff salaries', date: expenseDate, branchId: branch._id });
      }

      // Random one-off expenses
      if (Math.random() < 0.03) {
        expenses.push({
          category: 'Maintenance',
          amount: getRandomFloat(5000, 15000),
          description: 'Unexpected equipment repair',
          date: expenseDate,
          branchId: branch._id,
        });
      }
    }
    console.log('✅ Step 3 Complete');

    // ==================== STEP 4: INSERTING INTO DATABASE ====================
    console.log('💾 Step 4: Inserting data into database...');
    if (orders.length > 0) {
      await Order.insertMany(orders, { ordered: false, batchSize: BATCH_SIZE });
      console.log(`✅ Inserted ${orders.length} orders.`);
    }
    if (expenses.length > 0) {
      await Expense.insertMany(expenses, { ordered: false, batchSize: BATCH_SIZE });
      console.log(`✅ Inserted ${expenses.length} expenses.`);
    }
    console.log('✅ Step 4 Complete');

    // ==================== STEP 5: FINAL SUMMARY ====================
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 REVENUE DATA SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════');

    const totalRevenue = orders.reduce((sum, o) => sum + (o.payment?.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    console.log('📊 DATA SUMMARY:');
    console.log(`   - Period: ${startDate.toDateString()} to ${today.toDateString()}`);
    console.log(`   - Total Orders Generated: ${orders.length}`);
    console.log(`   - Total Expenses Generated: ${expenses.length}`);

    console.log('💰 FINANCIAL OVERVIEW:');
    console.log(`   - Total Revenue: ${totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);
    console.log(`   - Total Expenses: ${totalExpenses.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);
    console.log(`   - Net Profit: ${netProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);
    console.log(`   - Avg Order Value: ${(totalRevenue / orders.length).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);

    console.log('✨ All done! You can now start the application and view the new revenue dashboard.');
    process.exit(0);

  } catch (error) {
    console.error('❌ SEEDING FAILED:', error.message);
    console.error(error.stack);
    console.error('💡 TROUBLESHOOTING:');
    console.error('   1. Ensure MongoDB is running.');
    console.error('   2. Verify the MONGO_URI in your .env file.');
    console.error('   3. Run `npm run seed:all` first to ensure base data exists.');
    process.exit(1);
  }
};

seedRevenueData();
