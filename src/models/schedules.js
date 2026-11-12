
import Schedule from './schemas/schedules.js';

export async function getAllSchedules() {
  return Schedule.find({}).lean();
}

export async function getScheduleById(id) {
  return Schedule.findOne({ id: Number(id) }).lean();
}

export async function getSchedulesByTripId(tripId) {
  return Schedule.find({ tripId }).lean();
}

export async function createSchedule(scheduleData) {
  const schedule = await Schedule.create(scheduleData);
  return schedule.toObject();
}

export async function updateSchedule(id, scheduleData) {
  return Schedule.findOneAndUpdate(
    { id: Number(id) },
    scheduleData,
    {
      new: true,
      runValidators: true
    }
  ).lean();
}

export async function deleteSchedule(id) {
  return Schedule.findOneAndDelete({ id: Number(id) }).lean();
}
