
import { Router } from 'express';

import {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip
} from '../controllers/trips.js';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Trip:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - description
 *         - region
 *         - startStation
 *         - endStation
 *         - duration
 *         - distance
 *         - highlights
 *         - bestSeason
 *         - operatingMonths
 *         - imageUrl
 *       properties:
 *         id:
 *           type: string
 *           example: alpine-panorama
 *         name:
 *           type: string
 *           example: Alpine Panorama
 *         description:
 *           type: string
 *         region:
 *           type: string
 *           enum: [central, northern, kansai, hokkaido]
 *         startStation:
 *           type: string
 *         endStation:
 *           type: string
 *         duration:
 *           type: string
 *         distance:
 *           type: number
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *         bestSeason:
 *           type: string
 *           enum: [spring, summer, autumn, winter]
 *         operatingMonths:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 1
 *             maximum: 12
 *         imageUrl:
 *           type: string
 *
 * /api/trips:
 *   get:
 *     summary: Retrieve railway trips with pagination and filters
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of trips per page (maximum 50)
 *       - in: query
 *         name: region
 *         required: false
 *         schema:
 *           type: string
 *           enum: [central, northern, kansai, hokkaido]
 *         description: Filter trips by region
 *       - in: query
 *         name: season
 *         required: false
 *         schema:
 *           type: string
 *           enum: [spring, summer, autumn, winter]
 *         description: Filter trips by best season
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search trip names and descriptions
 *     responses:
 *       200:
 *         description: Filtered and paginated list of railway trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *                 filters:
 *                   type: object
 *                   properties:
 *                     region:
 *                       type: string
 *                       nullable: true
 *                       example: central
 *                     season:
 *                       type: string
 *                       nullable: true
 *                       example: autumn
 *                     q:
 *                       type: string
 *                       nullable: true
 *                       example: gorge
 *       400:
 *         description: Invalid pagination or filter parameters
 *       500:
 *         description: Failed to fetch trips
 *
 *   post:
 *     summary: Create a new railway trip
 *     tags: [Trips]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Trip'
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       400:
 *         description: Invalid trip data
 *       409:
 *         description: Trip ID already exists
 *       500:
 *         description: Failed to create trip
 *
 * /api/trips/{id}:
 *   get:
 *     summary: Retrieve a railway trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique trip ID
 *     responses:
 *       200:
 *         description: Trip retrieved successfully
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Failed to fetch trip
 *
 *   put:
 *     summary: Update a railway trip
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               region:
 *                 type: string
 *               startStation:
 *                 type: string
 *               endStation:
 *                 type: string
 *               duration:
 *                 type: string
 *               distance:
 *                 type: number
 *               highlights:
 *                 type: array
 *                 items:
 *                   type: string
 *               bestSeason:
 *                 type: string
 *               operatingMonths:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 12
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trip updated successfully
 *       404:
 *         description: Trip not found
 *       400:
 *         description: Invalid trip data
 *       500:
 *         description: Failed to update trip
 *
 *   delete:
 *     summary: Delete a railway trip
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip deleted successfully
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Failed to delete trip
 */

// GET /api/trips - Retrieve filtered and paginated trips
router.get('/', getAllTrips);

// GET /api/trips/:id - Retrieve one trip
router.get('/:id', getTripById);

// POST /api/trips - Create a trip
router.post('/', createTrip);

// PUT /api/trips/:id - Update a trip
router.put('/:id', updateTrip);

// DELETE /api/trips/:id - Delete a trip
router.delete('/:id', deleteTrip);

export default router;
