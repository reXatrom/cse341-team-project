
import Trip from './schemas/trips.js';

// Retrieve all trips (used by the existing public Trips page).
export async function getAllTrips() {
  return Trip.find({}).lean();
}

// Retrieve one trip using its ID.
export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

// Escape special regular-expression characters in user search input.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Retrieve a filtered page of trips and the total matching trip count.
export async function getPaginatedTrips(page, limit, filters = {}) {
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.region) {
    query.region = filters.region;
  }

  if (filters.season) {
    query.bestSeason = filters.season;
  }

  if (filters.q) {
    const searchPattern = new RegExp(escapeRegex(filters.q), 'i');

    query.$or = [
      { name: searchPattern },
      { description: searchPattern }
    ];
  }

  const [trips, totalItems] = await Promise.all([
    Trip.find(query)
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Trip.countDocuments(query)
  ]);

  return {
    trips,
    totalItems
  };
}

// Create a new trip.
export async function createTrip(tripData) {
  const trip = new Trip(tripData);
  return trip.save();
}

// Update an existing trip.
export async function updateTrip(id, tripData) {
  return Trip.findOneAndUpdate(
    { id },
    { $set: tripData },
    { returnDocument: 'after', runValidators: true }
  ).lean();
}

// Delete a trip.
export async function deleteTrip(id) {
  return Trip.findOneAndDelete({ id }).lean();
}
