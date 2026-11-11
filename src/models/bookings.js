
import Booking from './schemas/bookings.js';

// Create a new booking with passenger information.
export async function createBooking(bookingData) {
    return Booking.create(bookingData);
}

// Retrieve all bookings from the database.
export async function getAllBookings() {
    return Booking.find({}).sort({ createdAt: -1 }).lean();
}

// Retrieve one booking using its confirmation code.
export async function getBookingById(id) {
    return Booking.findOne({ id }).lean();
}
