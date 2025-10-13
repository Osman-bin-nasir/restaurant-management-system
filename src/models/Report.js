import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  type: { type: String, enum: ['daily', 'monthly'], required: true },
  date: { type: Date, required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  salesData: { type: Object },
  expenses: { type: Object },
  profits: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
