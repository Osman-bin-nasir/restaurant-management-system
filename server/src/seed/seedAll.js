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
import Expense from '../models/Expense.js';

dotenv.config({ path: './server/.env' });

/**
 * =================================================================
 * 🎯 100-DAY COMPREHENSIVE RESTAURANT SEED SCRIPT
 * =================================================================
 * Generates realistic data for October 03, 2025 - November 02, 2025
 * - Separate schemas for Dining Orders and Parcel Orders
 * - Realistic customer behavior patterns
 * - Weekend vs weekday variations
 * - Peak hours simulation
 * - Balanced profitability
 * =================================================================
 */

// ==================== CONFIGURATION ====================
const DAYS_TO_SEED = 100;
const START_DATE = new Date('2025-10-03'); // 100 days before Nov 02, 2025
const END_DATE = new Date('2025-11-02');
const BATCH_SIZE = 200;

// Order volume configuration (daily ranges)
const WEEKDAY_ORDERS = { dineIn: { min: 8, max: 12 }, parcel: { min: 3, max: 5 } };
const WEEKEND_ORDERS = { dineIn: { min: 12, max: 18 }, parcel: { min: 5, max: 8 } };

// Peak hours configuration
const LUNCH_HOURS = { start: 12, end: 15 };
const DINNER_HOURS = { start: 18, end: 22 };

// ==================== HELPER FUNCTIONS ====================
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

const getOrderHour = () => {
  // 60% lunch, 40% dinner
  const isPeakLunch = Math.random() < 0.6;
  if (isPeakLunch) {
    return getRandomInt(LUNCH_HOURS.start, LUNCH_HOURS.end);
  }
  return getRandomInt(DINNER_HOURS.start, DINNER_HOURS.end);
};

const paymentMethods = ['cash', 'card', 'upi'];
const paymentWeights = [0.40, 0.35, 0.25]; // 40% cash, 35% card, 25% UPI

const getWeightedPaymentMethod = () => {
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < paymentWeights.length; i++) {
    sum += paymentWeights[i];
    if (rand < sum) return paymentMethods[i];
  }
  return 'cash';
};

// Customer names for parcel orders
const customerNames = [
  'Amit Kumar', 'Priya Sharma', 'Rohan Verma', 'Deepak Patel', 'Neha Singh',
  'Rajesh Gupta', 'Sonia Mehra', 'Vikram Joshi', 'Kavita Reddy', 'Arjun Malhotra',
  'Sneha Kapoor', 'Ravi Shankar', 'Anjali Desai', 'Karan Singh', 'Pooja Nair',
  'Manoj Kumar', 'Divya Iyer', 'Suresh Pillai', 'Meera Rao', 'Ashok Mehta'
];

const getRandomCustomerName = () => getRandomItem(customerNames);
const getRandomPhone = () => `+91-${getRandomInt(7000000000, 9999999999)}`;

