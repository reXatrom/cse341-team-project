
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kizuna Rail Trips API',
      version: '1.0.0',
      description: 'API documentation for managing scenic railway trips.'
    },
    servers: [
      {
        url: '/',
        description: 'Current application server'
      }
    ],
    tags: [
      {
        name: 'Trips',
        description: 'Operations for managing railway trips'
      }
    ]
  },
  apis: ['./src/routes/trips-api.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
