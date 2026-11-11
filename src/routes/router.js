
import railTripsRouter from './trips.js';
import { trainsApi, trainsPage } from './trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { getAllBookings } from '../controllers/bookings.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../swagger.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Restrict booking administration to local development.
// Production access requires proper authentication.
function developmentOnly(req, res, next) {
    if (process.env.NODE_ENV !== 'development') {
        return res.sendStatus(404);
    }

    return next();
}

// Bookings API - development only
router.get('/api/bookings', developmentOnly, getAllBookings);

// Swagger API documentation
router.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

// Bookings Admin page - development only
router.get('/bookings-admin', developmentOnly, (req, res) => {
    return res.render('bookings-admin', {
        title: 'Bookings Administration'
    });
});

// Rail trips
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
