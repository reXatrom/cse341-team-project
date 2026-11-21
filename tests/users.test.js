
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

    async function createAndLoginUser(username) {
        const role = await getRoleByName('user');

        const user = await createUser({
            displayName: 'Test User',
            username,
            email: `${username}@example.com`,
            password: 'TestPassword123',
            role: role._id
        });

        const agent = request.agent(app);

        const loginResponse = await agent
            .post('/auth/login')
            .send({
                identifier: username,
                password: 'TestPassword123'
            });

        expect(loginResponse.status).toBe(302);

        return { user, agent, role };
    }

    test('prevents a regular user from changing their own role to admin', async () => {
        const { user, agent, role } = await createAndLoginUser(
            'regularroletest'
        );

        const adminRole = await getRoleByName('admin');

        const response = await agent
            .put(`/api/users/${user._id}`)
            .send({
                role: adminRole._id
            });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe(
            'You cannot change your account role.'
        );

        const unchangedUser = await User.findById(user._id);

        expect(unchangedUser.role.toString()).toBe(role._id.toString());
    });

    test('rejects passwords shorter than eight characters', async () => {
        const { user, agent } = await createAndLoginUser(
            'shortpasswordtest'
        );

        const response = await agent
            .put(`/api/users/${user._id}`)
            .send({
                password: 'short'
            });

        expect(response.status).toBe(400);

        const unchangedUser = await User.findById(user._id);

        expect(unchangedUser).not.toBeNull();
    });

    test('successfully updates an account', async () => {
        const { user, agent } = await createAndLoginUser(
            'successfulupdatetest'
        );

        const response = await agent
            .put(`/api/users/${user._id}`)
            .send({
                displayName: 'Updated Test User',
                email: 'updateduser@example.com'
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User updated successfully.');

        const updatedUser = await User.findById(user._id);

        expect(updatedUser.displayName).toBe('Updated Test User');
        expect(updatedUser.email).toBe('updateduser@example.com');
    });

    test('successfully deletes an account', async () => {
        const { user, agent } = await createAndLoginUser(
            'successfuldeletetest'
        );

        const response = await agent.delete(
            `/api/users/${user._id}`
        );

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User deleted successfully.');
        expect(response.body.redirect).toBe('/auth/login');

        const deletedUser = await User.findById(user._id);

        expect(deletedUser).toBeNull();
    });
});
