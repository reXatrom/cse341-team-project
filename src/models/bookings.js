
import { getDb } from '../db/connect.js';

// Retrieve a paginated list of bookings, newest first.
export async function getPaginatedBookings(page, limit) {
  const skip = (page - 1) * limit;
  const collection = getDb().collection('confirmations');

  const [bookings, totalItems] = await Promise.all([
    collection
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),

    collection.countDocuments({})
  ]);

  return {
    bookings,
    totalItems
  };
}
