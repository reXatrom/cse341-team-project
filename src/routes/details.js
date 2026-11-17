
import { getDb } from '../db/connect.js';
import { getTripById } from '../models/trips.js';

export default async (req, res, next) => {
    try {
        const { tripId } = req.params;

        // Retrieve trip details using Mongoose.
        const details = await getTripById(tripId);

        // Handle a trip that does not exist.
        if (!details) {
            return res.status(404).render('errors/404', {
                title: 'Trip Not Found',
                error: 'The requested trip could not be found.'
            });
        }

export default async (req, res, next) => {
    try {
        const { tripId } = req.params;
        const db = getDb();

        const details = await db.collection('trips').findOne({ id: tripId });

        if (!details) {
            return res.status(404).render('errors/404', {
                title: 'Trip Not Found',
                error: 'The requested trip could not be found.'
            });
        }

        details.schedules = await db.collection('schedules')
            .find({ tripId })
            .toArray();

        const activeSchedules = details.schedules.filter(
            schedule => schedule.status === true
        );

        res.render('trips/details', {
            title: 'Trip Details',
            details,
            activeSchedules
        });
    } catch (error) {
        next(error);
    }
};
