
import { getAllTrips } from '../models/trips.js';

export default async (req, res, next) => {
    try {
        // Retrieve trips using the Mongoose model.
        const trips = await getAllTrips();

        // Build unique region and season filter options.
        const regions = [...new Set(trips.map(trip => trip.region))];
        const seasons = [...new Set(trips.map(trip => trip.bestSeason))];

        res.render('trips/list', {
            title: 'Scenic Train Trips',
            regions,
            trips,
            seasons
        });
    } catch (error) {
        next(error);
    }
};
