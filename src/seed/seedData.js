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

    // 1️⃣ Define Roles + Permissions
    const roleDefinitions = [
      { name: 'admin', permissions: ['*'] },
      {
        name: 'manager',
        permissions: ['branch:*', 'reports:view', 'employees:manage'],
      },
      { name: 'cashier', permissions: ['orders:create', 'billing:*'] },
      { name: 'waiter', permissions: ['orders:create', 'tables:manage'] },
      { name: 'chef', permissions: ['orders:view', 'orders:update'] },
    ];

    // 2️⃣ Clear existing data
    await Promise.all([
      Role.deleteMany({}),
      Permission.deleteMany({}),
      Branch.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing data');

    // 3️⃣ Extract unique permissions
    const allPermissions = [
      ...new Set(roleDefinitions.flatMap(r => r.permissions)),
    ];

    // 4️⃣ Create Permission documents
    const createdPermissions = await Permission.insertMany(
      allPermissions.map(p => ({ name: p }))
    );

    const permissionMap = {};
    createdPermissions.forEach(p => (permissionMap[p.name] = p._id));
    console.log('✅ Permissions seeded');

    // 5️⃣ Create Roles referencing Permission IDs
    const createdRoles = await Role.insertMany(
      roleDefinitions.map(role => ({
        name: role.name,
        permissions:
          role.permissions.includes('*')
            ? createdPermissions.map(p => p._id) // admin gets all
            : role.permissions.map(p => permissionMap[p]),
      }))
    );
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

    // 7️⃣ Create one User per Role
    const users = [
      {
        name: 'Super Admin',
        email: 'admin@restaurant.com',
        password: await bcrypt.hash('admin123', 10),
        role: roleMap['admin'],
        shift: 'morning',
        branchId: mainBranch._id,
      },
      {
        name: 'John Manager',
        email: 'manager@restaurant.com',
        password: await bcrypt.hash('manager123', 10),
        role: roleMap['manager'],
        shift: 'morning',
        branchId: mainBranch._id,
      },
      {
        name: 'Priya Cashier',
        email: 'cashier@restaurant.com',
        password: await bcrypt.hash('cashier123', 10),
        role: roleMap['cashier'],
        shift: 'evening',
        branchId: mainBranch._id,
      },
      {
        name: 'Ravi Waiter',
        email: 'waiter@restaurant.com',
        password: await bcrypt.hash('waiter123', 10),
        role: roleMap['waiter'],
        shift: 'evening',
        branchId: mainBranch._id,
      },
      {
        name: 'Chef Arjun',
        email: 'chef@restaurant.com',
        password: await bcrypt.hash('chef123', 10),
        role: roleMap['chef'],
        shift: 'morning',
        branchId: mainBranch._id,
      },
    ];

    await User.insertMany(users);
    console.log('✅ Users seeded successfully');

    console.log('\n🌱 Seeding Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
};

seedData();
