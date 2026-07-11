const asyncHandler = require('../utils/asyncHandler');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const Referrer = require('../models/Referrer');
const Prescription = require('../models/Prescription');

exports.overview = asyncHandler(async (req, res) => {
  const uid = req.user.id;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalAppointments,
    seenAppointments,
    scheduledToday,
    totalInvoices,
    paidInvoices,
    totalPrescriptions,
    activeReferrers,
    revenueAgg,
  ] = await Promise.all([
    Appointment.countDocuments({ user_id: uid }),
    Appointment.countDocuments({ user_id: uid, status: 'seen' }),
    Appointment.countDocuments({
      user_id: uid,
      appointment_date: { $gte: startOfDay, $lte: endOfDay },
      status: 'scheduled',
    }),
    Invoice.countDocuments({ user_id: uid }),
    Invoice.countDocuments({ user_id: uid, status: 'paid' }),
    Prescription.countDocuments({ user_id: uid }),
    Referrer.countDocuments({ user_id: uid, is_active: true }),
    Invoice.aggregate([
      { $match: { user_id: req.user._mongoId || undefined } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total_amount' },
          totalPaid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total_amount', 0] },
          },
        },
      },
    ]).catch(() => []),
  ]);

  const revenue = revenueAgg?.[0] || { totalRevenue: 0, totalPaid: 0 };

  res.json({
    appointments: { total: totalAppointments, seen: seenAppointments, scheduledToday },
    invoices: { total: totalInvoices, paid: paidInvoices, ...revenue },
    prescriptions: { total: totalPrescriptions },
    referrers: { active: activeReferrers },
  });
});