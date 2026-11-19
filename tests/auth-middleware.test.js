
import { describe, expect, test, vi } from 'vitest';

import {
    requireApiLogin,
    requirePageLogin,
    requireApiRole,
    requirePageRole
} from '../src/middleware/auth.js';

describe('Authentication Middleware', () => {
    test('requireApiLogin returns 401 when the user is signed out', () => {
        const req = { session: {} };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        const next = vi.fn();

        requireApiLogin()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Authentication required.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('requireApiLogin allows a signed-in user', () => {
        const req = { session: { user: { id: '123' } } };
        const res = {};
        const next = vi.fn();

        requireApiLogin()(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });

    test('requirePageLogin redirects a signed-out user', () => {
        const req = { session: {} };
        const res = {
            redirect: vi.fn()
        };
        const next = vi.fn();

        requirePageLogin()(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/auth/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('requirePageLogin allows a signed-in user', () => {
        const req = { session: { user: { id: '123' } } };
        const res = {};
        const next = vi.fn();

        requirePageLogin()(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });

    test('requireApiRole returns 401 when the user is signed out', () => {
        const req = { session: {} };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        const next = vi.fn();

        requireApiRole('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('requireApiRole returns 403 when the user has the wrong role', () => {
        const req = {
            session: { user: { role: 'user' } }
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        const next = vi.fn();

        requireApiRole('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            error: 'You do not have permission to access this resource.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('requireApiRole allows a user with the required role', () => {
        const req = {
            session: { user: { role: 'admin' } }
        };
        const res = {};
        const next = vi.fn();

        requireApiRole('admin')(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });

    test('requirePageRole redirects a signed-out user', () => {
        const req = { session: {} };
        const res = {
            redirect: vi.fn()
        };
        const next = vi.fn();

        requirePageRole('admin')(req, res, next);

        expect(res.redirect).toHaveBeenCalledWith('/auth/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('requirePageRole renders 403 for a user with the wrong role', () => {
        const req = {
            session: { user: { role: 'user' } }
        };
        const res = {
            status: vi.fn().mockReturnThis(),
            render: vi.fn()
        };
        const next = vi.fn();

        requirePageRole('admin')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.render).toHaveBeenCalledWith('errors/403', {
            title: 'Access Forbidden',
            error: 'You do not have permission to access this page.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    test('requirePageRole allows a user with the required role', () => {
        const req = {
            session: { user: { role: 'admin' } }
        };
        const res = {};
        const next = vi.fn();

        requirePageRole('admin')(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });
});
