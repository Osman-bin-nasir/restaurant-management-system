import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  image: String,
  cookingTime: { type: Number, default: 10 }, // in minutes
  availability: { type: Boolean, default: true },
  ingredients: [{ type: String }],
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true }
}, { timestamps: true });

menuItemSchema.index({ name: 1, branchId: 1 }, { unique: true });

export default mongoose.model('MenuItem', menuItemSchema);
