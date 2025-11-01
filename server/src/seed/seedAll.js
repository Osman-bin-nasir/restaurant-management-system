import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
// Models
import Role from '../models/Role.js';
import Permission from '../models/Permissions.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import ParcelOrder from '../models/ParcelOrder.js';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
dotenv.config({ path: './server/.env' });

/**
 * =================================================================
 * 🎯 PROFIT-OPTIMIZED RESTAURANT SEED SCRIPT
 * =================================================================
 * Creates complete restaurant data with guaranteed profitability:
 * - Increased order volume (8-12 orders per day instead of 3)
 * - Optimized expense structure
 * - Balanced revenue vs costs
 * =================================================================
 */

// --- REVENUE SEED CONFIGURATION ---
const DAYS_TO_SEED = 92; // Aug 1 to Oct 31, 2025
const BATCH_SIZE = 200;

const seedAll = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ==================== CLEAR EXISTING DATA ====================
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Permission.deleteMany({}),
      Role.deleteMany({}),
      User.deleteMany({}),
      Branch.deleteMany({}),
      MenuItem.deleteMany({}),
      Table.deleteMany({}),
      Order.deleteMany({}),
      ParcelOrder.deleteMany({}),
      Revenue.deleteMany({}),
      Expense.deleteMany({})
    ]);
    console.log('✅ Database cleared\n');

    // ==================== 1. CREATE PERMISSIONS ====================
    console.log('📋 Creating permissions...');
    const permissionsList = [
      // Users
      { name: 'users:view', description: 'View users' },
      { name: 'users:create', description: 'Create new users' },
      { name: 'users:update', description: 'Update user details' },
      { name: 'users:delete', description: 'Delete users' },
     
      // Roles & Permissions
      { name: 'permissions:view', description: 'View roles & permissions' },
      { name: 'permissions:create', description: 'Create roles & permissions' },
      { name: 'permissions:update', description: 'Update roles & permissions' },
      { name: 'permissions:delete', description: 'Delete roles & permissions' },
     
      // Branches
      { name: 'branches:view', description: 'View branches' },
      { name: 'branches:create', description: 'Create branches' },
      { name: 'branches:update', description: 'Update branches' },
      { name: 'branches:delete', description: 'Delete branches' },
     
      // Orders
      { name: 'orders:view', description: 'View orders' },
      { name: 'orders:create', description: 'Create orders' },
      { name: 'orders:update', description: 'Update order status' },
      { name: 'orders:delete', description: 'Delete/cancel orders' },
     
      // Menu
      { name: 'menu:view', description: 'View menu items' },
      { name: 'menu:create', description: 'Add menu items' },
      { name: 'menu:update', description: 'Update menu items' },
      { name: 'menu:delete', description: 'Delete menu items' },
     
      // Inventory
      { name: 'inventory:view', description: 'View inventory' },
      { name: 'inventory:create', description: 'Add inventory items' },
      { name: 'inventory:update', description: 'Update inventory' },
      { name: 'inventory:delete', description: 'Delete inventory items' },
     
      // Tables
      { name: 'tables:view', description: 'View table status' },
      { name: 'tables:create', description: 'Create tables' },
      { name: 'tables:update', description: 'Update table status' },
      { name: 'tables:manage', description: 'Merge/split tables' },
     
      // Billing
      { name: 'billing:view', description: 'View bills' },
      { name: 'billing:create', description: 'Generate bills' },
      { name: 'billing:process', description: 'Process payments' },
      { name: 'billing:discount', description: 'Apply discounts' },
     
      // Reports
      { name: 'reports:view', description: 'View reports' },
      { name: 'reports:generate', description: 'Generate reports' },
      { name: 'reports:export', description: 'Export reports' },
     
      // Kitchen
      { name: 'kitchen:view', description: 'View kitchen orders' },
      { name: 'kitchen:update', description: 'Update order cooking status' },
     
      // Expenses
      { name: 'expenses:view', description: 'View expenses' },
      { name: 'expenses:create', description: 'Add expenses' },
      { name: 'expenses:approve', description: 'Approve expenses' },
     
      // Attendance
      { name: 'attendance:view', description: 'View attendance' },
      { name: 'attendance:mark', description: 'Mark attendance' }
    ];

    const createdPermissions = await Permission.insertMany(permissionsList);
    const permissionMap = {};
    createdPermissions.forEach(p => (permissionMap[p.name] = p._id));
    console.log(`✅ Created ${createdPermissions.length} permissions\n`);

    // ==================== 2. CREATE ROLES ====================
    console.log('👥 Creating roles...');
    const roleDefinitions = [
      {
        name: 'admin',
        permissions: Object.values(permissionMap)
      },
      {
        name: 'manager',
        permissions: [
          'branches:view', 'branches:update',
          'users:view', 'users:create', 'users:update',
          'orders:view', 'orders:update', 'orders:delete',
          'menu:view', 'menu:create', 'menu:update', 'menu:delete',
          'inventory:view', 'inventory:update',
          'tables:view', 'tables:update', 'tables:manage',
          'reports:view', 'reports:generate', 'reports:export',
          'expenses:view', 'expenses:create', 'expenses:approve',
          'attendance:view', 'attendance:mark'
        ].map(p => permissionMap[p])
      },
      {
        name: 'cashier',
        permissions: [
          'orders:view', 'orders:create', 'orders:update',
          'billing:view', 'billing:create', 'billing:process', 'billing:discount',
          'menu:view',
          'tables:view'
        ].map(p => permissionMap[p])
      },
      {
        name: 'waiter',
        permissions: [
          'orders:view', 'orders:create', 'orders:update',
          'tables:view', 'tables:update', 'tables:manage',
          'menu:view'
        ].map(p => permissionMap[p])
      },
      {
        name: 'chef',
        permissions: [
          'kitchen:view', 'kitchen:update',
          'orders:view',
          'inventory:view'
        ].map(p => permissionMap[p])
      }
    ];

    const createdRoles = await Role.insertMany(roleDefinitions);
    const roleMap = {};
    createdRoles.forEach(r => (roleMap[r.name] = r._id));
    console.log(`✅ Created ${createdRoles.length} roles\n`);

    // ==================== 3. CREATE BRANCHES ====================
    console.log('🏢 Creating branches...');
    const branches = [
      {
        name: 'Main Branch - Downtown',
        location: 'Downtown, City Center, 123 Main Street',
        contact: '+91-9876543210',
        operatingHours: { open: '9:00 AM', close: '11:00 PM' },
        status: 'active'
      },
      {
        name: 'North Branch - Mall Road',
        location: 'Mall Road, Near City Mall, 456 North Ave',
        contact: '+91-9876543211',
        operatingHours: { open: '10:00 AM', close: '10:00 PM' },
        status: 'active'
      },
      {
        name: 'South Branch - Beach Side',
        location: 'Beach Road, Ocean View, 789 South Blvd',
        contact: '+91-9876543212',
        operatingHours: { open: '11:00 AM', close: '12:00 AM' },
        status: 'active'
      }
    ];

    const createdBranches = await Branch.insertMany(branches);
    const mainBranch = createdBranches[0];
    console.log(`✅ Created ${createdBranches.length} branches\n`);

    // ==================== 4. CREATE USERS ====================
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('123456', 10);
   
    const users = [
      {
        name: 'Super Admin',
        email: 'admin@restaurant.com',
        password: hashedPassword,
        role: roleMap['admin'],
        shift: 'morning',
        branchId: mainBranch._id,
        employeeId: 'EMP001',
        isActive: true,
        isAccountVerified: true
      },
      {
        name: 'John Manager',
        email: 'manager@restaurant.com',
        password: hashedPassword,
        role: roleMap['manager'],
        shift: 'morning',
        branchId: mainBranch._id,
        employeeId: 'EMP002',
        isActive: true,
        isAccountVerified: true
      },
      {
        name: 'Priya Cashier',
        email: 'cashier@restaurant.com',
        password: hashedPassword,
        role: roleMap['cashier'],
        shift: 'evening',
        branchId: mainBranch._id,
        employeeId: 'EMP003',
        isActive: true,
        isAccountVerified: true
      },
      {
        name: 'Ravi Waiter',
        email: 'waiter@restaurant.com',
        password: hashedPassword,
        role: roleMap['waiter'],
        shift: 'evening',
        branchId: mainBranch._id,
        employeeId: 'EMP004',
        isActive: true,
        isAccountVerified: true
      },
      {
        name: 'Chef Arjun',
        email: 'chef@restaurant.com',
        password: hashedPassword,
        role: roleMap['chef'],
        shift: 'morning',
        branchId: mainBranch._id,
        employeeId: 'EMP005',
        isActive: true,
        isAccountVerified: true
      },
      {
        name: 'Sarah Waiter',
        email: 'waiter2@restaurant.com',
        password: hashedPassword,
        role: roleMap['waiter'],
        shift: 'morning',
        branchId: mainBranch._id,
        employeeId: 'EMP006',
        isActive: true,
        isAccountVerified: true
      },
      {
        name: 'Chef Maria',
        email: 'chef2@restaurant.com',
        password: hashedPassword,
        role: roleMap['chef'],
        shift: 'evening',
        branchId: mainBranch._id,
        employeeId: 'EMP007',
        isActive: true,
        isAccountVerified: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    const cashier = createdUsers.find(u => u.email === 'cashier@restaurant.com');
    const waiters = createdUsers.filter(u => u.email.includes('waiter'));
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // ==================== 5. CREATE MENU ITEMS ====================
    console.log('🍽️ Creating menu items...');
    const menuItems = [
      // Snacks
      {
        name: 'Paneer Tikka',
        category: 'Snack',
        price: 249,
        description: 'Grilled cottage cheese marinated in Indian spices',
        image: 'https://images.unsplash.com/photo-1701579231320-cc2f7acad3cd?ixlib=rb-4.0.3',
        cookingTime: 15,
        availability: true,
        ingredients: ['Paneer', 'Yogurt', 'Spices', 'Bell Peppers'],
        branchId: mainBranch._id
      },
      {
        name: 'Chicken Wings',
        category: 'Snack',
        price: 299,
        description: 'Crispy fried chicken wings with hot sauce',
        image: 'https://images.unsplash.com/photo-1637273484026-11d51fb64024?ixlib=rb-4.0.3',
        cookingTime: 20,
        availability: true,
        ingredients: ['Chicken', 'Hot Sauce', 'Butter'],
        branchId: mainBranch._id
      },
      {
        name: 'French Fries',
        category: 'Snack',
        price: 129,
        description: 'Golden crispy potato fries with ketchup',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
        cookingTime: 10,
        availability: true,
        ingredients: ['Potato', 'Salt', 'Oil'],
        branchId: mainBranch._id
      },
      {
        name: 'Butter Naan',
        category: 'Snack',
        price: 49,
        description: 'Soft leavened bread with butter',
        image: 'https://images.unsplash.com/photo-1690915475901-6c08af925906?ixlib=rb-4.0.3',
        cookingTime: 5,
        availability: true,
        ingredients: ['Flour', 'Butter', 'Yeast'],
        branchId: mainBranch._id
      },
     
      // Meals
      {
        name: 'Chicken Biryani',
        category: 'Meal',
        price: 349,
        description: 'Aromatic rice cooked with marinated chicken and spices',
        image: 'https://images.unsplash.com/photo-1701579231305-d84d8af9a3fd?ixlib=rb-4.0.3',
        cookingTime: 30,
        availability: true,
        ingredients: ['Rice', 'Chicken', 'Spices', 'Onion', 'Yogurt'],
        branchId: mainBranch._id
      },
      {
        name: 'Butter Chicken',
        category: 'Meal',
        price: 379,
        description: 'Tender chicken in creamy tomato gravy',
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500',
        cookingTime: 25,
        availability: true,
        ingredients: ['Chicken', 'Butter', 'Cream', 'Tomato', 'Spices'],
        branchId: mainBranch._id
      },
     
      // Vegan
      {
        name: 'Paneer Butter Masala',
        category: 'Vegan',
        price: 299,
        description: 'Cottage cheese cubes in rich tomato gravy',
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500',
        cookingTime: 20,
        availability: true,
        ingredients: ['Paneer', 'Tomato', 'Cream', 'Butter', 'Spices'],
        branchId: mainBranch._id
      },
     
      // Drinks
      {
        name: 'Mango Lassi',
        category: 'Drink',
        price: 99,
        description: 'Sweet yogurt drink blended with mango',
        image: 'https://images.unsplash.com/photo-1600788907416-456578634209?w=500',
        cookingTime: 5,
        availability: true,
        ingredients: ['Yogurt', 'Mango', 'Sugar'],
        branchId: mainBranch._id
      },
      {
        name: 'Cold Coffee',
        category: 'Drink',
        price: 129,
        description: 'Chilled coffee blended with milk and ice cream',
        image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500',
        cookingTime: 5,
        availability: true,
        ingredients: ['Coffee', 'Milk', 'Sugar', 'Ice Cream'],
        branchId: mainBranch._id
      },
      {
        name: 'Fresh Lime Soda',
        category: 'Drink',
        price: 79,
        description: 'Refreshing lime soda with mint',
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500',
        cookingTime: 3,
        availability: true,
        ingredients: ['Lime', 'Soda', 'Mint', 'Sugar'],
        branchId: mainBranch._id
      },
      {
        name: 'Masala Chai',
        category: 'Drink',
        price: 49,
        description: 'Traditional Indian tea with spices',
        image: 'https://images.unsplash.com/photo-1619581073186-5b4ae1b0caad?ixlib=rb-4.0.3',
        cookingTime: 10,
        availability: true,
        ingredients: ['Tea', 'Milk', 'Spices', 'Sugar'],
        branchId: mainBranch._id
      },
     
      // Desserts
      {
        name: 'Ice Cream Sundae',
        category: 'Dessert',
        price: 149,
        description: 'Vanilla ice cream with chocolate sauce and nuts',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500',
        cookingTime: 3,
        availability: true,
        ingredients: ['Ice Cream', 'Chocolate Sauce', 'Nuts'],
        branchId: mainBranch._id
      }
    ];

    const createdMenuItems = await MenuItem.insertMany(menuItems);
    console.log(`✅ Created ${createdMenuItems.length} menu items\n`);

    // ==================== 6. CREATE TABLES ====================
    console.log('🪑 Creating tables...');
    const tables = [];
   
    for (let i = 1; i <= 8; i++) {
      tables.push({
        tableNumber: i,
        capacity: 2,
        status: 'available',
        branchId: mainBranch._id,
        currentOrderId: null,
        mergedWith: []
      });
    }
   
    for (let i = 9; i <= 16; i++) {
      tables.push({
        tableNumber: i,
        capacity: 4,
        status: 'available',
        branchId: mainBranch._id,
        currentOrderId: null,
        mergedWith: []
      });
    }
   
    for (let i = 17; i <= 20; i++) {
      tables.push({
        tableNumber: i,
        capacity: 6,
        status: 'available',
        branchId: mainBranch._id,
        currentOrderId: null,
        mergedWith: []
      });
    }
   
    for (let i = 21; i <= 22; i++) {
      tables.push({
        tableNumber: i,
        capacity: 8,
        status: 'available',
        branchId: mainBranch._id,
        currentOrderId: null,
        mergedWith: []
      });
    }

    const createdTables = await Table.insertMany(tables);
    console.log(`✅ Created ${createdTables.length} tables\n`);

    // ==================== 7. GENERATE HISTORICAL ORDERS & EXPENSES ====================
    console.log(`📊 Generating historical orders from August 1, 2025 to October 31, 2025...`);
    console.log('⏳ This may take a moment...');

    const today = new Date('2025-11-01');
    const startDate = new Date('2025-08-01');
    const dineInOrders = [];
    const parcelOrders = [];
    let orderCounter = 1;

    // Helper functions
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

    // Weighted menu items (higher probability for higher-priced items)
    const popularMenuItems = createdMenuItems.flatMap(item => {
      let weight = 1;
      if (item.price > 300) weight = 4; // High-priced items (meals)
      else if (item.price > 200) weight = 3; // Medium-priced items
      else if (item.price > 100) weight = 2; // Lower-priced items
      return Array(weight).fill(item);
    });

    // Customer data for parcel
    const customerNames = ['Amit Kumar', 'Priya Sharma', 'Rohan Verma', 'Deepak Patel', 'Neha Singh', 'Rajesh Gupta', 'Sonia Mehra', 'Vikram Joshi'];
    const getRandomCustomerName = () => getRandomItem(customerNames);
    const getRandomPhone = () => '+91-' + (Math.floor(Math.random() * 9000000000) + 1000000000).toString();

    // Generate orders: 6-8 dine-in + 2-4 parcel per day (8-12 total orders per day)
    for (let d = 0; d < DAYS_TO_SEED; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + d);
      
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      
      // More orders on weekends
      const dineInOrdersPerDay = isWeekend ? getRandomInt(8, 12) : getRandomInt(6, 9);
      const parcelOrdersPerDay = isWeekend ? getRandomInt(3, 5) : getRandomInt(2, 4);
      
      const totalOrdersPerDay = dineInOrdersPerDay + parcelOrdersPerDay;

      if (d % 15 === 0) console.log(`📅 Processing Day ${d + 1}/${DAYS_TO_SEED}... (${totalOrdersPerDay} orders)`);

      // Generate dine-in orders
      for (let i = 0; i < dineInOrdersPerDay; i++) {
        const hour = Math.random() < 0.6 ? getRandomInt(12, 15) : getRandomInt(18, 22);
        const minute = getRandomInt(0, 59);
        const orderDate = new Date(currentDate);
        orderDate.setHours(hour, minute);

        // More items per order (2-6 items)
        const numItems = getRandomInt(2, 6);
        let totalAmount = 0;
        
        const orderItems = Array.from({ length: numItems }, () => {
          const menuItem = getRandomItem(popularMenuItems);
          const quantity = getRandomInt(1, 3); // Higher quantities
          totalAmount += menuItem.price * quantity;
          return {
            menuItem: menuItem._id,
            quantity,
            priceAtOrder: menuItem.price,
            status: 'served',
            statusHistory: [{
              status: 'served',
              timestamp: orderDate
            }]
          };
        });

        // Less frequent discounts (10% chance instead of 20%)
        const hasDiscount = Math.random() < 0.1;
        const discount = hasDiscount ? totalAmount * getRandomFloat(0.05, 0.10) : 0;
        const finalAmount = totalAmount - discount;

        dineInOrders.push({
          orderNumber: `ORD-${Date.now()}-${orderCounter++}`,
          type: 'dine-in',
          tableId: getRandomItem(createdTables)._id,
          items: orderItems,
          totalAmount,
          status: 'paid',
          waiterId: getRandomItem(waiters)._id,
          cashierId: cashier._id,
          branchId: mainBranch._id,
          payment: {
            method: getRandomPaymentMethod(),
            amount: finalAmount,
            originalAmount: totalAmount,
            discount,
            paidAt: new Date(orderDate.getTime() + getRandomInt(10, 30) * 60000),
          },
          createdAt: orderDate,
          updatedAt: new Date(orderDate.getTime() + getRandomInt(10, 30) * 60000),
        });
      }

      // Generate parcel orders
      for (let i = 0; i < parcelOrdersPerDay; i++) {
        const hour = Math.random() < 0.6 ? getRandomInt(12, 15) : getRandomInt(18, 22);
        const minute = getRandomInt(0, 59);
        const orderDate = new Date(currentDate);
        orderDate.setHours(hour, minute);

        // More items per parcel order (2-5 items)
        const numItems = getRandomInt(2, 5);
        let subtotal = 0;
        
        const tempItems = Array.from({ length: numItems }, () => {
          const menuItem = getRandomItem(popularMenuItems);
          const quantity = getRandomInt(1, 3); // Higher quantities
          subtotal += menuItem.price * quantity;
          return {
            menuItem: menuItem._id,
            quantity,
            notes: '',
            priceAtOrder: menuItem.price
          };
        });

        // Less frequent discounts
        const hasDiscount = Math.random() < 0.1;
        let discountType = 'fixed';
        let discount = 0;
        let discountAmount = 0;
        
        if (hasDiscount) {
          const percent = getRandomFloat(0.05, 0.10);
          discountType = 'percentage';
          discount = percent * 100;
          discountAmount = subtotal * percent;
        }

        const taxableAmount = subtotal - discountAmount;
        const taxAmount = Math.round(taxableAmount * 0.05);
        const totalAmount = taxableAmount + taxAmount;

        const parcelItems = tempItems.map(item => ({
          ...item,
          status: 'completed',
          statusHistory: [{
            status: 'completed',
            timestamp: new Date(orderDate.getTime() + 20 * 60000)
          }],
          kitchenCompleteTime: new Date(orderDate.getTime() + 20 * 60000)
        }));

        const paidAt = new Date(orderDate.getTime() + 15 * 60000);
        const actualReadyTime = new Date(orderDate.getTime() + 20 * 60000);

        parcelOrders.push({
          orderNumber: `PARCEL-${Date.now()}-${orderCounter++}`,
          type: 'parcel',
          items: parcelItems,
          subtotal,
          discount,
          discountType,
          taxAmount,
          totalAmount,
          orderStatus: 'completed',
          payment: {
            status: 'paid',
            method: getRandomPaymentMethod(),
            amount: totalAmount,
            paidAt
          },
          customerName: getRandomCustomerName(),
          customerPhone: getRandomPhone(),
          cashierId: cashier._id,
          branchId: mainBranch._id,
          orderedAt: orderDate,
          actualReadyTime
        });
      }
    }

    // Generate expenses (optimized for profitability)
    const expenses = [];
    
    // Calculate total expected orders for expense scaling
    const totalExpectedOrders = (dineInOrders.length + parcelOrders.length);
    const dailyOrderFactor = totalExpectedOrders / DAYS_TO_SEED;

    for (let d = 0; d < DAYS_TO_SEED; d++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + d);
      const expenseDate = new Date(currentDate);
      expenseDate.setHours(10, 0, 0, 0);

      // Daily groceries - scaled based on order volume
      const dailyGroceries = getRandomFloat(800, 1200) * (dailyOrderFactor / 8); // Scale with order volume
      expenses.push({
        category: 'Groceries',
        amount: dailyGroceries,
        description: 'Daily purchase of fresh ingredients',
        date: expenseDate,
        branchId: mainBranch._id,
      });

      // Weekly supplies (Mondays)
      if (currentDate.getDay() === 1) {
        expenses.push({
          category: 'Supplies',
          amount: getRandomFloat(400, 600),
          description: 'Weekly cleaning and kitchen supplies',
          date: expenseDate,
          branchId: mainBranch._id,
        });
      }

      // Monthly rent and utilities (1st)
      if (currentDate.getDate() === 1) {
        expenses.push({
          category: 'Rent',
          amount: 18000, // Reasonable rent for restaurant
          description: 'Monthly rent',
          date: expenseDate,
          branchId: mainBranch._id
        });
        
        expenses.push({
          category: 'Utilities',
          amount: getRandomFloat(3500, 4500),
          description: 'Electricity, water, gas bills',
          date: expenseDate,
          branchId: mainBranch._id
        });
      }

      // Monthly salaries (28th) - optimized staffing
      if (currentDate.getDate() === 28) {
        expenses.push({
          category: 'Salaries',
          amount: 45000, // Optimized staffing costs
          description: 'Monthly staff salaries',
          date: expenseDate,
          branchId: mainBranch._id
        });
      }

      // Occasional maintenance (2% chance, moderate amounts)
      if (Math.random() < 0.02) {
        expenses.push({
          category: 'Maintenance',
          amount: getRandomFloat(800, 1500),
          description: 'Equipment repair or maintenance',
          date: expenseDate,
          branchId: mainBranch._id,
        });
      }

      // Marketing expenses (3% chance, strategic amounts)
      if (Math.random() < 0.03) {
        expenses.push({
          category: 'Marketing',
          amount: getRandomFloat(1500, 2500),
          description: 'Promotional campaign or advertising',
          date: expenseDate,
          branchId: mainBranch._id,
        });
      }
    }

    // ==================== 8. INSERT ORDERS & EXPENSES ====================
    console.log('💾 Inserting orders and expenses into database...');
   
    if (dineInOrders.length > 0) {
      await Order.insertMany(dineInOrders, { ordered: false, batchSize: BATCH_SIZE });
      console.log(`✅ Inserted ${dineInOrders.length} dine-in orders.`);
    }
   
    if (parcelOrders.length > 0) {
      await ParcelOrder.insertMany(parcelOrders, { ordered: false, batchSize: BATCH_SIZE });
      console.log(`✅ Inserted ${parcelOrders.length} parcel orders.`);
    }
   
    if (expenses.length > 0) {
      await Expense.insertMany(expenses, { ordered: false, batchSize: BATCH_SIZE });
      console.log(`✅ Inserted ${expenses.length} expenses.\n`);
    }

    // ==================== 9. CREATE CURRENT ORDERS ====================
    console.log('📦 Creating current sample orders...');
   
    const createOrderItems = (items, baseStatus = 'placed') => {
      return items.map(item => ({
        menuItem: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes || '',
        status: baseStatus,
        priceAtOrder: item.price,
        statusHistory: [{
          status: baseStatus,
          timestamp: new Date()
        }]
      }));
    };

    const chickenBiryani = createdMenuItems.find(m => m.name === 'Chicken Biryani');
    const butterChicken = createdMenuItems.find(m => m.name === 'Butter Chicken');
    const paneerBM = createdMenuItems.find(m => m.name === 'Paneer Butter Masala');
    const butterNaan = createdMenuItems.find(m => m.name === 'Butter Naan');
    const coldCoffee = createdMenuItems.find(m => m.name === 'Cold Coffee');
    const paneerTikka = createdMenuItems.find(m => m.name === 'Paneer Tikka');
    const chickenWings = createdMenuItems.find(m => m.name === 'Chicken Wings');
    const mangoLassi = createdMenuItems.find(m => m.name === 'Mango Lassi');

    const currentOrders = [
      {
        orderNumber: `ORD-${Date.now()}-CURRENT-001`,
        type: 'dine-in',
        tableId: createdTables[0]._id,
        items: createOrderItems([
          { menuItemId: chickenBiryani._id, quantity: 2, price: chickenBiryani.price },
          { menuItemId: butterNaan._id, quantity: 4, price: butterNaan.price },
          { menuItemId: coldCoffee._id, quantity: 2, price: coldCoffee.price, notes: 'Less sugar' }
        ], 'placed'),
        totalAmount: (chickenBiryani.price * 2) + (butterNaan.price * 4) + (coldCoffee.price * 2),
        status: 'placed',
        customerName: 'Amit Kumar',
        waiterId: waiters[0]._id,
        branchId: mainBranch._id
      },
      {
        orderNumber: `ORD-${Date.now()}-CURRENT-002`,
        type: 'dine-in',
        tableId: createdTables[8]._id,
        items: createOrderItems([
          { menuItemId: butterChicken._id, quantity: 1, price: butterChicken.price },
          { menuItemId: paneerTikka._id, quantity: 1, price: paneerTikka.price },
          { menuItemId: butterNaan._id, quantity: 3, price: butterNaan.price }
        ], 'in-kitchen'),
        totalAmount: butterChicken.price + paneerTikka.price + (butterNaan.price * 3),
        status: 'in-kitchen',
        customerName: 'Priya Sharma',
        waiterId: waiters[1]._id,
        branchId: mainBranch._id
      },
      {
        orderNumber: `ORD-${Date.now()}-CURRENT-003`,
        type: 'dine-in',
        tableId: createdTables[15]._id,
        items: createOrderItems([
          { menuItemId: paneerBM._id, quantity: 2, price: paneerBM.price },
          { menuItemId: butterNaan._id, quantity: 4, price: butterNaan.price },
          { menuItemId: mangoLassi._id, quantity: 2, price: mangoLassi.price }
        ], 'ready'),
        totalAmount: (paneerBM.price * 2) + (butterNaan.price * 4) + (mangoLassi.price * 2),
        status: 'ready',
        customerName: 'Rohan Verma',
        waiterId: waiters[0]._id,
        branchId: mainBranch._id
      },
      {
        orderNumber: `ORD-${Date.now()}-CURRENT-004`,
        type: 'dine-in',
        tableId: createdTables[18]._id,
        items: createOrderItems([
          { menuItemId: chickenBiryani._id, quantity: 3, price: chickenBiryani.price },
          { menuItemId: chickenWings._id, quantity: 1, price: chickenWings.price },
          { menuItemId: coldCoffee._id, quantity: 3, price: coldCoffee.price }
        ], 'served'),
        totalAmount: (chickenBiryani.price * 3) + chickenWings.price + (coldCoffee.price * 3),
        status: 'served',
        customerName: 'Deepak Patel',
        waiterId: waiters[1]._id,
        branchId: mainBranch._id
      }
    ];

    const createdCurrentOrders = await Order.insertMany(currentOrders);
    console.log(`✅ Created ${createdCurrentOrders.length} current sample orders\n`);

    // Update table status for current dine-in orders
    for (const order of createdCurrentOrders) {
      if (order.type === 'dine-in' && order.tableId) {
        await Table.findByIdAndUpdate(order.tableId, {
          status: 'occupied',
          currentOrderId: order._id
        });
      }
    }
    console.log('✅ Updated table statuses\n');

    // ==================== FINAL SUMMARY ====================
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 COMPLETE SEEDING FINISHED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');
   
    console.log('📊 BASIC DATA SUMMARY:');
    console.log(` Permissions: ${createdPermissions.length}`);
    console.log(` Roles: ${createdRoles.length}`);
    console.log(` Branches: ${createdBranches.length}`);
    console.log(` Users: ${createdUsers.length}`);
    console.log(` Menu Items: ${createdMenuItems.length}`);
    console.log(` Tables: ${createdTables.length}\n`);
   
    console.log('📈 HISTORICAL DATA SUMMARY:');
    console.log(` Period: ${startDate.toDateString()} to ${today.toDateString()}`);
    console.log(` Historical Orders: ${dineInOrders.length + parcelOrders.length} (${dineInOrders.length} dine-in, ${parcelOrders.length} parcel)`);
    console.log(` Current Orders: ${createdCurrentOrders.length}`);
    console.log(` Total Expenses: ${expenses.length}\n`);
    
    const dineInRevenue = dineInOrders
      .reduce((sum, o) => sum + (o.payment?.amount || 0), 0);
    const parcelRevenue = parcelOrders
      .reduce((sum, o) => sum + (o.payment?.amount || 0), 0);
    const totalRevenue = dineInRevenue + parcelRevenue;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = ((netProfit / totalRevenue) * 100) || 0;

    console.log('💰 FINANCIAL OVERVIEW:');
    console.log(` Dine-In Revenue: ${dineInRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);
    console.log(` Parcel Revenue: ${parcelRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);
    console.log(` Total Revenue: ${totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);
    console.log(` Total Expenses: ${totalExpenses.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);
    console.log(` Net Profit: ${netProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);
    console.log(` Profit Margin: ${profitMargin.toFixed(2)}%`);
    console.log(` Avg Order Value: ${((totalRevenue / (dineInOrders.length + parcelOrders.length)) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}\n`);
   
    console.log('🔑 TEST CREDENTIALS (Password: 123456):');
    console.log(' Admin: admin@restaurant.com');
    console.log(' Manager: manager@restaurant.com');
    console.log(' Cashier: cashier@restaurant.com');
    console.log(' Waiter: waiter@restaurant.com');
    console.log(' Chef: chef@restaurant.com\n');
   
    console.log('💡 QUICK STATS:');
    const tableStats = {
      available: await Table.countDocuments({ status: 'available' }),
      occupied: await Table.countDocuments({ status: 'occupied' }),
      reserved: await Table.countDocuments({ status: 'reserved' })
    };
   
    console.log(` Available Tables: ${tableStats.available}`);
    console.log(` Occupied Tables: ${tableStats.occupied}`);
    console.log(` Reserved Tables: ${tableStats.reserved}`);
    console.log(` Total Capacity: ${createdTables.reduce((sum, t) => sum + t.capacity, 0)} seats\n`);
   
    console.log('📋 CURRENT ORDER STATUS:');
    console.log(` Placed: ${createdCurrentOrders.filter(o => o.status === 'placed').length}`);
    console.log(` In Kitchen: ${createdCurrentOrders.filter(o => o.status === 'in-kitchen').length}`);
    console.log(` Ready: ${createdCurrentOrders.filter(o => o.status === 'ready').length}`);
    console.log(` Served: ${createdCurrentOrders.filter(o => o.status === 'served').length}\n`);
   
    console.log('🍽️ MENU BREAKDOWN:');
    console.log(` Snacks: ${createdMenuItems.filter(m => m.category === 'Snack').length}`);
    console.log(` Meals: ${createdMenuItems.filter(m => m.category === 'Meal').length}`);
    console.log(` Vegan: ${createdMenuItems.filter(m => m.category === 'Vegan').length}`);
    console.log(` Drinks: ${createdMenuItems.filter(m => m.category === 'Drink').length}`);
    console.log(` Desserts: ${createdMenuItems.filter(m => m.category === 'Dessert').length}\n`);
   
    console.log('📈 DAILY AVERAGES:');
    console.log(` Orders per Day: ${((dineInOrders.length + parcelOrders.length) / DAYS_TO_SEED).toFixed(1)}`);
    console.log(` Daily Revenue: ${(totalRevenue / DAYS_TO_SEED).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);
    console.log(` Daily Expenses: ${(totalExpenses / DAYS_TO_SEED).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`);
    console.log(` Daily Profit: ${(netProfit / DAYS_TO_SEED).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}\n`);
   
    console.log('✨ YOU CAN NOW:');
    console.log(' 1. Login with any test account');
    console.log(' 2. View orders in different stages');
    console.log(' 3. Analyze profitable revenue data');
    console.log(' 4. View optimized expense reports');
    console.log(' 5. Test complete restaurant workflow\n');

    // Profitability check
    if (netProfit > 0) {
      console.log('✅ SUCCESS: Restaurant is PROFITABLE! 🎉');
    } else {
      console.log('❌ WARNING: Restaurant is still not profitable. Consider further adjustments.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING FAILED:', error.message);
    console.error(error.stack);
    console.error('\n💡 TROUBLESHOOTING:');
    console.error(' 1. Ensure MongoDB is running.');
    console.error(' 2. Verify the MONGO_URI in your .env file.');
    console.error(' 3. Check that all required models are properly defined.');
    process.exit(1);
  }
};

seedAll();