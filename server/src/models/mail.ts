import { Schema, model, type Document } from 'mongoose';

export interface IEventDetails {
  eventId?: string;
  eventName?: string;
  eventDate?: Date;
  eventVenue?: string;
  eventTime?: string;
}

export interface IMail {
  senderId: string;
  senderName: string;
  senderLabel?: string;
  senderEmail: string;
  title: string;
  content: string;
  recipientCount: number;
  recipientEmails: string[];
  isBroadcast: boolean;
  isEventInvitation: boolean;
  eventDetails?: IEventDetails | null;
  hasTokens: boolean;
  tokenGeneratedAt?: Date | null;
  status: 'pending' | 'completed';
  ccEmails: string[];
  ccEmailsSent: number;
  createdAt: Date;
  updatedAt: Date;
}

export type IMailDocument = IMail & Document;

const mailSchema = new Schema<IMail>(
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
    // Optional explicit sender label entered by admins (e.g., "Admin", "Career Cell")
    senderLabel: {
      type: String,
      trim: true,
      default: ''
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
    ccEmails: [{
      type: String,
    }],
    ccEmailsSent: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for sorting by creation date
mailSchema.index({ createdAt: -1 });

const Mail = model<IMail>('Mail', mailSchema);

export default Mail;
