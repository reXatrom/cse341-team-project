
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kizuna Rail Trips API',
      version: '1.0.0',
      description:
        'API documentation for Kizuna Rail trips, trains, and bookings.'
    },
    servers: [
      {
        url: '/',
        description: 'Current application server'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid'
        }
      }
    },
    tags: [
      {
        name: 'Trips',
        description: 'Operations for managing railway trips'
      },
      {
        name: 'Trains',
        description: 'Train catalogue and pagination'
      },
      {
        name: 'Bookings',
        description: 'Administrator operations for viewing bookings'
      }
    ]
  },
  apis: [
    './src/routes/trips-api.js',
    './src/routes/trains.js',
    './src/routes/bookings.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
