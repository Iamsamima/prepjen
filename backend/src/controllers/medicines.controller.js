const asyncHandler = require('../utils/asyncHandler');
const Medicine = require('../models/Medicine');
const crudFactory = require('./crudFactory');

const base = crudFactory(Medicine, {
  searchFields: ['name', 'generic_name', 'manufacturer'],
  allowedFilters: ['type', 'is_active'],
});

exports.list = base.list;
exports.getOne = base.getOne;
exports.create = base.create;
exports.update = base.update;
exports.remove = base.remove;
exports.search = base.search;
exports.bulkCreate = base.bulkCreate;

// CSV/JSON import
exports.importJson = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : req.body.items;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items[] required' });
  const docs = await Medicine.insertMany(
    items.map((i) => ({ ...i, user_id: req.user.id })),
    { ordered: false }
  );
  res.status(201).json({ inserted: docs.length });
});

exports.exportJson = asyncHandler(async (req, res) => {
  const docs = await Medicine.find({ user_id: req.user.id }).lean();
  res.json(docs);
});