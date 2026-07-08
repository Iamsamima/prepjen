const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * tags: [{ name: Auth }]
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new doctor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: doctor@example.com }
 *               password: { type: string, example: "StrongPass!23" }
 *               full_name: { type: string, example: "Dr. Jane Doe" }
 *     responses:
 *       201: { description: Created }
 */
router.post('/signup', c.signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: doctor@example.com }
 *               password: { type: string, example: "StrongPass!23" }
 *     responses:
 *       200: { description: OK }
 */
router.post('/login', c.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/me', auth, c.me);

router.post('/change-password', auth, c.changePassword);

module.exports = router;