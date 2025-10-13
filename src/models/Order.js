import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['dine-in', 'parcel'], required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      quantity: { type: Number, default: 1 },
      notes: String
    }
  ],
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['placed', 'in-kitchen', 'ready', 'served', 'paid', 'cancelled'],
    default: 'placed'
  },
  customerName: String,
  waiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }
}, { timestamps: true });

orderSchema.index({ branchId: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
