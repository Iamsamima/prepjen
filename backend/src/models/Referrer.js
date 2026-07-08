const mongoose = require('mongoose');

const ReferrerSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, index: true },
    phone: String,
    email: String,
    type: {
      type: String,
      enum: ['individual', 'clinic', 'hospital', 'other'],
      default: 'individual',
    },
    default_commission_percentage: { type: Number, default: 10 },
    total_commission_earned: { type: Number, default: 0 },
    total_commission_paid: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true, index: true },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Referrer', ReferrerSchema);