
import { getDb } from '../db/connect.js';

const trainsPage = (req, res) => {
    return res.render('trains', { title: 'Trains' });
};

/**
 * @openapi
 * /api/trains:
 *   get:
 *     tags:
 *       - Trains
 *     summary: Get paginated trains
 *     description: Returns trains with pagination metadata.
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
 *     responses:
 *       200:
 *         description: Paginated train records
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
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Internal server error
 */

const trainsApi = async (req, res) => {
    const pageValue = req.query.page ?? '1';
    const limitValue = req.query.limit ?? '10';

    const validInteger = (value) =>
        typeof value === 'string' &&
        /^[1-9]\d*$/.test(value) &&
        Number.isSafeInteger(Number(value));

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

    try {
        const collection = getDb().collection('trains');

        const totalItems = await collection.countDocuments({});
        const totalPages = Math.ceil(totalItems / limit);

        const trains = await collection
            .find({})
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
            }
        });
    } catch (error) {
        console.error('Error fetching trains:', error);

        return res.status(500).json({
            error: 'Unable to retrieve trains.'
        });
    }
};

export { trainsApi, trainsPage };
