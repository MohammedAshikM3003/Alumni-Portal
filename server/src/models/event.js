import { Schema, model } from 'mongoose';

const eventSchema = new Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventDay: {
      type: String,
      required: true,
      trim: true,
    },
    eventTime: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    coOrganizers: [{
      type: Schema.Types.ObjectId,
      ref: 'Department',
    }],
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    photos: [{
      type: String, // GridFS file ID
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Event = model('Event', eventSchema);

export default Event;
