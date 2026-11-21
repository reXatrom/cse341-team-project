
import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';

import app from '../app.js';
import User from '../src/models/schemas/users.js';
import { createUser } from '../src/models/users.js';
import { getRoleByName, seedStandardRoles } from '../src/models/roles.js';

describe('User Management API', () => {
    beforeEach(async () => {
        await User.createIndexes();
        await seedStandardRoles();
    });

    test('prevents a regular user from changing their own role to admin', async () => {
        const role = await getRoleByName('user');

        const user = await createUser({
            displayName: 'Regular Test User',
            username: 'regularroletest',
            email: 'regularroletest@example.com',
            password: 'TestPassword123',
            role: role._id
        });

        const agent = request.agent(app);

        const loginResponse = await agent
            .post('/auth/login')
            .send({
                identifier: 'regularroletest',
                password: 'TestPassword123'
            });

        expect(loginResponse.status).toBe(302);

        const response = await agent
            .put(`/api/users/${user._id}`)
            .send({
                role: (await getRoleByName('admin'))._id
            });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe(
            'You cannot change your account role.'
        );

        const unchangedUser = await User.findById(user._id);

        expect(unchangedUser.role.toString()).toBe(role._id.toString());
    });
});
