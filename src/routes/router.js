
import { Router } from 'express';
import railTripsRouter from './trips.js';
import tripsApiRouter from './trips-api.js';
import { trainsApi, trainsPage } from './trains.js';
import { homePage, aboutPage, testErrorPage } from './index.js';
import schedulesRouter from './schedules.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

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
