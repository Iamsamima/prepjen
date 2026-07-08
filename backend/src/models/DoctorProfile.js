const mongoose = require('mongoose');

const DoctorProfileSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    doctor_name: String,
    qualification: String,
    registration_number: String,
    specialization: String,
    phone: String,
    email: String,
    hospital_name: String,
    hospital_address: String,
    clinic_name: String,
    clinic_address: String,
    header_url: String,
    footer_url: String,
    signature_url: String,
    logo_url: String,
    website: String,
    consultation_fee: { type: Number, default: 0 },
    platform_fee: { type: Number, default: 0 },
    default_gst_percentage: { type: Number, default: 0 },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorProfile', DoctorProfileSchema);