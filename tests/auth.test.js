
import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { seedStandardRoles } from '../src/models/roles.js';
import User from '../src/models/schemas/users.js';

describe('Authentication', () => {
    beforeEach(async () => {
        // Recreate unique username and email indexes.
        await User.createIndexes();

        // Ensure standard roles exist before each test.
        await seedStandardRoles();
    });

    test('GET /auth/login displays the login page', async () => {
        const response = await request(app).get('/auth/login');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Sign In');
    });

    test('GET /auth/register displays the registration page', async () => {
        const response = await request(app).get('/auth/register');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Create Account');
    });

    test('POST /auth/register creates a new user account', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                displayName: 'Test User',
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'TestPassword123'
            });

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/auth/login');
    });

    test('POST /auth/register rejects duplicate usernames', async () => {
        const user = {
            displayName: 'Test User',
            username: 'duplicateuser',
            email: 'first@example.com',
            password: 'TestPassword123'
        };

        await request(app).post('/auth/register').send(user);

        const response = await request(app)
            .post('/auth/register')
            .send({
                ...user,
                email: 'second@example.com'
            });

        expect(response.status).toBe(409);
        expect(response.text).toContain('already registered');
    });

    test('POST /auth/login rejects incorrect passwords', async () => {
        await request(app).post('/auth/register').send({
            displayName: 'Test User',
            username: 'loginuser',
            email: 'loginuser@example.com',
            password: 'CorrectPassword123'
        });

        const response = await request(app)
            .post('/auth/login')
            .send({
                identifier: 'loginuser',
                password: 'WrongPassword123'
            });

        expect(response.status).toBe(401);
        expect(response.text).toContain('Invalid username/email or password');
    });

    test('POST /auth/login creates a session for a valid user', async () => {
        const agent = request.agent(app);

        await agent.post('/auth/register').send({
            displayName: 'Test User',
            username: 'sessionuser',
            email: 'sessionuser@example.com',
            password: 'TestPassword123'
        });

        const loginResponse = await agent
            .post('/auth/login')
            .send({
                identifier: 'sessionuser',
                password: 'TestPassword123'
            });

        expect(loginResponse.status).toBe(302);
        expect(loginResponse.headers.location).toBe('/user/dashboard');

        // Authenticated users should go to their dashboard.
        const loginPageResponse = await agent.get('/auth/login');

        expect(loginPageResponse.status).toBe(302);
        expect(loginPageResponse.headers.location).toBe('/user/dashboard');

        const registerPageResponse = await agent.get('/auth/register');

        expect(registerPageResponse.status).toBe(302);
        expect(registerPageResponse.headers.location).toBe('/user/dashboard');

        // The dashboard must be accessible with the session.
        const dashboardResponse = await agent.get('/user/dashboard');

        expect(dashboardResponse.status).toBe(200);
        expect(dashboardResponse.text).toContain('Welcome, Test User');
    });

    test('POST /auth/logout destroys the user session', async () => {
        const agent = request.agent(app);

        await agent.post('/auth/register').send({
            displayName: 'Test User',
            username: 'logoutuser',
            email: 'logoutuser@example.com',
            password: 'TestPassword123'
        });

        await agent.post('/auth/login').send({
            identifier: 'logoutuser',
            password: 'TestPassword123'
        });

        const logoutResponse = await agent.post('/auth/logout');

        expect(logoutResponse.status).toBe(302);
        expect(logoutResponse.headers.location).toBe('/auth/login');

        // After logout, the login page should be accessible.
        const loginPageResponse = await agent.get('/auth/login');

        expect(loginPageResponse.status).toBe(200);

        // The protected dashboard must no longer be accessible.
        const dashboardResponse = await agent.get('/user/dashboard');

        expect(dashboardResponse.status).toBe(302);
        expect(dashboardResponse.headers.location).toBe('/auth/login');
    });
});
