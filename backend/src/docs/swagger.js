const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Prescription App Backend',
      version: '1.0.0',
      description:
        'Node.js + Express + Mongoose backend for the Prescription app. ' +
        'AI is powered by Google Gemini with multi-key rotation and automatic failover on rate limits.',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Local dev' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object' },
          },
        },
        Paginated: {
          type: 'object',
          properties: {
            docs: { type: 'array', items: { type: 'object' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasMore: { type: 'boolean' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);