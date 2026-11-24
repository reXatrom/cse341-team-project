import { getPaginatedBookings } from '../models/bookings.js';

// GET /api/bookings
// Retrieve bookings with pagination.
export async function getBookings(req, res) {
  try {
    const pageValue = req.query.page ?? '1';
    const limitValue = req.query.limit ?? '10';

    const page = Number(pageValue);
    const limit = Number(limitValue);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit !== 10
    ) {
      return res.status(400).json({
        error: 'Page must be a positive integer and limit must be 10.'
      });
    }

    const { bookings, totalItems } =
      await getPaginatedBookings(page, limit);

    // Return passenger count without exposing passenger contact details.
    const safeBookings = bookings.map(
      ({ _id, passengers, ...booking }) => ({
        ...booking,
        passengerCount: Array.isArray(passengers)
          ? passengers.length
          : 0
      })
    );

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      data: safeBookings,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error retrieving bookings:', error);

    return res.status(500).json({
      error: 'Failed to retrieve bookings.'
    });
  }
}