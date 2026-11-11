
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.3',
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
                Passenger: {
                    type: 'object',
                    properties: {
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' }
                    }
                },
                Booking: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        scheduleId: { type: 'integer' },
                        tripId: { type: 'integer' },
                        ticketClass: { type: 'string' },
                        selectedDay: { type: 'string' },
                        passengers: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Passenger'
                            }
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                }
            }
        },
        paths: {
            '/api/bookings': {
                get: {
                    summary: 'Retrieve all bookings',
                    description: 'Returns booking records from MongoDB.',
                    tags: ['Bookings'],
                    responses: {
                        200: {
                            description: 'List of bookings',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/Booking'
                                        }
                                    }
                                }
                            }
                        },
                        500: {
                            description: 'Server error'
                        }
                    }
                }
            }
        }
    },
    apis: []
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
