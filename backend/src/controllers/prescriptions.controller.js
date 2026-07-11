const asyncHandler = require('../utils/asyncHandler');
const Prescription = require('../models/Prescription');
const crudFactory = require('./crudFactory');

const base = crudFactory(Prescription, {
  searchFields: ['patient_name', 'patient_phone', 'notes'],
  allowedFilters: ['appointment_id'],
  dateField: 'createdAt',
});

module.exports = {
  ...base,
  byPhone: asyncHandler(async (req, res) => {
    const items = await Prescription.find({
      user_id: req.user.id,
      patient_phone: req.params.phone,
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ patient_phone: req.params.phone, total: items.length, items });
  }),
};