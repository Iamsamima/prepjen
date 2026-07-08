const router = require('express').Router();
const c = require('../controllers/medicines.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/medicines:
 *   get:
 *     tags: [Medicines]
 *     summary: List medicines (regex search on name/generic_name)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string, example: "para" } }
 *     responses: { 200: { description: OK } }
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