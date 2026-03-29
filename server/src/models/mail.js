import { Schema, model } from 'mongoose';

const mailSchema = new Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    recipientCount: {
      type: Number,
      default: 1,
    },
    recipientEmails: [{
      type: String,
    }],
    isBroadcast: {
      type: Boolean,
      default: false,
    },
    isEventInvitation: {
      type: Boolean,
      default: false,
    },
    eventDetails: {
      eventId: { type: String },
      eventName: { type: String },
      eventDate: { type: Date },
      eventVenue: { type: String },
      eventTime: { type: String },
    },
    hasTokens: {
      type: Boolean,
      default: false,
    },
    tokenGeneratedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Index for sorting by creation date
mailSchema.index({ createdAt: -1 });

const Mail = model('Mail', mailSchema);

export default Mail;
