const router = require('express').Router();
const c = require('../controllers/invoices.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List invoices
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [draft, issued, paid, cancelled] } }
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Invoices]
 *     summary: Create invoice (totals auto-calculated)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patient_name: { type: string, example: "John Doe" }
 *               doctor_fees: { type: number, example: 500 }
 *               platform_fees: { type: number, example: 20 }
 *               gst_percentage: { type: number, example: 18 }
 *               discount_percentage: { type: number, example: 10 }
 *               is_referred: { type: boolean, example: false }
 *               referrer_id: { type: string }
 *               referral_commission_percentage: { type: number, example: 10 }
 *     responses: { 201: { description: Created } }
 */
router.get('/', c.list);
router.post('/', c.create);
router.get('/stats', c.stats);
router.get('/search', c.search);
router.get('/next-number', c.nextNumber);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.post('/:id/mark-paid', c.markPaid);

module.exports = router;