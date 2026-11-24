
import { Router } from 'express';
import railTripsRouter from './trips.js';
import tripsApiRouter from './trips-api.js';
import bookingsApiRouter from './bookings.js';
import { trainsApi, trainsPage } from './trains.js';
import { homePage, aboutPage, testErrorPage } from './index.js';
import schedulesRouter from './schedules.js';
import authRouter from './auth.js';
import {
    requirePageRole
} from '../middleware/auth.js';

import {
    adminDashboard,
    usersAdminPage,
    tripsAdminPage,
    bookingsAdminPage
} from '../controllers/admin.js';

import usersApiRouter from './users.js';

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

// Protected User Management page
router.get(
    '/admin/users',
    requirePageRole('admin'),
    usersAdminPage
);

// Protected Bookings Management page
router.get(
    '/admin/bookings',
    requirePageRole('admin'),
    bookingsAdminPage
);

// Protected Trips Management page
router.get(
    '/trips-admin',
    requirePageRole('admin'),
    tripsAdminPage
);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Trips API
router.use('/api/trips', tripsApiRouter);

// Bookings API
router.use('/api/bookings', bookingsApiRouter);

// Schedules API
router.use('/api/schedules', schedulesRouter);

// Users API
router.use('/api/users', usersApiRouter);

// Rail trips pages
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
