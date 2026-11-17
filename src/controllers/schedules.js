
import {
  getAllSchedules,
  getScheduleById,
  getSchedulesByTripId,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from '../models/schedules.js';

export async function getSchedules(req, res) {
  try {
    const schedules = await getAllSchedules();
    return res.status(200).json({ schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
}

export async function getSchedule(req, res) {
  try {
    const schedule = await getScheduleById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    return res.status(200).json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return res.status(500).json({ error: 'Failed to fetch schedule' });
  }
}

export async function getTripSchedules(req, res) {
  try {
    const schedules = await getSchedulesByTripId(req.params.tripId);
    return res.status(200).json({ schedules });
  } catch (error) {
    console.error('Error fetching trip schedules:', error);
    return res.status(500).json({ error: 'Failed to fetch trip schedules' });
  }
}

export async function addSchedule(req, res) {
  try {
    const schedule = await createSchedule(req.body);
    return res.status(201).json({
      message: 'Schedule created successfully',
      schedule
    });
  } catch (error) {
    console.error('Error creating schedule:', error);

    if (error.code === 11000) {
      return res.status(409).json({ error: 'Schedule ID already exists' });
    }

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to create schedule' });
  }
}

export async function editSchedule(req, res) {
  try {
    const schedule = await updateSchedule(req.params.id, req.body);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    return res.status(200).json({
      message: 'Schedule updated successfully',
      schedule
    });
  } catch (error) {
    console.error('Error updating schedule:', error);

    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to update schedule' });
  }
}

export async function removeSchedule(req, res) {
  try {
    const schedule = await deleteSchedule(req.params.id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    return res.status(200).json({
      message: 'Schedule deleted successfully',
      schedule
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return res.status(500).json({ error: 'Failed to delete schedule' });
  }
}
