import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
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
  
  // ✨ NEW: Item-level status tracking
  status: {
    type: String,
    enum: ['placed', 'in-kitchen', 'ready', 'served', 'cancelled'],
    default: 'placed',
    required: true
  },
  
  // ✨ NEW: Track status history for audit trail
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // ✨ NEW: Kitchen workflow tracking
  kitchenStartTime: Date,
  kitchenCompleteTime: Date,
  servedTime: Date,
  
  // ✨ NEW: Item versioning (for modifications)
  version: { type: Number, default: 1 },
  originalItemId: { type: mongoose.Schema.Types.ObjectId }, // For tracking splits/modifications
  
  // Pricing snapshot (frozen at order time)
  priceAtOrder: Number,
  
  // ✨ NEW: Cancellation tracking
  cancellationReason: String,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: Date
}, { 
  timestamps: true,
  _id: true // ✨ NEW: Each item gets unique _id for tracking
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['dine-in', 'parcel'], required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  
  // Items with individual statuses
  items: [orderItemSchema],
  
  totalAmount: { type: Number, default: 0 },
  
  // ✨ MODIFIED: Derived from item statuses
  status: {
    type: String,
    enum: ['placed', 'in-kitchen', 'ready', 'served', 'paid', 'cancelled'],
    default: 'placed'
  },
  
  customerName: String,
  waiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  
  // Payment remains at order level
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
    }
  },
  
  discount: {
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: Number,
    amount: Number,
    appliedAt: Date
  }
}, { 
  timestamps: true 
});

// ✨ NEW: Virtual for aggregated item counts by status
orderSchema.virtual('itemStatusCounts').get(function() {
  const counts = {
    placed: 0,
    'in-kitchen': 0,
    ready: 0,
    served: 0,
    cancelled: 0
  };
  
  this.items.forEach(item => {
    counts[item.status]++;
  });
  
  return counts;
});

// ✨ NEW: Method to derive order status from items
orderSchema.methods.updateOrderStatus = function() {
  const items = this.items.filter(item => item.status !== 'cancelled');
  
  if (items.length === 0) {
    this.status = 'cancelled';
    return;
  }
  
  const allServed = items.every(item => item.status === 'served');
  const anyReady = items.some(item => item.status === 'ready');
  const anyInKitchen = items.some(item => item.status === 'in-kitchen');
  const allPlaced = items.every(item => item.status === 'placed');
  
  if (this.payment?.paidAt) {
    this.status = 'paid';
  } else if (allServed) {
    this.status = 'served';
  } else if (anyReady) {
    this.status = 'ready'; // Prioritize 'ready' if any item is ready
  } else if (anyInKitchen) {
    this.status = 'in-kitchen';
  } else if (allPlaced) {
    this.status = 'placed';
  } else {
    this.status = 'placed'; // Fallback
  }
};

// ✨ NEW: Method to get active (non-cancelled) items
orderSchema.methods.getActiveItems = function() {
  return this.items.filter(item => item.status !== 'cancelled');
};

// ✨ NEW: Indexes for efficient queries
orderSchema.index({ 'items.status': 1, branchId: 1 });
orderSchema.index({ 'items._id': 1 }); // For direct item lookups

export default mongoose.model('Order', orderSchema);