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
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },

  // Payments related

  payment: {
    method: { type: String, enum: ['cash', 'card', 'upi', 'cheque'] },
    amount: Number,
    originalAmount: Number,
    discount: Number,
    paidAt: Date,
    notes: String,
    refund: {
      amount: Number,
      reason: String,
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      processedAt: Date
    },
    voided: {
      reason: String,
      voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      voidedAt: Date
    }
  },
  discount: {
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number,
    amount: Number,
    appliedAt: Date
  }
}, { timestamps: true });

orderSchema.index({ branchId: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
