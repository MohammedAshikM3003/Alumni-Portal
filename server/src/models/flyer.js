import { Schema, model } from 'mongoose';

const flyerSchema = new Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    guestImage: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: String,
      default: '',
    },
    venue: {
      type: String,
      default: '',
      trim: true,
    },
    hostedBy: {
      type: String,
      default: '',
      trim: true,
    },
    tagline: {
      type: String,
      default: '',
      trim: true,
    },
    eventDescription: {
      type: String,
      default: '',
      trim: true,
    },
    templateImageId: {
      type: String,
      required: true,
    },
    generatedImageId: {
      type: String,
      required: true,
    },
    geminiPrompt: {
      type: String,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default model('Flyer', flyerSchema);
