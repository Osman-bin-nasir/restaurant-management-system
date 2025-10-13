import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  mergedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Table' }]
}, { timestamps: true });

tableSchema.index({ tableNumber: 1, branchId: 1 }, { unique: true });

export default mongoose.model('Table', tableSchema);
