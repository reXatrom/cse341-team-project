
import { Router } from 'express';

import {
  getSchedules,
  getSchedule,
  getTripSchedules,
  addSchedule,
  editSchedule,
  removeSchedule
} from '../controllers/schedules.js';



/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Schedule management endpoints
 */

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: List of all schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schedules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Schedule'
 *       500:
 *         description: Failed to fetch schedules
 *
 *   post:
 *     summary: Create a new schedule
 *     tags: [Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleInput'
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *       400:
 *         description: Invalid schedule data
 *       409:
 *         description: Schedule ID already exists
 *       500:
 *         description: Failed to create schedule
 */

/**
 * @swagger
 * /api/schedules/trip/{tripId}:
 *   get:
 *     summary: Get schedules belonging to a specific trip
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         example: alpine-panorama
 *     responses:
 *       200:
 *         description: Schedules belonging to the requested trip
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schedules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Schedule'
 *       500:
 *         description: Failed to fetch trip schedules
 */

/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: Get a schedule by ID
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Schedule found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Failed to fetch schedule
 *
 *   put:
 *     summary: Update an existing schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departureTime:
 *                 type: string
 *                 example: '18:30'
 *               arrivalTime:
 *                 type: string
 *                 example: '22:30'
 *               daysOfWeek:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [friday, saturday]
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       404:
 *         description: Schedule not found
 *       400:
 *         description: Invalid schedule data
 *       500:
 *         description: Failed to update schedule
 *
 *   delete:
 *     summary: Delete a schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Failed to delete schedule
 */



const router = Router();

// Get all schedules
router.get('/', getSchedules);

// Get schedules belonging to a specific trip
router.get('/trip/:tripId', getTripSchedules);

// Get one schedule by ID
router.get('/:id', getSchedule);

// Create a schedule
router.post('/', addSchedule);

// Update a schedule
router.put('/:id', editSchedule);

// Delete a schedule
router.delete('/:id', removeSchedule);

export default router;
