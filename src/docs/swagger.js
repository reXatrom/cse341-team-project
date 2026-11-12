import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kizuna Rail API',
      version: '1.0.0',
      description: 'API documentation for the Kizuna Rail application.'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server'
      }
    ],
    components: {
      schemas: {
        Schedule: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            tripId: {
              type: 'string',
              example: 'alpine-panorama'
            },
            departureTime: {
              type: 'string',
              example: '08:30'
            },
            arrivalTime: {
              type: 'string',
              example: '13:00'
            },
            daysOfWeek: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'monday',
                  'tuesday',
                  'wednesday',
                  'thursday',
                  'friday',
                  'saturday',
                  'sunday'
                ]
              },
              example: ['monday', 'tuesday', 'wednesday']
            },
            status: {
              type: 'boolean',
              example: true
            }
          }
        },
        ScheduleInput: {
          type: 'object',
          required: [
            'id',
            'tripId',
            'departureTime',
            'arrivalTime',
            'daysOfWeek'
          ],
          properties: {
            id: {
              type: 'integer',
              example: 99
            },
            tripId: {
              type: 'string',
              example: 'alpine-panorama'
            },
            departureTime: {
              type: 'string',
              example: '18:00'
            },
            arrivalTime: {
              type: 'string',
              example: '22:00'
            },
            daysOfWeek: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'monday',
                  'tuesday',
                  'wednesday',
                  'thursday',
                  'friday',
                  'saturday',
                  'sunday'
                ]
              },
              example: ['friday', 'saturday']
            },
            status: {
              type: 'boolean',
              example: true
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/schedules.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
