const router = require('express').Router();
const c = require('../controllers/stats.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

/**
 * @swagger
 * /api/stats/overview:
 *   get: { tags: [Stats], security: [{ bearerAuth: [] }], summary: Global stats overview }
 */
router.get('/overview', c.overview);

module.exports = router;