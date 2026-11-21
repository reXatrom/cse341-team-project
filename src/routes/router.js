
import { Router } from 'express';
import railTripsRouter from './trips.js';
import tripsApiRouter from './trips-api.js';
import { trainsApi, trainsPage } from './trains.js';
import { homePage, aboutPage, testErrorPage } from './index.js';
import schedulesRouter from './schedules.js';
import authRouter from './auth.js';
import {
    requireApiRole,
    requirePageRole
} from '../middleware/auth.js';
import { adminDashboard } from '../controllers/admin.js';
import {
    userDashboard,
    getMyBookings
} from '../controllers/user-dashboard.js';

const router = Router();

// Authentication routes
router.use('/auth', authRouter);

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Protected Admin Dashboard
router.get(
    '/admin/dashboard',
    requirePageRole('admin'),
    adminDashboard
);

// Protected User Dashboard
router.get(
    '/user/dashboard',
    requirePageRole('user'),
    userDashboard
);

// Authenticated user booking API
router.get(
    '/api/users/me/bookings',
    requireApiRole('user'),
    getMyBookings
);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Trips API
router.use('/api/trips', tripsApiRouter);

// Schedules API
router.use('/api/schedules', schedulesRouter);

// Rail trips pages
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
