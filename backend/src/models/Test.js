const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, index: true },
    category: { type: String, enum: ['Blood', 'Urine', 'Imaging', 'Other'], default: 'Other' },
    notes: String,
    default_reason: String,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TestSchema.index({ user_id: 1, name: 1 });

module.exports = mongoose.model('Test', TestSchema);