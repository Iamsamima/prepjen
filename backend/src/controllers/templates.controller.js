const asyncHandler = require('../utils/asyncHandler');
const Template = require('../models/Template');
const crudFactory = require('./crudFactory');

const base = crudFactory(Template, {
  searchFields: ['name', 'tags'],
  allowedFilters: ['type', 'is_active'],
});

module.exports = {
  ...base,
  importJson: asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items[] required' });
    const docs = await Template.insertMany(
      items.map((i) => ({ ...i, user_id: req.user.id })),
      { ordered: false }
    );
    res.status(201).json({ inserted: docs.length });
  }),
  exportJson: asyncHandler(async (req, res) => {
    const filter = { user_id: req.user.id };
    if (req.query.type) filter.type = req.query.type;
    const docs = await Template.find(filter).lean();
    res.json(docs);
  }),
};