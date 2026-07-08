const Prescription = require('../models/Prescription');
const crudFactory = require('./crudFactory');

module.exports = crudFactory(Prescription, {
  searchFields: ['patient_name', 'patient_phone', 'notes'],
  allowedFilters: ['appointment_id'],
  dateField: 'createdAt',
});