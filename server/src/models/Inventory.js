import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  unit: { type: String, enum: ['kg', 'g', 'litre', 'ml', 'pcs'], default: 'pcs' },
  reorderLevel: { type: Number, default: 10 },
  lastRestocked: { type: Date, default: Date.now },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true }
}, { timestamps: true });

inventorySchema.index({ itemName: 1, branchId: 1 }, { unique: true });

export default mongoose.model('Inventory', inventorySchema);
