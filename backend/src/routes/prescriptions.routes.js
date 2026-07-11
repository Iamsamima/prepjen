const router = require('express').Router();
const c = require('../controllers/prescriptions.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/prescriptions:
 *   get: { tags: [Prescriptions], security: [{ bearerAuth: [] }], summary: List prescriptions }
 *   post: { tags: [Prescriptions], security: [{ bearerAuth: [] }], summary: Save a prescription }
 */
router.get('/', c.list);
router.post('/', c.create);
router.get('/search', c.search);
router.get('/history/:phone', c.byPhone);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;