
import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import { seedStandardRoles } from '../src/models/roles.js';
import User from '../src/models/schemas/users.js';

describe('User Dashboard and Navigation', () => {
    beforeEach(async () => {
        await User.createIndexes();
        await seedStandardRoles();
    });

    async function createLoggedInUser(
        username = 'dashboarduser',
        email = 'dashboard@example.com'
    ) {
        const agent = request.agent(app);

        await agent.post('/auth/register').send({
            displayName: 'Dashboard Test User',
            username,
            email,
            password: 'TestPassword123'
        });

        const loginResponse = await agent.post('/auth/login').send({
            identifier: username,
            password: 'TestPassword123'
        });

        expect(loginResponse.status).toBe(302);

        return agent;
    }

    test('redirects guests away from the user dashboard', async () => {
        const response = await request(app).get('/user/dashboard');

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/auth/login');
    });

    test('displays a personalized dashboard for a signed-in user', async () => {
        const agent = await createLoggedInUser();

        const response = await agent.get('/user/dashboard');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Dashboard Test User');
        expect(response.text).toContain('My Bookings');
        expect(response.text).toContain('/js/user-dashboard.js');
    });

    test('shows the user dashboard navigation link', async () => {
        const agent = await createLoggedInUser();

        const response = await agent.get('/user/dashboard');

        expect(response.status).toBe(200);
        expect(response.text).toContain('href="/user/dashboard"');
        expect(response.text).not.toContain('href="/admin/dashboard"');
    });

    test('does not show private dashboard navigation to guests', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.text).not.toContain('href="/user/dashboard"');
        expect(response.text).toContain('href="/auth/login"');
    });

    test('requires authentication for the bookings API', async () => {
        const response = await request(app)
            .get('/api/users/me/bookings');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Authentication required.');
    });

    test('returns an empty booking list for a new user', async () => {
        const agent = await createLoggedInUser();

        const response = await agent
            .get('/api/users/me/bookings');

        expect(response.status).toBe(200);
        expect(response.body.bookings).toEqual([]);
    });

    test('returns bookings belonging to the authenticated user only', async () => {
        const agent = await createLoggedInUser();

        const user = await User.findOne({
            username: 'dashboarduser'
        }).lean();

        await getDb().collection('confirmations').insertMany([
            {
                id: 'OWN-BOOKING-001',
                bookingOwnerId: user._id.toString(),
                tripId: 1,
                scheduleId: 10,
                ticketClass: 'standard',
                selectedDay: 'Monday',
                createdAt: new Date().toISOString()
            },
            {
                id: 'OTHER-BOOKING-002',
                bookingOwnerId: 'another-user-id',
                tripId: 2,
                scheduleId: 20,
                ticketClass: 'first',
                selectedDay: 'Tuesday',
                createdAt: new Date().toISOString()
            }
        ]);

        const response = await agent
            .get('/api/users/me/bookings');

        expect(response.status).toBe(200);
        expect(response.body.bookings).toHaveLength(1);
        expect(response.body.bookings[0].id).toBe('OWN-BOOKING-001');

        expect(
            response.body.bookings.some(
                (booking) => booking.id === 'OTHER-BOOKING-002'
            )
        ).toBe(false);
    });

    test('does not expose internal booking ownership fields', async () => {
        const agent = await createLoggedInUser();

        const user = await User.findOne({
            username: 'dashboarduser'
        }).lean();

        await getDb().collection('confirmations').insertOne({
            id: 'PRIVATE-BOOKING-001',
            bookingOwnerId: user._id.toString(),
            tripId: 1,
            createdAt: new Date().toISOString()
        });

        const response = await agent
            .get('/api/users/me/bookings');

        expect(response.status).toBe(200);
        expect(response.body.bookings).toHaveLength(1);
        expect(response.body.bookings[0]).not.toHaveProperty(
            'bookingOwnerId'
        );
        expect(response.body.bookings[0]).not.toHaveProperty('_id');
    });
});
