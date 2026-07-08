const asyncHandler = require('../utils/asyncHandler');
const Invoice = require('../models/Invoice');
const Referrer = require('../models/Referrer');
const crudFactory = require('./crudFactory');

function computeTotals(inv) {
  const doctor = Number(inv.doctor_fees || 0);
  const platform = Number(inv.platform_fees || 0);
  const other = Number(inv.other_charges || 0);
  const subtotal = doctor + platform + other;
  const discount = inv.discount_amount != null
    ? Number(inv.discount_amount)
    : (subtotal * Number(inv.discount_percentage || 0)) / 100;
  const afterDiscount = Math.max(0, subtotal - discount);
  const gst = inv.gst_amount != null
    ? Number(inv.gst_amount)
    : (afterDiscount * Number(inv.gst_percentage || 0)) / 100;
  const total = afterDiscount + gst;
  const commission = inv.is_referred
    ? (doctor * Number(inv.referral_commission_percentage || 0)) / 100
    : 0;
  return {
    subtotal,
    discount_amount: Number(discount.toFixed(2)),
    gst_amount: Number(gst.toFixed(2)),
    total_amount: Number(total.toFixed(2)),
    referral_commission_amount: Number(commission.toFixed(2)),
  };
}

async function nextInvoiceNumber(userId) {
  const count = await Invoice.countDocuments({ user_id: userId });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
}

const base = crudFactory(Invoice, {
  searchFields: ['invoice_number', 'patient_name', 'patient_phone'],
  allowedFilters: ['status', 'is_referred', 'referrer_id'],
  dateField: 'invoice_date',
  beforeCreate: async (payload, req) => {
    if (!payload.invoice_number) payload.invoice_number = await nextInvoiceNumber(req.user.id);
    return { ...payload, ...computeTotals(payload) };
  },
  beforeUpdate: async (payload) => ({ ...payload, ...computeTotals(payload) }),
});

exports.list = base.list;
exports.getOne = base.getOne;
exports.create = base.create;
exports.update = base.update;
exports.remove = base.remove;
exports.search = base.search;

exports.markPaid = asyncHandler(async (req, res) => {
  const inv = await Invoice.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user.id },
    { $set: { status: 'paid', payment_date: new Date(), payment_method: req.body?.payment_method || 'cash' } },
    { new: true }
  );
  if (!inv) return res.status(404).json({ error: 'Not found' });

  // update referrer earnings
  if (inv.is_referred && inv.referrer_id && inv.referral_commission_amount) {
    await Referrer.findByIdAndUpdate(inv.referrer_id, {
      $inc: { total_commission_earned: inv.referral_commission_amount },
    });
  }
  res.json(inv);
});

exports.stats = asyncHandler(async (req, res) => {
  const match = { user_id: req.user.id };
  const [agg] = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        totalRevenue: { $sum: '$total_amount' },
        totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total_amount', 0] } },
        totalPending: {
          $sum: { $cond: [{ $ne: ['$status', 'paid'] }, '$total_amount', 0] },
        },
        totalCommission: { $sum: '$referral_commission_amount' },
        totalDiscount: { $sum: '$discount_amount' },
        totalGst: { $sum: '$gst_amount' },
      },
    },
  ]);
  res.json(agg || {
    totalInvoices: 0, totalRevenue: 0, totalPaid: 0, totalPending: 0,
    totalCommission: 0, totalDiscount: 0, totalGst: 0,
  });
});

exports.nextNumber = asyncHandler(async (req, res) => {
  res.json({ invoice_number: await nextInvoiceNumber(req.user.id) });
});