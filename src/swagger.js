
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
                    required: [
                        'firstName',
                        'lastName',
                        'email',
                        'phone'
                    ],
                    properties: {
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        email: {
                            type: 'string',
                            format: 'email'
                        },
                        phone: { type: 'string' }
                    }
                },
                Booking: {
                    type: 'object',
                    required: [
                        'id',
                        'scheduleId',
                        'tripId',
                        'ticketClass',
                        'selectedDay',
                        'passengers'
                    ],
                    properties: {
                        id: { type: 'string' },
                        scheduleId: { type: 'integer' },
                        tripId: {
                            type: 'string',
                            example: 'alpine-panorama'
                        },
                        ticketClass: { type: 'string' },
                        selectedDay: { type: 'string' },
                        passengers: {
                            type: 'array',
                            minItems: 1,
                            maxItems: 8,
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
                    description:
                        'Returns booking records from MongoDB. Available in development mode only.',
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
                        404: {
                            description: 'Endpoint unavailable outside development mode'
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
