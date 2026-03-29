import { Schema, model } from 'mongoose';

// Recipient sub-schema for multiple alumni support
const recipientSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  department: { type: String, default: '' },
  batch: { type: String, default: '' },
}, { _id: false });

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
    // Support for multiple recipients
    recipients: {
      type: [recipientSchema],
      default: [],
    },
    // Legacy single recipient fields (for backward compatibility)
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
