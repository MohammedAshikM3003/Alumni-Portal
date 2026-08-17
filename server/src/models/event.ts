import { Schema, model, type Types, type Document } from 'mongoose';

export interface IEvent {
  eventName: string;
  eventDate: Date;
  eventDay: string;
  eventTime: string;
  venue: string;
  batch?: string;
  organizer: Types.ObjectId;
  coOrganizers: Types.ObjectId[];
  status: 'upcoming' | 'completed' | 'cancelled';
  photos: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IEventDocument = IEvent & Document;

const eventSchema = new Schema<IEvent>(
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
    batch: {
      type: String,
      trim: true,
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
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming',
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

const Event = model<IEvent>('Event', eventSchema);

export default Event;
