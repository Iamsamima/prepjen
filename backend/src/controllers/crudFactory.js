/**
 * Reusable CRUD controller factory. Every list endpoint supports:
 *   ?page=&limit=&sort=&search=&from=&to=&<allowedFilter>=
 * with debounced regex search on searchFields.
 */
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { paginate } = require('../utils/buildQuery');

function crudFactory(Model, opts = {}) {
  const {
    searchFields = [],
    allowedFilters = [],
    dateField,
    scoped = true, // scope by req.user.id via user_id
    beforeCreate,  // async (payload, req) => payload
    beforeUpdate,  // async (payload, doc, req) => payload
  } = opts;

  const baseFilter = (req) => (scoped ? { user_id: req.user.id } : {});

  const list = asyncHandler(async (req, res) => {
    const result = await paginate(Model, req.query, {
      baseFilter: baseFilter(req),
      searchFields,
      allowedFilters,
      dateField,
    });
    res.json(result);
  });

  const getOne = asyncHandler(async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, ...baseFilter(req) });
    if (!doc) throw new ApiError(404, 'Not found');
    res.json(doc);
  });

  const create = asyncHandler(async (req, res) => {
    let payload = { ...req.body, ...(scoped ? { user_id: req.user.id } : {}) };
    if (beforeCreate) payload = await beforeCreate(payload, req);
    const doc = await Model.create(payload);
    res.status(201).json(doc);
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, ...baseFilter(req) });
    if (!doc) throw new ApiError(404, 'Not found');
    let payload = req.body;
    if (beforeUpdate) payload = await beforeUpdate(payload, doc, req);
    Object.assign(doc, payload);
    await doc.save();
    res.json(doc);
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findOneAndDelete({ _id: req.params.id, ...baseFilter(req) });
    if (!doc) throw new ApiError(404, 'Not found');
    res.json({ ok: true, id: req.params.id });
  });

  const search = asyncHandler(async (req, res) => {
    const q = req.query.q || req.query.search || '';
    const result = await paginate(Model, { ...req.query, search: q }, {
      baseFilter: baseFilter(req),
      searchFields,
      allowedFilters,
      dateField,
    });
    res.json(result);
  });

  const bulkCreate = asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    if (!Array.isArray(items)) throw new ApiError(400, 'items[] required');
    const withUser = items.map((i) => ({ ...i, ...(scoped ? { user_id: req.user.id } : {}) }));
    const docs = await Model.insertMany(withUser, { ordered: false });
    res.status(201).json({ inserted: docs.length, docs });
  });

  return { list, getOne, create, update, remove, search, bulkCreate };
}

module.exports = crudFactory;