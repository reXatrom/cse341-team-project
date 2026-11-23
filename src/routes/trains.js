
import { getDb } from '../db/connect.js';

const trainsPage = (req, res) => {
    return res.render('trains', { title: 'Trains' });
};

const validInteger = (value) =>
    typeof value === 'string' &&
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value));

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const filterFields = ['search', 'operator', 'type', 'powerSource'];

/**
 * @openapi
 * /api/trains:
 *   get:
 *     tags:
 *       - Trains
 *     summary: Search, filter, and paginate trains
 *     description: Returns matching trains with pagination metadata.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of trains per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive partial train name search
 *       - in: query
 *         name: operator
 *         schema:
 *           type: string
 *         description: Case-insensitive operator filter
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Case-insensitive train type filter
 *       - in: query
 *         name: powerSource
 *         schema:
 *           type: string
 *         description: Case-insensitive power source filter
 *     responses:
 *       200:
 *         description: Matching train records and pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trains:
 *                   type: array
 *                   items:
 *                     type: object
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
 *                 filters:
 *                   type: object
 *                   properties:
 *                     search:
 *                       type: string
 *                     operator:
 *                       type: string
 *                     type:
 *                       type: string
 *                     powerSource:
 *                       type: string
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */

const trainsApi = async (req, res) => {
    const pageValue = req.query.page ?? '1';
    const limitValue = req.query.limit ?? '10';

    if (!validInteger(pageValue)) {
        return res.status(400).json({
            error: 'Page must be a positive integer.'
        });
    }

    if (!validInteger(limitValue) || Number(limitValue) > 100) {
        return res.status(400).json({
            error: 'Limit must be between 1 and 100.'
        });
    }

    const page = Number(pageValue);
    const limit = Number(limitValue);
    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
        return res.status(400).json({
            error: 'Pagination offset is too large.'
        });
    }

    const filters = {};

    for (const field of filterFields) {
        const value = req.query[field] ?? '';

        if (typeof value !== 'string' || value.length > 100) {
            return res.status(400).json({
                error: `${field} must be a string of at most 100 characters.`
            });
        }

        filters[field] = value.trim();
    }

    const query = {};

    if (filters.search) {
        query.name = {
            $regex: escapeRegex(filters.search),
            $options: 'i'
        };
    }

    for (const field of ['operator', 'type', 'powerSource']) {
        if (filters[field]) {
            query[field] = {
                $regex: `^${escapeRegex(filters[field])}$`,
                $options: 'i'
            };
        }
    }

    try {
        const collection = getDb().collection('trains');

        const totalItems = await collection.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limit);

        const trains = await collection
            .find(query)
            .sort({ name: 1, _id: 1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return res.status(200).json({
            trains,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1 && totalPages > 0
            },
            filters
        });
    } catch (error) {
        console.error('Error fetching trains:', error);

        return res.status(500).json({
            error: 'Unable to retrieve trains.'
        });
    }
};

export { trainsApi, trainsPage };
