const router = require('express').Router();
const c = require('../controllers/templates.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/templates:
 *   get:
 *     tags: [Templates]
 *     summary: List templates (filter by type)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [prescription, medicine, diagnosis, symptom, test] }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Templates]
 *     summary: Save a new template
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, name]
 *             properties:
 *               type: { type: string, enum: [prescription, medicine, diagnosis, symptom, test] }
 *               name: { type: string, example: "Fever - standard" }
 *               data: { type: object, example: { medicines: [], notes: "" } }
 *     responses: { 201: { description: Created } }
 */
router.get('/', c.list);
router.post('/', c.create);
router.get('/search', c.search);
router.post('/bulk', c.bulkCreate);
router.post('/import', c.importJson);
router.get('/export', c.exportJson);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;