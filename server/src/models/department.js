import { Schema, model } from 'mongoose';

const departmentSchema = new Schema({
  stream: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: String,
    required: true,
    trim: true,
  },
  deptCode: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true
  },
  alumniCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for faster queries (deptCode already indexed via unique: true)
departmentSchema.index({ stream: 1, branch: 1 });

const Department = model('Department', departmentSchema);

export default Department;