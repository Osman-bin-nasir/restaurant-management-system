import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: String,
  date: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true }
}, { timestamps: true });

expenseSchema.index({ branchId: 1, date: -1 });
expenseSchema.index({ branchId: 1, category: 1, date: -1 });

export default mongoose.model('Expense', expenseSchema);
