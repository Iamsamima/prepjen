const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null, index: true },
    patient_name: { type: String, required: true, index: true },
    patient_phone: { type: String, index: true },
    patient_email: String,
    patient_age: Number,
    patient_gender: String,
    vitals: mongoose.Schema.Types.Mixed,
    symptoms: [String],
    diagnosis: [
      {
        name: String,
        description: String,
        confidence: String,
      },
    ],
    medicines: [
      {
        name: String,
        type: String,
        dose: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],
    tests: [
      {
        testName: String,
        testType: String,
        reason: String,
      },
    ],
    notes: String,
    follow_up_date: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', PrescriptionSchema);