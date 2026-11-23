
import Trip from './schemas/trips.js';

// Retrieve all trips (used by the existing public Trips page).
export async function getAllTrips() {
  return Trip.find({}).lean();
}

// Retrieve one trip using its ID.
export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

// Retrieve a specific page of trips and the total number of trips.
export async function getPaginatedTrips(page, limit) {
  const skip = (page - 1) * limit;

  const [trips, totalItems] = await Promise.all([
    Trip.find({})
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Trip.countDocuments({})
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
