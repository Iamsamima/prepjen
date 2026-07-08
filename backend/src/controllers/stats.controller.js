const asyncHandler = require('../utils/asyncHandler');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const Referrer = require('../models/Referrer');

exports.overview = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const [appointments, invoices, referrers] = await Promise.all([
    Appointment.aggregate([
      { $match: { user_id: req.user.mongoObjectId || undefined } },
    ]).catch(() => []),
    Invoice.countDocuments({ user_id: uid }),
    Referrer.countDocuments({ user_id: uid, is_active: true }),
  ]);

  const appts = await Appointment.countDocuments({ user_id: uid });
  const seen = await Appointment.countDocuments({ user_id: uid, status: 'seen' });

  res.json({
    appointments: { total: appts, seen },
    invoices: { total: invoices },
    referrers: { active: referrers },
  });
});