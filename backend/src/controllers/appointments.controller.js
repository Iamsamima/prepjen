const asyncHandler = require('../utils/asyncHandler');
const Appointment = require('../models/Appointment');
const crudFactory = require('./crudFactory');

const base = crudFactory(Appointment, {
  searchFields: ['patient_name', 'patient_phone', 'patient_email', 'notes'],
  allowedFilters: ['status', 'payment_status'],
  dateField: 'appointment_date',
});

exports.list = base.list;
exports.getOne = base.getOne;
exports.create = base.create;
exports.update = base.update;
exports.remove = base.remove;
exports.search = base.search;

exports.stats = asyncHandler(async (req, res) => {
  const match = { user_id: req.user._mongoId || undefined };
  const [agg] = await Appointment.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalPatients: { $sum: 1 },
        patientsSeen: { $sum: { $cond: [{ $eq: ['$status', 'seen'] }, 1, 0] } },
        totalRevenue: { $sum: { $ifNull: ['$amount_charged', 0] } },
        amountPaid: { $sum: { $ifNull: ['$amount_paid', 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        totalPatients: 1,
        patientsSeen: 1,
        totalRevenue: 1,
        amountPaid: 1,
        amountDue: { $subtract: ['$totalRevenue', '$amountPaid'] },
      },
    },
  ]);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const scheduledToday = await Appointment.countDocuments({
    user_id: req.user.id,
    appointment_date: { $gte: start, $lte: end },
    status: 'scheduled',
  });

  res.json({
    totalPatients: 0,
    patientsSeen: 0,
    totalRevenue: 0,
    amountPaid: 0,
    amountDue: 0,
    ...(agg || {}),
    scheduledToday,
  });
});

exports.markSeen = asyncHandler(async (req, res) => {
  const doc = await Appointment.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user.id },
    { $set: { status: 'seen' } },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

exports.attachPrescription = asyncHandler(async (req, res) => {
  const doc = await Appointment.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user.id },
    { $set: { prescription_data: req.body, status: 'seen' } },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

exports.patientHistory = asyncHandler(async (req, res) => {
  const phone = req.params.phone;
  const history = await Appointment.find({
    user_id: req.user.id,
    patient_phone: phone,
    prescription_data: { $ne: null },
  })
    .sort({ appointment_date: -1 })
    .lean();
  res.json({ patient_phone: phone, total: history.length, history });
});