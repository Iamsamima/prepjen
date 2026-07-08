const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patient_name: { type: String, required: true, index: true },
    patient_phone: { type: String, index: true },
    patient_email: String,
    patient_age: Number,
    patient_gender: { type: String, enum: ['male', 'female', 'other', null], default: null },
    appointment_date: { type: Date, required: true, index: true },
    appointment_time: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'seen', 'cancelled', 'no-show'],
      default: 'scheduled',
      index: true,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'partial'],
      default: 'pending',
      index: true,
    },
    amount_charged: { type: Number, default: 0 },
    amount_paid: { type: Number, default: 0 },
    notes: String,
    prescription_data: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

AppointmentSchema.index({ user_id: 1, appointment_date: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);