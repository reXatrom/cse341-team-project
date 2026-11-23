
import {
  getPaginatedTrips,
  getTripById as findTripById,
  createTrip as saveTrip,
  updateTrip as modifyTrip,
  deleteTrip as removeTrip
} from '../models/trips.js';

// Validate positive integer query parameters.
function parsePositiveInteger(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  if (
    typeof value !== 'string' ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

// GET all trips with pagination.
export async function getAllTrips(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 10);

    if (page === null || limit === null) {
      return res.status(400).json({
        error: 'Page and limit must be positive integers.'
      });
    }

    if (limit > 50) {
      return res.status(400).json({
        error: 'Limit cannot exceed 50.'
      });
    }

    const { trips, totalItems } = await getPaginatedTrips(page, limit);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      data: trips,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      filters: {
        region: null,
        season: null,
        q: null
      }
    });
  } catch (error) {
    console.error('Error fetching trips:', error);

    return res.status(500).json({
      error: 'Failed to fetch trips'
    });
  }
}

// GET one trip.
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

// POST create a trip.
export async function createTrip(req, res) {
  try {
    const trip = await saveTrip(req.body);
    return res.status(201).json(trip);
  } catch (error) {
    console.error('Error creating trip:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: 'A trip with this ID already exists'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to create trip' });
  }
}

// PUT update a trip.
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

// DELETE a trip.
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
