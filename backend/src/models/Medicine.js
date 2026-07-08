const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, index: true },
    generic_name: { type: String, index: true },
    type: {
      type: String,
      enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Other'],
      default: 'Tablet',
    },
    default_dose: String,
    default_frequency: String,
    default_duration: String,
    instructions: String,
    strength: String,
    manufacturer: String,
    notes: String,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MedicineSchema.index({ user_id: 1, name: 1 });

module.exports = mongoose.model('Medicine', MedicineSchema);