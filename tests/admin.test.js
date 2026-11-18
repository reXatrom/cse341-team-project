
import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';

import app from '../app.js';
import User from '../src/models/schemas/users.js';
import { createUser } from '../src/models/users.js';
import { getRoleByName, seedStandardRoles } from '../src/models/roles.js';

describe('Admin Dashboard', () => {
    beforeEach(async () => {
        await User.createIndexes();
        await seedStandardRoles();
    });

    async function createAndLoginUser(agent, roleName, username) {
        const role = await getRoleByName(roleName);

        await createUser({
            displayName: 'Dashboard Test User',
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

    test('redirects signed-out visitors to the login page', async () => {
        const response = await request(app).get('/admin/dashboard');

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/auth/login');
    });

    test('denies access to a signed-in ordinary user', async () => {
        const agent = request.agent(app);

        const loginResponse = await createAndLoginUser(
            agent,
            'user',
            'dashboarduser'
        );

        expect(loginResponse.status).toBe(302);

        const response = await agent.get('/admin/dashboard');

        expect(response.status).toBe(403);
        expect(response.text).toContain('403 - Access Forbidden');
    });

    test('allows a signed-in administrator to access the dashboard', async () => {
        const agent = request.agent(app);

        const loginResponse = await createAndLoginUser(
            agent,
            'admin',
            'dashboardadmin'
        );

        expect(loginResponse.status).toBe(302);

        const response = await agent.get('/admin/dashboard');

        expect(response.status).toBe(200);
        expect(response.text).toContain('Welcome to the Admin Dashboard');
        expect(response.text).toContain('Dashboard Test User');
    });
});