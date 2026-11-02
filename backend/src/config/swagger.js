import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

export const swaggerSpec = swaggerJsdoc({
  definition: {
        openapi: '3.0.0',
        info: { title: 'MediSync API', version: '2.0.0' },
        servers: [{ url: `http://localhost:${env.port}/api/v1` }],
        components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/modules/**/*.routes.js'],
});