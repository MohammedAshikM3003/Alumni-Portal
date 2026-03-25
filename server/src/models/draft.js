import { Schema, model } from 'mongoose';

const draftSchema = new Schema(
  {
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    recipientName: {
      type: String,
      default: '',
    },
    recipientEmail: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    batch: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    eventName: {
      type: String,
      default: '',
    },
    eventDate: {
      type: String,
      default: '',
    },
    eventLocation: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for sorting by update date
draftSchema.index({ updatedAt: -1 });

const Draft = model('Draft', draftSchema);

export default Draft;
