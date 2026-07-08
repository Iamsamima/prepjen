function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function paginate(Model, query = {}, opts = {}) {
  const {
    baseFilter = {},
    searchFields = [],
    dateField,
    allowedFilters = [],
    defaultSort = { createdAt: -1 },
  } = opts;

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { ...baseFilter };

  if (query.search && searchFields.length) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = searchFields.map((f) => ({ [f]: rx }));
  }

  for (const key of allowedFilters) {
    if (query[key] !== undefined && query[key] !== '') filter[key] = query[key];
  }

  if (dateField && (query.from || query.to)) {
    filter[dateField] = {};
    if (query.from) filter[dateField].$gte = new Date(query.from);
    if (query.to) {
      const end = new Date(query.to);
      end.setHours(23, 59, 59, 999);
      filter[dateField].$lte = end;
    }
  }

  let sort = defaultSort;
  if (query.sort) {
    sort = {};
    for (const part of String(query.sort).split(',')) {
      const p = part.trim();
      if (!p) continue;
      if (p.startsWith('-')) sort[p.slice(1)] = -1;
      else sort[p] = 1;
    }
  }

  const [docs, total] = await Promise.all([
    Model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);

  return {
    docs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: skip + docs.length < total,
  };
}

module.exports = { paginate, escapeRegex };