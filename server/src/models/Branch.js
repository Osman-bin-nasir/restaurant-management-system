import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  contact: { type: String },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  operatingHours: {
    open: String,
    close: String
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Branch', branchSchema);
