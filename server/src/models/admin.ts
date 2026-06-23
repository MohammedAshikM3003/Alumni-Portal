import { Schema, model, type Types, type Document } from 'mongoose';

export interface IAdminAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface IInstituteDetails {
  logo?: Types.ObjectId | null;
  banner?: Types.ObjectId | null;
}

export interface IAdmin {
  userId: Types.ObjectId;
  registerNumber?: string;
  name?: string;
  username?: string;
  email?: string;
  mobile?: string;
  dateOfBirth?: Date;
  degree?: string;
  branch?: string;
  presentAddress?: IAdminAddress;
  permanentAddress?: IAdminAddress;
  designation?: string;
  profilePhoto: Types.ObjectId | null;
  instituteDetails?: IInstituteDetails;
  resetOtp?: string;
  resetOtpExpiry?: Date;
  resetOtpVerifiedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IAdminDocument = IAdmin & Document;

const adminSchema = new Schema<IAdmin>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    registerNumber: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    degree: {
      type: String,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    presentAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    permanentAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    designation: {
      type: String,
      trim: true,
    },
    // Profile photo (GridFS ID)
    profilePhoto: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    // Institute Details
    instituteDetails: {
      logo: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      banner: {
        type: Schema.Types.ObjectId,
        default: null,
      },
    },
    // OTP for password reset
    resetOtp: {
      type: String,
    },
    resetOtpExpiry: {
      type: Date,
    },
    resetOtpVerifiedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create sparse indexes for unique fields that can be empty
adminSchema.index({ registerNumber: 1 }, { unique: true, sparse: true });
adminSchema.index({ username: 1 }, { unique: true, sparse: true });
adminSchema.index({ email: 1 }, { unique: true, sparse: true });

const Admin = model<IAdmin>('Admin', adminSchema, 'admin');

export default Admin;
