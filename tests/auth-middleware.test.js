
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../src/models/users.js', () => ({
    getUserById: vi.fn()
}));

import { getUserById } from '../src/models/users.js';

import {
    requireApiLogin,
    requirePageLogin,
    requireApiRole,
    requirePageRole
} from '../src/middleware/auth.js';

describe('Authentication Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        getUserById.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011'
        });
    });

    test('requireApiLogin returns 401 when the user is signed out', async () => {
        const req = { session: {} };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        const next = vi.fn();

        await requireApiLogin()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Authentication required.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('requireApiLogin allows a signed-in user', async () => {
        const req = {
            session: {
                user: { id: '507f1f77bcf86cd799439011' }
            }
        };
        const res = {};
        const next = vi.fn();

        await requireApiLogin()(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });

    test('requireApiLogin rejects a deleted user with an existing session', async () => {
        getUserById.mockResolvedValue(null);

        const req = {
            session: {
                user: { id: '507f1f77bcf86cd799439011' },
                destroy: vi.fn(callback => callback())
            }
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        const next = vi.fn();

        await requireApiLogin()(req, res, next);

        expect(getUserById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(req.session.destroy).toHaveBeenCalledOnce();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('requirePageLogin redirects a signed-out user', async () => {
        const req = { session: {} };
        const res = {
            redirect: vi.fn()
        };
        const next = vi.fn();

        await requirePageLogin()(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/auth/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('requirePageLogin allows a signed-in user', async () => {
        const req = {
            session: {
                user: { id: '507f1f77bcf86cd799439011' }
            }
        };
        const res = {};
        const next = vi.fn();

        await requirePageLogin()(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });

    test('requireApiRole returns 401 when the user is signed out', async () => {
        const req = { session: {} };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        const next = vi.fn();

        await requireApiRole('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('requireApiRole returns 403 when the user has the wrong role', async () => {
        const req = {
            session: {
                user: {
                    id: '507f1f77bcf86cd799439011',
                    role: 'user'
                }
            }
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        const next = vi.fn();

        await requireApiRole('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            error: 'You do not have permission to access this resource.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('requireApiRole allows a user with the required role', async () => {
        const req = {
            session: {
                user: {
                    id: '507f1f77bcf86cd799439011',
                    role: 'admin'
                }
            }
        };
        const res = {};
        const next = vi.fn();

        await requireApiRole('admin')(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });

    test('requirePageRole redirects a signed-out user', async () => {
        const req = { session: {} };
        const res = {
            redirect: vi.fn()
        };
        const next = vi.fn();

        await requirePageRole('admin')(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/auth/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('requirePageRole renders 403 for a user with the wrong role', async () => {
        const req = {
            session: {
                user: {
                    id: '507f1f77bcf86cd799439011',
                    role: 'user'
                }
            }
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            render: vi.fn()
        };
        const next = vi.fn();

        await requirePageRole('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.render).toHaveBeenCalledWith('errors/403', {
            title: 'Access Forbidden',
            error: 'You do not have permission to access this page.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('requirePageRole allows a user with the required role', async () => {
        const req = {
            session: {
                user: {
                    id: '507f1f77bcf86cd799439011',
                    role: 'admin'
                }
            }
        };
        const res = {};
        const next = vi.fn();

        await requirePageRole('admin')(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });
});
