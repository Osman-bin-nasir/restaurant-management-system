
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Revenue from '../models/Revenue.js';

dotenv.config({ path: './server/.env' });

const seedRevenue = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing revenue data
    await Revenue.deleteMany({});
    console.log('🧹 Cleared existing revenue data');

    // Find all paid orders
    const paidOrders = await Order.find({ status: 'paid' });

    if (paidOrders.length === 0) {
      console.log('No paid orders found to generate revenue from.');
      process.exit(0);
    }

    // Create revenue data from paid orders
    const revenueData = paidOrders.map(order => ({
      orderId: order._id,
      branchId: order.branchId,
      amount: order.totalAmount,
      date: order.createdAt
    }));

    await Revenue.insertMany(revenueData);
    console.log(`✅ Seeded ${revenueData.length} revenue records`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
};

seedRevenue();
