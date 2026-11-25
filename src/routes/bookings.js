
import { Router } from 'express';
import { getBookings } from '../controllers/bookings.js';
import { requireApiRole } from '../middleware/auth.js';

const router = Router();

// All bookings API endpoints require administrator access.
router.use(requireApiRole('admin'));

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Retrieve filtered and paginated bookings
 *     description: Returns bookings in descending booking-date order. Supports filtering by ticket class and booking date range. Only administrators can access this endpoint.
 *     tags: [Bookings]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number to retrieve.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           enum: [10]
 *           default: 10
 *         description: Number of bookings per page. Fixed at 10.
 *       - in: query
 *         name: ticketClass
 *         schema:
 *           type: string
 *           enum: [standard, premium, first]
 *         description: Filter bookings by ticket class.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Include bookings created on or after this date (YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Include bookings created on or before this date (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Filtered and paginated bookings retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       ticketClass:
 *                         type: string
 *                       selectedDay:
 *                         type: string
 *                       passengerCount:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *       400:
 *         description: Invalid pagination or filter parameter.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Administrator access required.
 *       500:
 *         description: Internal server error.
 */

// GET /api/bookings - Retrieve filtered and paginated bookings.
router.get('/', getBookings);

export default router;
