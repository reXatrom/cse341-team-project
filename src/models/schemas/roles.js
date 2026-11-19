
import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      enum: ['user', 'admin']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    collection: 'roles',
    timestamps: true
  }
);

const Role = mongoose.model('Role', roleSchema);

export default Role;
