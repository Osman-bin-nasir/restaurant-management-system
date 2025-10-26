import mongoose from 'mongoose';

const parcelOrderItemSchema = new mongoose.Schema({
  menuItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MenuItem', 
    required: true 
  },
  quantity: { 
    type: Number, 
    default: 1,
    min: 1
  },
  notes: String,
  
  // Kitchen status tracking
  status: {
    type: String,
    enum: ['placed', 'in-kitchen', 'ready', 'completed'],
    default: 'placed',
    required: true
  },
  
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Kitchen workflow
  kitchenStartTime: Date,
  kitchenCompleteTime: Date,
  
  // Pricing
  priceAtOrder: Number
}, { 
  timestamps: true,
  _id: true
});

const parcelOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  
  // Always parcel type
  type: { type: String, default: 'parcel', immutable: true },
  
  // Items
  items: [parcelOrderItemSchema],
  
  // Pricing
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  
  // Order status (simpler than dine-in)
  orderStatus: {
    type: String,
    enum: ['placed', 'in-kitchen', 'ready', 'completed', 'cancelled'],
    default: 'placed'
  },
  
  // Payment (immediate billing)
  payment: {
    status: { 
      type: String, 
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid'
    },
    method: { type: String, enum: ['cash', 'card', 'upi', 'cheque'] },
    amount: Number,
    paidAt: Date,
    refund: {
      amount: Number,
      reason: String,
      processedAt: Date
    }
  },
  
  // Customer info
  customerName: { type: String, required: true },
  customerPhone: String,
  
  // Staff
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  
  // Timestamps
  orderedAt: { type: Date, default: Date.now },
  estimatedReadyTime: Date,
  actualReadyTime: Date
  
}, { 
  timestamps: true 
});

// ============ METHODS ============

// Calculate totals
parcelOrderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => 
    sum + (item.priceAtOrder * item.quantity), 0
  );
  
  let discountAmount = 0;
  if (this.discountType === 'percentage') {
    discountAmount = (this.subtotal * this.discount) / 100;
  } else {
    discountAmount = this.discount;
  }
  
  const taxableAmount = this.subtotal - discountAmount;
  this.taxAmount = Math.round(taxableAmount * 0.05); // 5% tax
  this.totalAmount = taxableAmount + this.taxAmount;
};

// Update order status based on items
parcelOrderSchema.methods.updateOrderStatus = function() {
  const items = this.items.filter(item => item.status !== 'cancelled');
  
  if (items.length === 0) {
    this.orderStatus = 'cancelled';
    return;
  }
  
  const allCompleted = items.every(item => item.status === 'completed');
  const allReady = items.every(item => item.status === 'ready' || item.status === 'completed');
  const anyInKitchen = items.some(item => item.status === 'in-kitchen');
  
  if (allCompleted) {
    this.orderStatus = 'completed';
  } else if (allReady) {
    this.orderStatus = 'ready';
    if (!this.actualReadyTime) {
      this.actualReadyTime = new Date();
    }
  } else if (anyInKitchen) {
    this.orderStatus = 'in-kitchen';
  } else {
    this.orderStatus = 'placed';
  }
};

// Pre-save middleware
parcelOrderSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

export default mongoose.model('ParcelOrder', parcelOrderSchema);