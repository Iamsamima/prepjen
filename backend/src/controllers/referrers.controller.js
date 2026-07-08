const asyncHandler = require('../utils/asyncHandler');
const Referrer = require('../models/Referrer');
const crudFactory = require('./crudFactory');

const base = crudFactory(Referrer, {
  searchFields: ['name', 'phone', 'email'],
  allowedFilters: ['type', 'is_active'],
});

exports.list = base.list;
exports.getOne = base.getOne;
exports.create = base.create;
exports.update = base.update;
exports.search = base.search;

// soft delete
exports.remove = asyncHandler(async (req, res) => {
  const doc = await Referrer.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user.id },
    { $set: { is_active: false } },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

exports.payCommission = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount || 0);
  const doc = await Referrer.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user.id },
    { $inc: { total_commission_paid: amount } },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});