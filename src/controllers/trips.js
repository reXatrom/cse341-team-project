
import {
  getPaginatedTrips,
  getTripById as findTripById,
  createTrip as saveTrip,
  updateTrip as modifyTrip,
  deleteTrip as removeTrip
} from '../models/trips.js';

const VALID_REGIONS = [
  'central',
  'northern',
  'kansai',
  'hokkaido'
];

const VALID_SEASONS = [
  'spring',
  'summer',
  'autumn',
  'winter'
];

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

// Validate and normalize an optional filter.
function parseFilter(value, allowedValues) {
  if (value === undefined) {
    return { valid: true, value: null };
  }

  if (typeof value !== 'string') {
    return { valid: false, value: null };
  }

  const normalized = value.trim().toLowerCase();

  if (!allowedValues.includes(normalized)) {
    return { valid: false, value: null };
  }

  return { valid: true, value: normalized };
}

// GET all trips with pagination, filtering, and keyword search.
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

    const regionResult = parseFilter(
      req.query.region,
      VALID_REGIONS
    );

    if (!regionResult.valid) {
      return res.status(400).json({
        error: 'Invalid region. Use central, northern, kansai, or hokkaido.'
      });
    }

    const seasonResult = parseFilter(
      req.query.season,
      VALID_SEASONS
    );

    if (!seasonResult.valid) {
      return res.status(400).json({
        error: 'Invalid season. Use spring, summer, autumn, or winter.'
      });
    }

    let q = null;

    if (req.query.q !== undefined) {
      if (
        typeof req.query.q !== 'string' ||
        req.query.q.length > 100
      ) {
        return res.status(400).json({
          error: 'Search query must be a string of no more than 100 characters.'
        });
      }

      q = req.query.q.trim() || null;

      if (q && q.length > 100) {
        return res.status(400).json({
          error: 'Search query must be no more than 100 characters.'
        });
      }
    }

    const filters = {
      region: regionResult.value,
      season: seasonResult.value,
      q
    };

    const { trips, totalItems } = await getPaginatedTrips(
      page,
      limit,
      filters
    );

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
      filters
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
