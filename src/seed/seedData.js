import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Role from '../models/Role.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1️⃣ Create Roles
    const roles = [
      { name: 'admin', permissions: ['*'] },
      { name: 'manager', permissions: ['branch:*', 'reports:view', 'employees:manage'] },
      { name: 'cashier', permissions: ['orders:create', 'billing:*'] },
      { name: 'waiter', permissions: ['orders:create', 'tables:manage'] },
      { name: 'chef', permissions: ['orders:view', 'orders:update'] }
    ];

    await Role.deleteMany({});
    const createdRoles = await Role.insertMany(roles);
    console.log('✅ Roles seeded');

    // Get role IDs
    const roleMap = {};
    createdRoles.forEach(r => (roleMap[r.name] = r._id));

    // 2️⃣ Create a default Branch
    await Branch.deleteMany({});
    const mainBranch = await Branch.create({
      name: 'Main Branch',
      location: 'Downtown',
      contact: '+91-9876543210',
      operatingHours: { open: '9:00 AM', close: '11:00 PM' },
      status: 'active'
    });
    console.log('✅ Branch seeded');

    // 3️⃣ Create Users
    await User.deleteMany({});
    const users = [
      {
        name: 'Super Admin',
        email: 'admin@restaurant.com',
        password: 'admin123',
        role: roleMap['admin'],
        shift: 'morning'
      },
      {
        name: 'John Manager',
        email: 'manager@restaurant.com',
        password: 'manager123',
        role: roleMap['manager'],
        shift: 'morning'
      },
      {
        name: 'Priya Cashier',
        email: 'cashier@restaurant.com',
        password: 'cashier123',
        role: roleMap['cashier'],
        shift: 'evening'
      },
      {
        name: 'Amit Waiter',
        email: 'waiter@restaurant.com',
        password: 'waiter123',
        role: roleMap['waiter'],
        shift: 'morning'
      },
      {
        name: 'Chef Ramesh',
        email: 'chef@restaurant.com',
        password: 'chef123',
        role: roleMap['chef'],
        shift: 'evening'
      }
    ];

    // Hash passwords
    const userDocs = await Promise.all(
      users.map(async u => ({
        ...u,
        password: await bcrypt.hash(u.password, 10),
        branchId: mainBranch._id
      }))
    );

    await User.insertMany(userDocs);
    console.log('✅ Users created:');
    users.forEach(u =>
      console.log(`→ ${u.name} | ${u.email} | pass: ${u.password}`)
    );

    console.log('\n🌱 Seeding Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
};

seedData();