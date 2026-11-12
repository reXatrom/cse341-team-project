
import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true
    },
    tripId: {
      type: String,
      required: true,
      trim: true
    },
    departureTime: {
      type: String,
      required: true
    },
    arrivalTime: {
      type: String,
      required: true
    },
    daysOfWeek: {
      type: [String],
      required: true,
      enum: [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ]
    },
    status: {
      type: Boolean,
      default: true
    }
  },
  {
    collection: 'schedules',
    timestamps: false,
    id: false
  }
);

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
