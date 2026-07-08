const router = require('express').Router();
const c = require('../controllers/profile.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get doctor profile
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Profile]
 *     summary: Update doctor profile (header, footer, signature, clinic info)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctor_name: { type: string, example: "Dr. Jane Doe" }
 *               specialization: { type: string, example: "Cardiologist" }
 *               header_url: { type: string }
 *               footer_url: { type: string }
 *               signature_url: { type: string }
 *     responses: { 200: { description: OK } }
 */
router.get('/', c.get);
router.put('/', c.update);
router.delete('/asset/:field', c.clearAsset);

module.exports = router;