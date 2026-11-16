
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

        // Retrieve schedules using the existing MongoDB connection.
        const db = getDb();
        details.schedules = await db.collection('schedules')
            .find({ tripId })
            .toArray();

        return res.render('trips/details', {
            title: 'Trip Details',
            details
        });
    } catch (error) {
        return next(error);
    }
};
