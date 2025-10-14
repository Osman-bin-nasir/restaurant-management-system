import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Role from '../models/Role.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import Permission from '../models/Permissions.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1️⃣ Define ALL Permissions
    const permissionsList = [
      // Users
      { name: 'users:view', description: 'View users' },
      { name: 'users:create', description: 'Create new users' },
      { name: 'users:update', description: 'Update user details' },
      { name: 'users:delete', description: 'Delete users' },
      
      // Roles & Permissions
      { name: 'permissions:view', description: 'View roles' },
      { name: 'permissions:create', description: 'Create roles' },
      { name: 'permissions:update', description: 'Update roles' },
      { name: 'permissions:delete', description: 'Delete roles' },
      
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

    // 2️⃣ Clear existing data
    await Promise.all([
      Role.deleteMany({}),
      Permission.deleteMany({}),
      Branch.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing data');

    // 3️⃣ Create Permission documents
    const createdPermissions = await Permission.insertMany(permissionsList);
    const permissionMap = {};
    createdPermissions.forEach(p => (permissionMap[p.name] = p._id));
    console.log('✅ Permissions seeded');

    // 4️⃣ Define Roles with EXPLICIT Permissions
    const roleDefinitions = [
      {
        name: 'admin',
        permissions: Object.values(permissionMap) // All permissions
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

    // 5️⃣ Create Roles
    const createdRoles = await Role.insertMany(roleDefinitions);
    console.log('✅ Roles seeded');

    const roleMap = {};
    createdRoles.forEach(r => (roleMap[r.name] = r._id));

    // 6️⃣ Create default Branch
    const mainBranch = await Branch.create({
      name: 'Main Branch',
      location: 'Downtown',
      contact: '+91-9876543210',
      operatingHours: { open: '9:00 AM', close: '11:00 PM' },
      status: 'active',
    });
    console.log('✅ Branch seeded');

    // 7️⃣ Create Users
    const users = [
      {
        name: 'Super Admin',
        email: 'admin@restaurant.com',
        password: await bcrypt.hash('admin123', 10),
        role: roleMap['admin'],
        shift: 'morning',
        branchId: mainBranch._id,
        isAccountVerified: true
      },
      {
        name: 'John Manager',
        email: 'manager@restaurant.com',
        password: await bcrypt.hash('manager123', 10),
        role: roleMap['manager'],
        shift: 'morning',
        branchId: mainBranch._id,
        isAccountVerified: true
      },
      {
        name: 'Priya Cashier',
        email: 'cashier@restaurant.com',
        password: await bcrypt.hash('cashier123', 10),
        role: roleMap['cashier'],
        shift: 'evening',
        branchId: mainBranch._id,
        isAccountVerified: true
      },
      {
        name: 'Ravi Waiter',
        email: 'waiter@restaurant.com',
        password: await bcrypt.hash('waiter123', 10),
        role: roleMap['waiter'],
        shift: 'evening',
        branchId: mainBranch._id,
        isAccountVerified: true
      },
      {
        name: 'Chef Arjun',
        email: 'chef@restaurant.com',
        password: await bcrypt.hash('chef123', 10),
        role: roleMap['chef'],
        shift: 'morning',
        branchId: mainBranch._id,
        isAccountVerified: true
      },
    ];

    await User.insertMany(users);
    console.log('✅ Users seeded successfully');

    console.log('\n🌱 Seeding Completed Successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@restaurant.com / admin123');
    console.log('Manager: manager@restaurant.com / manager123');
    console.log('Cashier: cashier@restaurant.com / cashier123');
    console.log('Waiter: waiter@restaurant.com / waiter123');
    console.log('Chef: chef@restaurant.com / chef123');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
};

seedData();