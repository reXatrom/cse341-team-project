
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kizuna Rail Trips API',
      version: '1.0.0',
      description:
        'API documentation for Kizuna Rail trips, trains, and user management.'
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
      },
      {
        name: 'Users',
        description: 'User management and pagination'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie used for authentication.'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '674a12345678901234567890'
            },
            displayName: {
              type: 'string',
              example: 'John Smith'
            },
            username: {
              type: 'string',
              example: 'johnsmith'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            role: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'admin'
                }
              }
            }
          }
        },
        UserPaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1
            },
            limit: {
              type: 'integer',
              example: 10
            },
            totalItems: {
              type: 'integer',
              example: 25
            },
            totalPages: {
              type: 'integer',
              example: 3
            },
            hasNextPage: {
              type: 'boolean',
              example: true
            },
            hasPreviousPage: {
              type: 'boolean',
              example: false
            }
          }
        },
        PaginatedUsersResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/User'
              }
            },
            meta: {
              $ref: '#/components/schemas/UserPaginationMeta'
            }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Page must be a positive integer.'
            }
          }
        }
      }
    }
  },
  apis: [
    './src/routes/trips-api.js',
    './src/routes/trains.js',
    './src/routes/users.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
