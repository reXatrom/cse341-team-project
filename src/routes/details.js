import { getTripById } from '../models/trips.js';
import { getSchedulesByTripId } from '../models/schedules.js';

export default async (req, res, next) => {
    try {
        const { tripId } = req.params;

        const details = await getTripById(tripId);

        if (!details) {
            res.status(404).render('errors/404', {
                title: 'Trip Not Found',
                error: 'The requested trip could not be found.'
            });
            return;
        }

        details.schedules = await getSchedulesByTripId(tripId);

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