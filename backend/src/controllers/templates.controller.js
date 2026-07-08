const Template = require('../models/Template');
const crudFactory = require('./crudFactory');

const base = crudFactory(Template, {
  searchFields: ['name', 'tags'],
  allowedFilters: ['type', 'is_active'],
});

module.exports = base;