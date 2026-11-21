
import { getUserById } from '../models/users.js';
import { getDb } from '../db/connect.js';

// Display the dashboard for an authenticated standard user.
export function userDashboard(req, res) {
    return res.render('user/dashboard', {
        title: 'My Dashboard'
    });
}

// Return bookings owned by the authenticated user.
export async function getMyBookings(req, res, next) {
    try {
        const user = await getUserById(req.session.user.id);

        if (!user) {
            return res.status(401).json({
                error: 'Your account could not be found.'
            });
        }

        const bookings = await getDb()
            .collection('confirmations')
            .find({
                bookingOwnerId: user._id.toString()
            })
            .sort({ createdAt: -1 })
            .project({
                _id: 0,
                id: 1,
                createdAt: 1,
                scheduleId: 1,
                tripId: 1,
                ticketClass: 1,
                selectedDay: 1
            })
            .toArray();

        return res.json({ bookings });
    } catch (error) {
        return next(error);
    }
}
