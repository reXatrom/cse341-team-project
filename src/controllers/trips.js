
import {
  getAllTrips as findAllTrips,
  getTripById as findTripById,
  createTrip as saveTrip,
  updateTrip as modifyTrip,
  deleteTrip as removeTrip
} from '../models/trips.js';

// GET all trips
export async function getAllTrips(req, res) {
  try {
    const trips = await findAllTrips();
    return res.status(200).json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return res.status(500).json({ error: 'Failed to fetch trips' });
  }
}

// GET one trip
export async function getTripById(req, res) {
  try {
    const { id } = req.params;
    const trip = await findTripById(id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    return res.status(500).json({ error: 'Failed to fetch trip' });
  }
}

// POST create a trip
export async function createTrip(req, res) {
  try {
    const trip = await saveTrip(req.body);
    return res.status(201).json(trip);
  } catch (error) {
    console.error('Error creating trip:', error);

    if (error.code === 11000) {
      return res.status(409).json({ error: 'A trip with this ID already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to create trip' });
  }
}

// PUT update a trip
export async function updateTrip(req, res) {
  try {
    const { id } = req.params;
    const { id: ignoredId, ...tripData } = req.body;

    const trip = await modifyTrip(id, tripData);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error('Error updating trip:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to update trip' });
  }
}

// DELETE a trip
export async function deleteTrip(req, res) {
  try {
    const { id } = req.params;
    const trip = await removeTrip(id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.status(200).json({
      message: 'Trip deleted successfully',
      trip
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return res.status(500).json({ error: 'Failed to delete trip' });
  }
}
