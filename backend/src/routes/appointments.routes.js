const router = require('express').Router();
const c = require('../controllers/appointments.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: List appointments (paginated, searchable, filterable)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *       - in: query
 *         name: search
 *         description: Regex-based search (debounce on the client)
 *         schema: { type: string, example: "john" }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [scheduled, seen, cancelled, no-show] }
 *       - in: query
 *         name: payment_status
 *         schema: { type: string, enum: [pending, paid, partial] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date, example: "2026-01-01" }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date, example: "2026-12-31" }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "appointment_date,-appointment_time" }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Appointments]
 *     summary: Create appointment
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_name, appointment_date, appointment_time]
 *             properties:
 *               patient_name: { type: string, example: "John Doe" }
 *               patient_phone: { type: string, example: "9876543210" }
 *               patient_age: { type: integer, example: 42 }
 *               patient_gender: { type: string, enum: [male, female, other] }
 *               appointment_date: { type: string, format: date, example: "2026-07-08" }
 *               appointment_time: { type: string, example: "10:30" }
 *               amount_charged: { type: number, example: 500 }
 *     responses: { 201: { description: Created } }
 */
router.get('/', c.list);
router.post('/', c.create);
router.get('/stats', c.stats);
router.get('/search', c.search);
router.get('/history/:phone', c.patientHistory);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get: { tags: [Appointments], security: [{ bearerAuth: [] }], summary: Get one }
 *   put: { tags: [Appointments], security: [{ bearerAuth: [] }], summary: Update }
 *   delete: { tags: [Appointments], security: [{ bearerAuth: [] }], summary: Delete }
 */
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.post('/:id/mark-seen', c.markSeen);
router.post('/:id/prescription', c.attachPrescription);

module.exports = router;