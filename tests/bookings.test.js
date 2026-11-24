
import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';

import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import User from '../src/models/schemas/users.js';
import { createUser } from '../src/models/users.js';
import { getRoleByName, seedStandardRoles } from '../src/models/roles.js';

describe('Bookings API', () => {
    beforeEach(async () => {
        await User.createIndexes();
        await seedStandardRoles();
    });

    async function createAndLoginUser(agent, roleName, username) {
        const role = await getRoleByName(roleName);

        await createUser({
            displayName: 'Bookings Test User',
            username,
            email: `${username}@example.com`,
            password: 'TestPassword123',
            role: role._id
        });

        return agent
            .post('/auth/login')
            .send({
                identifier: username,
                password: 'TestPassword123'
            });
    }

    async function createBookings(count) {
        const bookings = Array.from({ length: count }, (_, index) => ({
            id: `BOOKING-${String(index + 1).padStart(3, '0')}`,
            createdAt: new Date(
                Date.UTC(2026, 0, index + 1)
            ).toISOString(),
            scheduleId: 1,
            tripId: 'test-trip',
            ticketClass: 'standard',
            selectedDay: 'Monday',
            passengers: [
                {
                    firstName: 'Test',
                    lastName: `Passenger ${index + 1}`,
                    email: `passenger${index + 1}@example.com`,
                    phone: '08012345678'
                }
            ]
        }));

        await getDb()
            .collection('confirmations')
            .insertMany(bookings);

        return bookings;
    }

    test('GET /api/bookings requires authentication', async () => {
        const response = await request(app).get('/api/bookings');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty(
            'error',
            'Authentication required.'
        );
    });

    test('GET /api/bookings denies access to ordinary users', async () => {
        const agent = request.agent(app);

        const loginResponse = await createAndLoginUser(
            agent,
            'user',
            'bookingsregular'
        );

        expect(loginResponse.status).toBe(302);

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(403);
    });

    test('GET /api/bookings allows administrators to view bookings', async () => {
        await createBookings(3);

        const agent = request.agent(app);

        const loginResponse = await createAndLoginUser(
            agent,
            'admin',
            'bookingsadmin'
        );

        expect(loginResponse.status).toBe(302);

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(3);
        expect(response.body.pagination.totalItems).toBe(3);
    });

    test('GET /api/bookings returns a maximum of 10 bookings per page', async () => {
        await createBookings(15);

        const agent = request.agent(app);

        await createAndLoginUser(
            agent,
            'admin',
            'bookingspagination'
        );

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(10);

        expect(response.body.pagination).toEqual({
            page: 1,
            limit: 10,
            totalItems: 15,
            totalPages: 2,
            hasNextPage: true,
            hasPreviousPage: false
        });
    });

    test('GET /api/bookings returns the second page correctly', async () => {
        await createBookings(15);

        const agent = request.agent(app);

        await createAndLoginUser(
            agent,
            'admin',
            'bookingssecondpage'
        );

        const response = await agent.get('/api/bookings?page=2');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(5);

        expect(response.body.pagination).toEqual({
            page: 2,
            limit: 10,
            totalItems: 15,
            totalPages: 2,
            hasNextPage: false,
            hasPreviousPage: true
        });
    });

    test('GET /api/bookings sorts bookings by newest date first', async () => {
        await createBookings(3);

        const agent = request.agent(app);

        await createAndLoginUser(
            agent,
            'admin',
            'bookingssorting'
        );

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.data.map((booking) => booking.id)).toEqual([
            'BOOKING-003',
            'BOOKING-002',
            'BOOKING-001'
        ]);
    });

    test('GET /api/bookings does not expose passenger contact details', async () => {
        await createBookings(1);

        const agent = request.agent(app);

        await createAndLoginUser(
            agent,
            'admin',
            'bookingsprivacy'
        );

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.data[0].passengerCount).toBe(1);
        expect(response.body.data[0]).not.toHaveProperty('passengers');
        expect(response.body.data[0]).not.toHaveProperty('_id');
    });

    test.each(['0', '-1', '1.5', 'abc'])(
        'GET /api/bookings rejects invalid page value: %s',
        async (page) => {
            const agent = request.agent(app);

            await createAndLoginUser(
                agent,
                'admin',
                `bookingspage${page.replace(/[^a-zA-Z0-9]/g, '')}`
            );

            const response = await agent.get(
                `/api/bookings?page=${page}`
            );

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        }
    );

    test.each(['0', '5', '20', '1.5', 'abc'])(
        'GET /api/bookings rejects invalid limit value: %s',
        async (limit) => {
            const agent = request.agent(app);

            await createAndLoginUser(
                agent,
                'admin',
                `bookingslimit${limit.replace(/[^a-zA-Z0-9]/g, '')}`
            );

            const response = await agent.get(
                `/api/bookings?limit=${limit}`
            );

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        }
    );

    test('GET /api/bookings returns an empty list when no bookings exist', async () => {
        const agent = request.agent(app);

        await createAndLoginUser(
            agent,
            'admin',
            'bookingsempty'
        );

        const response = await agent.get('/api/bookings');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(response.body.pagination.totalItems).toBe(0);
        expect(response.body.pagination.totalPages).toBe(0);
    });
});
