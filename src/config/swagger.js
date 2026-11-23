
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kizuna Rail Trips API',
      version: '1.0.0',
      description:
        'API documentation for Kizuna Rail trips and trains.'
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
      },
      {
        name: 'Trains',
        description: 'Train catalogue and pagination'
      }
    ]
  },
  apis: [
    './src/routes/trips-api.js',
    './src/routes/trains.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
