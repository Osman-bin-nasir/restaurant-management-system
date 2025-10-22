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

dotenv.config({ path: './server/.env' });

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
      Order.deleteMany({})
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
    const userMap = {};
    createdUsers.forEach(u => {
      if (u.email === 'waiter@restaurant.com') userMap.waiter = u._id;
      if (u.email === 'waiter2@restaurant.com') userMap.waiter2 = u._id;
      if (u.email === 'cashier@restaurant.com') userMap.cashier = u._id;
      if (u.email === 'chef@restaurant.com') userMap.chef = u._id;
    });
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // ==================== 5. CREATE MENU ITEMS (FROM YOUR DATA) ====================
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
      {
        name: 'Dal Makhani',
        category: 'Vegan',
        price: 249,
        description: 'Creamy black lentils slow-cooked overnight',
        image: 'https://images.unsplash.com/photo-1626500154744-e4b394ffea16?ixlib=rb-4.0.3',
        cookingTime: 15,
        availability: true,
        ingredients: ['Black Lentils', 'Butter', 'Cream', 'Spices'],
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
      },
      {
        name: 'cake',
        category: 'Dessert',
        price: 599,
        description: 'it s cake',
        image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=500',
        cookingTime: 10,
        availability: true,
        ingredients: ['Flour', 'Sugar'],
        branchId: mainBranch._id
      }
    ];

    const createdMenuItems = await MenuItem.insertMany(menuItems);
    console.log(`✅ Created ${createdMenuItems.length} menu items\n`);

    // ==================== 6. CREATE TABLES ====================
    console.log('🪑 Creating tables...');
    const tables = [];
    
    // 2-seater tables (1-8)
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
    
    // 4-seater tables (9-16)
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
    
    // 6-seater tables (17-20)
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
    
    // 8-seater tables (21-22)
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

    // ==================== 7. CREATE SAMPLE ORDERS ====================
    console.log('📦 Creating sample orders...');
    
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

    // Get menu items for orders
    const chickenBiryani = createdMenuItems.find(m => m.name === 'Chicken Biryani');
    const butterChicken = createdMenuItems.find(m => m.name === 'Butter Chicken');
    const paneerBM = createdMenuItems.find(m => m.name === 'Paneer Butter Masala');
    const butterNaan = createdMenuItems.find(m => m.name === 'Butter Naan');
    const coldCoffee = createdMenuItems.find(m => m.name === 'Cold Coffee');
    const paneerTikka = createdMenuItems.find(m => m.name === 'Paneer Tikka');
    const chickenWings = createdMenuItems.find(m => m.name === 'Chicken Wings');
    const cake = createdMenuItems.find(m => m.name === 'cake');
    const mangoLassi = createdMenuItems.find(m => m.name === 'Mango Lassi');

    const orders = [
      // Order 1 - Placed (New order)
      {
        orderNumber: `ORD-${Date.now()}-001`,
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
        waiterId: userMap.waiter,
        branchId: mainBranch._id
      },
      
      // Order 2 - In Kitchen
      {
        orderNumber: `ORD-${Date.now()}-002`,
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
        waiterId: userMap.waiter2,
        branchId: mainBranch._id
      },
      
      // Order 3 - Ready
      {
        orderNumber: `ORD-${Date.now()}-003`,
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
        waiterId: userMap.waiter,
        branchId: mainBranch._id
      },
      
      // Order 4 - Served
      {
        orderNumber: `ORD-${Date.now()}-004`,
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
        waiterId: userMap.waiter2,
        branchId: mainBranch._id
      },
      
      // Order 5 - Parcel order
      {
        orderNumber: `ORD-${Date.now()}-005`,
        type: 'parcel',
        items: createOrderItems([
          { menuItemId: butterChicken._id, quantity: 2, price: butterChicken.price },
          { menuItemId: butterNaan._id, quantity: 6, price: butterNaan.price },
          { menuItemId: cake._id, quantity: 1, price: cake.price }
        ], 'placed'),
        totalAmount: (butterChicken.price * 2) + (butterNaan.price * 6) + cake.price,
        status: 'placed',
        customerName: 'Online Order - Rajesh',
        waiterId: userMap.waiter,
        branchId: mainBranch._id
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log(`✅ Created ${createdOrders.length} sample orders\n`);

    // Update table status for dine-in orders
    for (const order of createdOrders) {
      if (order.type === 'dine-in' && order.tableId) {
        await Table.findByIdAndUpdate(order.tableId, {
          status: 'occupied',
          currentOrderId: order._id
        });
      }
    }
    console.log('✅ Updated table statuses\n');

    // ==================== SUMMARY ====================
    console.log('═══════════════════════════════════════');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   Permissions: ${createdPermissions.length}`);
    console.log(`   Roles: ${createdRoles.length}`);
    console.log(`   Branches: ${createdBranches.length}`);
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Menu Items: ${createdMenuItems.length}`);
    console.log(`   Tables: ${createdTables.length}`);
    console.log(`   Orders: ${createdOrders.length}\n`);
    
    console.log('🔑 Test Credentials (Password: 123456):');
    console.log('   Admin:    admin@restaurant.com');
    console.log('   Manager:  manager@restaurant.com');
    console.log('   Cashier:  cashier@restaurant.com');
    console.log('   Waiter:   waiter@restaurant.com');
    console.log('   Chef:     chef@restaurant.com\n');
    
    console.log('💡 Quick Stats:');
    const tableStats = {
      available: await Table.countDocuments({ status: 'available' }),
      occupied: await Table.countDocuments({ status: 'occupied' }),
      reserved: await Table.countDocuments({ status: 'reserved' })
    };
    
    console.log(`   Available Tables: ${tableStats.available}`);
    console.log(`   Occupied Tables: ${tableStats.occupied}`);
    console.log(`   Reserved Tables: ${tableStats.reserved}`);
    console.log(`   Total Capacity: ${createdTables.reduce((sum, t) => sum + t.capacity, 0)} seats\n`);
    
    console.log('📋 Order Status Breakdown:');
    console.log(`   Placed: ${createdOrders.filter(o => o.status === 'placed').length}`);
    console.log(`   In Kitchen: ${createdOrders.filter(o => o.status === 'in-kitchen').length}`);
    console.log(`   Ready: ${createdOrders.filter(o => o.status === 'ready').length}`);
    console.log(`   Served: ${createdOrders.filter(o => o.status === 'served').length}\n`);
    
    console.log('🍽️ Menu Breakdown:');
    console.log(`   Snacks: ${createdMenuItems.filter(m => m.category === 'Snack').length}`);
    console.log(`   Meals: ${createdMenuItems.filter(m => m.category === 'Meal').length}`);
    console.log(`   Vegan: ${createdMenuItems.filter(m => m.category === 'Vegan').length}`);
    console.log(`   Drinks: ${createdMenuItems.filter(m => m.category === 'Drink').length}`);
    console.log(`   Desserts: ${createdMenuItems.filter(m => m.category === 'Dessert').length}\n`);
    
    console.log('✨ You can now:');
    console.log('   1. Login with any test account');
    console.log('   2. View orders in different stages');
    console.log('   3. Create new orders');
    console.log('   4. Test kitchen workflow');
    console.log('   5. Process payments\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedAll();