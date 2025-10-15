import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['daily', 'monthly', 'yearly', 'custom'], 
    required: true 
  },
  date: { type: Date, required: true },
  branchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: true 
  },
  
  // Revenue data
  revenue: {
    gross: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 }
  },
  
  // Expense data
  expenses: {
    total: { type: Number, default: 0 },
    byCategory: [
      {
        category: String,
        amount: Number
      }
    ]
  },
  
  // Profit data
  profit: {
    gross: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    margin: { type: Number, default: 0 } // percentage
  },
  
  // Breakdown data
  breakdown: {
    byPaymentMethod: [
      {
        method: String,
        count: Number,
        amount: Number
      }
    ],
    byOrderType: [
      {
        type: String,
        count: Number,
        amount: Number
      }
    ],
    byCategory: [
      {
        category: String,
        quantity: Number,
        revenue: Number
      }
    ]
  },
  
  // Legacy fields (keep for backward compatibility)
  salesData: { type: Object },
  profits: { type: Number, default: 0 }
  
}, { timestamps: true });

// Index for efficient queries
reportSchema.index({ branchId: 1, type: 1, date: -1 });

export default mongoose.model('Report', reportSchema);