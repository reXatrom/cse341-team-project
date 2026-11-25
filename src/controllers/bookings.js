import { getPaginatedBookings } from '../models/bookings.js';

const validTicketClasses = ['standard', 'premium', 'first'];

// Convert a YYYY-MM-DD value to a valid UTC date.
function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

// GET /api/bookings
// Retrieve filtered bookings with pagination.
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

    const { ticketClass, startDate, endDate } = req.query;

    if (
      ticketClass !== undefined &&
      (typeof ticketClass !== 'string' ||
        !validTicketClasses.includes(ticketClass))
    ) {
      return res.status(400).json({
        error: 'Ticket class must be standard, premium, or first.'
      });
    }

    if (
      (startDate !== undefined && typeof startDate !== 'string') ||
      (endDate !== undefined && typeof endDate !== 'string')
    ) {
      return res.status(400).json({
        error: 'Start date and end date must be valid dates.'
      });
    }

    const parsedStartDate = startDate ? parseDate(startDate) : null;
    const parsedEndDate = endDate ? parseDate(endDate) : null;

    if (
      (startDate && !parsedStartDate) ||
      (endDate && !parsedEndDate)
    ) {
      return res.status(400).json({
        error: 'Start date and end date must use a valid YYYY-MM-DD date.'
      });
    }

    if (
      parsedStartDate &&
      parsedEndDate &&
      parsedStartDate > parsedEndDate
    ) {
      return res.status(400).json({
        error: 'Start date must be on or before end date.'
      });
    }

    const filters = {
      ticketClass,
      startDate: parsedStartDate
        ? parsedStartDate.toISOString()
        : undefined,
      endDate: parsedEndDate
        ? new Date(
            parsedEndDate.getTime() + 24 * 60 * 60 * 1000
          ).toISOString()
        : undefined
    };

    const { bookings, totalItems } =
      await getPaginatedBookings(page, limit, filters);

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
