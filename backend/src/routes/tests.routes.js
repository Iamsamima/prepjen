const router = require('express').Router();
const c = require('../controllers/tests.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/tests:
 *   get: { tags: [Tests], security: [{ bearerAuth: [] }], summary: List diagnostic tests }
 *   post: { tags: [Tests], security: [{ bearerAuth: [] }], summary: Add a test }
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