const router = require('express').Router();
const c = require('../controllers/ai.controller');
const { auth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

router.use(auth);
router.use(aiLimiter);

/**
 * @swagger
 * /api/ai/suggest:
 *   post:
 *     tags: [AI]
 *     summary: Gemini-powered auto-suggestions (with multi-key rotation)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type: { type: string, enum: [symptoms, diagnosis, medicines, dose, dosage, frequency, duration, tests] }
 *               query: { type: string, example: "fev" }
 *               context:
 *                 type: object
 *                 properties:
 *                   symptoms: { type: string, example: "fever, cough" }
 *                   diagnosis: { type: string, example: "Viral fever" }
 *                   medicineName: { type: string, example: "Paracetamol" }
 *                   medicineType: { type: string, example: "Tablet" }
 *                   patientInfo:
 *                     type: object
 *                     properties:
 *                       age: { type: string, example: "42" }
 *                       gender: { type: string, example: "male" }
 *                       weight: { type: string, example: "70kg" }
 *     responses: { 200: { description: OK } }
 */
router.post('/suggest', c.suggest);

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: General Gemini chat completion
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt: { type: string, example: "Summarize hypertension treatment options." }
 *               system: { type: string }
 *               json: { type: boolean, example: false }
 *     responses: { 200: { description: OK } }
 */
router.post('/chat', c.chat);

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     tags: [AI]
 *     summary: Inspect the Gemini key pool (rotation + cooldown state)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.get('/status', c.status);

/**
 * @swagger
 * /api/ai/reload:
 *   post:
 *     tags: [AI]
 *     summary: Reload Gemini API keys from env (clears cooldowns)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
router.post('/reload', c.reload);

module.exports = router;