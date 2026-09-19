import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('Missing required environment variable: MONGO_URI');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

export default connectDB;