// ==================== MAIN SEED FUNCTION ====================
const seed100Days = async () => {
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
      Expense.deleteMany({})
    ]);
    console.log('✅ Database cleared\n');

    // ==================== 1. CREATE PERMISSIONS ====================
    console.log('📋 Creating permissions...');
    const permissionsList = [
      { name: 'users:view', description: 'View users' },
      { name: 'users:create', description: 'Create new users' },
      { name: 'users:update', description: 'Update user details' },
      { name: 'users:delete', description: 'Delete users' },
      { name: 'permissions:view', description: 'View roles & permissions' },
      { name: 'permissions:create', description: 'Create roles & permissions' },
      { name: 'permissions:update', description: 'Update roles & permissions' },
      { name: 'permissions:delete', description: 'Delete roles & permissions' },
      { name: 'branches:view', description: 'View branches' },
      { name: 'branches:create', description: 'Create branches' },
      { name: 'branches:update', description: 'Update branches' },
      { name: 'branches:delete', description: 'Delete branches' },
      { name: 'orders:view', description: 'View orders' },
      { name: 'orders:create', description: 'Create orders' },
      { name: 'orders:update', description: 'Update order status' },
      { name: 'orders:delete', description: 'Delete/cancel orders' },
      { name: 'menu:view', description: 'View menu items' },
      { name: 'menu:create', description: 'Add menu items' },
      { name: 'menu:update', description: 'Update menu items' },
      { name: 'menu:delete', description: 'Delete menu items' },
      { name: 'inventory:view', description: 'View inventory' },
      { name: 'inventory:create', description: 'Add inventory items' },
      { name: 'inventory:update', description: 'Update inventory' },
      { name: 'inventory:delete', description: 'Delete inventory items' },
      { name: 'tables:view', description: 'View table status' },
      { name: 'tables:create', description: 'Create tables' },
      { name: 'tables:update', description: 'Update table status' },
      { name: 'tables:manage', description: 'Merge/split tables' },
      { name: 'billing:view', description: 'View bills' },
      { name: 'billing:create', description: 'Generate bills' },
      { name: 'billing:process', description: 'Process payments' },
      { name: 'billing:discount', description: 'Apply discounts' },
      { name: 'reports:view', description: 'View reports' },
      { name: 'reports:generate', description: 'Generate reports' },
      { name: 'reports:export', description: 'Export reports' },
      { name: 'kitchen:view', description: 'View kitchen orders' },
      { name: 'kitchen:update', description: 'Update order cooking status' },
      { name: 'expenses:view', description: 'View expenses' },
      { name: 'expenses:create', description: 'Add expenses' },
      { name: 'expenses:approve', description: 'Approve expenses' },
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
          'orders:view', 'orders:create', 'orders:update', 'orders:delete',
          'menu:view', 'menu:create', 'menu:update', 'menu:delete',
          'inventory:view', 'inventory:update',
          'tables:view', 'tables:create', 'tables:update', 'tables:manage',
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

    // ==================== 3. CREATE BRANCH ====================
    console.log('🏢 Creating branch...');
    const branch = await Branch.create({
      name: 'Main Branch - City Center',
      location: 'Downtown, City Center, 123 Main Street',
      contact: '+91-9876543210',
      operatingHours: { open: '10:00 AM', close: '11:00 PM' },
      status: 'active'
    });
    console.log('✅ Created branch\n');

    // ==================== 4. CREATE USERS ====================
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const users = await User.insertMany([
      {
        name: 'Super Admin',
        email: 'admin@restaurant.com',
        password: hashedPassword,
        role: roleMap['admin'],
        shift: 'morning',
        branchId: branch._id,
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
        branchId: branch._id,
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
        branchId: branch._id,
        employeeId: 'EMP003',
        isActive: true,
        isAccountVerified: true
      },
      {
        name: 'Ravi Waiter',
        email: 'waiter@restaurant.com',
        password: hashedPassword,
        role: roleMap['waiter'],
        shift: 'morning',
        branchId: branch._id,
        employeeId: 'EMP004',
        isActive: true,
        isAccountVerified: true
      },
      {
        name: 'Sarah Waiter',
        email: 'waiter2@restaurant.com',
        password: hashedPassword,
        role: roleMap['waiter'],
        shift: 'evening',
        branchId: branch._id,
        employeeId: 'EMP005',
        isActive: true,
        isAccountVerified: true
      },
      {
        name: 'Chef Arjun',
        email: 'chef@restaurant.com',
        password: hashedPassword,
        role: roleMap['chef'],
        shift: 'morning',
        branchId: branch._id,
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
        branchId: branch._id,
        employeeId: 'EMP007',
        isActive: true,
        isAccountVerified: true
      }
    ]);

    const cashier = users.find(u => u.email === 'cashier@restaurant.com');
    const waiters = users.filter(u => u.email.includes('waiter'));
    console.log(`✅ Created ${users.length} users\n`);

    // ==================== 5. CREATE MENU ITEMS ====================
    console.log('🍽️ Creating menu items...');
    const menuItems = await MenuItem.insertMany([
      // Starters/Snacks (Higher margin items)
      {
        name: 'Paneer Tikka',
        category: 'Snack',
        price: 249,
        description: 'Grilled cottage cheese marinated in Indian spices',
        image: 'https://images.unsplash.com/photo-1701579231320-cc2f7acad3cd',
        cookingTime: 15,
        availability: true,
        ingredients: ['Paneer', 'Yogurt', 'Spices', 'Bell Peppers'],
        branchId: branch._id
      },
      {
        name: 'Chicken Wings',
        category: 'Snack',
        price: 299,
        description: 'Crispy fried chicken wings with hot sauce',
        image: 'https://images.unsplash.com/photo-1637273484026-11d51fb64024',
        cookingTime: 20,
        availability: true,
        ingredients: ['Chicken', 'Hot Sauce', 'Butter'],
        branchId: branch._id
      },
      {
        name: 'French Fries',
        category: 'Snack',
        price: 129,
        description: 'Golden crispy potato fries',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
        cookingTime: 10,
        availability: true,
        ingredients: ['Potato', 'Salt', 'Oil'],
        branchId: branch._id
      },
      {
        name: 'Spring Rolls',
        category: 'Snack',
        price: 179,
        description: 'Crispy vegetable spring rolls',
        image: 'https://images.unsplash.com/photo-1541529086526-db283c563270',
        cookingTime: 12,
        availability: true,
        ingredients: ['Vegetables', 'Wrapper', 'Spices'],
        branchId: branch._id
      },
      
      // Main Course (Premium items)
      {
        name: 'Chicken Biryani',
        category: 'Meal',
        price: 349,
        description: 'Aromatic rice cooked with marinated chicken',
        image: 'https://images.unsplash.com/photo-1701579231305-d84d8af9a3fd',
        cookingTime: 30,
        availability: true,
        ingredients: ['Rice', 'Chicken', 'Spices', 'Onion', 'Yogurt'],
        branchId: branch._id
      },
      {
        name: 'Butter Chicken',
        category: 'Meal',
        price: 379,
        description: 'Tender chicken in creamy tomato gravy',
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398',
        cookingTime: 25,
        availability: true,
        ingredients: ['Chicken', 'Butter', 'Cream', 'Tomato', 'Spices'],
        branchId: branch._id
      },
      {
        name: 'Paneer Butter Masala',
        category: 'Vegan',
        price: 299,
        description: 'Cottage cheese in rich tomato gravy',
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7',
        cookingTime: 20,
        availability: true,
        ingredients: ['Paneer', 'Tomato', 'Cream', 'Butter', 'Spices'],
        branchId: branch._id
      },
      {
        name: 'Dal Makhani',
        category: 'Vegan',
        price: 229,
        description: 'Creamy black lentils cooked overnight',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        cookingTime: 20,
        availability: true,
        ingredients: ['Black Lentils', 'Butter', 'Cream', 'Spices'],
        branchId: branch._id
      },
      {
        name: 'Veg Biryani',
        category: 'Vegan',
        price: 279,
        description: 'Fragrant rice with mixed vegetables',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8',
        cookingTime: 25,
        availability: true,
        ingredients: ['Rice', 'Mixed Vegetables', 'Spices'],
        branchId: branch._id
      },
      
      // Breads (High volume, low cost)
      {
        name: 'Butter Naan',
        category: 'Snack',
        price: 49,
        description: 'Soft leavened bread with butter',
        image: 'https://images.unsplash.com/photo-1690915475901-6c08af925906',
        cookingTime: 5,
        availability: true,
        ingredients: ['Flour', 'Butter', 'Yeast'],
        branchId: branch._id
      },
      {
        name: 'Garlic Naan',
        category: 'Snack',
        price: 59,
        description: 'Naan topped with garlic and coriander',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950',
        cookingTime: 5,
        availability: true,
        ingredients: ['Flour', 'Garlic', 'Butter'],
        branchId: branch._id
      },
      
      // Drinks (Highest margin)
      {
        name: 'Mango Lassi',
        category: 'Drink',
        price: 99,
        description: 'Sweet yogurt drink with mango',
        image: 'https://images.unsplash.com/photo-1600788907416-456578634209',
        cookingTime: 5,
        availability: true,
        ingredients: ['Yogurt', 'Mango', 'Sugar'],
        branchId: branch._id
      },
      {
        name: 'Cold Coffee',
        category: 'Drink',
        price: 129,
        description: 'Chilled coffee with ice cream',
        image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7',
        cookingTime: 5,
        availability: true,
        ingredients: ['Coffee', 'Milk', 'Sugar', 'Ice Cream'],
        branchId: branch._id
      },
      {
        name: 'Fresh Lime Soda',
        category: 'Drink',
        price: 79,
        description: 'Refreshing lime soda with mint',
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721',
        cookingTime: 3,
        availability: true,
        ingredients: ['Lime', 'Soda', 'Mint', 'Sugar'],
        branchId: branch._id
      },
      {
        name: 'Masala Chai',
        category: 'Drink',
        price: 49,
        description: 'Traditional Indian spiced tea',
        image: 'https://images.unsplash.com/photo-1619581073186-5b4ae1b0caad',
        cookingTime: 10,
        availability: true,
        ingredients: ['Tea', 'Milk', 'Spices', 'Sugar'],
        branchId: branch._id
      },
      
      // Desserts
      {
        name: 'Gulab Jamun',
        category: 'Dessert',
        price: 89,
        description: 'Sweet milk dumplings in sugar syrup',
        image: 'https://images.unsplash.com/photo-1589301760010-0badc41e3bec',
        cookingTime: 5,
        availability: true,
        ingredients: ['Milk Powder', 'Sugar', 'Cardamom'],
        branchId: branch._id
      },
      {
        name: 'Ice Cream Sundae',
        category: 'Dessert',
        price: 149,
        description: 'Vanilla ice cream with toppings',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb',
        cookingTime: 3,
        availability: true,
        ingredients: ['Ice Cream', 'Chocolate', 'Nuts'],
        branchId: branch._id
      }
    ]);
    console.log(`✅ Created ${menuItems.length} menu items\n`);

    // Weighted menu selection for realistic ordering patterns
    const popularMenuItems = menuItems.flatMap(item => {
      let weight = 1;
      if (item.category === 'Meal') weight = 5; // Main courses most popular
      else if (item.category === 'Snack' && item.price < 100) weight = 4; // Breads
      else if (item.category === 'Drink') weight = 3; // Drinks frequently ordered
      else if (item.category === 'Snack') weight = 2; // Appetizers
      return Array(weight).fill(item);
    });

    // ==================== 6. CREATE TABLES ====================
    console.log('🪑 Creating tables...');
    const tables = [];
    
    // 2-seater tables (10)
    for (let i = 1; i <= 10; i++) {
      tables.push({
        tableNumber: i,
        capacity: 2,
        status: 'available',
        branchId: branch._id
      });
    }
    
    // 4-seater tables (10)
    for (let i = 11; i <= 20; i++) {
      tables.push({
        tableNumber: i,
        capacity: 4,
        status: 'available',
        branchId: branch._id
      });
    }
    
    // 6-seater tables (5)
    for (let i = 21; i <= 25; i++) {
      tables.push({
        tableNumber: i,
        capacity: 6,
        status: 'available',
        branchId: branch._id
      });
    }

    const createdTables = await Table.insertMany(tables);
    console.log(`✅ Created ${createdTables.length} tables\n`);

    // ==================== 7. GENERATE 100 DAYS OF ORDERS ====================
    console.log('📊 Generating 100 days of orders and expenses...');
    console.log(`📅 Period: ${START_DATE.toDateString()} to ${END_DATE.toDateString()}\n`);

    const diningOrders = [];
    const parcelOrders = [];
    const expenses = [];
    let orderCounter = 1;

    for (let dayOffset = 0; dayOffset < DAYS_TO_SEED; dayOffset++) {
      const currentDate = new Date(START_DATE);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      
      const isWeekendDay = isWeekend(currentDate);
      const orderConfig = isWeekendDay ? WEEKEND_ORDERS : WEEKDAY_ORDERS;
      
      const dineInCount = getRandomInt(orderConfig.dineIn.min, orderConfig.dineIn.max);
      const parcelCount = getRandomInt(orderConfig.parcel.min, orderConfig.parcel.max);
      
      if (dayOffset % 10 === 0) {
        console.log(`📅 Day ${dayOffset + 1}/${DAYS_TO_SEED}: ${currentDate.toDateString()} - ${dineInCount} dine-in, ${parcelCount} parcel orders`);
      }

      // ==================== GENERATE DINING ORDERS ====================
      for (let i = 0; i < dineInCount; i++) {
        const orderHour = getOrderHour();
        const orderMinute = getRandomInt(0, 59);
        const orderDate = new Date(currentDate);
        orderDate.setHours(orderHour, orderMinute, 0, 0);

        // Generate 2-5 items per order
        const numItems = getRandomInt(2, 5);
        let totalAmount = 0;
        
        const orderItems = [];
        for (let j = 0; j < numItems; j++) {
          const menuItem = getRandomItem(popularMenuItems);
          const quantity = getRandomInt(1, 3);
          const itemAmount = menuItem.price * quantity;
          totalAmount += itemAmount;
          
          orderItems.push({
            menuItem: menuItem._id,
            quantity,
            notes: j === 0 && Math.random() < 0.1 ? 'Extra spicy' : '',
            status: 'served',
            priceAtOrder: menuItem.price,
            statusHistory: [{
              status: 'placed',
              timestamp: orderDate,
              updatedBy: getRandomItem(waiters)._id
            }, {
              status: 'in-kitchen',
              timestamp: new Date(orderDate.getTime() + 5 * 60000)
            }, {
              status: 'ready',
              timestamp: new Date(orderDate.getTime() + (15 + menuItem.cookingTime) * 60000)
            }, {
              status: 'served',
              timestamp: new Date(orderDate.getTime() + (20 + menuItem.cookingTime) * 60000)
            }],
            kitchenStartTime: new Date(orderDate.getTime() + 5 * 60000),
            kitchenCompleteTime: new Date(orderDate.getTime() + (15 + menuItem.cookingTime) * 60000),
            servedTime: new Date(orderDate.getTime() + (20 + menuItem.cookingTime) * 60000)
          });
        }

        // Apply discount to 15% of orders
        const hasDiscount = Math.random() < 0.15;
        const discountPercent = hasDiscount ? getRandomFloat(0.05, 0.15) : 0;
        const discountAmount = Math.round(totalAmount * discountPercent);
        const finalAmount = totalAmount - discountAmount;

        const paymentTime = new Date(orderDate.getTime() + getRandomInt(45, 90) * 60000);

        diningOrders.push({
          orderNumber: `DINE-${Date.now()}-${orderCounter++}`,
          type: 'dine-in',
          tableId: getRandomItem(createdTables)._id,
          items: orderItems,
          totalAmount: finalAmount,
          status: 'paid',
          customerName: getRandomCustomerName(),
          waiterId: getRandomItem(waiters)._id,
          cashierId: cashier._id,
          branchId: branch._id,
          payment: {
            method: getWeightedPaymentMethod(),
            amount: finalAmount,
            originalAmount: totalAmount,
            discount: discountAmount,
            paidAt: paymentTime,
            status: 'paid'
          },
          discount: hasDiscount ? {
            type: 'percentage',
            value: discountPercent * 100,
            amount: discountAmount,
            appliedAt: paymentTime
          } : undefined,
          createdAt: orderDate,
          updatedAt: paymentTime
        });
      }

      // ==================== GENERATE PARCEL ORDERS ====================
      for (let i = 0; i < parcelCount; i++) {
        const orderHour = getOrderHour();
        const orderMinute = getRandomInt(0, 59);
        const orderDate = new Date(currentDate);
        orderDate.setHours(orderHour, orderMinute, 0, 0);

        // Generate 2-4 items per parcel order
        const numItems = getRandomInt(2, 4);
        let subtotal = 0;
        
        const parcelItems = [];
        for (let j = 0; j < numItems; j++) {
          const menuItem = getRandomItem(popularMenuItems);
          const quantity = getRandomInt(1, 2); // Less quantity for parcel
          subtotal += menuItem.price * quantity;
          
          parcelItems.push({
            menuItem: menuItem._id,
            quantity,
            notes: j === 0 && Math.random() < 0.08 ? 'Mild spice' : '',
            status: 'completed',
            priceAtOrder: menuItem.price,
            statusHistory: [{
              status: 'placed',
              timestamp: orderDate
            }, {
              status: 'in-kitchen',
              timestamp: new Date(orderDate.getTime() + 2 * 60000)
            }, {
              status: 'ready',
              timestamp: new Date(orderDate.getTime() + (menuItem.cookingTime + 3) * 60000)
            }, {
              status: 'completed',
              timestamp: new Date(orderDate.getTime() + (menuItem.cookingTime + 5) * 60000)
            }],
            kitchenStartTime: new Date(orderDate.getTime() + 2 * 60000),
            kitchenCompleteTime: new Date(orderDate.getTime() + (menuItem.cookingTime + 3) * 60000)
          });
        }

        // Apply discount to 12% of parcel orders
        const hasDiscount = Math.random() < 0.12;
        let discount = 0;
        let discountType = 'fixed';
        
        if (hasDiscount) {
          const usePercentage = Math.random() < 0.5;
          if (usePercentage) {
            discountType = 'percentage';
            discount = getRandomFloat(5, 12); // 5-12% discount
          } else {
            discount = getRandomInt(20, 50); // ₹20-50 flat discount
          }
        }

        // Calculate final amount for ParcelOrder schema
        let discountAmount = 0;
        if (discountType === 'percentage') {
          discountAmount = Math.round((subtotal * discount) / 100);
        } else {
          discountAmount = discount;
        }

        const taxableAmount = subtotal - discountAmount;
        const taxAmount = Math.round(taxableAmount * 0.05); // 5% GST
        const totalAmount = taxableAmount + taxAmount;

        const paidAt = new Date(orderDate.getTime() + 2 * 60000); // Paid immediately
        const readyTime = new Date(orderDate.getTime() + getRandomInt(20, 35) * 60000);

        parcelOrders.push({
          orderNumber: `PARCEL-${Date.now()}-${orderCounter++}`,
          type: 'parcel',
          items: parcelItems,
          subtotal,
          discount: hasDiscount ? discount : 0,
          discountType,
          taxAmount,
          totalAmount,
          orderStatus: 'completed',
          payment: {
            status: 'paid',
            method: getWeightedPaymentMethod(),
            amount: totalAmount,
            paidAt
          },
          customerName: getRandomCustomerName(),
          customerPhone: getRandomPhone(),
          cashierId: cashier._id,
          branchId: branch._id,
          orderedAt: orderDate,
          estimatedReadyTime: new Date(orderDate.getTime() + 25 * 60000),
          actualReadyTime: readyTime,
          createdAt: orderDate,
          updatedAt: readyTime
        });
      }

      // ==================== GENERATE DAILY EXPENSES ====================
      const expenseDate = new Date(currentDate);
      expenseDate.setHours(10, 0, 0, 0);

      // Daily groceries - scaled with order volume
      const dailyOrderCount = dineInCount + parcelCount;
      const groceryCost = getRandomFloat(1000, 1400) * (dailyOrderCount / 10);
      expenses.push({
        category: 'Groceries',
        amount: Math.round(groceryCost),
        description: 'Daily purchase of fresh ingredients',
        date: expenseDate,
        branchId: branch._id,
        approvedBy: users.find(u => u.email === 'manager@restaurant.com')._id
      });

      // Weekly supplies (every Monday)
      if (currentDate.getDay() === 1) {
        expenses.push({
          category: 'Supplies',
          amount: getRandomFloat(500, 700),
          description: 'Weekly cleaning and kitchen supplies',
          date: expenseDate,
          branchId: branch._id,
          approvedBy: users.find(u => u.email === 'manager@restaurant.com')._id
        });
      }

      // Monthly fixed expenses (1st of month)
      if (currentDate.getDate() === 1) {
        // Rent
        expenses.push({
          category: 'Rent',
          amount: 25000,
          description: 'Monthly restaurant rent',
          date: expenseDate,
          branchId: branch._id,
          approvedBy: users.find(u => u.email === 'admin@restaurant.com')._id
        });

        // Utilities
        expenses.push({
          category: 'Utilities',
          amount: getRandomFloat(4000, 5500),
          description: 'Electricity, water, and gas bills',
          date: expenseDate,
          branchId: branch._id,
          approvedBy: users.find(u => u.email === 'manager@restaurant.com')._id
        });
      }

      // Monthly salaries (25th of month)
      if (currentDate.getDate() === 25) {
        expenses.push({
          category: 'Salaries',
          amount: 55000,
          description: 'Monthly staff salaries',
          date: expenseDate,
          branchId: branch._id,
          approvedBy: users.find(u => u.email === 'admin@restaurant.com')._id
        });
      }

      // Occasional maintenance (3% chance)
      if (Math.random() < 0.03) {
        expenses.push({
          category: 'Maintenance',
          amount: getRandomFloat(1000, 2500),
          description: 'Equipment repair and maintenance',
          date: expenseDate,
          branchId: branch._id,
          approvedBy: users.find(u => u.email === 'manager@restaurant.com')._id
        });
      }

      // Marketing expenses (4% chance)
      if (Math.random() < 0.04) {
        expenses.push({
          category: 'Marketing',
          amount: getRandomFloat(2000, 4000),
          description: 'Social media advertising and promotions',
          date: expenseDate,
          branchId: branch._id,
          approvedBy: users.find(u => u.email === 'manager@restaurant.com')._id
        });
      }

      // Licensing/permits (quarterly - 1st of Oct, Jan, Apr, Jul)
      if (currentDate.getDate() === 1 && [0, 3, 6, 9].includes(currentDate.getMonth())) {
        expenses.push({
          category: 'Licensing',
          amount: 5000,
          description: 'Quarterly licensing and permit fees',
          date: expenseDate,
          branchId: branch._id,
          approvedBy: users.find(u => u.email === 'admin@restaurant.com')._id
        });
      }
    }

    // ==================== 8. INSERT DATA INTO DATABASE ====================
    console.log('\n💾 Inserting orders and expenses into database...\n');

    // Insert Dining Orders
    if (diningOrders.length > 0) {
      console.log(`📥 Inserting ${diningOrders.length} dining orders...`);
      await Order.insertMany(diningOrders, { ordered: false, batchSize: BATCH_SIZE });
      console.log('✅ Dining orders inserted');
    }

    // Insert Parcel Orders
    if (parcelOrders.length > 0) {
      console.log(`📥 Inserting ${parcelOrders.length} parcel orders...`);
      await ParcelOrder.insertMany(parcelOrders, { ordered: false, batchSize: BATCH_SIZE });
      console.log('✅ Parcel orders inserted');
    }

    // Insert Expenses
    if (expenses.length > 0) {
      console.log(`📥 Inserting ${expenses.length} expenses...`);
      await Expense.insertMany(expenses, { ordered: false, batchSize: BATCH_SIZE });
      console.log('✅ Expenses inserted\n');
    }

    // ==================== 9. CREATE CURRENT ACTIVE ORDERS ====================
    console.log('📦 Creating current active orders for testing...\n');

    const chickenBiryani = menuItems.find(m => m.name === 'Chicken Biryani');
    const butterChicken = menuItems.find(m => m.name === 'Butter Chicken');
    const paneerBM = menuItems.find(m => m.name === 'Paneer Butter Masala');
    const butterNaan = menuItems.find(m => m.name === 'Butter Naan');
    const coldCoffee = menuItems.find(m => m.name === 'Cold Coffee');
    const mangoLassi = menuItems.find(m => m.name === 'Mango Lassi');

    const now = new Date();
    
    const currentOrders = await Order.insertMany([
      {
        orderNumber: `DINE-${Date.now()}-ACTIVE-001`,
        type: 'dine-in',
        tableId: createdTables[0]._id,
        items: [{
          menuItem: chickenBiryani._id,
          quantity: 2,
          status: 'placed',
          priceAtOrder: chickenBiryani.price,
          statusHistory: [{ status: 'placed', timestamp: now }]
        }, {
          menuItem: butterNaan._id,
          quantity: 4,
          status: 'placed',
          priceAtOrder: butterNaan.price,
          statusHistory: [{ status: 'placed', timestamp: now }]
        }],
        totalAmount: (chickenBiryani.price * 2) + (butterNaan.price * 4),
        status: 'placed',
        customerName: 'Amit Kumar',
        waiterId: waiters[0]._id,
        branchId: branch._id,
        createdAt: now
      },
      {
        orderNumber: `DINE-${Date.now()}-ACTIVE-002`,
        type: 'dine-in',
        tableId: createdTables[10]._id,
        items: [{
          menuItem: butterChicken._id,
          quantity: 1,
          status: 'in-kitchen',
          priceAtOrder: butterChicken.price,
          statusHistory: [
            { status: 'placed', timestamp: new Date(now.getTime() - 10 * 60000) },
            { status: 'in-kitchen', timestamp: new Date(now.getTime() - 5 * 60000) }
          ],
          kitchenStartTime: new Date(now.getTime() - 5 * 60000)
        }, {
          menuItem: butterNaan._id,
          quantity: 3,
          status: 'in-kitchen',
          priceAtOrder: butterNaan.price,
          statusHistory: [
            { status: 'placed', timestamp: new Date(now.getTime() - 10 * 60000) },
            { status: 'in-kitchen', timestamp: new Date(now.getTime() - 5 * 60000) }
          ],
          kitchenStartTime: new Date(now.getTime() - 5 * 60000)
        }],
        totalAmount: butterChicken.price + (butterNaan.price * 3),
        status: 'in-kitchen',
        customerName: 'Priya Sharma',
        waiterId: waiters[1]._id,
        branchId: branch._id,
        createdAt: new Date(now.getTime() - 10 * 60000)
      },
      {
        orderNumber: `DINE-${Date.now()}-ACTIVE-003`,
        type: 'dine-in',
        tableId: createdTables[20]._id,
        items: [{
          menuItem: paneerBM._id,
          quantity: 2,
          status: 'ready',
          priceAtOrder: paneerBM.price,
          statusHistory: [
            { status: 'placed', timestamp: new Date(now.getTime() - 25 * 60000) },
            { status: 'in-kitchen', timestamp: new Date(now.getTime() - 20 * 60000) },
            { status: 'ready', timestamp: new Date(now.getTime() - 2 * 60000) }
          ],
          kitchenStartTime: new Date(now.getTime() - 20 * 60000),
          kitchenCompleteTime: new Date(now.getTime() - 2 * 60000)
        }, {
          menuItem: mangoLassi._id,
          quantity: 2,
          status: 'ready',
          priceAtOrder: mangoLassi.price,
          statusHistory: [
            { status: 'placed', timestamp: new Date(now.getTime() - 25 * 60000) },
            { status: 'in-kitchen', timestamp: new Date(now.getTime() - 20 * 60000) },
            { status: 'ready', timestamp: new Date(now.getTime() - 2 * 60000) }
          ],
          kitchenStartTime: new Date(now.getTime() - 20 * 60000),
          kitchenCompleteTime: new Date(now.getTime() - 2 * 60000)
        }],
        totalAmount: (paneerBM.price * 2) + (mangoLassi.price * 2),
        status: 'ready',
        customerName: 'Rohan Verma',
        waiterId: waiters[0]._id,
        branchId: branch._id,
        createdAt: new Date(now.getTime() - 25 * 60000)
      }
    ]);

    // Update table status for active orders
    await Table.updateOne(
      { _id: createdTables[0]._id },
      { status: 'occupied', currentOrderId: currentOrders[0]._id }
    );
    await Table.updateOne(
      { _id: createdTables[10]._id },
      { status: 'occupied', currentOrderId: currentOrders[1]._id }
    );
    await Table.updateOne(
      { _id: createdTables[20]._id },
      { status: 'occupied', currentOrderId: currentOrders[2]._id }
    );

    console.log(`✅ Created ${currentOrders.length} active orders\n`);

    // ==================== 10. CALCULATE AND DISPLAY STATISTICS ====================
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 100-DAY SEED COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');

    // Basic data summary
    console.log('📊 BASIC DATA SUMMARY:');
    console.log(`  ✓ Permissions: ${createdPermissions.length}`);
    console.log(`  ✓ Roles: ${createdRoles.length}`);
    console.log(`  ✓ Branch: 1 (Main Branch)`);
    console.log(`  ✓ Users: ${users.length}`);
    console.log(`  ✓ Menu Items: ${menuItems.length}`);
    console.log(`  ✓ Tables: ${createdTables.length}\n`);

    // Order summary
    console.log('📈 ORDER SUMMARY:');
    console.log(`  Period: ${START_DATE.toLocaleDateString()} to ${END_DATE.toLocaleDateString()}`);
    console.log(`  Duration: ${DAYS_TO_SEED} days\n`);
    console.log(`  Dining Orders: ${diningOrders.length}`);
    console.log(`  Parcel Orders: ${parcelOrders.length}`);
    console.log(`  Total Historical Orders: ${diningOrders.length + parcelOrders.length}`);
    console.log(`  Active Orders (Current): ${currentOrders.length}\n`);

    // Financial summary
    const diningRevenue = diningOrders.reduce((sum, o) => sum + (o.payment?.amount || 0), 0);
    const parcelRevenue = parcelOrders.reduce((sum, o) => sum + (o.payment?.amount || 0), 0);
    const totalRevenue = diningRevenue + parcelRevenue;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    console.log('💰 FINANCIAL OVERVIEW:');
    console.log(`  Dining Revenue: ₹${diningRevenue.toLocaleString('en-IN')}`);
    console.log(`  Parcel Revenue: ₹${parcelRevenue.toLocaleString('en-IN')}`);
    console.log(`  Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`);
    console.log(`  Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`);
    console.log(`  Net Profit: ₹${netProfit.toLocaleString('en-IN')}`);
    console.log(`  Profit Margin: ${profitMargin.toFixed(2)}%\n`);

    // Daily averages
    const avgOrdersPerDay = (diningOrders.length + parcelOrders.length) / DAYS_TO_SEED;
    const avgRevenuePerDay = totalRevenue / DAYS_TO_SEED;
    const avgExpensesPerDay = totalExpenses / DAYS_TO_SEED;
    const avgProfitPerDay = netProfit / DAYS_TO_SEED;
    const avgOrderValue = totalRevenue / (diningOrders.length + parcelOrders.length);

    console.log('📊 DAILY AVERAGES:');
    console.log(`  Orders per Day: ${avgOrdersPerDay.toFixed(1)}`);
    console.log(`  Revenue per Day: ₹${avgRevenuePerDay.toFixed(2)}`);
    console.log(`  Expenses per Day: ₹${avgExpensesPerDay.toFixed(2)}`);
    console.log(`  Profit per Day: ₹${avgProfitPerDay.toFixed(2)}`);
    console.log(`  Average Order Value: ₹${avgOrderValue.toFixed(2)}\n`);

    // Order type breakdown
    console.log('🍽️ ORDER TYPE BREAKDOWN:');
    console.log(`  Dining Orders: ${diningOrders.length} (${((diningOrders.length / (diningOrders.length + parcelOrders.length)) * 100).toFixed(1)}%)`);
    console.log(`  Parcel Orders: ${parcelOrders.length} (${((parcelOrders.length / (diningOrders.length + parcelOrders.length)) * 100).toFixed(1)}%)\n`);

    // Payment method breakdown
    const paymentMethodCounts = {};
    [...diningOrders, ...parcelOrders].forEach(order => {
      const method = order.payment?.method || 'unknown';
      paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + 1;
    });

    console.log('💳 PAYMENT METHOD BREAKDOWN:');
    Object.entries(paymentMethodCounts).forEach(([method, count]) => {
      const percentage = (count / (diningOrders.length + parcelOrders.length)) * 100;
      console.log(`  ${method.toUpperCase()}: ${count} (${percentage.toFixed(1)}%)`);
    });
    console.log();

    // Expense breakdown
    const expenseCategories = {};
    expenses.forEach(expense => {
      expenseCategories[expense.category] = (expenseCategories[expense.category] || 0) + expense.amount;
    });

    console.log('💸 EXPENSE BREAKDOWN:');
    Object.entries(expenseCategories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, amount]) => {
        const percentage = (amount / totalExpenses) * 100;
        console.log(`  ${category}: ₹${amount.toLocaleString('en-IN')} (${percentage.toFixed(1)}%)`);
      });
    console.log();

    // Table status
    const availableTables = await Table.countDocuments({ status: 'available' });
    const occupiedTables = await Table.countDocuments({ status: 'occupied' });
    
    console.log('🪑 TABLE STATUS:');
    console.log(`  Available: ${availableTables}`);
    console.log(`  Occupied: ${occupiedTables}`);
    console.log(`  Total Capacity: ${createdTables.reduce((sum, t) => sum + t.capacity, 0)} seats\n`);

    // Test credentials
    console.log('🔑 TEST CREDENTIALS (Password: 123456):');
    console.log('  Admin:    admin@restaurant.com');
    console.log('  Manager:  manager@restaurant.com');
    console.log('  Cashier:  cashier@restaurant.com');
    console.log('  Waiter:   waiter@restaurant.com / waiter2@restaurant.com');
    console.log('  Chef:     chef@restaurant.com / chef2@restaurant.com\n');

    // Success indicators
    console.log('✨ READY TO USE:');
    console.log('  ✓ Login with any test account');
    console.log('  ✓ View 100 days of historical data');
    console.log('  ✓ Analyze revenue and expense trends');
    console.log('  ✓ Test kitchen workflow with active orders');
    console.log('  ✓ Process payments and generate bills\n');

    if (netProfit > 0) {
      console.log('✅ SUCCESS: Restaurant is PROFITABLE! 🎉');
      console.log(`   Net profit of ₹${netProfit.toLocaleString('en-IN')} over ${DAYS_TO_SEED} days\n`);
    } else {
      console.log('⚠️  WARNING: Restaurant showing losses. Review pricing strategy.\n');
    }

    console.log('═══════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error.message);
    console.error(error.stack);
    console.error('\n💡 TROUBLESHOOTING:');
    console.error('  1. Ensure MongoDB is running');
    console.error('  2. Verify MONGO_URI in .env file');
    console.error('  3. Check all models are properly defined');
    console.error('  4. Ensure sufficient disk space\n');
    process.exit(1);
  }
};

// Execute the seed script
seed100Days();