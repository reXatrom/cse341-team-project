
import { getDb } from '../db/connect.js';

export default async (req, res) => {
    try {
        const { tripId } = req.params;
        const db = getDb();

        // Find the selected trip.
        const details = await db.collection('trips').findOne({
            id: tripId
        });

        // Return 404 if the trip does not exist.
        if (!details) {
            return res.status(404).send('Trip not found.');
        }

        // Find schedules associated with this trip.
        const schedules = await db
            .collection('schedules')
            .find({ tripId })
            .toArray();

        details.schedules = schedules;

        return res.render('trips/details', {
            title: 'Trip Details',
            details
        });
    } catch (error) {
        console.error('Error loading trip details:', error);

        return res.status(500).send(
            'Unable to load trip details.'
        );
    }
};
