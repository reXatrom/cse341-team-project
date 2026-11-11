
import { getAllBookings as findAllBookings } from '../models/bookings.js';

// GET /api/bookings
// Retrieve all bookings from MongoDB using Mongoose.
export async function getAllBookings(req, res) {
    try {
        const bookings = await findAllBookings();

        return res.status(200).json(bookings);
    } catch (error) {
        console.error('Error retrieving bookings:', error);

        return res.status(500).json({
            message: 'Failed to retrieve bookings.'
        });
    }
}
