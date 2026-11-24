
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

    // Create a user and log in.
    async function createAndLoginUser(username, roleName = 'user') {
        const role = await getRoleByName(roleName);

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

    // Create a user without password hashing or login.
    // These users are only needed as pagination records.
    async function createTestUser(username, roleName = 'user') {
        const role = await getRoleByName(roleName);

        return User.create({
            displayName: 'Test User',
            username,
            email: `${username}@example.com`,
            passwordHash: 'test-only-password-hash',
            role: role._id
        });
    }

    test('allows an administrator to retrieve paginated users', async () => {
        const { agent } = await createAndLoginUser(
            'paginationadmin',
            'admin'
        );

        for (let i = 1; i <= 11; i++) {
            await createTestUser(`paginationuser${i}`);
        }

        const response = await agent.get('/api/users');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(10);

        expect(response.body.meta).toEqual({
            page: 1,
            limit: 10,
            totalItems: 12,
            totalPages: 2,
            hasNextPage: true,
            hasPreviousPage: false
        });
    });

    test('returns the correct users for the requested page', async () => {
        const { agent } = await createAndLoginUser(
            'paginationpageadmin',
            'admin'
        );

        for (let i = 1; i <= 11; i++) {
            await createTestUser(`paginationpageuser${i}`);
        }

        const response = await agent.get('/api/users?page=2&limit=5');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(5);

        expect(response.body.meta).toEqual({
            page: 2,
            limit: 5,
            totalItems: 12,
            totalPages: 3,
            hasNextPage: true,
            hasPreviousPage: true
        });
    });

    test('returns the final page with the remaining users', async () => {
        const { agent } = await createAndLoginUser(
            'paginationlastadmin',
            'admin'
        );

        for (let i = 1; i <= 11; i++) {
            await createTestUser(`paginationlastuser${i}`);
        }

        const response = await agent.get('/api/users?page=2&limit=10');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.meta.hasNextPage).toBe(false);
        expect(response.body.meta.hasPreviousPage).toBe(true);
    });

    test('rejects an invalid page number', async () => {
        const { agent } = await createAndLoginUser(
            'invalidpageadmin',
            'admin'
        );

        const response = await agent.get('/api/users?page=0');

        expect(response.status).toBe(400);
    });

    test('rejects a limit greater than 100', async () => {
        const { agent } = await createAndLoginUser(
            'invalidlimitadmin',
            'admin'
        );

        const response = await agent.get('/api/users?limit=101');

        expect(response.status).toBe(400);
    });

    test('rejects an unsupported sort field', async () => {
        const { agent } = await createAndLoginUser(
            'invalidsortadmin',
            'admin'
        );

        const response = await agent.get('/api/users?sort=passwordHash');

        expect(response.status).toBe(400);
    });

    test('rejects an unsupported sort order', async () => {
        const { agent } = await createAndLoginUser(
            'invalidorderadmin',
            'admin'
        );

        const response = await agent.get('/api/users?order=random');

        expect(response.status).toBe(400);
    });

    test('allows a regular user to retrieve only their own account', async () => {
        const { user, agent } = await createAndLoginUser(
            'regularpaginationuser'
        );

        await createTestUser('anotherpaginationuser');

        const response = await agent.get('/api/users');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]._id).toBe(user._id.toString());
        expect(response.body.meta.totalItems).toBe(1);
    });

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
