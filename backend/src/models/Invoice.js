const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invoice_number: { type: String, required: true, index: true },
    invoice_date: { type: Date, default: Date.now, index: true },
    appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
    patient_name: { type: String, required: true, index: true },
    patient_phone: String,
    patient_email: String,
    doctor_fees: { type: Number, default: 0 },
    platform_fees: { type: Number, default: 0 },
    other_charges: { type: Number, default: 0 },
    other_charges_description: String,
    subtotal: { type: Number, default: 0 },
    discount_percentage: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    gst_percentage: { type: Number, default: 0 },
    gst_amount: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0 },
    is_referred: { type: Boolean, default: false },
    referrer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Referrer', default: null },
    referral_commission_percentage: { type: Number, default: 0 },
    referral_commission_amount: { type: Number, default: 0 },
    referral_commission_paid: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'cancelled'],
      default: 'issued',
      index: true,
    },
    payment_method: String,
    payment_date: Date,
    notes: String,
  },
  { timestamps: true }
);

InvoiceSchema.index({ user_id: 1, invoice_number: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);