const router = require('express').Router();
const c = require('../controllers/referrers.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/referrers:
 *   get: { tags: [Referrers], security: [{ bearerAuth: [] }], summary: List referrers }
 *   post:
 *     tags: [Referrers]
 *     summary: Add a referrer
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Dr. Smith" }
 *               type: { type: string, enum: [individual, clinic, hospital, other] }
 *               default_commission_percentage: { type: number, example: 10 }
 *     responses: { 201: { description: Created } }
 */
router.get('/', c.list);
router.post('/', c.create);
router.get('/search', c.search);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.post('/:id/pay-commission', c.payCommission);

module.exports = router;