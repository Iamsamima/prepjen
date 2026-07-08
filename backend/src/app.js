const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const { globalLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const swaggerSpec = require('./docs/swagger');
const swaggerUi = require('swagger-ui-express');

const app = express();

// ---------- Security & parsing ----------
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(compression());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(globalLimiter);

// ---------- Static uploads ----------
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

// ---------- Swagger docs ----------
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Prescription API Docs',
  })
);
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// ---------- Health ----------
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// ---------- Routes ----------
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/appointments', require('./routes/appointments.routes'));
app.use('/api/invoices', require('./routes/invoices.routes'));
app.use('/api/referrers', require('./routes/referrers.routes'));
app.use('/api/templates', require('./routes/templates.routes'));
app.use('/api/medicines', require('./routes/medicines.routes'));
app.use('/api/tests', require('./routes/tests.routes'));
app.use('/api/prescriptions', require('./routes/prescriptions.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/uploads', require('./routes/uploads.routes'));
app.use('/api/stats', require('./routes/stats.routes'));

// ---------- 404 + Error handler ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;