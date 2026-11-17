
import Trip from './schemas/trips.js';

// Retrieve all trips.
export async function getAllTrips() {
  return Trip.find({}).lean();
}

// Retrieve one trip using its ID.
export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
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
