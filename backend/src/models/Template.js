const mongoose = require('mongoose');

/**
 * Unified template collection for prescriptions/diagnoses/medicines/symptoms/tests.
 * `type` discriminates. `data` holds the type-specific payload.
 */
const TemplateSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['prescription', 'medicine', 'diagnosis', 'symptom', 'test'],
      required: true,
      index: true,
    },
    name: { type: String, required: true, index: true },
    tags: [String],
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TemplateSchema.index({ user_id: 1, type: 1, name: 1 });

module.exports = mongoose.model('Template', TemplateSchema);