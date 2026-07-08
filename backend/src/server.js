require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`🚀 Backend running on http://localhost:${PORT}`);
    logger.info(`📚 Swagger docs at http://localhost:${PORT}/api/docs`);
  });
})();

process.on('unhandledRejection', (err) => {
  logger.error('UnhandledRejection', err);
});
process.on('uncaughtException', (err) => {
  logger.error('UncaughtException', err);
});