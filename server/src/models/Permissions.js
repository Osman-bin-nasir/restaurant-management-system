import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "orders:create"
    description: { type: String }, // optional, e.g. "Allows creating orders"
  },
  { timestamps: true }
);

export default mongoose.model('Permission', permissionSchema);