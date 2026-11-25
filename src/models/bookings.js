import { getDb } from '../db/connect.js';

// Retrieve filtered and paginated bookings, newest first.
export async function getPaginatedBookings(page, limit, filters = {}) {
  const skip = (page - 1) * limit;
  const collection = getDb().collection('confirmations');

  const query = {};

  if (filters.ticketClass) {
    query.ticketClass = filters.ticketClass;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};

    if (filters.startDate) {
      query.createdAt.$gte = filters.startDate;
    }

    if (filters.endDate) {
      query.createdAt.$lt = filters.endDate;
    }
  }

  const [bookings, totalItems] = await Promise.all([
    collection
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),

    collection.countDocuments(query)
  ]);

  return {
    bookings,
    totalItems
  };
}
